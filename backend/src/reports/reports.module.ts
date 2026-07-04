import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CleanupService } from './cleanup.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CleanupService],
  exports: [ReportsService],
})
export class ReportsModule {}
