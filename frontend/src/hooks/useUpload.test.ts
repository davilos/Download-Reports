import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUpload } from './useUpload';

// Mock API functions (../api re-exports requestUploadUrl, uploadToSignedUrl, confirmUpload)
const mockRequestUploadUrl = vi.fn();
const mockUploadToSignedUrl = vi.fn();
const mockConfirmUpload = vi.fn();
vi.mock('../api', () => ({
  requestUploadUrl: (...args: unknown[]) => mockRequestUploadUrl(...args),
  uploadToSignedUrl: (...args: unknown[]) => mockUploadToSignedUrl(...args),
  confirmUpload: (...args: unknown[]) => mockConfirmUpload(...args),
}));

// Mock axios for 403 detection (axios.isAxiosError)
const mockIsAxiosError = vi.fn();
vi.mock('axios', () => ({
  default: { isAxiosError: (...args: unknown[]) => mockIsAxiosError(...args) },
}));

const createMockFile = (name = 'test.pdf', type = 'application/pdf', size = 1024): File => {
  const file = new File(['content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('useUpload', () => {
  let setTimeoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAxiosError.mockReturnValue(false);
    // The hook's auto-retry waits 3s via setTimeout; make it resolve immediately
    // so tests stay deterministic and fast without relying on fake-timer/microtask
    // interleaving (which is brittle for retry loops awaited inside act()).
    setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(((cb: () => void) => {
        cb();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }) as any);
  });

  afterEach(() => {
    setTimeoutSpy.mockRestore();
  });

  it('happy path: request -> PUT -> confirm -> success', async () => {
    mockRequestUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/put', reportId: 'id-1' });
    const callOrder: string[] = [];
    mockUploadToSignedUrl.mockImplementation(async () => {
      callOrder.push('put');
    });
    mockConfirmUpload.mockImplementation(async () => {
      callOrder.push('confirm');
    });

    const { result } = renderHook(() => useUpload());
    const file = createMockFile();

    await act(async () => {
      await result.current.upload(file);
    });

    expect(mockRequestUploadUrl).toHaveBeenCalledWith({
      fileName: 'test.pdf',
      fileSize: 1024,
      contentType: 'application/pdf',
    });
    expect(mockUploadToSignedUrl).toHaveBeenCalledOnce();
    expect(mockConfirmUpload).toHaveBeenCalledWith('id-1');
    // success is only set once confirm resolves, after the PUT
    expect(callOrder).toEqual(['put', 'confirm']);
    expect(result.current.status).toBe('success');
  });

  it('rejects invalid MIME type without calling any API', async () => {
    const { result } = renderHook(() => useUpload());
    const file = createMockFile('malware.exe', 'application/octet-stream');

    await act(async () => {
      await result.current.upload(file);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Tipo de arquivo não suportado');
    expect(mockRequestUploadUrl).not.toHaveBeenCalled();
    expect(mockUploadToSignedUrl).not.toHaveBeenCalled();
    expect(mockConfirmUpload).not.toHaveBeenCalled();
  });

  it('rejects file > 50MB without calling any API', async () => {
    const { result } = renderHook(() => useUpload());
    const file = createMockFile('huge.pdf', 'application/pdf', 52_428_801);

    await act(async () => {
      await result.current.upload(file);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Arquivo muito grande (máx. 50 MB)');
    expect(mockRequestUploadUrl).not.toHaveBeenCalled();
    expect(mockUploadToSignedUrl).not.toHaveBeenCalled();
  });

  it('sets status to ttl-expired when S3 returns 403 during PUT', async () => {
    mockRequestUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/put', reportId: 'id-1' });
    const axiosError = { response: { status: 403 } };
    mockIsAxiosError.mockReturnValue(true);
    mockUploadToSignedUrl.mockRejectedValue(axiosError);

    const { result } = renderHook(() => useUpload());
    const file = createMockFile();

    await act(async () => {
      await result.current.upload(file);
    });

    expect(result.current.status).toBe('ttl-expired');
    expect(mockConfirmUpload).not.toHaveBeenCalled();
  });

  it('auto-retries once after a network error on PUT, then succeeds', async () => {
    mockRequestUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/put', reportId: 'id-1' });
    let callCount = 0;
    mockUploadToSignedUrl.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('Network Error'));
      return Promise.resolve();
    });
    mockConfirmUpload.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpload());
    const file = createMockFile();

    await act(async () => {
      await result.current.upload(file);
    });

    expect(mockUploadToSignedUrl).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
    expect(result.current.status).toBe('success');
  });

  it('sets status to error after the retry also fails with a network error', async () => {
    mockRequestUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/put', reportId: 'id-1' });
    mockUploadToSignedUrl.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useUpload());
    const file = createMockFile();

    await act(async () => {
      await result.current.upload(file);
    });

    expect(mockUploadToSignedUrl).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('error');
    expect(mockConfirmUpload).not.toHaveBeenCalled();
  });

  it('retryUpload restarts the full flow reusing the stored file, without re-selecting it', async () => {
    mockRequestUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.example.com/put', reportId: 'id-1' });
    const axiosError = { response: { status: 403 } };
    mockIsAxiosError.mockReturnValue(true);
    mockUploadToSignedUrl.mockRejectedValueOnce(axiosError).mockResolvedValue(undefined);
    mockConfirmUpload.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpload());
    const file = createMockFile();

    await act(async () => {
      await result.current.upload(file);
    });
    expect(result.current.status).toBe('ttl-expired');

    // TTL no longer expired on the retried attempt
    mockIsAxiosError.mockReturnValue(false);
    mockRequestUploadUrl.mockClear();

    await act(async () => {
      await result.current.retryUpload();
    });

    // Full flow restarted (new upload-intent -> new PUT) using fileRef.current,
    // with no file argument required from the caller.
    expect(mockRequestUploadUrl).toHaveBeenCalledWith({
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    });
    expect(result.current.status).toBe('success');
  });
});
