import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./data/database.db',
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✓ 数据库连接成功');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
