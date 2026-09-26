import { getFileTypeColor } from '../../utils';

interface BadgeProps {
  label: string;
  variant?: 'type' | 'custom';
  typeKey?: string;
  className?: string;
}

/**
 * A small badge component for file types and statuses.
 */
export function Badge({ label, variant = 'custom', typeKey, className = '' }: BadgeProps) {
  const colorClasses = variant === 'type' && typeKey
    ? getFileTypeColor(typeKey)
    : className;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg border ${colorClasses}`}
    >
      {label}
    </span>
  );
}
