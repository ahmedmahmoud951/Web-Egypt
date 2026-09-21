'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ReelDto } from '@/types/social';
import { socialAdminApi } from '@/api/socialAdmin';
import { formatRelativeArabicTime, reelPublishedAt } from '@/lib/utils';
import {
  logVideoElement,
  probeMediaCodec,
  logBrowserCodecSupport,
  usePlayableMediaSrc,
  ensureWebPlayableMedia,
  clearSignedMediaUrlCache,
} from '@/hooks/usePlayableMediaSrc';
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
  Film,
} from 'lucide-react';
import Link from 'next/link';

export interface ReelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reel: ReelDto | null;
  onReelUpdated?: () => void;
}

function statusMeta(status: string | undefined) {
  if (status === 'Published') {
    return {
      label: 'منشور',
      className:
        'bg-gradient-to-l from-emerald-500/25 to-teal-500/10 text-emerald-200 border-emerald-400/40 shadow-[0_0_24px_rgba(16,185,129,0.25)]',
      dot: 'bg-emerald-400',
    };
  }
  if (status === 'Draft') {
    return {
      label: 'مسودة',
      className: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
      dot: 'bg-slate-400',
    };
  }
  if (status === 'Hidden') {
    return {
      label: 'محجوب',
      className:
        'bg-amber-500/20 text-amber-200 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      dot: 'bg-amber-400',
    };
  }
  return {
    label: 'محذوف',
    className: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    dot: 'bg-rose-400',
  };
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
                flash.success(
                  result.normalizedNow ? 'تم تحويل الفيديو وعرض الصورة' : 'تم تحميل نسخة ويب قابلة للعرض'
                );
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
  }, [
    isOpen,
    reel?.id,
    src,
    failed,
    meta?.contentType,
    meta?.width,
    meta?.height,
    meta?.originalFileName,
    reel?.mediaUrl,
  ]);

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

  const st = statusMeta(reel.status);
  const stats = [
    {
      key: 'views',
      label: 'مشاهدات',
      value: reel.viewsCount ?? 0,
      icon: Eye,
      tone: 'cyan',
    },
    {
      key: 'likes',
      label: 'إعجابات',
      value: reel.reactionsCount ?? 0,
      icon: Heart,
      tone: 'rose',
    },
    {
      key: 'comments',
      label: 'تعليقات',
      value: reel.commentsCount ?? 0,
      icon: MessageCircle,
      tone: 'amber',
    },
    {
      key: 'shares',
      label: 'مشاركات',
      value: reel.sharesCount ?? 0,
      icon: Share2,
      tone: 'emerald',
    },
    {
      key: 'reports',
      label: 'بلاغات',
      value: reel.reportsCount ?? 0,
      icon: Flag,
      tone: 'rose-hot',
    },
  ] as const;

  return (
    <div
      className="reel-studio fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="reel-studio-backdrop absolute inset-0" onClick={onClose} />

      <div className="reel-studio-shell relative w-full max-w-[1180px] max-h-[94vh] flex flex-col md:flex-row overflow-hidden">
        {/* Cinema stage — video */}
        <div className="reel-studio-stage relative w-full md:w-[440px] lg:w-[480px] shrink-0 min-h-[360px] md:min-h-[640px]">
          <div className="reel-studio-stage-frame absolute inset-3 rounded-[1.75rem] overflow-hidden">
            {failed || !src ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 px-6 text-center bg-[#070b12]">
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
                  className={`absolute inset-0 w-full h-full object-contain bg-black ${
                    noVideoTrack ? 'opacity-0' : ''
                  }`}
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
                  <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 px-6 text-center bg-black/75 backdrop-blur-md">
                    <Loader2 className="w-8 h-8 text-[#E6D19A] animate-spin" />
                    <p className="text-sm font-black text-white">جاري تحويل الفيديو للويب…</p>
                    <p className="text-xs text-white/60 font-semibold">HEVC → H.264</p>
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
                        'الصوت بيشتغل على الويب، والصورة بتشتغل على الموبايل غالباً لأن الملف H.265/HEVC.'}
                    </p>
                    {src && (
                      <a
                        href={src}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="mt-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C4A35A]/20 hover:bg-[#C4A35A]/35 text-[#E6D19A] text-xs font-bold border border-[#C4A35A]/40 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        تنزيل الفيديو
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            {!failed && src && (
              <div className="absolute bottom-5 inset-x-5 z-10 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="pointer-events-auto p-2.5 rounded-2xl bg-black/55 hover:bg-black/75 text-white border border-white/15 backdrop-blur-xl shadow-lg transition-all"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="pointer-events-auto p-2.5 rounded-2xl bg-black/55 hover:bg-black/75 text-white border border-white/15 backdrop-blur-xl shadow-lg transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          <div className="reel-studio-stage-glow pointer-events-none" />
        </div>

        {/* Inspector panel */}
        <div className="reel-studio-panel relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="reel-studio-panel-top flex items-start gap-4 px-5 sm:px-7 pt-5 sm:pt-6 pb-4">
            <div className="min-w-0 flex-1 flex items-center gap-3">
              <UserAvatarWithStory
                name={reel.authorName}
                avatarUrl={reel.authorAvatar}
                verificationBadge={reel.authorVerificationBadge}
                size="lg"
                showName
                subtitle={`معرّف · ${reel.id.slice(0, 8)}…`}
              />
            </div>

            {/* Status badge — kept on the START (right in RTL), far from close on the left */}
            <div className="shrink-0 flex flex-col items-end gap-2 pt-1">
              <span
                className={`inline-flex items-center gap-2 text-[11px] px-3.5 py-1.5 rounded-full font-black tracking-wide border backdrop-blur-md ${st.className}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot} animate-pulse`} />
                {st.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-[#9FB0C3] font-bold">
                <Film className="w-3 h-3 text-[#C4A35A]" />
                استوديو المراجعة
              </span>
            </div>

            {/* Generous spacer so badge never sits near the close control */}
            <div className="hidden sm:block w-10 shrink-0" aria-hidden />

            <button
              type="button"
              onClick={onClose}
              className="reel-studio-close shrink-0 p-2.5 rounded-2xl text-white/70 hover:text-white transition-all"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-7 pb-5 space-y-5">
            <section className="reel-studio-caption space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[11px] font-black uppercase tracking-[0.14em] text-[#C4A35A]">
                  نص الوصف
                </label>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#9FB0C3] border border-white/10"
                  title={reelPublishedAt(reel)}
                >
                  <Calendar className="w-3 h-3 text-[#C4A35A]" />
                  {formatRelativeArabicTime(reelPublishedAt(reel))}
                </span>
              </div>
              <div className="reel-studio-caption-body p-4 rounded-2xl text-sm text-[#E8EEF5] leading-relaxed font-semibold">
                {reel.caption || <span className="text-[#6B7C90] italic font-medium">بدون تعليق</span>}
              </div>
              <p className="text-[11px] text-[#6B7C90] leading-snug">
                لا يمكن تعديل نص التعليق من قِبل المشرف حفاظاً على النزاهة وحقوق الملكية.
              </p>
            </section>

            {(reel.locationName || reel.categoryName || reel.eventTitle) && (
              <div className="flex flex-wrap gap-2">
                {reel.locationName && (
                  <div className="reel-studio-chip reel-studio-chip--cyan">
                    <MapPin className="w-3.5 h-3.5" />
                    {reel.locationName}
                  </div>
                )}
                {reel.categoryName && (
                  <div className="reel-studio-chip reel-studio-chip--gold">
                    <Tag className="w-3.5 h-3.5" />
                    {reel.categoryName}
                  </div>
                )}
                {reel.eventTitle && (
                  <div className="reel-studio-chip reel-studio-chip--teal">
                    <Sparkles className="w-3.5 h-3.5" />
                    {reel.eventTitle}
                  </div>
                )}
              </div>
            )}

            <section className="reel-studio-stats">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.key} className={`reel-studio-stat reel-studio-stat--${s.tone}`}>
                    <div className="reel-studio-stat-icon">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="reel-studio-stat-label">{s.label}</div>
                    <div className="reel-studio-stat-value">{s.value}</div>
                  </div>
                );
              })}
            </section>
          </div>

          <div className="reel-studio-footer px-5 sm:px-7 py-4 flex items-center justify-between flex-wrap gap-3">
            <Link href={`/admin/reports?search=${reel.id}`} className="reel-studio-reports-link">
              <ShieldAlert className="w-4 h-4" />
              مراجعة سجل البلاغات المرتبطة
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              {reel.status === 'Published' && (
                <Button variant="gold" size="sm" onClick={handleHide} className="gap-1.5 text-xs rounded-xl">
                  <EyeOff className="w-4 h-4" />
                  حجب المقطع
                </Button>
              )}
              {(reel.status === 'Hidden' || reel.status === 'Deleted') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRestore}
                  className="gap-1.5 text-xs rounded-xl"
                >
                  <RotateCcw className="w-4 h-4" />
                  استعادة
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={handleDelete} className="gap-1.5 text-xs rounded-xl">
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
