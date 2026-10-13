'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Eye, Film, Loader2, Music2, Play } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';

interface ReelCardMediaProps {
  mediaUrl: string;
  posterUrl?: string | null;
  durationSeconds?: number | null;
  onOpen: () => void;
}

export function ReelCardMedia({ mediaUrl, posterUrl, durationSeconds, onOpen }: ReelCardMediaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lazy viewport intersection: only load video element when within 300px of viewport
  // This frees up browser connection sockets so visible cards load in milliseconds!
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Instant direct resolved URL for high-speed delivery
  const resolvedMedia = resolveMediaUrl(mediaUrl);
  const resolvedPoster = posterUrl ? resolveMediaUrl(posterUrl) : null;
  // #t=0.1 prompts the browser to fetch only the first frame instantly
  const mediaSrcWithFrame = resolvedMedia ? `${resolvedMedia}#t=0.1` : '';

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setIsPlaying(false);
  }, [mediaUrl]);

  const handleMouseEnter = () => {
    if (videoRef.current && !hasError) {
      videoRef.current.muted = true;
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay may be restricted in some browser settings
      });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      try {
        videoRef.current.currentTime = 0.1;
      } catch {
        // ignore seek error
      }
      setIsPlaying(false);
    }
  };

  const formatDuration = (secs?: number | null) => {
    if (!secs || secs <= 0) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="reel-card-media group relative overflow-hidden"
      onClick={onOpen}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Instant Poster Image if available */}
      {resolvedPoster && !hasError && (
        <img
          src={resolvedPoster}
          alt="Reel preview"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-[1] pointer-events-none ${
            isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />
      )}

      {/* 2. Fast HTML5 Video with metadata preloading - loaded only when in/near view */}
      {isInView && mediaSrcWithFrame && !hasError ? (
        <video
          ref={videoRef}
          src={mediaSrcWithFrame}
          muted
          playsInline
          loop
          preload="metadata"
          className={`reel-card-video transition-all duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadedData={() => setIsLoaded(true)}
          onLoadedMetadata={() => setIsLoaded(true)}
          onCanPlay={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      ) : null}

      {/* 3. Skeleton Shimmer while loading */}
      {!isLoaded && !resolvedPoster && !hasError && (
        <div className="absolute inset-0 z-[2] grid place-items-center bg-gradient-to-b from-[#121c2a] to-[#0a1018] animate-pulse pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-white/40">
            <Film className="w-8 h-8 text-[#C4A35A]/60 animate-bounce" />
            <span className="text-[10px] font-bold text-[#E6D19A]/70">جاري عرض المقطع…</span>
          </div>
        </div>
      )}

      {/* 4. Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 grid place-items-center bg-[#0a1018] text-white/60 gap-2 px-3 text-center z-[3]">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span className="text-[11px] font-bold">تعذر عرض المعاينة</span>
        </div>
      )}

      {/* 5. Cinematic Gradient Scrim */}
      <div className="reel-card-scrim z-[4]" />

      {/* 6. Hover Live Preview Badge */}
      {isPlaying && (
        <div className="absolute top-3 right-3 z-[6] flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-[10px] font-black text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          بث حي
        </div>
      )}

      {/* 7. Duration Badge if available */}
      {durationSeconds && durationSeconds > 0 && (
        <div className="absolute top-3 left-3 z-[5] px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white/90">
          {formatDuration(durationSeconds)}
        </div>
      )}

      {/* 8. Glowing Center Play / View Button on Hover */}
      <span className="reel-card-play z-[5] transition-transform duration-300 group-hover:scale-110">
        <span className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0F1B2D]/80 to-[#1F6B7A]/80 backdrop-blur-md border border-[#C4A35A]/50 grid place-items-center shadow-[0_0_24px_rgba(196,163,90,0.4)] group-hover:border-[#C4A35A] group-hover:shadow-[0_0_32px_rgba(196,163,90,0.7)] transition-all">
          <Play className="w-5 h-5 text-[#F5E6B8] fill-[#F5E6B8]/40 ml-0.5" />
        </span>
      </span>
    </div>
  );
}
