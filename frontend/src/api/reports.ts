import apiClient from './client';
import type { ReportsResponse, ReportsFilters } from '../types';

/**
 * Fetch a paginated, filtered list of reports from the real API.
 */
export async function fetchReports(
  filters: ReportsFilters = {},
): Promise<ReportsResponse> {
  const { data } = await apiClient.get<ReportsResponse>('/reports', { params: filters });
  return data;
}

/**
 * Get a presigned download URL for a report.
 */
export async function getDownloadLink(
  reportId: string,
): Promise<{ downloadUrl: string }> {
  const { data } = await apiClient.get<{ downloadUrl: string }>(`/reports/${reportId}/download-link`);
  return data;
}
