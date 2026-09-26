/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Format an ISO date string to a localized Brazilian date/time string.
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format an ISO date string to a relative time string (e.g., "há 2 dias").
 */
export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  
  return formatDate(isoString);
}

/**
 * Get file type badge color classes based on file extension.
 */
export function getFileTypeColor(type: string): string {
  const colors: Record<string, string> = {
    pdf: 'bg-red-500/15 text-red-400 border-red-500/20',
    xml: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    csv: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    xlsx: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  };
  return colors[type] ?? 'bg-surface-500/15 text-surface-400 border-surface-500/20';
}

/**
 * Get status badge styling.
 */
export function getStatusConfig(status: string): { label: string; classes: string } {
  const config: Record<string, { label: string; classes: string }> = {
    available: {
      label: 'Disponível',
      classes: 'bg-emerald-500/15 text-emerald-400',
    },
    processing: {
      label: 'Processando',
      classes: 'bg-amber-500/15 text-amber-400 animate-pulse-soft',
    },
    error: {
      label: 'Erro',
      classes: 'bg-red-500/15 text-red-400',
    },
  };
  return config[status] ?? { label: status, classes: 'bg-surface-500/15 text-surface-400' };
}

/**
 * Returns a CSS class for staggered animation delay.
 */
export function getStaggerDelay(index: number): string {
  return `${index * 50}ms`;
}
