import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * *')
  async runCleanup(): Promise<void> {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const expiredReports = await this.prisma.report.findMany({
      where: {
        status: ReportStatus.PENDING,
        createdAt: { lt: twentyMinutesAgo },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (expiredReports.length === 0) {
      this.logger.log('CleanupService: nenhum registro para limpar');
      return;
    }

    const ids = expiredReports.map((r) => r.id);
    await this.prisma.report.updateMany({
      where: { id: { in: ids } },
      data: {
        status: ReportStatus.EXPIRED,
        deletedAt: new Date(),
      },
    });

    this.logger.log(
      `CleanupService: ${expiredReports.length} registros PENDING expirados`,
    );
  }
}
