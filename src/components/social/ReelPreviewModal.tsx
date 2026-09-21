'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ReelDto } from '@/types/social';
import { socialAdminApi } from '@/api/socialAdmin';
import { formatRelativeArabicTime, reelPublishedAt } from '@/lib/utils';
import { logVideoElement, probeMediaCodec, logBrowserCodecSupport, usePlayableMediaSrc, ensureWebPlayableMedia, clearSignedMediaUrlCache } from '@/hooks/usePlayableMediaSrc';
import type { MediaCodecProbe } from '@/hooks/usePlayableMediaSrc';
import { extractMediaId } from '@/lib/media';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { Button } from '@/components/ui/Button';
import { useFlash } from '@/components/ui/FlashProvider';
import { devLog } from '@/lib/devLog';
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
  AlertTriangle,
  Music2,
  Loader2,
  Download,
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
  const [isMuted, setIsMuted] = useState(true);
  const [noVideoTrack, setNoVideoTrack] = useState(false);
  const [codecProbe, setCodecProbe] = useState<MediaCodecProbe | null>(null);
  const [forcedSrc, setForcedSrc] = useState<string | null>(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [normalizeError, setNormalizeError] = useState<string | null>(null);
  const normalizeAttemptedRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const flash = useFlash();
  const { src: resolvedSrc, failed, markFailed, meta } = usePlayableMediaSrc(reel?.mediaUrl);
  const src = forcedSrc || resolvedSrc;

  useEffect(() => {
    if (!isOpen || !reel) return;
    setIsMuted(true);
    setIsPlaying(true);
    setNoVideoTrack(false);
    setCodecProbe(null);
    setForcedSrc(null);
    setIsNormalizing(false);
    setNormalizeError(null);
    normalizeAttemptedRef.current = null;
    logBrowserCodecSupport('reel-preview');
  }, [isOpen, reel?.id]);

  useEffect(() => {
    if (!isOpen || !reel) return;
    const el = videoRef.current;
    if (!el || !src || failed) return;

    el.muted = true;
    logVideoElement('reel-preview', 'open-attempt-play', el, { reelId: reel.id });

    el.play()
      .then(() => {
        setIsPlaying(true);
        const audioOnly =
          el.readyState >= 2 &&
          el.videoWidth === 0 &&
          el.videoHeight === 0 &&
          Number.isFinite(el.duration) &&
          el.duration > 0;
        if (audioOnly) {
          setNoVideoTrack(true);
          const mediaId = extractMediaId(reel.mediaUrl);
          if (mediaId) {
            void probeMediaCodec(mediaId).then((probe) => {
              if (probe) setCodecProbe(probe);
            });

            if (normalizeAttemptedRef.current !== mediaId) {
              normalizeAttemptedRef.current = mediaId;
              setIsNormalizing(true);
              setNormalizeError(null);
              void ensureWebPlayableMedia(mediaId).then((result) => {
                setIsNormalizing(false);
                if (!result?.url) {
                  setNormalizeError(
                    'تعذر تحويل الفيديو للويب. تأكد من نشر الـ API مع ffmpeg أو صدّر الريل بـ H.264 من التطبيق.'
                  );
                  return;
                }
                clearSignedMediaUrlCache(mediaId);
                setForcedSrc(result.url);
                setNoVideoTrack(false);
                setNormalizeError(null);
                flash.success(result.normalizedNow ? 'تم تحويل الفيديو وعرض الصورة' : 'تم تحميل نسخة ويب قابلة للعرض');
              });
            }
          }
          devLog.warn('reel-preview', 'NO VIDEO TRACK — audio plays but no picture', {
            reelId: reel.id,
            duration: el.duration,
            contentType: meta?.contentType,
            dbWidth: meta?.width,
            dbHeight: meta?.height,
            fileName: meta?.originalFileName,
          });
        }
        logVideoElement('reel-preview', 'playing', el, {
          reelId: reel.id,
          zeroSize: el.clientWidth === 0 || el.clientHeight === 0,
          noVideoTrack: audioOnly,
        });
      })
      .catch((err) => {
        setIsPlaying(false);
        devLog.warn('reel-preview', 'autoplay blocked/failed', {
          reelId: reel.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });
  }, [isOpen, reel?.id, src, failed, meta?.contentType, meta?.width, meta?.height, meta?.originalFileName, reel?.mediaUrl]);

  if (!isOpen || !reel) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
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
      message: `«${(reel.caption || 'مقطع ريلز').slice(0, 40)}» — سيتم حذف المقطع نهائياً من قاعدة البيانات والوسائط.`,
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
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-40 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative w-full md:w-[380px] shrink-0 bg-black overflow-hidden min-h-[380px] md:min-h-[580px] aspect-[9/16] md:aspect-auto">
          {failed || !src ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 px-6 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <p className="text-sm font-bold">تعذر تحميل الفيديو</p>
              <p className="text-xs text-white/50">قد يكون الملف غير مكتمل الرفع أو محذوفاً من التخزين.</p>
            </div>
          ) : (
            <>
              <video
                key={src}
                ref={videoRef}
                src={src}
                className={`absolute inset-0 w-full h-full object-contain bg-black ${noVideoTrack ? 'opacity-0' : ''}`}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                preload="auto"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => {
                  logVideoElement('reel-preview', 'loadedmetadata', videoRef.current);
                  const el = videoRef.current;
                  if (
                    el &&
                    el.videoWidth === 0 &&
                    el.videoHeight === 0 &&
                    Number.isFinite(el.duration) &&
                    el.duration > 0
                  ) {
                    setNoVideoTrack(true);
                  }
                }}
                onLoadedData={() => {
                  logVideoElement('reel-preview', 'loadeddata', videoRef.current);
                  const el = videoRef.current;
                  if (
                    el &&
                    el.videoWidth === 0 &&
                    el.videoHeight === 0 &&
                    Number.isFinite(el.duration) &&
                    el.duration > 0
                  ) {
                    setNoVideoTrack(true);
                  }
                }}
                onCanPlay={() => logVideoElement('reel-preview', 'canplay', videoRef.current)}
                onError={() => {
                  logVideoElement('reel-preview', 'error', videoRef.current);
                  markFailed();
                }}
                onClick={togglePlay}
              />
              {isNormalizing && (
                <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 px-6 text-center bg-black/70 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-[#E6D19A] animate-spin" />
                  <p className="text-sm font-black text-white">جاري تحويل الفيديو للويب…</p>
                  <p className="text-xs text-white/60 font-semibold">HEVC → H.264 عشان الصورة تظهر في المتصفح</p>
                </div>
              )}
              {noVideoTrack && !isNormalizing && (
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 px-6 text-center bg-gradient-to-b from-[#15283C] to-[#0A101D]">
                  <span className="w-16 h-16 rounded-full bg-[#C4A35A]/20 border border-[#C4A35A]/40 grid place-items-center">
                    <Music2 className="w-8 h-8 text-[#E6D19A]" />
                  </span>
                  <p className="text-sm font-black text-white">
                    {codecProbe?.hasHevc
                      ? 'الفيديو HEVC — المتصفح مش بيعرض الصورة'
                      : 'مفيش مسار فيديو قابل للعرض في المتصفح'}
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed font-semibold">
                    {normalizeError ||
                      codecProbe?.diagnosisAr ||
                      'الصوت بيشتغل على الويب، والصورة بتشتغل على الموبايل غالباً لأن الملف H.265/HEVC. التطبيق لازم يصدّر الريلز بـ H.264 (avc1).'}
                  </p>
                  {(codecProbe || meta) && (
                    <p className="text-[10px] font-mono text-white/40 break-all">
                      {[
                        codecProbe?.contentType || meta?.contentType,
                        codecProbe?.detectedTags?.length
                          ? `tags:${codecProbe.detectedTags.join(',')}`
                          : null,
                        codecProbe?.hasHevc ? 'HEVC=yes' : null,
                        codecProbe?.hasH264 ? 'H264=yes' : null,
                        meta?.originalFileName || codecProbe?.originalFileName,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  {src && (
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C4A35A]/20 hover:bg-[#C4A35A]/35 text-[#E6D19A] text-xs font-bold border border-[#C4A35A]/40 transition-all shadow-md pointer-events-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل الفيديو لتشغيله في مشغل الجهاز (VLC / Media Player)</span>
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {!failed && src && (
            <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between pointer-events-none">
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
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto space-y-6">
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--egypt-gold)]">نص الوصف (Caption)</label>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-200 leading-relaxed font-medium">
                {reel.caption || <span className="text-slate-500 italic">بدون تعليق</span>}
              </div>
              <p className="text-[11px] text-slate-400">
                * ملاحظة: لا يمكن تعديل نص التعليق من قِبل المشرف حفاظاً على النزاهة وحقوق الملكية.
              </p>
            </div>

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
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950/40 text-teal-300 border border-teal-700/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  الحدث: {reel.eventTitle}
                </div>
              )}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10"
                title={reelPublishedAt(reel)}
              >
                <Calendar className="w-3.5 h-3.5" />
                {formatRelativeArabicTime(reelPublishedAt(reel))}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-[#1a2838] border border-cyan-500/30 text-center shadow-[0_0_14px_rgba(34,211,238,0.15)]">
                <div className="text-[#8B9CB0] flex items-center justify-center gap-1 text-[11px]">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  مشاهدات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.viewsCount ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1a2838] border border-rose-400/30 text-center shadow-[0_0_14px_rgba(244,63,94,0.15)]">
                <div className="text-[#8B9CB0] flex items-center justify-center gap-1 text-[11px]">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  إعجابات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.reactionsCount ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1a2838] border border-amber-400/30 text-center shadow-[0_0_14px_rgba(251,191,36,0.15)]">
                <div className="text-[#8B9CB0] flex items-center justify-center gap-1 text-[11px]">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                  تعليقات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.commentsCount ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1a2838] border border-emerald-400/30 text-center shadow-[0_0_14px_rgba(16,185,129,0.15)]">
                <div className="text-[#8B9CB0] flex items-center justify-center gap-1 text-[11px]">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  مشاركات
                </div>
                <div className="text-base font-black text-white mt-0.5">{reel.sharesCount ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1a2838] border border-rose-500/40 text-center shadow-[0_0_14px_rgba(244,63,94,0.22)]">
                <div className="text-rose-300 flex items-center justify-center gap-1 text-[11px]">
                  <Flag className="w-3.5 h-3.5 text-rose-400" />
                  بلاغات
                </div>
                <div className="text-base font-black text-rose-300 mt-0.5">{reel.reportsCount ?? 0}</div>
              </div>
            </div>
          </div>

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
