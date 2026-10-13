'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ExternalLink,
  User,
  Phone,
  ShieldCheck,
  Download,
  RefreshCw,
} from 'lucide-react';

interface AvatarZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null | undefined;
  userName?: string;
  userPhoneNumber?: string;
  badgeName?: string;
  title?: string;
}

export function AvatarZoomModal({
  isOpen,
  onClose,
  imageUrl,
  userName,
  userPhoneNumber,
  badgeName,
  title = 'معاينة وتكبير صورة المستخدم',
}: AvatarZoomModalProps) {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Reset transform when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen, imageUrl]);

  // Handle keyboard events (ESC to close, + / - to zoom, 0 to reset)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(prev + 0.3, 4));
      } else if (e.key === '-' || e.key === '_') {
        setScale((prev) => Math.max(prev - 0.3, 0.5));
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Zoom helpers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.3, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.2, 4));
    } else {
      setScale((prev) => Math.max(prev - 0.2, 0.5));
    }
  }, []);

  // Drag handlers for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && scale === 1) {
          onClose();
        }
      }}
      onWheel={handleWheel}
    >
      {/* TOP BAR: USER IDENTITY & CONTROLS */}
      <div className="relative z-20 flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 via-slate-800 to-sky-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-0.5 text-right">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-sm sm:text-base truncate">
                {userName || 'مستخدم مسجل'}
              </h3>
              {badgeName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {badgeName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              {userPhoneNumber && (
                <span dir="ltr" className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {userPhoneNumber}
                </span>
              )}
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400 font-sans">{title}</span>
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            title="فتح الرابط الأصلي للصورة في تبويب جديد"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">الصورة الأصلية</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 border border-white/10 hover:border-rose-500/40 transition active:scale-95 cursor-pointer"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CENTER VIEWPORT: THE ZOOMABLE / DRAGGABLE AVATAR */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center overflow-hidden my-3 sm:my-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Glow ambient background aura */}
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {!imageLoaded && !imageError && (
          <div className="absolute flex flex-col items-center gap-2 text-amber-400 font-bold text-xs">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span>جاري تحميل وتكبير الصورة بجودة عالية...</span>
          </div>
        )}

        {imageError ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-2 max-w-sm">
            <User className="w-12 h-12 mx-auto text-rose-400" />
            <div className="text-white text-sm font-bold">تعذر تحميل الصورة الشخصية للمستخدم</div>
            <p className="text-xs text-slate-400">قد يكون الرابط غير متاح أو تم نقله في الخادم.</p>
          </div>
        ) : (
          <div
            className="transition-transform duration-100 ease-out flex items-center justify-center p-4 max-w-full max-h-full"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={userName || 'صورة المستخدم'}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              draggable={false}
              className={`max-w-[85vw] max-h-[70vh] sm:max-w-[70vw] sm:max-h-[75vh] object-contain rounded-3xl shadow-2xl ring-2 ring-white/15 border border-amber-500/40 transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        )}
      </div>

      {/* BOTTOM TOOLBAR: ZOOM CONTROLS & SCALE PERCENTAGE */}
      <div className="relative z-20 flex items-center justify-center">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/95 border border-slate-800 rounded-2xl p-1.5 sm:p-2 backdrop-blur-md shadow-2xl">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="تكبير (+)"
          >
            <ZoomIn className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">تكبير</span>
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="تصغير (-)"
          >
            <ZoomOut className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">تصغير</span>
          </button>

          <button
            type="button"
            onClick={handleRotate}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="تدوير 90 درجة"
          >
            <RotateCw className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">تدوير</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition flex items-center gap-1 active:scale-95 cursor-pointer"
            title="إعادة ضبط الحجم الأصلي (0)"
          >
            <Maximize2 className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs font-black text-amber-300 min-w-[58px] text-center">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
