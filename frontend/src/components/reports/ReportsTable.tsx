import { Fragment } from 'react';
import { Clock, Download, Loader2 } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { StatusDot } from '../ui';
import { formatFileSize, formatDate, formatRelativeDate } from '../../utils';
import type { Report } from '../../types';

interface ReportsTableProps {
  reports: Report[];
  onDownload: (reportId: string, fileName: string) => void;
  downloadingId: string | null;
}

const tooltipClassName =
  'z-50 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white shadow-lift animate-fade-in';

/**
 * Offers a line break after each `_`, `-` and `.` so long file names wrap at their separators. The last dot is
 * not a break point, so the extension stays attached to the word before it.
 */
function breakableFileName(fileName: string) {
  const extensionStart = fileName.lastIndexOf('.');
  const base = extensionStart > 0 ? fileName.slice(0, extensionStart) : fileName;
  const extension = extensionStart > 0 ? fileName.slice(extensionStart) : '';
  const parts = base.split(/(?<=[_.-])/);
  parts[parts.length - 1] += extension;

  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <wbr />}
      {part}
    </Fragment>
  ));
}

function downloadLabel(report: Report, isDownloading: boolean): string {
  if (isDownloading) return 'Baixando';
  if (report.status === 'AVAILABLE') return 'Baixar';
  return report.status === 'PENDING' ? 'Aguardando' : 'Indisponível';
}

/**
 * Reports rendered as a grid of cards. The markup stays a table with explicit ARIA roles, because CSS grid on
 * table elements drops their implicit semantics in some browsers; screen readers still get a real data table.
 */
export function ReportsTable({ reports, onDownload, downloadingId }: ReportsTableProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <table role="table" className="block w-full" id="reports-table">
        <thead role="rowgroup" className="sr-only">
          <tr role="row">
            <th role="columnheader">Nome do Arquivo</th>
            <th role="columnheader">Data de Envio</th>
            <th role="columnheader">Tamanho</th>
            <th role="columnheader">Status</th>
            <th role="columnheader">Ações</th>
          </tr>
        </thead>

        <tbody role="rowgroup" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const isDownloading = downloadingId === report.id;
            const isAvailable = report.status === 'AVAILABLE';
            const isDisabled = !isAvailable || isDownloading;
            const label = downloadLabel(report, isDownloading);

            return (
              <tr
                key={report.id}
                role="row"
                className="grid grid-cols-[1fr_auto] grid-rows-[1fr_auto_auto] rounded-card bg-card p-5 shadow-card
                           transition-shadow duration-300 ease-out-expo hover:shadow-lift"
              >
                <td role="cell" className="col-span-2 flex min-w-0 items-start gap-3.5">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tile
                               text-[11px] font-extrabold tracking-wide text-ink"
                    aria-hidden="true"
                  >
                    {report.type.toUpperCase()}
                  </span>
                  <p
                    className="line-clamp-3 pt-0.5 [overflow-wrap:anywhere] text-[15.5px] font-bold leading-snug text-ink"
                    title={report.fileName}
                  >
                    {breakableFileName(report.fileName)}
                  </p>
                </td>

                <td role="cell" className="mt-4 flex flex-col">
                  <span className="text-xs text-ink-soft" aria-hidden="true">
                    Enviado
                  </span>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      {/* Focusable so keyboard and touch (tap focuses) can reach the exact date, not only hover. */}
                      <time
                        dateTime={report.createdAt}
                        tabIndex={0}
                        className="w-fit cursor-default rounded text-sm font-semibold tabular-nums text-ink"
                      >
                        {formatRelativeDate(report.createdAt)}
                      </time>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className={tooltipClassName} sideOffset={6}>
                        {formatDate(report.createdAt)}
                        <Tooltip.Arrow className="fill-ink" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                  {/* Touch screens cannot hover, so phones always see the exact date under a relative one. */}
                  {formatRelativeDate(report.createdAt) !== formatDate(report.createdAt) && (
                    <span className="text-xs tabular-nums text-ink-soft sm:hidden">{formatDate(report.createdAt)}</span>
                  )}
                </td>

                <td role="cell" className="mt-4 flex flex-col items-end text-right">
                  <span className="text-xs text-ink-soft" aria-hidden="true">
                    Tamanho
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink">{formatFileSize(report.fileSize)}</span>
                </td>

                <td role="cell" className="mt-4 flex items-center border-t border-line pt-4">
                  <StatusDot status={report.status} />
                </td>

                <td role="cell" className="mt-4 flex items-center justify-end border-t border-line pt-4">
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      {/* A disabled button gets no pointer or focus events, so the wrapper carries the tooltip. */}
                      <span tabIndex={isDisabled ? 0 : undefined} className="inline-flex rounded-full">
                        <button
                          id={`download-${report.id}`}
                          type="button"
                          onClick={() => onDownload(report.id, report.fileName)}
                          disabled={isDisabled}
                          className={`btn h-10 px-4 text-sm ${
                            isAvailable
                              ? 'bg-action text-white hover:bg-action-hover'
                              : 'pointer-events-none border border-dashed border-line font-semibold text-ink-soft'
                          } ${isDownloading ? 'pointer-events-none' : ''}`}
                          aria-label={`${label} ${report.fileName}`}
                        >
                          {isDownloading ? (
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                          ) : isAvailable ? (
                            <Download size={16} aria-hidden="true" />
                          ) : (
                            <Clock size={16} aria-hidden="true" />
                          )}
                          {label}
                        </button>
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className={tooltipClassName} sideOffset={6}>
                        {isAvailable ? 'Baixar arquivo' : 'Arquivo indisponível'}
                        <Tooltip.Arrow className="fill-ink" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Tooltip.Provider>
  );
}
