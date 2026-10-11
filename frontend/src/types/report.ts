/** Types for the reports/documents domain */

export interface Report {
  id: string;
  fileName: string;
  createdAt: string;    // ISO date string
  fileSize: number;
  type: ReportType;
  status: ReportStatus;
  // downloadUrl removed — generated on demand via /download-link
}

export type ReportType = 'pdf' | 'xml' | 'csv' | 'xlsx';

export type ReportStatus = 'PENDING' | 'AVAILABLE' | 'PROCESSING' | 'ERROR' | 'EXPIRED';

export interface ReportsResponse {
  data: Report[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportsFilters {
  search?: string;
  type?: ReportType | 'all';
  page?: number;
  pageSize?: number;
}
