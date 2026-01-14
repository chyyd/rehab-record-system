import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { ProjectsModule } from './projects/projects.module';
import { RecordsModule } from './records/records.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { PhotosModule } from './photos/photos.module';
import { PrintModule } from './print/print.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    PatientsModule,
    ProjectsModule,
    RecordsModule,
    AssessmentsModule,
    PhotosModule,
    PrintModule,
    StatisticsModule,
  ],
})
export class AppModule {}
