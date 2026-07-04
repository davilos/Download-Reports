import { useState, useCallback } from 'react';
import axios from 'axios';
import { getDownloadLink } from '../api';

interface UseDownloadReturn {
  download: (reportId: string, fileName: string) => Promise<void>;
  isDownloading: string | null;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook to handle report download actions.
 * Calls /reports/:id/download-link to get a presigned URL, then triggers
 * the download programmatically via an <a download> element (AD-012).
 */
export function useDownload(): UseDownloadReturn {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async (reportId: string, fileName: string) => {
    setIsDownloading(reportId);
    setError(null);

    try {
      const { downloadUrl } = await getDownloadLink(reportId);

      // Trigger download via programmatic <a download> element (AD-012)
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('Link expirado — clique em Baixar novamente');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao baixar relatório.');
      }
    } finally {
      setIsDownloading(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { download, isDownloading, error, clearError };
}
