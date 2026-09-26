import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReportStatus } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;
  let mockPrismaReport: {
    create: jest.Mock;
    update: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  let mockStorage: jest.Mocked<Partial<StorageService>>;

  beforeEach(async () => {
    mockPrismaReport = {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    };

    mockStorage = {
      buildS3Key: jest.fn().mockReturnValue('reports/report-id/file.pdf'),
      createPutPresignedUrl: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/put-url'),
      createGetPresignedUrl: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/get-url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: { report: mockPrismaReport } },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('createUploadIntent', () => {
    it('creates a PENDING report and returns the presigned uploadUrl and reportId', async () => {
      const mockReport = {
        id: 'report-id',
        fileName: 'file.pdf',
        fileSize: 1024,
        contentType: 'application/pdf',
        type: 'pdf',
        status: ReportStatus.PENDING,
        s3Key: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockPrismaReport.create.mockResolvedValue(mockReport);
      mockPrismaReport.update.mockResolvedValue({
        ...mockReport,
        s3Key: 'reports/report-id/file.pdf',
      });

      const result = await service.createUploadIntent(
        {
          fileName: 'file.pdf',
          fileSize: 1024,
          contentType: 'application/pdf',
        },
        'user-123',
      );

      // Payload assertions: the created record must actually be PENDING, and the
      // response must carry the exact reportId/uploadUrl produced by this flow —
      // not merely that create()/update() were called.
      expect(mockPrismaReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileName: 'file.pdf',
            fileSize: 1024,
            contentType: 'application/pdf',
            status: ReportStatus.PENDING,
          }),
        }),
      );
      expect(result).toEqual({
        reportId: 'report-id',
        uploadUrl: 'https://s3.example.com/put-url',
      });
    });

    it('propagates the error when the storage provider (S3) is unavailable', async () => {
      const mockReport = {
        id: 'id',
        fileName: 'file.pdf',
        fileSize: 1024,
        contentType: 'application/pdf',
        type: 'pdf',
        status: ReportStatus.PENDING,
        s3Key: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockPrismaReport.create.mockResolvedValue(mockReport);
      mockPrismaReport.update.mockResolvedValue({
        ...mockReport,
        s3Key: 'reports/id/file.pdf',
      });
      (mockStorage.createPutPresignedUrl as jest.Mock).mockRejectedValue(
        new Error('S3 unavailable'),
      );

      await expect(
        service.createUploadIntent(
          {
            fileName: 'file.pdf',
            fileSize: 1024,
            contentType: 'application/pdf',
          },
          'user-id',
        ),
      ).rejects.toThrow('S3 unavailable');
    });
  });

  describe('confirmUpload', () => {
    it('transitions a PENDING report to AVAILABLE', async () => {
      const mockReport = {
        id: 'report-id',
        status: ReportStatus.PENDING,
        deletedAt: null,
      };
      const updatedReport = { ...mockReport, status: ReportStatus.AVAILABLE };
      mockPrismaReport.findFirst.mockResolvedValue(mockReport);
      mockPrismaReport.update.mockResolvedValue(updatedReport);

      const result = await service.confirmUpload('report-id');

      expect(mockPrismaReport.update).toHaveBeenCalledWith({
        where: { id: 'report-id' },
        data: { status: ReportStatus.AVAILABLE },
      });
      expect(result.status).toBe(ReportStatus.AVAILABLE);
    });

    it('returns 404 REPORT_NOT_FOUND_OR_EXPIRED for a non-existing/expired report', async () => {
      mockPrismaReport.findFirst.mockResolvedValue(null);

      try {
        await service.confirmUpload('non-existing');
        throw new Error('expected confirmUpload to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect((err as NotFoundException).getResponse()).toEqual({
          error: 'REPORT_NOT_FOUND_OR_EXPIRED',
        });
      }
    });

    it('returns 422 INVALID_STATUS_TRANSITION for a report that is not PENDING (AVAILABLE or EXPIRED)', async () => {
      for (const status of [ReportStatus.AVAILABLE, ReportStatus.EXPIRED]) {
        mockPrismaReport.findFirst.mockResolvedValue({
          id: 'id',
          status,
          deletedAt: null,
        });

        try {
          await service.confirmUpload('id');
          throw new Error('expected confirmUpload to throw');
        } catch (err) {
          expect(err).toBeInstanceOf(UnprocessableEntityException);
          expect((err as UnprocessableEntityException).getResponse()).toEqual({
            error: 'INVALID_STATUS_TRANSITION',
          });
        }
      }
      expect(mockPrismaReport.update).not.toHaveBeenCalled();
    });
  });

  describe('getDownloadLink', () => {
    it('returns a presigned downloadUrl for an AVAILABLE report', async () => {
      mockPrismaReport.findFirst.mockResolvedValue({
        id: 'id',
        status: ReportStatus.AVAILABLE,
        s3Key: 'reports/id/file.pdf',
        deletedAt: null,
      });

      const result = await service.getDownloadLink('id');

      expect(mockStorage.createGetPresignedUrl).toHaveBeenCalledWith(
        'reports/id/file.pdf',
      );
      expect(result).toEqual({ downloadUrl: 'https://s3.example.com/get-url' });
    });

    it('returns 404 REPORT_NOT_FOUND for a non-existing report', async () => {
      mockPrismaReport.findFirst.mockResolvedValue(null);

      try {
        await service.getDownloadLink('non-existing');
        throw new Error('expected getDownloadLink to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect((err as NotFoundException).getResponse()).toEqual({
          error: 'REPORT_NOT_FOUND',
        });
      }
    });

    it('returns 422 REPORT_NOT_AVAILABLE when status is not AVAILABLE', async () => {
      mockPrismaReport.findFirst.mockResolvedValue({
        id: 'id',
        status: ReportStatus.PENDING,
        deletedAt: null,
      });

      try {
        await service.getDownloadLink('id');
        throw new Error('expected getDownloadLink to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(UnprocessableEntityException);
        expect((err as UnprocessableEntityException).getResponse()).toEqual({
          error: 'REPORT_NOT_AVAILABLE',
        });
      }
    });
  });

  describe('findAll', () => {
    it('applies search and type filters and returns the full paginated payload', async () => {
      const mockReports = [{ id: '1', fileName: 'invoice.pdf', type: 'pdf' }];
      mockPrismaReport.findMany.mockResolvedValue(mockReports);
      mockPrismaReport.count.mockResolvedValue(1);

      const result = await service.findAll({
        search: 'invoice',
        type: 'pdf',
        page: 2,
        pageSize: 5,
      });

      expect(mockPrismaReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fileName: expect.objectContaining({ contains: 'invoice' }),
            type: 'pdf',
            deletedAt: null,
          }),
          skip: 5,
          take: 5,
        }),
      );
      expect(result).toEqual({
        data: mockReports,
        total: 1,
        page: 2,
        pageSize: 5,
      });
    });

    it('returns an empty page when there are no reports', async () => {
      mockPrismaReport.findMany.mockResolvedValue([]);
      mockPrismaReport.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result).toEqual({ data: [], total: 0, page: 1, pageSize: 10 });
    });
  });
});
