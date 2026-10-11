import { describe, it, expectTypeOf } from 'vitest';
import type { Report, ReportStatus, ReportType } from './report';

// Type-level assertions: `tsc -b` fails the build if the frontend stops mirroring GET /api/reports.
describe('Report', () => {
  it('mirrors the fields of a GET /api/reports item', () => {
    expectTypeOf<Report>().toEqualTypeOf<{
      id: string;
      fileName: string;
      createdAt: string;
      fileSize: number;
      type: ReportType;
      status: ReportStatus;
    }>();
  });

  it('declares ReportStatus as the UPPERCASE Prisma enum', () => {
    expectTypeOf<ReportStatus>().toEqualTypeOf<'PENDING' | 'AVAILABLE' | 'PROCESSING' | 'ERROR' | 'EXPIRED'>();
  });
});
