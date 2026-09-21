import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@/lib/storage';
import { ApiResponse } from '@/types/api';
import { devLog } from '@/lib/devLog';

/**
 * Prefer same-origin /api (Next rewrites). If rewrite fails in Next 16, set
 * NEXT_PUBLIC_API_DIRECT=1 to call the backend origin directly from the browser.
 */
const useDirectApi =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_API_DIRECT === '1';

const API_BASE_URL = useDirectApi
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net')
  : typeof window !== 'undefined'
    ? ''
    : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net');

type TimedConfig = InternalAxiosRequestConfig & { metadata?: { start: number } };

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Fail faster on free hosting so the UI can show cached/placeholder data instead of a 45s hang.
  timeout: 20000,
});

if (typeof window !== 'undefined') {
  devLog.info('api', 'API client base', {
    baseURL: `${API_BASE_URL}/api` || '/api (same-origin rewrite)',
    direct: useDirectApi,
    target: process.env.NEXT_PUBLIC_API_URL,
  });
}

apiClient.interceptors.request.use(
  (config: TimedConfig) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { start: Date.now() };
    const method = (config.method || 'get').toUpperCase();
    const url = `${config.baseURL || ''}${config.url || ''}`;
    devLog.step('api', `${method} ${url}`, {
      params: config.params,
      hasToken: !!token,
    });
    return config;
  },
  (error) => {
    devLog.error('api', 'Request setup failed', error?.message || error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const cfg = response.config as TimedConfig;
    const ms = cfg.metadata?.start ? Date.now() - cfg.metadata.start : undefined;
    const method = (cfg.method || 'get').toUpperCase();
    const url = `${cfg.baseURL || ''}${cfg.url || ''}`;
    const body = response.data as ApiResponse<unknown> | undefined;
    const preview =
      body && typeof body === 'object'
        ? {
            success: body.success,
            hasData: body.data != null,
            error: body.error?.code || body.error?.message || null,
            items:
              body.data && typeof body.data === 'object' && 'items' in (body.data as object)
                ? (body.data as { items?: unknown[] }).items?.length
                : undefined,
            totalCount:
              body.data && typeof body.data === 'object' && 'totalCount' in (body.data as object)
                ? (body.data as { totalCount?: number }).totalCount
                : undefined,
          }
        : undefined;

    devLog.ok('api', `${method} ${url} → ${response.status}${ms != null ? ` (${ms}ms)` : ''}`, preview);
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const cfg = error.config as TimedConfig | undefined;
    const method = (cfg?.method || 'get').toUpperCase();
    const url = cfg ? `${cfg.baseURL || ''}${cfg.url || ''}` : '(unknown)';
    const ms = cfg?.metadata?.start ? Date.now() - cfg.metadata.start : undefined;

    // React Query / navigation abort — never log as a console error.
    const msg = (error.message || '').toLowerCase();
    if (
      error.code === 'ERR_CANCELED' ||
      error.name === 'CanceledError' ||
      error.name === 'AbortError' ||
      msg === 'canceled' ||
      msg === 'cancelled' ||
      msg.includes('aborted')
    ) {
      return Promise.reject(error);
    }

    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;

      devLog.error('api', `${method} ${url} → ${status}${ms != null ? ` (${ms}ms)` : ''}`, {
        error: responseData?.error || responseData,
      });

      if (status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          storage.clearToken();
          devLog.warn('api', '401 → cleared token from storage');
        }
      }

      if (responseData && responseData.error) {
        const details = responseData.error.details;
        if (details) {
          if (Array.isArray(details) && details.length > 0) {
            const msgs = details
              .map((d: unknown) => {
                if (typeof d === 'string') return d;
                if (typeof d === 'object' && d !== null && 'message' in d) {
                  return (d as { message: string }).message;
                }
                return null;
              })
              .filter(Boolean) as string[];
            if (msgs.length > 0) {
              return Promise.reject(new Error(msgs.join(' - ')));
            }
          } else if (typeof details === 'object') {
            const msgs = Object.values(details).flat().filter(Boolean);
            if (msgs.length > 0) {
              return Promise.reject(new Error(msgs.join(' - ')));
            }
          }
        }
        return Promise.reject(new Error(responseData.error.message || 'حدث خطأ في معالجة الطلب.'));
      }

      if (status === 403) {
        return Promise.reject(new Error('ليس لديك صلاحية للوصول إلى هذا المحتوى.'));
      }
      if (status === 404) {
        return Promise.reject(new Error('المورد المطلوب غير موجود.'));
      }
      if (status === 409) {
        return Promise.reject(new Error('تعارض في البيانات المدخلة، قد يكون الحدث مؤكدًا أو مبلغًا عنه مسبقًا.'));
      }
      if (status === 429) {
        return Promise.reject(new Error('تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار والمحاولة لاحقًا.'));
      }
      if (status >= 500) {
        return Promise.reject(new Error('حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقًا.'));
      }
    } else if (error.request) {
      if (error.code === 'ERR_CANCELED' || /cancel/i.test(error.message || '')) {
        return Promise.reject(error);
      }
      devLog.error('api', `${method} ${url} → network error (no response)`, error.message);
      const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '');
      return Promise.reject(
        new Error(
          isTimeout
            ? 'انتهت مهلة الاتصال بالخادم (20ث). أعد المحاولة — الاستضافة المشتركة بطيئة تحت الضغط.'
            : 'تعذر الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت.'
        )
      );
    }
    return Promise.reject(new Error(error.message || 'حدث خطأ غير متوقع.'));
  }
);
