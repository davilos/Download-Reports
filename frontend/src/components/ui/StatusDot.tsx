import type { ReportStatus } from '../../types';

interface StatusDotProps {
  // A plain string, not ReportStatus: the value comes from the API at runtime and may fall outside the type.
  status: string;
}

const statusConfig: Record<ReportStatus, { dot: string; label: string }> = {
  AVAILABLE: { dot: 'bg-ok', label: 'Disponível' },
  PROCESSING: { dot: 'bg-warn-dot', label: 'Processando' },
  ERROR: { dot: 'bg-danger', label: 'Erro' },
  PENDING: { dot: 'bg-warn-dot', label: 'Pendente' },
  EXPIRED: { dot: 'bg-ink-soft', label: 'Expirado' },
};

const unknownConfig = {
  dot: 'border-2 border-ink-soft bg-transparent',
  label: 'Desconhecido',
};

function isReportStatus(status: string): status is ReportStatus {
  return Object.hasOwn(statusConfig, status);
}

/**
 * Status dot plus its pt-BR label.
 */
export function StatusDot({ status }: StatusDotProps) {
  const config = isReportStatus(status) ? statusConfig[status] : unknownConfig;

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${config.dot}`} aria-hidden="true" />
      <span className="text-sm font-semibold text-ink">{config.label}</span>
    </div>
  );
}
