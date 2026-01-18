import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as schedule from 'node-schedule';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private backupJob: schedule.Job | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getBackupStatus() {
    const status = await this.prisma.systemStatus.findFirst({
      where: { id: 1 },
    });

    return {
      lastBackupTime: status?.lastBackupTime,
      backupStatus: status?.backupStatus || 'unknown',
      failedReason: status?.failedReason,
      databaseSize: status?.databaseSize,
      photosCount: status?.photosCount,
    };
  }

  async getBackupLogs() {
    return this.prisma.backupLog.findMany({
      orderBy: { backupDate: 'desc' },
    });
  }

  async manualBackup(backupTypes: string[]) {
    const results = [];

    for (const type of backupTypes) {
      try {
        const startTime = Date.now();
        let fileSize: number | null = null;
        let fileCount: number | null = null;

        if (type === 'database') {
          fileSize = await this.backupDatabase();
        } else if (type === 'config') {
          fileSize = await this.backupConfig();
        } else if (type === 'photos') {
          fileCount = await this.backupPhotos();
        }

        const duration = Math.floor((Date.now() - startTime) / 1000);

        await this.prisma.backupLog.create({
          data: {
            backupDate: new Date(),
            backupType: type,
            status: 'success',
            fileSize,
            fileCount,
            duration,
          },
        });

        results.push({ type, status: 'success', fileSize, fileCount });
      } catch (error) {
        await this.prisma.backupLog.create({
          data: {
            backupDate: new Date(),
            backupType: type,
            status: 'failed',
            errorMessage: error.message,
          },
        });

        results.push({ type, status: 'failed', error: error.message });
      }
    }

    // 更新系统状态
    const allSuccess = results.every(r => r.status === 'success');
    await this.prisma.systemStatus.update({
      where: { id: 1 },
      data: {
        lastBackupTime: new Date(),
        backupStatus: allSuccess ? 'ok' : 'failed',
        failedReason: allSuccess ? null : '部分备份失败',
      },
    });

    return results;
  }

  private async backupDatabase(): Promise<number> {
    const dbPath = this.configService.get<string>('DATABASE_URL').replace('file:', '');
    const backupDir = path.join(process.cwd(), 'backups', 'database');
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const backupPath = path.join(backupDir, `database_${date}.db`);

    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(dbPath, backupPath);

    const stats = await fs.stat(backupPath);
    return stats.size;
  }

  private async backupConfig(): Promise<number> {
    const envPath = path.join(process.cwd(), '.env');
    const backupDir = path.join(process.cwd(), 'backups', 'config');
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const backupPath = path.join(backupDir, `env_${date}`);

    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(envPath, backupPath);

    const stats = await fs.stat(backupPath);
    return stats.size;
  }

  private async backupPhotos(): Promise<number> {
    const sourceDir = path.join(process.cwd(), 'uploads', 'photos');
    const backupDir = path.join(process.cwd(), 'backups', 'photos');

    await fs.mkdir(backupDir, { recursive: true });

    const files = await fs.readdir(sourceDir);
    let newFileCount = 0;

    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const backupPath = path.join(backupDir, file);

      try {
        const sourceStat = await fs.stat(sourcePath);
        let shouldCopy = false;

        try {
          const backupStat = await fs.stat(backupPath);
          if (sourceStat.mtime > backupStat.mtime) {
            shouldCopy = true;
          }
        } catch {
          // 备份文件不存在，需要复制
          shouldCopy = true;
        }

        if (shouldCopy) {
          await fs.copyFile(sourcePath, backupPath);
          newFileCount++;
        }
      } catch (error) {
        this.logger.warn(`Failed to backup photo: ${file}`, error.message);
      }
    }

    return newFileCount;
  }

  async cleanupOldBackups() {
    const retentionDays = this.configService.get<number>('BACKUP_LOCAL_RETENTION_DAYS', 7);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // 清理数据库备份
    const dbBackupDir = path.join(process.cwd(), 'backups', 'database');
    try {
      const files = await fs.readdir(dbBackupDir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(dbBackupDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          this.logger.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      this.logger.warn('No database backups to clean');
    }

    // 清理配置文件备份
    const configBackupDir = path.join(process.cwd(), 'backups', 'config');
    try {
      const files = await fs.readdir(configBackupDir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(configBackupDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          this.logger.log(`Deleted old config backup: ${file}`);
        }
      }
    } catch (error) {
      this.logger.warn('No config backups to clean');
    }

    // 照片备份不删除（永久累加）
  }

  startDailyBackup() {
    const autoTime = this.configService.get<string>('BACKUP_AUTO_TIME', '02:00');
    const [hour, minute] = autoTime.split(':').map(Number);

    const rule = new schedule.RecurrenceRule();
    rule.hour = hour;
    rule.minute = minute;

    this.backupJob = schedule.scheduleJob(rule, async () => {
      this.logger.log('Starting daily automatic backup...');
      try {
        await this.manualBackup(['database', 'config', 'photos']);
        await this.cleanupOldBackups();
        this.logger.log('✅ Daily backup completed');
      } catch (error) {
        this.logger.error('❌ Daily backup failed', error);
      }
    });

    this.logger.log(`Daily backup scheduled at ${autoTime}`);
  }

  stopDailyBackup() {
    if (this.backupJob) {
      this.backupJob.cancel();
      this.backupJob = null;
      this.logger.log('Daily backup stopped');
    }
  }
}
