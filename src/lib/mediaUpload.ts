import { apiClient } from '@/api/client';
import { uploadsApi } from '@/api/uploads';
import { ApiResponse } from '@/types/api';

export interface MediaUploadResult {
  mediaId: string;
  url: string;
  mediaType: 'Image' | 'Video' | 'Document';
  fileName: string;
}

export interface DirectUploadUrlResponse {
  mediaId: string;
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

export interface MediaCompleteResponse {
  id: string;
  status: string;
  mediaType: string;
  url?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

/**
 * Sends structured log message to both browser console and Next.js dev server terminal
 */
export async function logUploadToDevServer(
  level: 'info' | 'warn' | 'error' | 'success',
  message: string,
  details?: unknown
) {
  const consolePrefix = `[TodayInEgypt Media]`;
  if (level === 'error') {
    console.error(`${consolePrefix} ❌ ${message}`, details ?? '');
  } else if (level === 'warn') {
    console.warn(`${consolePrefix} ⚠️ ${message}`, details ?? '');
  } else if (level === 'success') {
    console.log(`%c${consolePrefix} ✅ ${message}`, 'color: #10B981; font-weight: bold;', details ?? '');
  } else {
    console.log(`${consolePrefix} ℹ️ ${message}`, details ?? '');
  }

  try {
    const serializedDetails =
      details instanceof Error
        ? `${details.name}: ${details.message}\n${details.stack || ''}`
        : typeof details === 'object'
        ? JSON.stringify(details, null, 2)
        : details !== undefined
        ? String(details)
        : undefined;

    fetch('/api/dev-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        details: serializedDetails,
      }),
    }).catch(() => {});
  } catch {
    // Ignore background log transport failures
  }
}

function unwrapApiData<T>(payload: ApiResponse<T> | T | null | undefined, label: string): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as object) && 'success' in (payload as object)) {
    const wrapped = payload as ApiResponse<T>;
    if (!wrapped.success || wrapped.data == null) {
      throw new Error(wrapped.error?.message || `فشل ${label}.`);
    }
    return wrapped.data;
  }
  if (payload == null) {
    throw new Error(`استجابة فارغة من الخادم أثناء ${label}.`);
  }
  return payload as T;
}

/**
 * Uploads media directly to Backblaze B2 using short-lived pre-signed PUT URLs,
 * with live percentage progress tracking and detailed terminal logging.
 */
