import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { PhotosController } from './photos.controller';

@Module({
  controllers: [PhotosController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PhotosModule {}
