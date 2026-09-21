'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FacebookVideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  className?: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Full-bleed object-contain video with Facebook-like controls:
 * play/pause, ±10s seek, scrubber, mute, fullscreen.
 */
export function FacebookVideoPlayer({ src, autoPlay = true, className = '' }: FacebookVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false);
    }, 2800);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);

    if (autoPlay) {
      el.play().catch(() => {
        // Autoplay blocked — user can tap play
      });
    }

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [src, autoPlay]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        seekBy(10);
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        seekBy(-10);
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => undefined);
    else el.pause();
    bumpControls();
  };

  const seekBy = (delta: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + delta), el.duration || el.currentTime + delta);
    bumpControls();
  };

  const onScrub = (value: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = value;
    setCurrent(value);
    bumpControls();
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    bumpControls();
  };

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (!document.fullscreenElement) await shell.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // ignore
    }
    bumpControls();
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={shellRef}
      className={`relative w-full h-full max-h-[85vh] flex items-center justify-center bg-black rounded-lg overflow-hidden group/player ${className}`}
      onMouseMove={bumpControls}
      onClick={bumpControls}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        className="max-h-[85vh] max-w-full w-full object-contain bg-black"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      />

      {/* Center play when paused */}
      {!playing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/95 text-slate-900 shadow-xl flex items-center justify-center z-10"
          aria-label="تشغيل"
        >
          <Play className="w-8 h-8 fill-current mr-[-2px]" />
        </button>
      )}

      {/* Controls bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-200 ${
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-10 px-3 pb-3 space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="w-full h-1.5 accent-white cursor-pointer"
            aria-label="شريط التقدم"
          />
          <div className="flex items-center justify-between gap-2 text-white">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => seekBy(-10)}
                className="p-2 rounded-full hover:bg-white/15"
                title="رجوع 10 ثوانٍ"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 rounded-full hover:bg-white/15"
                title={playing ? 'إيقاف' : 'تشغيل'}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button
                type="button"
                onClick={() => seekBy(10)}
                className="p-2 rounded-full hover:bg-white/15"
                title="تقديم 10 ثوانٍ"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/15"
                title={muted ? 'تشغيل الصوت' : 'كتم'}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-[11px] font-mono text-white/90 px-1" dir="ltr">
                {formatTime(current)} / {formatTime(duration)}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/15"
              title="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
          {/* visual progress hint */}
          <div className="sr-only">{Math.round(progress)}%</div>
        </div>
      </div>
    </div>
  );
}
