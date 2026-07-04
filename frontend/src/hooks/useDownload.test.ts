import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDownload } from './useDownload';

const mockGetDownloadLink = vi.fn();
vi.mock('../api', () => ({
  getDownloadLink: (...args: unknown[]) => mockGetDownloadLink(...args),
}));

const mockIsAxiosError = vi.fn();
vi.mock('axios', () => ({
  default: { isAxiosError: (...args: unknown[]) => mockIsAxiosError(...args) },
}));

interface MockAnchor {
  href: string;
  download: string;
  click: ReturnType<typeof vi.fn>;
}

let mockAnchor: MockAnchor;

describe('useDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAxiosError.mockReturnValue(false);

    // Mock only the <a> element creation/DOM lifecycle used for the download
    // trigger; delegate everything else to the real DOM so that
    // @testing-library/react can still create its own render container.
    mockAnchor = { href: '', download: '', click: vi.fn() };

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: unknown) => {
      if (tagName === 'a') return mockAnchor as unknown as HTMLAnchorElement;
      return realCreateElement(tagName, options as ElementCreationOptions);
    }) as typeof document.createElement);

    const realAppendChild = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, 'appendChild').mockImplementation(((node: Node) => {
      if (node === (mockAnchor as unknown as Node)) return node;
      return realAppendChild(node);
    }) as typeof document.body.appendChild);

    const realRemoveChild = document.body.removeChild.bind(document.body);
    vi.spyOn(document.body, 'removeChild').mockImplementation(((node: Node) => {
      if (node === (mockAnchor as unknown as Node)) return node;
      return realRemoveChild(node);
    }) as typeof document.body.removeChild);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path: creates an <a> with the presigned URL/fileName, clicks it and removes it from the DOM', async () => {
    mockGetDownloadLink.mockResolvedValue({ downloadUrl: 'https://s3.example.com/file.pdf' });

    const { result } = renderHook(() => useDownload());

    await act(async () => {
      await result.current.download('report-123', 'file.pdf');
    });

    expect(mockGetDownloadLink).toHaveBeenCalledWith('report-123');
    // Payload assertions: the <a> element must carry the real downloadUrl/fileName,
    // actually be attached/detached from the DOM, and actually be clicked —
    // not just that getDownloadLink was called.
    expect(mockAnchor.href).toBe('https://s3.example.com/file.pdf');
    expect(mockAnchor.download).toBe('file.pdf');
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
    expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
    expect(result.current.error).toBeNull();
    expect(result.current.isDownloading).toBeNull();
  });

  it('sets the exact expired-link message on HTTP 403', async () => {
    const axiosError = { response: { status: 403 } };
    mockIsAxiosError.mockReturnValue(true);
    mockGetDownloadLink.mockRejectedValue(axiosError);

    const { result } = renderHook(() => useDownload());

    await act(async () => {
      await result.current.download('report-123', 'file.pdf');
    });

    expect(result.current.error).toBe('Link expirado — clique em Baixar novamente');
    // No download should have been triggered on failure
    expect(mockAnchor.click).not.toHaveBeenCalled();
  });

  it('sets a generic error message on other errors', async () => {
    mockGetDownloadLink.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDownload());

    await act(async () => {
      await result.current.download('report-123', 'file.pdf');
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.error).not.toBe('Link expirado — clique em Baixar novamente');
    expect(mockAnchor.click).not.toHaveBeenCalled();
  });

  it('clearError clears the error state', async () => {
    mockGetDownloadLink.mockRejectedValue(new Error('Some error'));

    const { result } = renderHook(() => useDownload());

    await act(async () => {
      await result.current.download('report-123', 'file.pdf');
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
