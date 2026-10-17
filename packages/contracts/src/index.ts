// The JSON shapes of the /api/reports routes. Types only: both packages erase these imports at compile time, so a
// runtime value here would need a build step and a CJS/ESM split that this package deliberately avoids.

export type ReportType = 'pdf' | 'xml' | 'csv' | 'xlsx';

export type ReportStatus = 'PENDING' | 'AVAILABLE' | 'PROCESSING' | 'ERROR' | 'EXPIRED';

/** One item of GET /api/reports, as serialized: dates are ISO strings. */
export interface Report {
  id: string;
  fileName: string;
  createdAt: string;
  fileSize: number;
  type: ReportType;
  status: ReportStatus;
}

/** Query string of GET /api/reports. */
export interface ReportsFilters {
  search?: string;
  type?: ReportType | 'all';
  page?: number;
  pageSize?: number;
}

/** Body of GET /api/reports. */
export interface ReportsResponse {
  data: Report[];
  total: number;
  page: number;
  pageSize: number;
}

/** Body of POST /api/reports/upload-intent. */
export interface UploadIntentRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
}

/** Response of POST /api/reports/upload-intent. */
export interface UploadIntentResponse {
  uploadUrl: string;
  reportId: string;
}

/** Response of GET /api/reports/:id/download-link. */
export interface DownloadLinkResponse {
  downloadUrl: string;
}

export type ReportErrorCode =
  | 'REPORT_NOT_FOUND'
  | 'REPORT_NOT_FOUND_OR_EXPIRED'
  | 'REPORT_NOT_AVAILABLE'
  | 'INVALID_STATUS_TRANSITION';

/** Body of a 404 / 422 from the report routes. */
export interface ReportErrorBody {
  error: ReportErrorCode;
}
