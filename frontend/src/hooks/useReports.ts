import { useState, useEffect, useCallback } from 'react';
import { fetchReports } from '../api';
import type { Report, ReportsFilters, ReportType } from '../types';

interface UseReportsReturn {
  reports: Report[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  filters: ReportsFilters;
  setSearch: (search: string) => void;
  setTypeFilter: (type: ReportType | 'all') => void;
  setPage: (page: number) => void;
  refetch: () => void;
}

/**
 * Hook to fetch and manage the reports list with filters and pagination.
 */
export function useReports(initialPageSize = 10): UseReportsReturn {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportsFilters>({
    search: '',
    type: 'all',
    page: 1,
    pageSize: initialPageSize,
  });

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchReports(filters);
      setReports(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios.');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setTypeFilter = useCallback((type: ReportType | 'all') => {
    setFilters((prev) => ({ ...prev, type, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    reports,
    total,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? initialPageSize,
    isLoading,
    error,
    filters,
    setSearch,
    setTypeFilter,
    setPage,
    refetch: loadReports,
  };
}
