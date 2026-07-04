import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReports } from './useReports';

const mockFetchReports = vi.fn();
vi.mock('../api', () => ({
  fetchReports: (...args: unknown[]) => mockFetchReports(...args),
}));

describe('useReports', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls fetchReports with filters on mount', async () => {
    mockFetchReports.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 });

    const { result } = renderHook(() => useReports());

    await act(async () => { await vi.waitFor(() => !result.current.isLoading); });

    expect(mockFetchReports).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
  });

  it('refetch triggers new fetchReports call', async () => {
    mockFetchReports.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 });

    const { result } = renderHook(() => useReports());
    await act(async () => { await vi.waitFor(() => !result.current.isLoading); });

    await act(async () => { result.current.refetch(); });

    expect(mockFetchReports.mock.calls.length).toBeGreaterThan(1);
  });

  it('transitions loading state and sets error state on fetch failure', async () => {
    mockFetchReports.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useReports());

    expect(result.current.isLoading).toBe(true);

    await act(async () => { await vi.waitFor(() => !result.current.isLoading); });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('API Error');
    expect(result.current.reports).toEqual([]);
  });
});
