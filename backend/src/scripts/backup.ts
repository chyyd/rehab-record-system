#!/usr/bin/env ts-node
import { BackupService } from '../backup/backup.service';
import { PrismaService } from '../common/services/prisma.service';

async function main() {
  const typeArg = process.argv.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'all';
  const backupTypes = typeArg === 'all'
    ? ['database', 'config', 'photos']
    : typeArg.split(',');

  const prisma = new PrismaService();
  const backupService = new BackupService(prisma, { get: (key: string) => process.env[key] } as any);

  console.log('🔄 Starting backup...');
  const results = await backupService.manualBackup(backupTypes);

  console.log('\n✅ Backup completed:');
  results.forEach(result => {
    console.log(`  - ${result.type}: ${result.status}`);
  });
}

main().catch(error => {
  console.error('❌ Backup failed:', error);
  process.exit(1);
});
