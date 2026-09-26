import { FileText } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Application header with branding and gradient accent.
 */
export function Header({ 
  title = 'Central de Relatórios', 
  subtitle = 'Gerencie e baixe seus documentos fiscais' 
}: HeaderProps) {
  return (
    <header className="relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 
                          flex items-center justify-center shadow-glow-lg">
            <FileText size={24} className="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold gradient-text">{title}</h1>
            <p className="text-surface-400 text-sm mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
