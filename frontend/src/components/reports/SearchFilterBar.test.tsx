import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchFilterBar } from './SearchFilterBar';
import type { ReportType } from '../../types';

const mockOnSearchChange = vi.fn();
const mockOnTypeChange = vi.fn();

function renderBar(currentType: ReportType | 'all' = 'all', resultCount = 3) {
  render(
    <SearchFilterBar
      onSearchChange={mockOnSearchChange}
      onTypeChange={mockOnTypeChange}
      currentType={currentType}
      resultCount={resultCount}
    />,
  );
}

describe('SearchFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders one type option per report type plus Todos, in order', () => {
    renderBar();

    const group = screen.getByRole('group', { name: 'Filtrar por tipo' });
    const labels = Array.from(group.querySelectorAll('button')).map((button) => button.textContent?.trim());
    expect(labels).toEqual(['Todos', 'PDF', 'XML', 'CSV', 'XLSX']);
  });

  it('marks only the current type as pressed', () => {
    renderBar('xml');

    expect(screen.getByRole('button', { name: 'XML' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'PDF' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onTypeChange with the clicked type', () => {
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'XLSX' }));

    expect(mockOnTypeChange).toHaveBeenCalledTimes(1);
    expect(mockOnTypeChange).toHaveBeenCalledWith('xlsx');
  });

  it('calls onTypeChange with all when Todos is clicked', () => {
    renderBar('pdf');

    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));

    expect(mockOnTypeChange).toHaveBeenCalledWith('all');
  });

  it('debounces the search value by 300 ms', () => {
    renderBar();
    mockOnSearchChange.mockClear();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar relatórios' }), { target: { value: 'nfe' } });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(mockOnSearchChange).not.toHaveBeenCalledWith('nfe');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockOnSearchChange).toHaveBeenCalledWith('nfe');
  });

  it('clears the search immediately from the clear button', () => {
    renderBar();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar relatórios' }), { target: { value: 'nfe' } });
    mockOnSearchChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));

    expect(mockOnSearchChange).toHaveBeenCalledWith('');
    expect(screen.getByRole('searchbox', { name: 'Buscar relatórios' })).toHaveValue('');
  });

  it.each([
    [1, '1 relatório'],
    [3, '3 relatórios'],
  ])('renders the result count for %i', (count, text) => {
    renderBar('all', count);

    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
