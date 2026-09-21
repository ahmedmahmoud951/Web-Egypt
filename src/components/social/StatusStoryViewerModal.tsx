'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { StatusDto, AdminStatusDetailDto } from '@/types/social';
import { socialAdminApi } from '@/api/socialAdmin';
import { formatArabicDate } from '@/lib/utils';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  MapPin,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useFlash } from '@/components/ui/FlashProvider';

export interface StatusStoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: (StatusDto | AdminStatusDetailDto)[];
  initialIndex?: number;
  onStatusUpdated?: () => void;
}

export function StatusStoryViewerModal({
  isOpen,
  onClose,
  statuses,
  initialIndex = 0,
  onStatusUpdated,
}: StatusStoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const flash = useFlash();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  const currentStatus = statuses[currentIndex];

  // Auto-record view on status change
  useEffect(() => {
    if (isOpen && currentStatus) {
      socialAdminApi.viewStatus(currentStatus.id).catch(() => {});
      setProgress(0);
    }
  }, [isOpen, currentIndex, currentStatus]);

  // Story progress timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentStatus) return;

    const duration = currentStatus.mediaType === 'Video' ? 12000 : 5000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            clearInterval(timer);
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentIndex, currentStatus, statuses.length, onClose]);

  if (!isOpen || !currentStatus) return null;

  const isVideo = currentStatus.mediaType === 'Video' || currentStatus.mediaUrl.endsWith('.mp4');

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleHide = async () => {
    try {
      await socialAdminApi.hideStatus(currentStatus.id);
      flash.success('تم حجب الحالة بنجاح.');
      onStatusUpdated?.();
      onClose();
    } catch {
      flash.error('فشل حجب الحالة.');
    }
  };

  const handleRestore = async () => {
    try {
      await socialAdminApi.restoreStatus(currentStatus.id);
      flash.success('تمت استعادة الحالة بنجاح.');
      onStatusUpdated?.();
      onClose();
    } catch {
      flash.error('فشلت استعادة الحالة.');
    }
  };

  const handleDelete = async () => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للحالة؟',
      message: 'لن تظهر هذه الحالة لأي مستخدم مجدداً.',
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await socialAdminApi.deleteStatus(currentStatus.id);
      flash.success('تم حذف الحالة نهائياً.');
      onStatusUpdated?.();
      onClose();
    } catch {
      flash.error('فشل حذف الحالة.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Container 9:16 Aspect Ratio */}
      <div className="relative w-full max-w-md h-[88vh] max-h-[820px] bg-[#0A101D] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(196,163,90,0.3)] flex flex-col justify-between">
        {/* Top Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {statuses.map((s, idx) => (
            <div
              key={s.id}
              className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm"
            >
              <div
                className="h-full bg-gradient-to-r from-[#C4A35A] to-[#0F766E] transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-7 inset-x-4 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full border-2 border-[#C4A35A] overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-sm">
              {currentStatus.authorAvatar ? (
                <Image
                  src={currentStatus.authorAvatar}
                  alt={currentStatus.authorName}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <span>{(currentStatus.authorName || 'م').slice(0, 2)}</span>
              )}
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                <span className="drop-shadow-[0_0_10px_rgba(196,163,90,0.5)]">
                  {currentStatus.authorName}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#0F766E]/80 border border-emerald-400/40">
                  {currentStatus.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/70">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatArabicDate(currentStatus.createdAt)}
                </span>
                {currentStatus.locationName && (
                  <span className="flex items-center gap-1 text-[var(--egypt-gold)]">
                    <MapPin className="w-3 h-3" />
                    {currentStatus.locationName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
              title={isPaused ? 'تشغيل' : 'إيقاف مؤقت'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Media Viewer */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStatus.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={false}
              loop
            />
          ) : (
            <Image
              src={currentStatus.mediaUrl}
              alt="Story Media"
              fill
              className="object-contain"
              priority
            />
          )}

          {/* Navigation Click Overlay */}
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
            onClick={handleNext}
            title="التالي"
          />
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
            onClick={handlePrev}
            title="السابق"
          />

          {/* Next / Prev Buttons */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-25 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentIndex < statuses.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-25 p-2 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Story Caption & Admin Action Bar */}
        <div className="relative z-30 p-4 bg-gradient-to-t from-black via-black/80 to-transparent space-y-3">
          {currentStatus.text && (
            <p className="text-white text-sm font-medium bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 text-right">
              {currentStatus.text}
            </p>
          )}

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-xs text-white/70 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                {currentStatus.viewsCount} مشاهدة
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {currentStatus.reactionsCount} تفاعل
              </span>
            </div>
            <div className="text-[11px] text-white/50">
              ينتهي في: {formatArabicDate(currentStatus.expiresAt)}
            </div>
          </div>

          {/* Admin Moderation Actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
            {currentStatus.status === 'Active' && (
              <Button
                variant="gold"
                size="sm"
                onClick={handleHide}
                className="gap-1 text-xs h-8"
              >
                <EyeOff className="w-3.5 h-3.5" />
                حجب
              </Button>
            )}
            {currentStatus.status === 'Hidden' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRestore}
                className="gap-1 text-xs h-8"
              >
                <Eye className="w-3.5 h-3.5" />
                استعادة
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className="gap-1 text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف نهائي
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
