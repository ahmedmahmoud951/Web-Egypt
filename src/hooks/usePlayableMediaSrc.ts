'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/api/client';
import { ApiResponse } from '@/types/api';
import { extractMediaId, resolveMediaUrl } from '@/lib/media';
import { devLog } from '@/lib/devLog';

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export type MediaMeta = {
  mediaId: string;
  contentType?: string;
  mediaType?: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  originalFileName?: string;
};

export type MediaCodecProbe = {
  mediaId: string;
  contentType?: string;
  detectedTags: string[];
  hasH264: boolean;
  hasHevc: boolean;
  hasAudio: boolean;
  hasVideoCodecTag: boolean;
  browserLikelyPlayableVideo: boolean;
  diagnosisAr: string;
  diagnosisEn: string;
  bytesProbed: number;
  width?: number | null;
  height?: number | null;
  fileSize?: number;
  originalFileName?: string;
};

export async function probeMediaCodec(mediaId: string): Promise<MediaCodecProbe | null> {
  try {
    const res = await apiClient.get<
      ApiResponse<{
        mediaId?: string;
        contentType?: string;
        detectedTags?: string[];
        hasH264?: boolean;
        hasHevc?: boolean;
        hasAudio?: boolean;
        hasVideoCodecTag?: boolean;
        browserLikelyPlayableVideo?: boolean;
        hasWebPlayableCopy?: boolean;
        diagnosisAr?: string;
        diagnosisEn?: string;
        bytesProbed?: number;
        width?: number | null;
        height?: number | null;
        fileSize?: number;
        originalFileName?: string;
      }>
    >(`/media/${mediaId}/probe`);
    const d = res.data.data;
    if (!d) return null;
    const probe: MediaCodecProbe = {
      mediaId: d.mediaId || mediaId,
      contentType: d.contentType,
      detectedTags: d.detectedTags || [],
      hasH264: !!d.hasH264,
      hasHevc: !!d.hasHevc,
      hasAudio: !!d.hasAudio,
      hasVideoCodecTag: !!d.hasVideoCodecTag,
      browserLikelyPlayableVideo: !!d.browserLikelyPlayableVideo,
      diagnosisAr: d.diagnosisAr || '',
      diagnosisEn: d.diagnosisEn || '',
      bytesProbed: d.bytesProbed || 0,
      width: d.width,
      height: d.height,
      fileSize: d.fileSize,
      originalFileName: d.originalFileName,
    };
    devLog.warn('reel-media', 'Codec probe result', probe);
    return probe;
  } catch (err) {
    devLog.error('reel-media', 'Codec probe failed', {
      mediaId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

const normalizeFailedCache = new Map<string, number>();

/** Ask API to return (or create) an H.264 copy playable in Chrome/Edge. */
export async function ensureWebPlayableMedia(mediaId: string): Promise<{
  url: string;
  normalizedNow: boolean;
  usedCachedCopy: boolean;
  alreadyPlayable: boolean;
  diagnosisAr?: string;
} | null> {
  const failedExpiry = normalizeFailedCache.get(mediaId);
  if (failedExpiry && failedExpiry > Date.now()) {
    return null;
  }

  try {
    devLog.step('reel-media', 'Ensuring web-playable H.264 copy', { mediaId });
    const res = await apiClient.post<
      ApiResponse<{
        url?: string;
        Url?: string;
        normalizedNow?: boolean;
        usedCachedCopy?: boolean;
        alreadyPlayable?: boolean;
        diagnosisAr?: string;
        expiresAt?: string;
      }>
    >(`/media/${mediaId}/ensure-web-playable`);
    const d = res.data.data;
    const url = d?.url || d?.Url;
    if (!url) {
      normalizeFailedCache.set(mediaId, Date.now() + 5 * 60 * 1000);
      devLog.warn('reel-media', 'ensure-web-playable returned empty url', { mediaId });
      return null;
    }
    normalizeFailedCache.delete(mediaId);
    const expiresAt = d?.expiresAt ? Date.parse(d.expiresAt) : Date.now() + 50 * 60 * 1000;
    signedUrlCache.set(mediaId, { url, expiresAt: Number.isFinite(expiresAt) ? expiresAt : Date.now() + 50 * 60 * 1000 });
    devLog.ok('reel-media', 'Web-playable url ready', {
      mediaId,
      normalizedNow: !!d?.normalizedNow,
      usedCachedCopy: !!d?.usedCachedCopy,
      alreadyPlayable: !!d?.alreadyPlayable,
    });
    return {
      url,
      normalizedNow: !!d?.normalizedNow,
      usedCachedCopy: !!d?.usedCachedCopy,
      alreadyPlayable: !!d?.alreadyPlayable,
      diagnosisAr: d?.diagnosisAr,
    };
  } catch (err) {
    normalizeFailedCache.set(mediaId, Date.now() + 5 * 60 * 1000);
    devLog.error('reel-media', 'ensure-web-playable failed', {
      mediaId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function clearSignedMediaUrlCache(mediaId?: string) {
  if (mediaId) signedUrlCache.delete(mediaId);
  else signedUrlCache.clear();
}

export function logBrowserCodecSupport(scope = 'reel-media') {
  if (typeof document === 'undefined') return;
  const v = document.createElement('video');
  const checks = {
    'video/mp4': v.canPlayType('video/mp4'),
    'avc1.42E01E': v.canPlayType('video/mp4; codecs="avc1.42E01E"'),
    'avc1.640028': v.canPlayType('video/mp4; codecs="avc1.640028"'),
    'hev1.1.6.L93.B0': v.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"'),
    'hvc1.1.6.L93.B0': v.canPlayType('video/mp4; codecs="hvc1.1.6.L93.B0"'),
    'vp09': v.canPlayType('video/mp4; codecs="vp09.00.10.08"'),
    'av01': v.canPlayType('video/mp4; codecs="av01.0.05M.08"'),
  };
  devLog.info(scope, 'Browser canPlayType matrix', checks);
  return checks;
}

/** Helps some browsers paint a visible frame before play. Skip for audio-looking URLs. */
export function withMediaFragment(url: string, seconds = 0.1): string {
  if (!url) return url;
  if (url.includes('#t=')) return url;
  if (/\.(m4a|mp3|aac|wav|ogg)(\?|#|$)/i.test(url)) return url;
  return `${url}#t=${seconds}`;
}

/**
 * Resolves a playable video/image src for admin UI.
 * Prefers an authenticated short-lived B2 URL (`/api/media/{id}/url`).
 */
export function usePlayableMediaSrc(rawUrl: string | null | undefined): {
  src: string;
  isResolving: boolean;
  failed: boolean;
  markFailed: () => void;
  meta: MediaMeta | null;
} {
  const [src, setSrc] = useState(() => resolveMediaUrl(rawUrl));
  const [isResolving, setIsResolving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [meta, setMeta] = useState<MediaMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fallback = resolveMediaUrl(rawUrl);
    setFailed(false);
    setSrc(fallback);
    setMeta(null);

    if (!rawUrl || !rawUrl.trim()) {
      setSrc('');
      setMeta(null);
      return;
    }

    const mediaId = extractMediaId(rawUrl);
    if (!mediaId) {
      devLog.warn('reel-media', 'No media id in url — using raw/fallback only', {
        rawUrl: rawUrl?.slice(0, 120),
        fallback: fallback.slice(0, 120),
      });
      return;
    }

    const cached = signedUrlCache.get(mediaId);
    if (cached && cached.expiresAt > Date.now()) {
      devLog.ok('reel-media', 'Using cached signed url', { mediaId });
      setSrc(cached.url);
    }

    setIsResolving(true);
    if (!cached || cached.expiresAt <= Date.now()) {
      devLog.step('reel-media', 'Resolving signed playable url', {
        mediaId,
        fallback: fallback.slice(0, 100),
      });
    }

    (async () => {
      try {
        const [urlRes, metaRes] = await Promise.all([
          cached && cached.expiresAt > Date.now()
            ? Promise.resolve(null)
            : apiClient.get<ApiResponse<{ url?: string; Url?: string; expiresAt?: string }>>(
                `/media/${mediaId}/url`
              ),
          apiClient.get<
            ApiResponse<{
              contentType?: string;
              mediaType?: string;
              width?: number | null;
              height?: number | null;
              durationSeconds?: number | null;
              originalFileName?: string;
            }>
          >(`/media/${mediaId}`),
        ]);

        if (cancelled) return;

        const m = metaRes.data.data;
        if (m) {
          const nextMeta: MediaMeta = {
            mediaId,
            contentType: m.contentType,
            mediaType: m.mediaType,
            width: m.width,
            height: m.height,
            durationSeconds: m.durationSeconds,
            originalFileName: m.originalFileName,
          };
          setMeta(nextMeta);
          devLog.info('reel-media', 'Media metadata', nextMeta);
        }

        const signed = urlRes?.data.data?.url || urlRes?.data.data?.Url;
        if (signed) {
          const expiresAt = urlRes?.data.data?.expiresAt
            ? Date.parse(urlRes.data.data.expiresAt)
            : Date.now() + 10 * 60 * 1000;
          signedUrlCache.set(mediaId, { url: signed, expiresAt: expiresAt - 30_000 });
          devLog.ok('reel-media', 'Signed url ready', {
            mediaId,
            host: (() => {
              try {
                return new URL(signed).host;
              } catch {
                return 'invalid-url';
              }
            })(),
            len: signed.length,
          });
          setSrc(signed);
        } else if (!cached) {
          devLog.warn('reel-media', 'Signed url empty — keeping /file fallback', { mediaId });
        }
      } catch (err) {
        devLog.error('reel-media', 'Media resolve failed — keeping /file fallback', {
          mediaId,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawUrl]);

  return {
    src,
    isResolving,
    failed,
    markFailed: () => setFailed(true),
    meta,
  };
}

export function logVideoElement(
  scope: string,
  event: string,
  el: HTMLVideoElement | null,
  extra?: Record<string, unknown>
) {
  if (!el) {
    devLog.warn(scope, `${event}: video el missing`, extra);
    return;
  }
  const err = el.error;
  const noVideoTrack =
    el.readyState >= 1 &&
    el.videoWidth === 0 &&
    el.videoHeight === 0 &&
    Number.isFinite(el.duration) &&
    el.duration > 0;

  if (noVideoTrack) {
    devLog.warn(scope, `${event}: NO VIDEO TRACK (audio-only / undecodable video)`, {
      duration: el.duration,
      readyState: el.readyState,
      ...extra,
    });
  }

  devLog.info(scope, `video:${event}`, {
    videoWidth: el.videoWidth,
    videoHeight: el.videoHeight,
    readyState: el.readyState,
    networkState: el.networkState,
    paused: el.paused,
    muted: el.muted,
    currentTime: Number(el.currentTime.toFixed(2)),
    duration: Number.isFinite(el.duration) ? Number(el.duration.toFixed(2)) : el.duration,
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight,
    noVideoTrack,
    srcHost: (() => {
      try {
        return new URL(el.currentSrc || el.src).host;
      } catch {
        return (el.currentSrc || el.src || '').slice(0, 80);
      }
    })(),
    mediaError: err ? { code: err.code, message: err.message } : null,
    ...extra,
  });
}

/** Seek a bit forward so the first painted frame isn’t black. */
export function useVideoPosterFrame(src: string | undefined, enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [noVideoTrack, setNoVideoTrack] = useState(false);

  useEffect(() => {
    setFrameReady(false);
    setNoVideoTrack(false);
    const el = videoRef.current;
    if (!el || !src || !enabled) return;

    const detectNoVideo = () => {
      if (
        el.readyState >= 2 &&
        el.videoWidth === 0 &&
        el.videoHeight === 0 &&
        Number.isFinite(el.duration) &&
        el.duration > 0
      ) {
        setNoVideoTrack(true);
        logVideoElement('reel-media', 'detected-audio-only', el);
        return true;
      }
      return false;
    };

    const snap = () => {
      try {
        if (detectNoVideo()) return;
        if (el.videoWidth === 0) {
          logVideoElement('reel-media', 'snap-skip-no-dimensions', el);
          return;
        }
        if (el.currentTime < 0.05) {
          const t = Math.min(0.25, Math.max(0.1, (el.duration || 1) * 0.02));
          el.currentTime = t;
        }
        setFrameReady(true);
        logVideoElement('reel-media', 'poster-frame', el, { frameReady: true });
      } catch (e) {
        devLog.warn('reel-media', 'poster seek failed', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };

    const onMeta = () => {
      logVideoElement('reel-media', 'loadedmetadata', el);
      snap();
    };
    const onData = () => {
      logVideoElement('reel-media', 'loadeddata', el);
      snap();
    };
    const onSeeked = () => logVideoElement('reel-media', 'seeked', el);
    const onCanPlay = () => {
      logVideoElement('reel-media', 'canplay', el);
      detectNoVideo();
    };
    const onError = () => logVideoElement('reel-media', 'error', el);

    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('loadeddata', onData);
    el.addEventListener('seeked', onSeeked);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('error', onError);

    try {
      el.load();
    } catch {
      // ignore
    }

    return () => {
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('loadeddata', onData);
      el.removeEventListener('seeked', onSeeked);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('error', onError);
    };
  }, [src, enabled]);

  return { videoRef, frameReady, noVideoTrack };
}
