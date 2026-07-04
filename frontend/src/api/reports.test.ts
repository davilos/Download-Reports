import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchReports, getDownloadLink } from './reports';

// Mock apiClient
const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
vi.mock('./client', () => ({
  default: { get: mockGet },
}));

describe('fetchReports', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls /reports endpoint with correct params', async () => {
    mockGet.mockResolvedValue({ data: { data: [], total: 0, page: 1, pageSize: 10 } });
    const result = await fetchReports({ page: 2, pageSize: 5 });
    expect(mockGet).toHaveBeenCalledWith('/reports', { params: { page: 2, pageSize: 5 } });
    expect(result).toEqual({ data: [], total: 0, page: 1, pageSize: 10 });
  });

  it('calls /reports with no params when filters are empty', async () => {
    mockGet.mockResolvedValue({ data: { data: [], total: 0, page: 1, pageSize: 10 } });
    await fetchReports();
    expect(mockGet).toHaveBeenCalledWith('/reports', { params: {} });
  });
});

describe('getDownloadLink', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls correct endpoint and returns downloadUrl', async () => {
    mockGet.mockResolvedValue({ data: { downloadUrl: 'https://s3.example.com/file.pdf' } });
    const result = await getDownloadLink('report-123');
    expect(mockGet).toHaveBeenCalledWith('/reports/report-123/download-link');
    expect(result.downloadUrl).toBe('https://s3.example.com/file.pdf');
  });
});
