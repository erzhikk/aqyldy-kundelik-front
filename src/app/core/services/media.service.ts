import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

/**
 * Request body for presigned URL
 */
export interface PresignRequest {
  userId: string;
  contentType: string;
  filename: string;
}

/**
 * Response from presigned URL endpoint
 */
export interface PresignResponse {
  url: string;
  key: string;
  fields: Record<string, string>;
  mediaObjectId: string;
}

/**
 * Response from reconcile endpoint
 */
export interface ReconcileResponse {
  success: boolean;
  key: string;
  width?: number;
  height?: number;
  fileSize?: number;
  sha256?: string;
  reason?: string | null;
}

/**
 * Media Service
 *
 * Handles file upload operations:
 * 1. Getting presigned URLs for direct upload to MinIO
 * 2. Reconciling (validating) uploaded files
 *
 * Benefits from all interceptors:
 * - Loading: Shows spinner during requests
 * - Auth: Adds Bearer token automatically
 * - Error: Shows user-friendly error notifications
 */
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly base = '/api/media';

  constructor(private http: HttpClient) {}

  /**
   * Get presigned URL for uploading a photo
   *
   * @param request Presign request with userId, contentType, and filename
   * @returns Promise with presigned URL and S3 key
   *
   * @example
   * const response = await mediaService.getPresignedUrl({
   *   userId: '74700097-17b2-409c-84d1-087ccfa7561c',
   *   contentType: 'image/jpeg',
   *   filename: 'avatar.jpg'
   * });
   * // Use response.url for uploading file
   */
  async getPresignedUrl(request: PresignRequest): Promise<PresignResponse> {
    return firstValueFrom(
      this.http.post<PresignResponse>(`${this.base}/presign/photo`, request)
    );
  }

  /**
   * Reconcile (validate) uploaded file
   *
   * Call this after uploading file to MinIO to trigger server-side validation.
   * Server will check:
   * - File exists in S3
   * - File type is valid
   * - File size is within limits
   * - Image dimensions are valid
   * - File is not animated
   *
   * @param key S3 key of uploaded file
   * @returns Promise with validation result
   *
   * @example
   * const result = await mediaService.reconcile('users/.../photos/uuid.jpg');
   * if (result.success) {
   *   console.log('File validated successfully');
   * } else {
   *   console.error('Validation failed:', result.reason);
   * }
   */
  async reconcile(key: string): Promise<ReconcileResponse> {
    return firstValueFrom(
      this.http.post<ReconcileResponse>(`${this.base}/reconcile`, null, {
        params: { key }
      })
    );
  }

  /**
   * Upload file directly to MinIO using presigned URL
   *
   * @param presignedUrl Presigned URL from getPresignedUrl()
   * @param file File to upload
   * @param contentType Content type of the file
   * @param onProgress Optional callback for upload progress
   * @returns Promise that resolves when upload is complete
   *
   * @example
   * await mediaService.uploadToMinio(
   *   presignResponse.url,
   *   file,
   *   'image/jpeg',
   *   (progress) => console.log(`Upload: ${progress}%`)
   * );
   */
  async uploadToMinio(
    presignedUrl: string,
    file: File,
    contentType: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Send request
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
    });
  }
}
