import { useReports, useDownload } from '../hooks';
import { Header } from '../components/layout';
import { SearchFilterBar, ReportsTable, Pagination, UploadButton } from '../components/reports';
import { TableSkeleton, EmptyState } from '../components/ui';

/**
 * Main Reports page — composes header, filters, data table, and pagination.
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
  } = useReports(10);

  const { download, isDownloading, error: downloadError } = useDownload();

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative z-10">
        <Header />

        <main className="max-w-7xl mx-auto px-6 pb-12">
          {/* Download error toast */}
          {downloadError && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-slide-down">
              {downloadError}
            </div>
          )}

          {/* Card Container */}
          <div className="glass-card overflow-hidden animate-fade-in">
            {/* Toolbar: Filters + Upload Button */}
            <div className="p-6 border-b border-surface-700/30 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <SearchFilterBar
                  onSearchChange={setSearch}
                  onTypeChange={setTypeFilter}
                  currentType={filters.type}
                  resultCount={total}
                />
              </div>

              {/* Upload action — triggers the ephemeral token flow */}
              <UploadButton onUploadSuccess={refetch} />
            </div>

            {/* Table Content */}
            {isLoading ? (
              <TableSkeleton rows={6} />
            ) : error ? (
              <EmptyState
                variant="error"
                title="Erro ao carregar"
                description={error}
                onRetry={refetch}
              />
            ) : reports.length === 0 ? (
              <EmptyState onRetry={refetch} />
            ) : (
              <ReportsTable
                reports={reports}
                onDownload={download}
                downloadingId={isDownloading}
              />
            )}

            {/* Pagination */}
            {!isLoading && !error && reports.length > 0 && (
              <Pagination
                currentPage={page}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            )}
          </div>

          {/* Footer */}
          <footer className="mt-8 text-center">
            <p className="text-surface-600 text-xs">
              Central de Relatórios &copy; {new Date().getFullYear()} — Todos os direitos reservados
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
