'use client';

import React, { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

interface EventVideoThumbnailProps {
  src: string;
  title?: string;
  className?: string;
  onOpen?: () => void;
}

/**
 * Facebook-style feed preview: first video frame + large play badge.
 * Does not autoplay; click opens the full player/lightbox.
 */
export function EventVideoThumbnail({ src, title, className = '', onOpen }: EventVideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const snapFrame = () => {
      try {
        // Seek slightly forward so a visible frame paints (black frame at 0 is common)
        if (el.currentTime < 0.05) {
          el.currentTime = Math.min(0.15, (el.duration || 1) * 0.02);
        }
      } catch {
        // ignore seek errors on some browsers before metadata
      }
    };

    el.addEventListener('loadedmetadata', snapFrame);
    el.addEventListener('loadeddata', snapFrame);
    return () => {
      el.removeEventListener('loadedmetadata', snapFrame);
      el.removeEventListener('loadeddata', snapFrame);
    };
  }, [src]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative w-full bg-black block text-left group/video ${className}`}
      aria-label={title ? `تشغيل فيديو: ${title}` : 'تشغيل الفيديو'}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        className="w-full max-h-[540px] object-contain bg-black pointer-events-none"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/video:bg-black/35 transition-colors">
        <span className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-white/95 text-slate-900 shadow-xl flex items-center justify-center ring-4 ring-white/30 group-hover/video:scale-105 transition-transform">
          <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current mr-[-2px]" />
        </span>
      </div>
      <span className="absolute bottom-3 right-3 text-[11px] font-bold text-white bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg">
        فيديو
      </span>
    </button>
  );
}
