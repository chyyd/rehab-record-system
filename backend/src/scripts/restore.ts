#!/usr/bin/env ts-node
import { BackupService } from '../backup/backup.service';
import { PrismaService } from '../common/services/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  const dateArg = process.argv.find(arg => arg.startsWith('--date='))?.split('=')[1];

  if (!dateArg) {
    console.error('❌ 请指定备份日期: --date=2025-01-18');
    process.exit(1);
  }

  const typeArg = process.argv.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';
  const restoreTypes = typeArg === 'all'
    ? ['database', 'config', 'photos']
    : typeArg.split(',');

  const date = dateArg.replace(/-/g, '');

  for (const type of restoreTypes) {
    if (type === 'database') {
      const backupPath = path.join(process.cwd(), 'backups', 'database', `database_${date}.db`);
      const dbPath = process.env.DATABASE_URL?.replace('file:', '');

      console.log(`🔄 Restoring database from ${backupPath}...`);
      await fs.copyFile(backupPath, dbPath);
      console.log('✅ Database restored');
    } else if (type === 'config') {
      const backupPath = path.join(process.cwd(), 'backups', 'config', `env_${date}`);
      const envPath = path.join(process.cwd(), '.env');

      console.log(`🔄 Restoring config from ${backupPath}...`);
      await fs.copyFile(backupPath, envPath);
      console.log('✅ Config restored');
    } else if (type === 'photos') {
      const backupDir = path.join(process.cwd(), 'backups', 'photos');
      const targetDir = path.join(process.cwd(), 'uploads', 'photos');

      console.log(`🔄 Restoring photos from ${backupDir}...`);

      const files = await fs.readdir(backupDir);
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const sourcePath = path.join(backupDir, file);
        const targetPath = path.join(targetDir, file);
        await fs.copyFile(sourcePath, targetPath);
      }

      console.log(`✅ Photos restored (${files.length - 1} files)`);
    }
  }

  console.log('\n✅ Restore completed successfully!');
  console.log('⚠️  Please restart the application for changes to take effect.');
}

main().catch(error => {
  console.error('❌ Restore failed:', error);
  process.exit(1);
});
