import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { requestUploadUrl, uploadToSignedUrl, confirmUpload } from '../api';

export type UploadStatus = 'idle' | 'requesting' | 'uploading' | 'confirming' | 'success' | 'error' | 'ttl-expired';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/xml',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const MAX_FILE_SIZE = 52_428_800; // 50 MB

interface UseUploadReturn {
  status: UploadStatus;
  progress: number;
  error: string | null;
  upload: (file: File) => Promise<void>;
  retryUpload: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook that orchestrates the three-step upload with ephemeral token:
 *   1. Validate file type/size
 *   2. POST /api/reports/upload-intent -> receives { uploadUrl, reportId }
 *   3. PUT uploadUrl (binary, with progress)
 *   4. PATCH /api/reports/:id/confirm -> status = AVAILABLE
 *
 * Handles TTL expiry (403 from S3), network auto-retry (1x after 3s),
 * and retryUpload() that reuses the File in memory.
 */
export function useUpload(onSuccess?: () => void): UseUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null); // preserve file for retry (AD-013)
  const ttlExpiredRef = useRef(false);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    fileRef.current = null;
    ttlExpiredRef.current = false;
  }, []);

  const executeUpload = useCallback(
    async (file: File) => {
      setError(null);
      setProgress(0);
      ttlExpiredRef.current = false;

      // Client-side validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setStatus('error');
        setError('Tipo de arquivo não suportado');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setStatus('error');
        setError('Arquivo muito grande (máx. 50 MB)');
        return;
      }

      try {
        // Step 2 — Request ephemeral token / presigned URL from backend
        setStatus('requesting');
        const { uploadUrl, reportId } = await requestUploadUrl({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        });

        // Step 3 — Upload directly to S3 with progress, with auto-retry on network error
        setStatus('uploading');
        let uploadAttempt = 0;

        const tryUpload = async (): Promise<void> => {
          try {
            await uploadToSignedUrl(uploadUrl, file, (percent) => {
              setProgress(percent);
            });
          } catch (uploadErr) {
            // Check for TTL expiry (S3 returns 403)
            if (axios.isAxiosError(uploadErr) && uploadErr.response?.status === 403) {
              ttlExpiredRef.current = true;
              setStatus('ttl-expired');
              throw uploadErr; // stop retry loop
            }
            // Network error: auto-retry once after 3s
            if (uploadAttempt === 0) {
              uploadAttempt++;
              await new Promise((resolve) => setTimeout(resolve, 3000));
              return tryUpload();
            }
            throw uploadErr;
          }
        };

        await tryUpload();

        // Step 4 — Confirm upload (PENDING -> AVAILABLE)
        setStatus('confirming');
        await confirmUpload(reportId);

        setStatus('success');
        setProgress(100);
        onSuccess?.();
      } catch (err) {
        if (!ttlExpiredRef.current) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Erro durante o upload.');
        }
      }
    },
    [onSuccess],
  );

  const upload = useCallback(
    async (file: File) => {
      fileRef.current = file; // save for retry (AD-013)
      await executeUpload(file);
    },
    [executeUpload],
  );

  const retryUpload = useCallback(async () => {
    if (!fileRef.current) return;
    setStatus('idle');
    setProgress(0);
    setError(null);
    ttlExpiredRef.current = false;
    await executeUpload(fileRef.current);
  }, [executeUpload]);

  return { status, progress, error, upload, retryUpload, reset };
}
