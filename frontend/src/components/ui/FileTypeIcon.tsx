import { FileText, FileSpreadsheet, FileCode, FileDown } from 'lucide-react';
import type { ReportType } from '../../types';

interface FileTypeIconProps {
  type: ReportType;
  className?: string;
  size?: number;
}

const iconMap: Record<ReportType, React.ComponentType<{ size?: number; className?: string }>> = {
  pdf: FileText,
  xml: FileCode,
  csv: FileDown,
  xlsx: FileSpreadsheet,
};

/**
 * Renders an icon corresponding to the file type.
 */
export function FileTypeIcon({ type, className = '', size = 18 }: FileTypeIconProps) {
  const Icon = iconMap[type] ?? FileText;
  return <Icon size={size} className={className} />;
}
