import type { ReportStatus } from '../../types';

interface StatusDotProps {
  status: ReportStatus;
}

const statusConfig: Record<ReportStatus, { color: string; ring: string; label: string }> = {
  available: {
    color: 'bg-emerald-400',
    ring: 'ring-emerald-400/30',
    label: 'Disponível',
  },
  processing: {
    color: 'bg-amber-400 animate-pulse-soft',
    ring: 'ring-amber-400/30',
    label: 'Processando',
  },
  error: {
    color: 'bg-red-400',
    ring: 'ring-red-400/30',
    label: 'Erro',
  },
  pending: {
    color: 'bg-blue-400 animate-pulse-soft',
    ring: 'ring-blue-400/30',
    label: 'Pendente',
  },
  expired: {
    color: 'bg-surface-500',
    ring: 'ring-surface-500/30',
    label: 'Expirado',
  },
};

/**
 * Small animated status dot indicator.
 */
export function StatusDot({ status }: StatusDotProps) {
  const config = statusConfig[status] ?? statusConfig.available;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ring-4 ${config.color} ${config.ring}`}
      />
      <span className="text-sm text-surface-400">{config.label}</span>
    </div>
  );
}
