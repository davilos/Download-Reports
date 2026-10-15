import { AlertCircle, FileSearch, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  variant?: 'empty' | 'error';
}

/**
 * Empty state / Error state with optional retry action.
 */
export function EmptyState({
  title = 'Nenhum relatório encontrado',
  description = 'Tente ajustar os filtros ou volte mais tarde.',
  onRetry,
  variant = 'empty',
}: EmptyStateProps) {
  const isError = variant === 'error';
  const Icon = isError ? AlertCircle : FileSearch;

  return (
    <div className="flex flex-col items-center justify-center rounded-card bg-card px-6 py-14 text-center shadow-card animate-fade-in">
      <span
        className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
          isError ? 'bg-danger-soft text-danger' : 'bg-tile text-ink'
        }`}
        aria-hidden="true"
      >
        <Icon size={28} />
      </span>

      <h2 className="mb-1.5 text-lg font-bold text-ink">{title}</h2>
      <p className="mb-6 max-w-sm text-sm text-ink-soft">{description}</p>

      {onRetry && (
        <button type="button" onClick={onRetry} className={`${isError ? 'btn-primary' : 'btn-secondary'} text-sm`}>
          <RefreshCw size={16} aria-hidden="true" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
