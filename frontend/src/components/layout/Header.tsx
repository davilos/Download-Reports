import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

/**
 * Application header. On phones the action moves to a fixed bottom bar so it stays within thumb reach.
 */
export function Header({
  title = 'Central de Relatórios',
  subtitle = 'Seus documentos fiscais, guardados e à mão.',
  action,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-6">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-ink shadow-card"
          aria-hidden="true"
        >
          <FileText size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-ink-soft sm:text-base">{subtitle}</p>
        </div>
      </div>

      {action && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3
                     shadow-bar [&>button]:w-full
                     sm:static sm:z-auto sm:bg-transparent sm:p-0 sm:shadow-none sm:[&>button]:w-auto"
        >
          {action}
        </div>
      )}
    </header>
  );
}
