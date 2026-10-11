import type { ReportStatus } from '../../types';

interface StatusDotProps {
  // A plain string, not ReportStatus: the value comes from the API at runtime and may fall outside the type.
  status: string;
}

const statusConfig: Record<ReportStatus, { color: string; ring: string; label: string }> = {
  AVAILABLE: {
    color: 'bg-emerald-400',
    ring: 'ring-emerald-400/30',
    label: 'Disponível',
  },
  PROCESSING: {
    color: 'bg-amber-400 animate-pulse-soft',
    ring: 'ring-amber-400/30',
    label: 'Processando',
  },
  ERROR: {
    color: 'bg-red-400',
    ring: 'ring-red-400/30',
    label: 'Erro',
  },
  PENDING: {
    color: 'bg-blue-400 animate-pulse-soft',
    ring: 'ring-blue-400/30',
    label: 'Pendente',
  },
  EXPIRED: {
    color: 'bg-surface-500',
    ring: 'ring-surface-500/30',
    label: 'Expirado',
  },
};

const unknownConfig = {
  color: 'bg-transparent border-2 border-surface-400',
  ring: 'ring-surface-400/20',
  label: 'Desconhecido',
};

function isReportStatus(status: string): status is ReportStatus {
  return Object.hasOwn(statusConfig, status);
}

/**
 * Small animated status dot indicator.
 */
export function StatusDot({ status }: StatusDotProps) {
  const config = isReportStatus(status) ? statusConfig[status] : unknownConfig;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ring-4 ${config.color} ${config.ring}`}
      />
      <span className="text-sm text-surface-400">{config.label}</span>
    </div>
  );
}
