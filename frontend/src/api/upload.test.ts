import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestUploadUrl, confirmUpload } from './upload';

// Mock apiClient
const { mockPost, mockPatch } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
}));
vi.mock('./client', () => ({
  default: { post: mockPost, patch: mockPatch },
}));

describe('requestUploadUrl', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends correct payload with fileSize to /reports/upload-intent', async () => {
    mockPost.mockResolvedValue({ data: { uploadUrl: 'https://s3.example.com/put-url', reportId: 'report-123' } });
    const result = await requestUploadUrl({ fileName: 'test.pdf', fileSize: 1024, contentType: 'application/pdf' });
    expect(mockPost).toHaveBeenCalledWith('/reports/upload-intent', { fileName: 'test.pdf', fileSize: 1024, contentType: 'application/pdf' });
    expect(result).toEqual({ uploadUrl: 'https://s3.example.com/put-url', reportId: 'report-123' });
  });
});

describe('confirmUpload', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls correct endpoint', async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await confirmUpload('report-123');
    expect(mockPatch).toHaveBeenCalledWith('/reports/report-123/confirm');
  });
});
