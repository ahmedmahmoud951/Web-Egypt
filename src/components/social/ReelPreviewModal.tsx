'use client';

import React, { useRef, useState } from 'react';
import { ReelDto } from '@/types/social';
import { socialAdminApi } from '@/api/socialAdmin';
import { formatArabicDate } from '@/lib/utils';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { Button } from '@/components/ui/Button';
import { useFlash } from '@/components/ui/FlashProvider';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Flag,
  Calendar,
  MapPin,
  Tag,
  Sparkles,
  EyeOff,
  RotateCcw,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export interface ReelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: ReelDto | null;
  onReelUpdated?: () => void;
}

export function ReelPreviewModal({
  isOpen,
  onClose,
  reel,
  onReelUpdated,
}: ReelPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const flash = useFlash();

  if (!isOpen || !reel) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleHide = async () => {
    try {
      await socialAdminApi.hideReel(reel.id);
      flash.success('تم حجب مقطع الريلز بنجاح.');
      onReelUpdated?.();
      onClose();
    } catch {
      flash.error('فشل حجب المقطع.');
    }
  };

  const handleRestore = async () => {
    try {
      await socialAdminApi.restoreReel(reel.id);
      flash.success('تمت استعادة مقطع الريلز بنجاح.');
      onReelUpdated?.();
      onClose();
    } catch {
      flash.error('فشلت استعادة المقطع.');
    }
  };

  const handleDelete = async () => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للريلز؟',
      message: `«${reel.caption.slice(0, 40) || 'مقطع ريلز'}» — سيتم حذف المقطع نهائياً من قاعدة البيانات والوسائط.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await socialAdminApi.deleteReel(reel.id);
      flash.success('تم حذف مقطع الريلز نهائياً.');
      onReelUpdated?.();
      onClose();
    } catch {
      flash.error('فشل حذف المقطع.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-gradient-to-br from-[#0F1B2D] via-[#15283C] to-[#0A101D] text-white rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(196,163,90,0.3)] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-40 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Column (9:16 vertical ratio) */}
        <div className="relative w-full md:w-[380px] shrink-0 bg-black flex items-center justify-center overflow-hidden min-h-[380px] md:min-h-[580px]">
          <video
            ref={videoRef}
            src={reel.mediaUrl}
            className="w-full h-full max-h-[580px] object-contain"
            autoPlay
            loop
            playsInline
            muted={isMuted}
            onClick={togglePlay}
          />

          {/* Video Floating Controls */}
          <div className="absolute bottom-4 inset-x-4 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={togglePlay}
              className="pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="pointer-events-auto p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Details & Moderation Info Column */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto space-y-6">
          {/* Header & Author Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <UserAvatarWithStory
                name={reel.authorName}
                avatarUrl={reel.authorAvatar}
                verificationBadge={reel.authorVerificationBadge}
                size="lg"
                showName
                subtitle={`معرّف المقطع: ${reel.id.slice(0, 8)}...`}
              />
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold shadow-[0_0_12px_rgba(0,0,0,0.4)] ${
                  reel.status === 'Published'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : reel.status === 'Draft'
                    ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    : reel.status === 'Hidden'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {reel.status === 'Published'
                  ? 'منشور'
                  : reel.status === 'Draft'
                  ? 'مسودة'
                  : reel.status === 'Hidden'
                  ? 'محجوب'
                  : 'محذوف'}
              </span>
            </div>

            {/* Caption (Read-only as per specs) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--egypt-gold)]">نص الوصف (Caption)</label>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-200 leading-relaxed font-medium">
                {reel.caption || <span className="text-slate-500 italic">بدون تعليق</span>}
              </div>
              <p className="text-[11px] text-slate-400">
                * ملاحظة: لا يمكن تعديل نص التعليق من قِبل المشرف حفاظاً على النزاهة وحقوق الملكية.
              </p>
            </div>

            {/* Meta Tags */}
            <div className="flex flex-wrap gap-2 text-xs">
              {reel.locationName && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-700/30">
                  <MapPin className="w-3.5 h-3.5" />
                  {reel.locationName}
                </div>
              )}
              {reel.categoryName && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-700/30">
                  <Tag className="w-3.5 h-3.5" />
                  {reel.categoryName}
                </div>
              )}
              {reel.eventTitle && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-700/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  الحدث: {reel.eventTitle}
                </div>
              )}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10">
                <Calendar className="w-3.5 h-3.5" />
                {formatArabicDate(reel.createdAt)}
              </div>
            </div>

            {/* Statistics Matrix */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-slate-400 flex items-center justify-center gap-1 text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  مشاهدات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.viewsCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-slate-400 flex items-center justify-center gap-1 text-[11px]">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  إعجابات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.reactionsCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-slate-400 flex items-center justify-center gap-1 text-[11px]">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                  تعليقات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.commentsCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="text-slate-400 flex items-center justify-center gap-1 text-[11px]">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  مشاركات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.sharesCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-center">
                <div className="text-rose-300 flex items-center justify-center gap-1 text-[11px]">
                  <Flag className="w-3.5 h-3.5 text-rose-400" />
                  بلاغات
                </div>
                <div className="text-base font-black text-rose-300 mt-0.5">{reel.reportsCount}</div>
              </div>
            </div>
          </div>

          {/* Action & Moderation Controls */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
            <Link
              href={`/admin/reports?search=${reel.id}`}
              className="text-xs text-[var(--egypt-gold)] hover:underline flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              مراجعة سجل البلاغات المرتبطة
            </Link>

            <div className="flex items-center gap-2">
              {reel.status === 'Published' && (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={handleHide}
                  className="gap-1.5 text-xs"
                >
                  <EyeOff className="w-4 h-4" />
                  حجب المقطع
                </Button>
              )}
              {(reel.status === 'Hidden' || reel.status === 'Deleted') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRestore}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  استعادة
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                حذف نهائي
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
