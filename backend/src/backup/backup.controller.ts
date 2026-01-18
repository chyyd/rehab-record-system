import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BackupService } from './backup.service';
import { ManualBackupDto } from './dto/backup.dto';
import { RestoreBackupDto } from './dto/restore.dto';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('status')
  async getBackupStatus() {
    return this.backupService.getBackupStatus();
  }

  @Get('logs')
  async getBackupLogs() {
    return this.backupService.getBackupLogs();
  }

  @Post('backup-now')
  async manualBackup(@Body() dto: ManualBackupDto) {
    const results = await this.backupService.manualBackup(dto.backupTypes);
    return {
      success: true,
      message: '备份完成',
      results,
    };
  }
}
