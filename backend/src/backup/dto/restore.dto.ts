import { IsArray, IsEnum, IsString, IsOptional } from 'class-validator';
import { BackupType } from './backup.dto';

export class RestoreBackupDto {
  @IsString()
  backupDate: string;  // 格式: YYYY-MM-DD

  @IsArray()
  @IsEnum(BackupType, { each: true })
  @IsOptional()
  restoreTypes?: BackupType[];
}
