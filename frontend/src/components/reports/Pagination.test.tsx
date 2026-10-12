import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

const mockOnPageChange = vi.fn();

function renderPagination(currentPage: number, totalItems: number, pageSize = 10) {
  return render(
    <Pagination currentPage={currentPage} totalItems={totalItems} pageSize={pageSize} onPageChange={mockOnPageChange} />,
  );
}

describe('Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when everything fits on one page', () => {
    const { container } = renderPagination(1, 10);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the visible range and the page position', () => {
    renderPagination(2, 25);

    expect(screen.getByText('Mostrando 11–20 de 25')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('marks only the current page with aria-current', () => {
    renderPagination(2, 25);

    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current');
  });

  it('disables the previous button on the first page and the next button on the last', () => {
    const { unmount } = renderPagination(1, 25);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeEnabled();
    unmount();

    renderPagination(3, 25);
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
  });

  it('calls onPageChange with the target page', () => {
    renderPagination(2, 25);

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));
    fireEvent.click(screen.getByRole('button', { name: '1' }));

    expect(mockOnPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(mockOnPageChange).toHaveBeenNthCalledWith(2, 1);
  });
});
