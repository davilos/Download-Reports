import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls under the report grid. Phones get "Página x de y" instead of the numbered pills.
 */
export function Pagination({ currentPage, totalItems, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-4 pt-2">
      <span className="text-sm font-semibold tabular-nums text-ink-soft">
        Mostrando {startItem}–{endItem} de {totalItems}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          id="pagination-prev"
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn-ghost h-10 w-10 p-0 disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="px-2 text-sm font-semibold tabular-nums text-ink sm:hidden">
          Página {currentPage} de {totalPages}
        </span>

        <div className="hidden items-center gap-1.5 sm:flex">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              id={`pagination-page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`btn h-10 w-10 text-sm tabular-nums ${
                page === currentPage ? 'bg-ink text-white' : 'text-ink hover:bg-tile'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          id="pagination-next"
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn-ghost h-10 w-10 p-0 disabled:opacity-40"
          aria-label="Próxima página"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