export async function uploadMediaDirectToB2(
  file: File,
  entityType: 'Event' | 'User' | 'Location' | 'Report',
  entityId: string,
  onProgress?: (percent: number) => void
): Promise<MediaUploadResult> {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  const mediaType: 'Image' | 'Video' | 'Document' = isVideo ? 'Video' : isImage ? 'Image' : 'Document';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net';

  await logUploadToDevServer(
    'info',
    `════════════════════════════════════════════════════════════\n` +
    `🚀 [UPLOAD START] File: "${file.name}" | Size: ${(file.size / 1024).toFixed(1)} KB | Type: ${file.type}\n` +
    `🌐 Configured API Base URL: ${apiUrl}\n` +
    `════════════════════════════════════════════════════════════`
  );

  let uploadInfo: DirectUploadUrlResponse;
  try {
    await logUploadToDevServer(
      'info',
      `📡 [STEP 1/3] Calling POST ${apiUrl}/api/media/upload-url ...`
    );

    const res = await apiClient.post<ApiResponse<DirectUploadUrlResponse>>('/media/upload-url', {
      entityType,
      entityId,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    });

    // API returns { success, data: { mediaId, uploadUrl, ... } } — unwrap nested data
    uploadInfo = unwrapApiData(res.data, 'طلب رابط الرفع');

    if (!uploadInfo.uploadUrl) {
      throw new Error('الخادم لم يُرجع uploadUrl صالحًا.');
    }

    const urlPreview = uploadInfo.uploadUrl.substring(0, Math.min(95, uploadInfo.uploadUrl.length));

    await logUploadToDevServer(
      'success',
      `✅ [STEP 1/3 SUCCESS] Presigned URL generated successfully!\n` +
      `   • MediaId: ${uploadInfo.mediaId}\n` +
      `   • ObjectKey in Backblaze B2: ${uploadInfo.objectKey}\n` +
      `   • S3 Presigned URL: ${urlPreview}...`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logUploadToDevServer(
      'error',
      `❌ [STEP 1/3 FAILED] Could not get S3 upload URL from Backend!\n` +
      `   Error: ${errorMsg}\n` +
      `   Target API URL: ${apiUrl}/api/media/upload-url`,
      err
    );

    if (isImage && file.size <= 5 * 1024 * 1024) {
      await logUploadToDevServer(
        'warn',
        `⚠️ [FALLBACK WARNING] B2 upload URL request failed. Falling back to legacy local server disk upload (POST ${apiUrl}/api/uploads/image)...`
      );
      const legacyUrl = await uploadsApi.uploadImage(file);
      await logUploadToDevServer(
        'warn',
        `⚠️ [FALLBACK COMPLETED] Image saved to local server disk: ${legacyUrl}. (Not in Backblaze B2!)`
      );
      return {
        mediaId: '',
        url: legacyUrl,
        mediaType: 'Image',
        fileName: file.name,
      };
    }
    throw err;
  }

  try {
    await logUploadToDevServer(
      'info',
      `☁️ [STEP 2/3] Uploading binary directly to Backblaze B2 bucket via HTTP PUT...\n` +
      `   • Target: ${uploadInfo.uploadUrl.split('?')[0]}`
    );

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadInfo.uploadUrl, true);

      if (uploadInfo.requiredHeaders) {
        Object.entries(uploadInfo.requiredHeaders).forEach(([header, value]) => {
          xhr.setRequestHeader(header, value);
        });
      } else {
        xhr.setRequestHeader('Content-Type', file.type);
      }

      if (xhr.upload) {
        let lastReported = 0;
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress?.(percent);
            if (percent - lastReported >= 25 || percent === 100) {
              lastReported = percent;
              logUploadToDevServer('info', `📊 [STEP 2/3 PROGRESS] ${percent}% uploaded to Backblaze B2`);
            }
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
        } else {
          reject(
            new Error(
              `Backblaze B2 returned HTTP ${xhr.status} ${xhr.statusText}: ${xhr.responseText || 'No response body'}`
            )
          );
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            'Network Error or CORS Block: The browser could not connect to Backblaze B2. Check if CORS is enabled on the B2 bucket.'
          )
        );
      };

      xhr.send(file);
    });

    await logUploadToDevServer(
      'success',
      `✅ [STEP 2/3 SUCCESS] File binary written directly to Backblaze B2 bucket successfully!`
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logUploadToDevServer(
      'error',
      `❌ [STEP 2/3 FAILED] Direct upload to Backblaze B2 failed!\n   Reason: ${errorMsg}`,
      err
    );

    if (isImage && file.size <= 5 * 1024 * 1024) {
      await logUploadToDevServer(
        'warn',
        `⚠️ [FALLBACK WARNING] Direct B2 upload failed (likely CORS or network). Falling back to legacy server upload...`
      );
      const fallbackUrl = await uploadsApi.uploadImage(file);
      await logUploadToDevServer(
        'warn',
        `⚠️ [FALLBACK COMPLETED] Image saved to local server disk: ${fallbackUrl}`
      );
      return {
        mediaId: uploadInfo.mediaId,
        url: fallbackUrl,
        mediaType: 'Image',
        fileName: file.name,
      };
    }
    throw err;
  }

  try {
    await logUploadToDevServer(
      'info',
      `💾 [STEP 3/3] Confirming upload completion: POST ${apiUrl}/api/media/${uploadInfo.mediaId}/complete ...`
    );

    const completeRes = await apiClient.post<ApiResponse<MediaCompleteResponse>>(
      `/media/${uploadInfo.mediaId}/complete`,
      {}
    );
    const completeData = unwrapApiData(completeRes.data, 'تأكيد الرفع');

    const finalUrl = completeData.url || `/api/media/${uploadInfo.mediaId}/file`;
    await logUploadToDevServer(
      'success',
      `✅ [STEP 3/3 SUCCESS] Media file confirmed and registered in [dbo].[MediaFiles]!\n` +
      `   • Media ID: ${uploadInfo.mediaId}\n` +
      `   • Final Access URL: ${finalUrl}\n` +
      `🎉 All 3 steps completed! Media is in Backblaze B2 & SQL database!`
    );

    return {
      mediaId: uploadInfo.mediaId,
      url: finalUrl,
      mediaType,
      fileName: file.name,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logUploadToDevServer(
      'error',
      `❌ [STEP 3/3 FAILED] Could not confirm upload with backend!\n   Error: ${errorMsg}`,
      err
    );
    throw err;
  }
}
