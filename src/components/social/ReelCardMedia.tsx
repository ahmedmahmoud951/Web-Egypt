'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Eye, Loader2, Music2 } from 'lucide-react';
import {
  clearSignedMediaUrlCache,
  ensureWebPlayableMedia,
  logVideoElement,
  MediaMeta,
  usePlayableMediaSrc,
  useVideoPosterFrame,
  withMediaFragment,
} from '@/hooks/usePlayableMediaSrc';
import { extractMediaId, resolveMediaUrl } from '@/lib/media';
import { devLog } from '@/lib/devLog';

interface ReelCardMediaProps {
  mediaUrl: string;
  posterUrl?: string | null;
  onOpen: () => void;
}

function AudioOnlyPlaceholder({
  meta,
  normalizing,
}: {
  meta: MediaMeta | null;
  normalizing?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#1a2838] to-[#0a1018] px-3 text-center pointer-events-none">
      {normalizing ? (
        <Loader2 className="w-7 h-7 text-[#E6D19A] animate-spin" />
      ) : (
        <span className="w-14 h-14 rounded-full bg-[#C4A35A]/20 border border-[#C4A35A]/40 grid place-items-center">
          <Music2 className="w-7 h-7 text-[#E6D19A]" />
        </span>
      )}
      <span className="text-[11px] font-black text-white/90">
        {normalizing ? 'جاري التحويل…' : 'فيديو HEVC (صوت فقط)'}
      </span>
      <span className="text-[10px] font-semibold text-white/50 leading-snug">
        {normalizing ? 'تحويل HEVC إلى H.264' : 'المتصفح لا يدعم كودك HEVC'}
      </span>
      {meta?.contentType && !normalizing && (
        <span className="text-[9px] font-mono text-white/35 truncate max-w-full px-2">
          {meta.contentType}
          {meta.width != null || meta.height != null
            ? ` · ${meta.width ?? 0}×${meta.height ?? 0}`
            : ''}
        </span>
      )}
    </div>
  );
}

export function ReelCardMedia({ mediaUrl, posterUrl, onOpen }: ReelCardMediaProps) {
  const { src, failed, markFailed, isResolving, meta } = usePlayableMediaSrc(mediaUrl);
  const [forcedSrc, setForcedSrc] = useState<string | null>(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const normalizeAttemptedRef = React.useRef<string | null>(null);
  const effectiveSrc = forcedSrc || src;
  const playable = effectiveSrc ? withMediaFragment(effectiveSrc, 0.15) : '';
  const { videoRef, frameReady, noVideoTrack } = useVideoPosterFrame(playable, !failed && !!playable);
  const poster = posterUrl ? resolveMediaUrl(posterUrl) : undefined;

  useEffect(() => {
    normalizeAttemptedRef.current = null;
    setForcedSrc(null);
    setIsNormalizing(false);
  }, [mediaUrl]);

  useEffect(() => {
    if (failed) {
      logVideoElement('reel-card', 'marked-failed', videoRef.current, {
        mediaUrl: mediaUrl.slice(0, 80),
      });
    }
  }, [failed, mediaUrl, videoRef]);

  useEffect(() => {
    const mediaId = extractMediaId(mediaUrl) || meta?.mediaId;
    if (!noVideoTrack || isNormalizing || forcedSrc || !mediaId || normalizeAttemptedRef.current === mediaId) {
      return;
    }

    normalizeAttemptedRef.current = mediaId;
    setIsNormalizing(true);
    void ensureWebPlayableMedia(mediaId).then((result) => {
      setIsNormalizing(false);
      if (!result?.url) {
        devLog.warn('reel-card', 'Web normalize failed — keeping audio-only placeholder', { mediaId });
        return;
      }
      clearSignedMediaUrlCache(mediaId);
      setForcedSrc(result.url);
      devLog.ok('reel-card', 'Switched to web-playable url', {
        mediaId,
        normalizedNow: result.normalizedNow,
      });
    });
  }, [noVideoTrack, isNormalizing, forcedSrc, mediaUrl, meta?.mediaId]);

  useEffect(() => {
    if (noVideoTrack) {
      devLog.warn('reel-card', 'Showing audio-only placeholder', {
        mediaUrl: mediaUrl.slice(0, 80),
        meta,
      });
    }
  }, [noVideoTrack, mediaUrl, meta]);

  return (
    <div className="reel-card-media" onClick={onOpen}>
      {failed || !playable ? (
        <div className="absolute inset-0 grid place-items-center bg-[#0a1018] text-white/60 gap-2 px-3 text-center z-[1]">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span className="text-[11px] font-bold">تعذر تحميل الفيديو</span>
        </div>
      ) : (
        <>
          <video
            key={playable}
            ref={videoRef}
            src={playable}
            poster={poster}
            muted
            playsInline
            preload="auto"
            className="reel-card-video"
            data-frame-ready={frameReady ? 'true' : 'false'}
            data-resolving={isResolving ? 'true' : 'false'}
            data-no-video={noVideoTrack ? 'true' : 'false'}
            onError={() => {
              logVideoElement('reel-card', 'onError', videoRef.current);
              markFailed();
            }}
          />
          {(noVideoTrack || isNormalizing) && (
            <AudioOnlyPlaceholder meta={meta} normalizing={isNormalizing} />
          )}
        </>
      )}
      <div className="reel-card-scrim" />
      <span className="reel-card-play">
        <span className="w-12 h-12 rounded-full bg-white/20 backdrop-blur border border-white/40 grid place-items-center">
          <Eye className="w-5 h-5" />
        </span>
      </span>
    </div>
  );
}
