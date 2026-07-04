import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { CleanupService } from './cleanup.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

describe('CleanupService', () => {
  let service: CleanupService;
  let mockPrismaReport: {
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  let loggerSpy: jest.SpyInstance;

  const FIXED_NOW = new Date('2026-07-04T12:00:00.000Z');

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);

    mockPrismaReport = {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    };

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        { provide: PrismaService, useValue: { report: mockPrismaReport } },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('soft-deletes N PENDING reports older than 20 minutes and logs the count', async () => {
    const expiredReports = [{ id: 'id-1' }, { id: 'id-2' }];
    mockPrismaReport.findMany.mockResolvedValue(expiredReports);
    mockPrismaReport.updateMany.mockResolvedValue({ count: 2 });

    await service.runCleanup();

    expect(mockPrismaReport.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['id-1', 'id-2'] } },
      data: { status: ReportStatus.EXPIRED, deletedAt: FIXED_NOW },
    });
    expect(loggerSpy).toHaveBeenCalledWith('CleanupService: 2 registros PENDING expirados');
  });

  it('does not update and logs a distinct no-op message when zero records are found', async () => {
    mockPrismaReport.findMany.mockResolvedValue([]);

    await service.runCleanup();

    expect(mockPrismaReport.updateMany).not.toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalledWith('CleanupService: nenhum registro para limpar');
  });

  it('queries only PENDING reports older than 20 minutes with deletedAt null, excluding AVAILABLE and recent PENDING records', async () => {
    mockPrismaReport.findMany.mockResolvedValue([{ id: 'old-pending-id' }]);
    mockPrismaReport.updateMany.mockResolvedValue({ count: 1 });

    await service.runCleanup();

    const twentyMinutesAgo = new Date(FIXED_NOW.getTime() - 20 * 60 * 1000);
    expect(mockPrismaReport.findMany).toHaveBeenCalledWith({
      where: {
        status: ReportStatus.PENDING,
        createdAt: { lt: twentyMinutesAgo },
        deletedAt: null,
      },
      select: { id: true },
    });
  });
});
