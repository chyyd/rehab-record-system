import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './backup.service';
import { PrismaService } from '../common/services/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('BackupService', () => {
  let service: BackupService;
  let prisma: PrismaService;

  const mockPrismaService = {
    systemStatus: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    backupLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        DATABASE_URL: 'file:./test.db',
        BACKUP_LOCAL_RETENTION_DAYS: 7,
        BACKUP_AUTO_TIME: '02:00',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBackupStatus', () => {
    it('should return backup status', async () => {
      const mockStatus = {
        id: 1,
        lastBackupTime: new Date(),
        backupStatus: 'ok',
        failedReason: null,
        databaseSize: 1024000,
        photosCount: 100,
      };

      mockPrismaService.systemStatus.findFirst.mockResolvedValue(mockStatus);

      const result = await service.getBackupStatus();

      expect(result).toEqual({
        lastBackupTime: mockStatus.lastBackupTime,
        backupStatus: 'ok',
        failedReason: null,
        databaseSize: 1024000,
        photosCount: 100,
      });
    });
  });

  describe('getBackupLogs', () => {
    it('should return backup logs', async () => {
      const mockLogs = [
        {
          id: 1,
          backupDate: new Date(),
          backupType: 'database',
          status: 'success',
          fileSize: 1024000,
        },
      ];

      mockPrismaService.backupLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getBackupLogs();

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.backupLog.findMany).toHaveBeenCalledWith({
        orderBy: { backupDate: 'desc' },
      });
    });
  });
});
