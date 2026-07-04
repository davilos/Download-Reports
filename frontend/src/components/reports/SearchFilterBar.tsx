import { useState, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons';
import type { ReportType } from '../../types';

interface SearchFilterBarProps {
  onSearchChange: (search: string) => void;
  onTypeChange: (type: ReportType | 'all') => void;
  currentType: ReportType | 'all' | undefined;
  resultCount: number;
}

const typeOptions: { value: ReportType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xml', label: 'XML' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
];

/**
 * Search and filter bar component with debounced search and Radix Select.
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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
        />
        <input
          id="search-reports"
          type="text"
          placeholder="Buscar relatórios..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="input-field pl-10 pr-10"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-white transition-colors"
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Type Filter (Radix Select) */}
      <Select.Root
        value={currentType}
        onValueChange={(val) => onTypeChange(val as ReportType | 'all')}
      >
        <Select.Trigger
          id="filter-type"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-800/50 border border-surface-700/50 
                     rounded-xl text-sm text-surface-300 hover:text-white hover:border-surface-600 
                     focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 
                     transition-all duration-200 min-w-[160px] justify-between"
          aria-label="Filtrar por tipo"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-surface-500" />
            <Select.Value />
          </div>
          <Select.Icon>
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            className="bg-surface-800 border border-surface-700/50 rounded-xl shadow-2xl overflow-hidden z-50 
                       animate-slide-down backdrop-blur-xl"
            position="popper"
            sideOffset={6}
          >
            <Select.Viewport className="p-1.5">
              {typeOptions.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-surface-300 
                             rounded-lg cursor-pointer outline-none
                             data-[highlighted]:bg-brand-500/15 data-[highlighted]:text-white
                             transition-colors duration-150"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <CheckIcon />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* Results Count */}
      <span className="text-sm text-surface-500 whitespace-nowrap hidden sm:block">
        {resultCount} relatório{resultCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
