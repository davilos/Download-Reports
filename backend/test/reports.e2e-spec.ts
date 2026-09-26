import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';
import { ReportStatus } from '@prisma/client';

/**
 * End-to-end tests for ReportsController (T7). These exercise the real HTTP
 * layer — guards, ValidationPipe, controller, DTOs — via a real INestApplication
 * and supertest. PrismaService is mocked (no live Postgres in this sandbox, per
 * the Test Coverage Matrix's Parallelism Assessment). StorageService is also
 * mocked: presigned URL signing requires a real S3 bucket name (there is none
 * configured in this sandbox — `S3_BUCKET_NAME` has no value — so the real AWS
 * SDK throws when building the signature), and StorageService's own contract is
 * already covered by its dedicated unit tests (T3). JwtStrategy and the
 * JwtAuthGuard run for real, so the guard and DTO validation are genuinely
 * exercised end-to-end.
 */
describe('ReportsController (e2e)', () => {
  let app: INestApplication<App>;
  let mockPrismaReport: {
    create: jest.Mock;
    update: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
  let mockStorage: {
    createPutPresignedUrl: jest.Mock;
    createGetPresignedUrl: jest.Mock;
    buildS3Key: jest.Mock;
  };

  // Mirrors JwtStrategy's own fallback (`configService.get('JWT_SECRET', 'default-secret')`)
  // so the signed token always matches whatever secret the running app resolves to.
  const jwtSecret = process.env.JWT_SECRET ?? 'default-secret';
  const validToken = jwt.sign({ sub: 'user-123' }, jwtSecret, {
    expiresIn: '1h',
  });

  beforeEach(async () => {
    mockPrismaReport = {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    };

    mockStorage = {
      buildS3Key: jest.fn().mockReturnValue('reports/report-1/file.pdf'),
      createPutPresignedUrl: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/put-url'),
      createGetPresignedUrl: jest
        .fn()
        .mockResolvedValue('https://s3.example.com/get-url'),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ report: mockPrismaReport })
      .overrideProvider(StorageService)
      .useValue(mockStorage)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/reports/upload-intent', () => {
    it('returns 200 with the presigned uploadUrl and the created reportId', async () => {
      const createdReport = {
        id: 'report-1',
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
      mockPrismaReport.create.mockResolvedValue(createdReport);
      mockPrismaReport.update.mockResolvedValue({
        ...createdReport,
        s3Key: 'reports/report-1/file.pdf',
      });

      const res = await request(app.getHttpServer())
        .post('/api/reports/upload-intent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          fileName: 'file.pdf',
          fileSize: 1024,
          contentType: 'application/pdf',
        })
        .expect(200);

      // Spec-defined outcome (spec.md P1 Upload AC1/AC2): 200 { uploadUrl, reportId }
      // with reportId matching the record just created.
      expect(res.body).toEqual({
        uploadUrl: 'https://s3.example.com/put-url',
        reportId: 'report-1',
      });
    });

    it('returns 401 when no JWT is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/reports/upload-intent')
        .send({
          fileName: 'file.pdf',
          fileSize: 1024,
          contentType: 'application/pdf',
        })
        .expect(401);

      // Spec-defined outcome (design.md API contract): 401 { message: "Unauthorized" }
      expect((res.body as { message: string }).message).toBe('Unauthorized');
      // Confirms the guard actually blocked the request before it reached the service.
      expect(mockPrismaReport.create).not.toHaveBeenCalled();
    });

    it('returns 400 when contentType is not an allowed MIME type', async () => {
      await request(app.getHttpServer())
        .post('/api/reports/upload-intent')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          fileName: 'file.exe',
          fileSize: 1024,
          contentType: 'application/x-msdownload',
        })
        .expect(400);

      expect(mockPrismaReport.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/reports/:id/confirm', () => {
    it('returns 200 and transitions the report to AVAILABLE', async () => {
      mockPrismaReport.findFirst.mockResolvedValue({
        id: 'report-1',
        status: ReportStatus.PENDING,
        deletedAt: null,
      });
      mockPrismaReport.update.mockResolvedValue({
        id: 'report-1',
        status: ReportStatus.AVAILABLE,
      });

      const res = await request(app.getHttpServer())
        .patch('/api/reports/report-1/confirm')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body).toEqual({
        id: 'report-1',
        status: ReportStatus.AVAILABLE,
      });
    });

    it('returns 404 REPORT_NOT_FOUND_OR_EXPIRED for a nonexistent id', async () => {
      mockPrismaReport.findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .patch('/api/reports/missing-id/confirm')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      // Spec-defined outcome (design.md API contract): 404 { error: "REPORT_NOT_FOUND_OR_EXPIRED" }
      expect(res.body).toEqual({ error: 'REPORT_NOT_FOUND_OR_EXPIRED' });
    });
  });

  describe('GET /api/reports/:id/download-link', () => {
    it('returns 200 with a downloadUrl for an AVAILABLE report', async () => {
      mockPrismaReport.findFirst.mockResolvedValue({
        id: 'report-1',
        status: ReportStatus.AVAILABLE,
        s3Key: 'reports/report-1/file.pdf',
        deletedAt: null,
      });

      const res = await request(app.getHttpServer())
        .get('/api/reports/report-1/download-link')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Spec-defined outcome (spec.md P1 Download AC2): 200 { downloadUrl }
      expect(res.body).toEqual({
        downloadUrl: 'https://s3.example.com/get-url',
      });
    });

    it('returns 422 REPORT_NOT_AVAILABLE when the report status is not AVAILABLE', async () => {
      mockPrismaReport.findFirst.mockResolvedValue({
        id: 'report-1',
        status: ReportStatus.PENDING,
        deletedAt: null,
      });

      const res = await request(app.getHttpServer())
        .get('/api/reports/report-1/download-link')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(422);

      // Spec-defined outcome (design.md API contract): 422 { error: "REPORT_NOT_AVAILABLE" }
      expect(res.body).toEqual({ error: 'REPORT_NOT_AVAILABLE' });
    });
  });

  describe('GET /api/reports', () => {
    it('returns 200 with the paginated list of reports', async () => {
      const reports = [
        {
          id: 'r1',
          fileName: 'a.pdf',
          type: 'pdf',
          status: ReportStatus.AVAILABLE,
        },
      ];
      mockPrismaReport.findMany.mockResolvedValue(reports);
      mockPrismaReport.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/reports')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body).toEqual({
        data: reports,
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    it('returns 200 with an empty list when there are no reports', async () => {
      mockPrismaReport.findMany.mockResolvedValue([]);
      mockPrismaReport.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .get('/api/reports')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Spec-defined outcome (spec.md P3 Listagem AC3): { data: [], total: 0, page: 1, pageSize: 10 }
      expect(res.body).toEqual({ data: [], total: 0, page: 1, pageSize: 10 });
    });
  });
});
