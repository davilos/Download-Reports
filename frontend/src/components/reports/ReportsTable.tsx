import { Download, Loader2 } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { FileTypeIcon, Badge, StatusDot } from '../ui';
import { formatFileSize, formatDate, formatRelativeDate, getStaggerDelay } from '../../utils';
import type { Report } from '../../types';

interface ReportsTableProps {
  reports: Report[];
  onDownload: (reportId: string, fileName: string) => void;
  downloadingId: string | null;
}

/**
 * Main data table for displaying reports with download action.
 */
export function ReportsTable({ reports, onDownload, downloadingId }: ReportsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" id="reports-table">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-surface-700/50">
            <th className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Nome do Arquivo
            </th>
            <th className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Data de Envio
            </th>
            <th className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Tamanho
            </th>
            <th className="text-left py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Status
            </th>
            <th className="text-center py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Ações
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-surface-800/50">
          {reports.map((report, index) => {
            const isDownloading = downloadingId === report.id;
            const isAvailable = report.status === 'available';

            return (
              <tr
                key={report.id}
                className="group hover:bg-surface-800/30 transition-colors duration-200 animate-slide-up"
                style={{ animationDelay: getStaggerDelay(index) }}
              >
                {/* File Name */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center 
                                    group-hover:bg-brand-500/10 transition-colors duration-200">
                      <FileTypeIcon type={report.type} className="text-surface-400 group-hover:text-brand-400 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate max-w-[260px]">
                        {report.fileName}
                      </p>
                      <Badge label={report.type.toUpperCase()} variant="type" typeKey={report.type} />
                    </div>
                  </div>
                </td>

                {/* Date */}
                <td className="py-4 px-6">
                  <Tooltip.Provider delayDuration={200}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <span className="text-sm text-surface-300 cursor-default">
                          {formatRelativeDate(report.sentAt)}
                        </span>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-surface-800 border border-surface-700/50 text-xs text-surface-300 
                                     px-3 py-2 rounded-lg shadow-xl animate-fade-in z-50"
                          sideOffset={5}
                        >
                          {formatDate(report.sentAt)}
                          <Tooltip.Arrow className="fill-surface-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </td>

                {/* Size */}
                <td className="py-4 px-6">
                  <span className="text-sm text-surface-400 font-mono">
                    {formatFileSize(report.sizeInBytes)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <StatusDot status={report.status} />
                </td>

                {/* Download Action */}
                <td className="py-4 px-6">
                  <div className="flex justify-center">
                    <Tooltip.Provider delayDuration={200}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            id={`download-${report.id}`}
                            onClick={() => onDownload(report.id, report.fileName)}
                            disabled={!isAvailable || isDownloading}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                              ${
                                isAvailable
                                  ? 'text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 active:scale-90'
                                  : 'text-surface-600 cursor-not-allowed opacity-50'
                              }`}
                            aria-label={`Baixar ${report.fileName}`}
                          >
                            {isDownloading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="bg-surface-800 border border-surface-700/50 text-xs text-surface-300 
                                       px-3 py-2 rounded-lg shadow-xl animate-fade-in z-50"
                            sideOffset={5}
                          >
                            {isAvailable ? 'Baixar arquivo' : 'Arquivo indisponível'}
                            <Tooltip.Arrow className="fill-surface-800" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
