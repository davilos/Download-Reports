import { AlertCircle } from 'lucide-react';
import { useReports, useDownload } from '../hooks';
import { Header } from '../components/layout';
import { SearchFilterBar, ReportsTable, Pagination, UploadButton } from '../components/reports';
import { TableSkeleton, EmptyState } from '../components/ui';

/**
 * Main Reports page — composes header, filters, the report card grid, and pagination.
 */
export function ReportsPage() {
  const {
    reports,
    total,
    page,
    pageSize,
    isLoading,
    error,
    filters,
    setSearch,
    setTypeFilter,
    setPage,
    refetch,
  } = useReports(12);

  const { download, isDownloading, error: downloadError } = useDownload();

  return (
    <div className="min-h-screen bg-ground">
      {/* Bottom padding on phones keeps the last card clear of the fixed upload bar. */}
      <div className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <Header action={<UploadButton onUploadSuccess={refetch} />} />

        <main className="mt-8 space-y-6 sm:mt-10">
          <SearchFilterBar
            onSearchChange={setSearch}
            onTypeChange={setTypeFilter}
            currentType={filters.type}
            resultCount={total}
          />

          {downloadError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl bg-danger-soft px-4 py-3 text-sm font-bold text-danger animate-fade-in"
            >
              <AlertCircle size={18} className="mt-px shrink-0" aria-hidden="true" />
              {downloadError}
            </div>
          )}

          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : error ? (
            <EmptyState variant="error" title="Erro ao carregar" description={error} onRetry={refetch} />
          ) : reports.length === 0 ? (
            <EmptyState onRetry={refetch} />
          ) : (
            <ReportsTable reports={reports} onDownload={download} downloadingId={isDownloading} />
          )}

          {!isLoading && !error && reports.length > 0 && (
            <Pagination currentPage={page} totalItems={total} pageSize={pageSize} onPageChange={setPage} />
          )}
        </main>

        <footer className="mt-12 text-center">
          <p className="text-xs text-ink-soft">
            Central de Relatórios &copy; {new Date().getFullYear()} — Todos os direitos reservados
          </p>
        </footer>
      </div>
    </div>
  );
}
