import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';

@Module({
  imports: [
    // ScheduleModule enables cron jobs
    ScheduleModule.forRoot(),
  ],
  providers: [BackupService],
})
export class BackupModule {}
