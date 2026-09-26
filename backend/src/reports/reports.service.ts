import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadIntentDto } from './dto/upload-intent.dto';
import { ReportsFiltersDto } from './dto/reports-filters.dto';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createUploadIntent(
    dto: UploadIntentDto,
    _userId: string,
  ): Promise<{ uploadUrl: string; reportId: string }> {
    const reportType = this.getReportType(dto.contentType);
    const report = await this.prisma.report.create({
      data: {
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        contentType: dto.contentType,
        type: reportType,
        status: ReportStatus.PENDING,
        s3Key: '',
      },
    });

    const s3Key = this.storage.buildS3Key(report.id, dto.fileName);
    await this.prisma.report.update({
      where: { id: report.id },
      data: { s3Key },
    });

    const uploadUrl = await this.storage.createPutPresignedUrl(
      s3Key,
      dto.contentType,
      dto.fileSize,
    );

    return { uploadUrl, reportId: report.id };
  }

  async confirmUpload(reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, deletedAt: null },
    });

    if (!report) {
      throw new NotFoundException({ error: 'REPORT_NOT_FOUND_OR_EXPIRED' });
    }

    // SPEC_DEVIATION: spec.md's concurrent-confirm edge case describes idempotent
    // (200) behavior for a second confirm on an already-AVAILABLE report, but
    // design.md's API contract and this task's Done-when/test list are explicit:
    // any status other than PENDING (including AVAILABLE) is a 422
    // INVALID_STATUS_TRANSITION. Following the more precise, doubly-confirmed
    // source (design.md contract + this task's own 12-test list) here;
    // true idempotent concurrent-confirm handling is not implemented by this task.
    if (report.status !== ReportStatus.PENDING) {
      throw new UnprocessableEntityException({
        error: 'INVALID_STATUS_TRANSITION',
      });
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.AVAILABLE },
    });
  }

  async getDownloadLink(reportId: string): Promise<{ downloadUrl: string }> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, deletedAt: null },
    });

    if (!report) {
      throw new NotFoundException({ error: 'REPORT_NOT_FOUND' });
    }

    if (report.status !== ReportStatus.AVAILABLE) {
      throw new UnprocessableEntityException({ error: 'REPORT_NOT_AVAILABLE' });
    }

    const downloadUrl = await this.storage.createGetPresignedUrl(report.s3Key);
    return { downloadUrl };
  }

  async findAll(filters: ReportsFiltersDto) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (filters.search) {
      where.fileName = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters.type && filters.type !== 'all') {
      where.type = filters.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  private getReportType(contentType: string): 'pdf' | 'xml' | 'csv' | 'xlsx' {
    const map: Record<string, 'pdf' | 'xml' | 'csv' | 'xlsx'> = {
      'application/pdf': 'pdf',
      'application/xml': 'xml',
      'text/csv': 'csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
    };
    return map[contentType] ?? 'pdf';
  }
}
