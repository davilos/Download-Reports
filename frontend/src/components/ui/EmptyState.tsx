import { AlertCircle, RefreshCw } from 'lucide-react';

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
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
          variant === 'error'
            ? 'bg-red-500/10 text-red-400'
            : 'bg-brand-500/10 text-brand-400'
        }`}
      >
        <AlertCircle size={28} />
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-surface-400 text-sm text-center max-w-sm mb-6">{description}</p>

      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm">
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
