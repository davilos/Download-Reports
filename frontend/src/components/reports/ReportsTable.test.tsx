import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ReportsTable } from './ReportsTable';
import { formatDate } from '../../utils';
import type { Report, ReportStatus } from '../../types';

// Radix Tooltip measures its trigger with ResizeObserver, which jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Same shape as one item of `data` in GET /api/reports.
const availableReport: Report = {
  id: 'r1',
  fileName: 'relatorio-vendas-outubro.pdf',
  createdAt: '2026-10-08T12:00:00.000Z',
  fileSize: 1536,
  type: 'pdf',
  status: 'AVAILABLE',
};

const mockOnDownload = vi.fn();

function renderTable(reports: Report[]) {
  render(<ReportsTable reports={reports} onDownload={mockOnDownload} downloadingId={null} />);
}

function cellInColumn(header: string, rowIndex = 0): HTMLElement {
  const table = screen.getByRole('table');
  const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent?.trim());
  const column = headers.indexOf(header);
  expect(column).toBeGreaterThan(-1);
  const bodyRows = within(table).getAllByRole('row').slice(1);
  return within(bodyRows[rowIndex]).getAllByRole('cell')[column];
}

async function openTooltip(trigger: HTMLElement): Promise<HTMLElement> {
  fireEvent.pointerMove(trigger);
  return screen.findByRole('tooltip');
}

describe('ReportsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T12:12:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the relative createdAt in the Data de Envio cell', () => {
    renderTable([availableReport]);

    expect(cellInColumn('Data de Envio')).toHaveTextContent('Há 12 min');
  });

  it('shows the full createdAt date in the date tooltip', async () => {
    renderTable([availableReport]);

    const tooltip = await openTooltip(within(cellInColumn('Data de Envio')).getByText('Há 12 min'));

    expect(tooltip).toHaveTextContent(formatDate('2026-10-08T12:00:00.000Z'));
    expect(tooltip).toHaveTextContent('08/10/2026');
  });

  it('renders fileSize in the Tamanho cell', () => {
    renderTable([availableReport]);

    expect(cellInColumn('Tamanho')).toHaveTextContent('1.5 KB');
  });

  it('enables the download button for an AVAILABLE report', async () => {
    renderTable([availableReport]);

    const button = within(cellInColumn('Ações')).getByRole('button');
    expect(button).toHaveAttribute('id', 'download-r1');
    expect(button).toBeEnabled();

    const tooltip = await openTooltip(button);
    expect(tooltip).toHaveTextContent('Baixar arquivo');
  });

  it('calls onDownload once with the report id and fileName', () => {
    renderTable([availableReport]);

    fireEvent.click(screen.getByRole('button', { name: 'Baixar relatorio-vendas-outubro.pdf' }));

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
    expect(mockOnDownload).toHaveBeenCalledWith('r1', 'relatorio-vendas-outubro.pdf');
  });

  const unavailableStatuses: ReportStatus[] = ['PENDING', 'PROCESSING', 'ERROR', 'EXPIRED'];

  it.each(unavailableStatuses)(
    'disables the download button with the unavailable tooltip for %s',
    async (status) => {
      renderTable([{ ...availableReport, status }]);

      const button = within(cellInColumn('Ações')).getByRole('button');
      expect(button).toHaveAttribute('id', 'download-r1');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(mockOnDownload).not.toHaveBeenCalled();

      const tooltip = await openTooltip(button);
      expect(tooltip).toHaveTextContent('Arquivo indisponível');
    },
  );

  it('renders the status label in the Status column', () => {
    renderTable([{ ...availableReport, status: 'PENDING' }]);

    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim());
    expect(headers).toEqual(['Nome do Arquivo', 'Data de Envio', 'Tamanho', 'Status', 'Ações']);
    const nameCell = cellInColumn('Nome do Arquivo');
    expect(within(nameCell).getByText('relatorio-vendas-outubro.pdf')).toBeInTheDocument();
    expect(within(nameCell).getByText('PDF')).toBeInTheDocument();
    expect(cellInColumn('Status')).toHaveTextContent('Pendente');
  });
});
