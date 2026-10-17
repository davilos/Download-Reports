import axios from 'axios';
import type { UploadIntentRequest, UploadIntentResponse } from '@download-reports/contracts';
import apiClient from './client';

/**
 * Step 1: Request a presigned upload URL from the backend.
 * The backend validates the file metadata and returns a pre-signed PUT URL
 * and the reportId for the newly created PENDING report.
 */
export async function requestUploadUrl(
  payload: UploadIntentRequest
): Promise<UploadIntentResponse> {
  const { data } = await apiClient.post<UploadIntentResponse>(
    '/reports/upload-intent',
    payload
  );
  return data;
}

/**
 * Step 2: Upload the file directly to the presigned URL via PUT.
 * Uses raw axios (not apiClient) because the presigned URL is an external
 * S3 endpoint with auth embedded in the query string.
 */
export async function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  await axios.put(signedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
}

/**
 * Step 3: Confirm the upload by calling PATCH /reports/:id/confirm
 * This transitions the report status from PENDING to AVAILABLE.
 */
export async function confirmUpload(reportId: string): Promise<void> {
  await apiClient.patch(`/reports/${reportId}/confirm`);
}
