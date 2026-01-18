import { IsEnum, IsOptional, IsArray } from 'class-validator';

export enum BackupType {
  DATABASE = 'database',
  CONFIG = 'config',
  PHOTOS = 'photos',
}

export enum BackupStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

export class ManualBackupDto {
  @IsArray()
  @IsEnum(BackupType, { each: true })
  backupTypes: BackupType[];
}
