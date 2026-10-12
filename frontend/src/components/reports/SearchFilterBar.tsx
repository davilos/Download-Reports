import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { ReportType } from '../../types';

interface SearchFilterBarProps {
  onSearchChange: (search: string) => void;
  onTypeChange: (type: ReportType | 'all') => void;
  currentType: ReportType | 'all' | undefined;
  resultCount: number;
}

const typeOptions: { value: ReportType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xml', label: 'XML' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'XLSX' },
];

/**
 * Search pill with debounced input, plus type chips: five options read faster as chips than inside a select.
 */
export function SearchFilterBar({
  onSearchChange,
  onTypeChange,
  currentType = 'all',
  resultCount,
}: SearchFilterBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchValue, onSearchChange]);

  const clearSearch = () => {
    setSearchValue('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
      <div className="relative w-full lg:max-w-md">
        <Search
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
          aria-hidden="true"
        />
        <input
          id="search-reports"
          type="search"
          placeholder="Procurar pelo nome do arquivo"
          aria-label="Buscar relatórios"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="input-field pl-11 pr-12 [&::-webkit-search-cancel-button]:hidden"
        />
        {searchValue && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full
                       text-ink-soft transition-colors hover:bg-tile hover:text-ink"
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div
        id="filter-type"
        role="group"
        aria-label="Filtrar por tipo"
        className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0"
      >
        {typeOptions.map((option) => {
          const isActive = currentType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onTypeChange(option.value)}
              className={`btn h-10 shrink-0 px-4 text-sm font-semibold ${
                isActive
                  ? 'bg-ink text-white'
                  : 'border border-line bg-card text-ink hover:border-ink-soft'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink-soft lg:ml-auto">
        {resultCount} relatório{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
