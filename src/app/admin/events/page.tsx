'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signalRService } from '@/lib/signalr';
import { AdminShell } from '@/components/admin/AdminShell';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { useFlash } from '@/components/ui/FlashProvider';
import { adminApi } from '@/api/admin';
import { eventsApi } from '@/api/events';
import { EventDto, EventStatus, MediaItemDto, CommentDto } from '@/types/event';
import { formatArabicDate, formatRelativeArabicTime } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { getMediaCandidateUrls, isVideoMedia, resolveMediaUrl } from '@/lib/media';
import {
  Search,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Newspaper,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  RotateCcw,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  Globe,
  Lock,
  Compass,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  FileText,
  LayoutGrid,
  List,
  Sparkles,
  Send,
} from 'lucide-react';

// ============================================================================
// RESILIENT MEDIA & AVATAR HELPERS
// ============================================================================

interface SafeMediaThumbnailProps {
  src?: string | null;
  alt: string;
  title: string;
  isVideo?: boolean;
  durationSeconds?: number | null;
  onClick?: () => void;
  className?: string;
  badgeText?: string;
}

function SafeMediaThumbnail({
  src,
  alt,
  title,
  isVideo = false,
  durationSeconds,
  onClick,
  className,
  badgeText,
}: SafeMediaThumbnailProps) {
  const candidates = useMemo(() => getMediaCandidateUrls(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(!src);
  const [tryVideo, setTryVideo] = useState(isVideo || isVideoMedia(src));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(!src);
    setTryVideo(isVideo || isVideoMedia(src));
    setIsPlaying(false);
    setIsLoaded(false);
  }, [src, isVideo]);

  const activeSrc = candidates[candidateIndex] || resolveMediaUrl(src);

  const handleError = () => {
    if (!tryVideo) {
      // If image failed, try video tag once before cycling candidates
      setTryVideo(true);
      return;
    }
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
      setTryVideo(isVideo || isVideoMedia(src));
    } else {
      setHasError(true);
    }
  };

  const handleMouseEnter = () => {
    if (tryVideo && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay might be rejected if unmuted or gesture lacking
          });
      }
    }
  };

  const handleMouseLeave = () => {
    if (tryVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!src || hasError) {
    return (
      <div
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-500 text-center cursor-pointer hover:border-cyan-500/60 hover:bg-slate-800/80 transition shadow-inner ${
          className || ''
        }`}
        title="اضغط لمعاينة البيانات والوسائط الأصلية"
      >
        <FileText className="w-8 h-8 mb-2 text-slate-400 group-hover:text-cyan-400 transition" />
        <span className="text-xs text-slate-300 font-bold line-clamp-1">{title}</span>
        {src && (
          <span className="text-[11px] text-cyan-400 mt-1.5 opacity-80 group-hover:opacity-100 flex items-center gap-1 font-bold">
            <Eye className="w-3.5 h-3.5" />
            فتح المعاينة
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden cursor-pointer hover:border-cyan-400/80 transition duration-300 shadow-md hover:shadow-cyan-500/20 flex items-center justify-center ${
        className || ''
      }`}
    >
      {/* 1. Ambient Backdrop: Eliminates black bars and provides dynamic colored blur for images */}
      {!tryVideo && (
        <img
          src={activeSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-125 pointer-events-none select-none transition-opacity duration-500"
          loading="lazy"
          decoding="async"
        />
      )}
      {tryVideo && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 opacity-90 pointer-events-none" />
      )}

      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center z-5">
          <div className="w-7 h-7 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* 2. Sharp Uncropped Foreground: object-contain guarantees 100% full view of photo or video without cropping */}
      {tryVideo ? (
        <video
          ref={videoRef}
          src={activeSrc}
          preload="none"
          muted
          loop
          playsInline
          className="relative z-10 w-full h-full object-contain transition duration-300"
          onError={handleError}
          onLoadedData={() => setIsLoaded(true)}
          onCanPlay={() => setIsLoaded(true)}
        />
      ) : (
        <img
          src={activeSrc}
          alt={alt}
          className={`relative z-10 w-full h-full object-contain transition duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleError}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Hover / Play Overlay */}
      <div
        className={`absolute inset-0 z-20 bg-slate-950/60 flex flex-col items-center justify-center text-white text-xs font-bold transition duration-200 backdrop-blur-xs ${
          isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        {tryVideo ? (
          <div className="p-3 rounded-full bg-cyan-500/30 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.5)] mb-1">
            <Play className="w-6 h-6 text-cyan-300 fill-cyan-300" />
          </div>
        ) : (
          <div className="p-3 rounded-full bg-slate-800/80 border border-slate-700 mb-1">
            <Eye className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
        )}
        <span className="text-slate-200 font-bold drop-shadow">
          {tryVideo ? (isPlaying ? 'اضغط لتكبير الفيديو' : 'اضغط للعرض الكامل') : 'اضغط للتكبير'}
        </span>
      </div>

      {/* Video Badge */}
      {tryVideo && (
        <span className="absolute top-2.5 left-2.5 z-20 bg-slate-950/85 text-cyan-300 text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1.5 border border-cyan-500/40 shadow-md backdrop-blur-sm">
          <Play
            className={`w-3 h-3 fill-cyan-400 ${
              isPlaying ? 'animate-pulse text-emerald-400 fill-emerald-400' : ''
            }`}
          />
          {isPlaying ? 'معاينة حية' : durationSeconds ? `${Math.round(durationSeconds)} ثانية` : 'فيديو'}
        </span>
      )}

      {/* Multi-media Badge */}
      {badgeText && (
        <span className="absolute bottom-2.5 right-2.5 z-20 bg-slate-950/90 text-[11px] text-cyan-200 font-black rounded-lg py-1 px-2.5 truncate border border-slate-700/80 shadow-md backdrop-blur-sm">
          {badgeText}
        </span>
      )}
    </div>
  );
}

const getAvatarGradient = (name: string) => {
  let hash = 0;
  const str = name || 'مستخدم';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    'from-cyan-950 via-slate-900 to-cyan-900 border-cyan-500/40 text-cyan-300',
    'from-emerald-950 via-slate-900 to-emerald-900 border-emerald-500/40 text-emerald-300',
    'from-purple-950 via-slate-900 to-purple-900 border-purple-500/40 text-purple-300',
    'from-amber-950 via-slate-900 to-amber-900 border-amber-500/40 text-amber-300',
    'from-sky-950 via-slate-900 to-blue-900 border-sky-500/40 text-sky-300',
    'from-rose-950 via-slate-900 to-pink-900 border-rose-500/40 text-rose-300',
  ];
  return palettes[Math.abs(hash) % palettes.length];
};

function SafeAvatar({
  src,
  name,
  size = 40,
  onClick,
}: {
  src?: string | null;
  name: string;
  size?: number;
  onClick?: () => void;
}) {
  const candidates = useMemo(() => getMediaCandidateUrls(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(!src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(!src);
    setIsLoaded(false);
  }, [src]);

  const activeSrc = candidates[candidateIndex] || resolveMediaUrl(src);

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const initial = (name || 'م').trim().charAt(0);
  const colorClass = useMemo(() => getAvatarGradient(name), [name]);

  if (!src || hasError) {
    return (
      <div
        onClick={onClick}
        style={{ width: size, height: size, minWidth: size }}
        className={`shrink-0 rounded-full bg-gradient-to-tr border flex items-center justify-center font-black shadow-inner select-none ${colorClass} ${
          onClick ? 'cursor-pointer hover:scale-105 transition' : ''
        }`}
      >
        <span style={{ fontSize: size * 0.4 }}>{initial}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size, minWidth: size }}
      className={`shrink-0 rounded-full overflow-hidden border relative group bg-gradient-to-tr shadow-inner select-none ${colorClass} ${
        onClick ? 'cursor-pointer hover:scale-105 hover:border-cyan-300 transition' : ''
      }`}
    >
      {/* Immediate Initial Letter Fallback while image loads asynchronously */}
      <span
        style={{ fontSize: size * 0.4 }}
        className={`absolute inset-0 flex items-center justify-center font-black transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {initial}
      </span>
      <img
        src={activeSrc}
        alt={name}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
      />
    </div>
  );
}

// ============================================================================
// MAIN ADMIN EVENTS PAGE
// ============================================================================

export default function AdminEventsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [locationPrivacyFilter, setLocationPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [hasGpsFilter, setHasGpsFilter] = useState<'all' | 'withGps' | 'withoutGps'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'comments' | 'reports'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(1);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const debouncedQ = useDebouncedValue(q, 400);
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();
  const flash = useFlash();

  // Modal States
  const [selectedEventForModal, setSelectedEventForModal] = useState<EventDto | null>(null);
  const [commentsEvent, setCommentsEvent] = useState<EventDto | null>(null);
  const [activeCommentText, setActiveCommentText] = useState('');
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    title: string;
    isVideo?: boolean;
    zoom: number;
    rotation: number;
  } | null>(null);

  const queryKey = useMemo(
    () => ['admin', 'events', { q: debouncedQ, status, page }],
    [debouncedQ, status, page]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      adminApi.getEvents({
        q: debouncedQ.trim() || undefined,
        status: (status || undefined) as EventStatus | undefined,
        page,
        pageSize: 20,
        signal,
      }),
    enabled: adminReady,
    staleTime: 60_000,
    retry: 0,
  });

  // Real-time synchronization via SignalR
  useEffect(() => {
    signalRService.start();

    const refreshLive = () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'events'], type: 'active' });
    };

    const unsubs = [
      signalRService.onEventCreated(() => refreshLive()),
      signalRService.onEventUpdated(() => refreshLive()),
      signalRService.onEventConfirmed(() => refreshLive()),
      signalRService.onEventHidden(() => refreshLive()),
      signalRService.onEventRestored(() => refreshLive()),
      signalRService.onEventReported(() => refreshLive()),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, refetch]);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      if (selectedEventForModal) setSelectedEventForModal(null);
      flash.success('تم حذف المنشور نهائيًا من قاعدة البيانات.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل حذف المنشور.'),
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => adminApi.hideEvent(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      if (selectedEventForModal && selectedEventForModal.id === updated.id) {
        setSelectedEventForModal((prev) => (prev ? { ...prev, status: 'Hidden' } : null));
      }
      flash.success('تم إخفاء المنشور عن العامة بنجاح.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل إخفاء المنشور.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreEvent(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      if (selectedEventForModal && selectedEventForModal.id === updated.id) {
        setSelectedEventForModal((prev) => (prev ? { ...prev, status: 'Published' } : null));
      }
      flash.success('تمت استعادة ونشر المنشور بنجاح.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشلت الاستعادة.'),
  });

  // Fetch comments for selected comments drawer
  const { data: commentsList, refetch: refetchComments, isLoading: commentsLoading } = useQuery<CommentDto[]>({
    queryKey: ['admin', 'event-comments', commentsEvent?.id],
    queryFn: () => (commentsEvent ? eventsApi.getComments(commentsEvent.id) : Promise.resolve([])),
    enabled: !!commentsEvent,
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ eventId, content }: { eventId: string; content: string }) =>
      eventsApi.addComment(eventId, { content }),
    onSuccess: () => {
      setActiveCommentText('');
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      flash.success('تم نشر تعليق الإدارة بنجاح.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل إرسال التعليق.'),
  });

  const onDelete = async (id: string, title?: string) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للمنشور؟',
      message: `«${title || 'منشور بدون عنوان'}» — سيتم حذفه ومسح كافة الوسائط والتعليقات الخاصة به نهائياً من قاعدة البيانات.`,
      confirmLabel: 'حذف نهائي فوري',
      cancelLabel: 'إلغاء التراجع',
      tone: 'danger',
    });
    if (!ok) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  // Client-side filtering & sorting
  const rawItems = data?.items || [];

  const filteredItems = useMemo(() => {
    let result = [...rawItems];

    if (locationPrivacyFilter === 'public') {
      result = result.filter((e) => e.isLocationPublic === true);
    } else if (locationPrivacyFilter === 'private') {
      result = result.filter((e) => e.isLocationPublic !== true);
    }

    if (hasGpsFilter === 'withGps') {
      result = result.filter((e) => e.latitude != null && e.longitude != null);
    } else if (hasGpsFilter === 'withoutGps') {
      result = result.filter((e) => e.latitude == null || e.longitude == null);
    }

    if (sortBy === 'popular') {
      result.sort((a, b) => b.confirmCount - a.confirmCount);
    } else if (sortBy === 'comments') {
      result.sort((a, b) => b.commentsCount - a.commentsCount);
    } else if (sortBy === 'reports') {
      result.sort((a, b) => b.reportCount - a.reportCount);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [rawItems, locationPrivacyFilter, hasGpsFilter, sortBy]);

  // Quick High-Level Statistics
  const stats = useMemo(() => {
    const total = data?.totalCount ?? rawItems.length;
    const published = rawItems.filter((e) => e.status === 'Published').length;
    const hidden = rawItems.filter((e) => e.status === 'Hidden').length;
    const withReports = rawItems.filter((e) => (e.reportCount ?? 0) > 0).length;
    const withGps = rawItems.filter((e) => e.latitude != null && e.longitude != null).length;
    const adminOnlyLocation = rawItems.filter((e) => e.isLocationPublic !== true && e.latitude != null).length;

    return { total, published, hidden, withReports, withGps, adminOnlyLocation };
  }, [data?.totalCount, rawItems]);

  return (
    <AdminShell>
      <div className="space-y-6 text-right max-w-7xl mx-auto pb-16">
        {/* ================================================================ */}
        {/* TOP GLOWING HEADER */}
        {/* ================================================================ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a1628] to-slate-900 border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.12)]">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)] shrink-0">
                <Newspaper className="w-8 h-8" strokeWidth={2.3} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    رصد حي فوري • مباشر عبر الساتلايت
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                  مركز رصد الأحداث والمنشورات المجتمعية
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  مراقبة المنشورات ومواقع الـ GPS الحية التي تم النشر منها بدقة الأمتار، فحص صور وفيديوهات الداتا
                  بدون فقدان، وتحكم فوري في الخصوصية وحجب المحتوى المخالف.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition shadow-md hover:border-cyan-400/50"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                تحديث حي
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* KPI STATS BAR */}
          {/* ================================================================ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col">
              <span className="text-[11px] font-bold text-slate-400">إجمالي المنشورات</span>
              <span className="text-xl font-black text-white mt-1">{stats.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex flex-col">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                منشور علني نشط
              </span>
              <span className="text-xl font-black text-emerald-300 mt-1">{stats.published}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-amber-500/30 flex flex-col">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                مخفي من الإدارة
              </span>
              <span className="text-xl font-black text-amber-300 mt-1">{stats.hidden}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-rose-500/40 flex flex-col">
              <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400 animate-bounce" />
                بلاغات تستوجب فحص
              </span>
              <span className="text-xl font-black text-rose-300 mt-1">{stats.withReports}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-cyan-500/30 flex flex-col">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                موثق بـ GPS دقيق
              </span>
              <span className="text-xl font-black text-cyan-200 mt-1">{stats.withGps}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-purple-500/30 flex flex-col">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-400" />
                موقع خفي (للإدارة فقط)
              </span>
              <span className="text-xl font-black text-purple-200 mt-1">{stats.adminOnlyLocation}</span>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SEARCH, STATUS TABS & FILTERS */}
        {/* ================================================================ */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="بحث بالعنوان، وصف المنشور، اسم الناشر، أو رقم الهاتف..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            {/* View Mode & Sorter */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="recent">الأحدث نشراً</option>
                <option value="popular">الأكثر تأكيداً 👍</option>
                <option value="comments">الأكثر تعليقاً 💬</option>
                <option value="reports">الأكثر بلاغات ⚠️</option>
              </select>

              <select
                value={locationPrivacyFilter}
                onChange={(e) => setLocationPrivacyFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="all">كل خصوصيات الموقع</option>
                <option value="public">موقع علني للجمهور 🌍</option>
                <option value="private">موقع خفي للإدارة 🔒</option>
              </select>

              <select
                value={hasGpsFilter}
                onChange={(e) => setHasGpsFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="all">كل الإحداثيات</option>
                <option value="withGps">يحتوي GPS حقيقي 📍</option>
                <option value="withoutGps">بدون GPS (مسار فقط)</option>
              </select>

              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'grid'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="عرض الكروت المتوهجة"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'table'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="عرض الجدول التقني"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Status Quick Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold border-t border-slate-800/80 pt-3">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setStatus('');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                status === ''
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              الكل ({data?.totalCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setStatus('Published');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                status === 'Published'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              منشور علني
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setStatus('Hidden');
              }}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                status === 'Hidden'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-950 text-amber-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              مخفي من الإدارة
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {isError && (
          <FlashBanner tone="error" title="فشل تحميل المنشورات" className="flex items-center justify-between">
            <span>{(error as Error)?.message || 'تعذر الاتصال بالخادم الرئيسي.'}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </FlashBanner>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-300">جاري جلب المنشورات وصور الداتا ومواقع GPS الحية...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-200">لا توجد منشورات مطابقة للمعايير المحددة</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              جرّب تغيير كلمات البحث، أو إلغاء فلاتر الخصوصية وحالة النشر لعرض المزيد.
            </p>
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW MODE: GLOWING CYBERPUNK CARDS GRID */}
        {/* ================================================================ */}
        {!isLoading && viewMode === 'grid' && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((event) => {
              const hasGps = event.latitude != null && event.longitude != null;
              const isPubLoc = event.isLocationPublic === true;
              const hasReports = (event.reportCount ?? 0) > 0;
              const mediaList = event.media && event.media.length > 0 ? event.media : [];
              const firstMedia = mediaList[0];
              const thumbnailSrc = firstMedia ? firstMedia.url : event.imageUrl;
              const isVid = firstMedia ? isVideoMedia(firstMedia.url, firstMedia.type) : isVideoMedia(thumbnailSrc);

              return (
                <div
                  key={event.id}
                  className={`group relative rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 border transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] ${
                    hasReports
                      ? 'border-rose-500/60 hover:border-rose-400'
                      : event.status === 'Hidden'
                        ? 'border-amber-500/50 hover:border-amber-400'
                        : 'border-slate-800/90 hover:border-cyan-500/60'
                  }`}
                >
                  {/* Top Glowing Status Line */}
                  <div
                    className={`h-1.5 w-full ${
                      hasReports
                        ? 'bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 animate-pulse'
                        : event.status === 'Hidden'
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500'
                          : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
                    }`}
                  />

                  {/* Card Header: Publisher Profile */}
                  <div className="p-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <SafeAvatar
                        src={event.userAvatarUrl}
                        name={event.userName || 'مستخدم'}
                        size={44}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/users/${event.userId}`}
                          className="font-black text-sm text-slate-100 hover:text-cyan-300 transition truncate block"
                        >
                          {event.userName || 'ناشر غير معروف'}
                        </Link>
                        {event.userPhoneNumber ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span dir="ltr" className="text-xs font-mono text-cyan-400 font-bold">
                              {event.userPhoneNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(event.userPhoneNumber!)}
                              className="text-slate-400 hover:text-white transition p-0.5"
                              title="نسخ رقم الهاتف"
                            >
                              {copiedPhone === event.userPhoneNumber ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <a
                              href={`https://wa.me/2${event.userPhoneNumber.replace(/^0+/, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 transition p-0.5"
                              title="محادثة واتساب"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                            <a
                              href={`tel:${event.userPhoneNumber}`}
                              className="text-blue-400 hover:text-blue-300 transition p-0.5"
                              title="اتصال هاتفي"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">رقم الهاتف غير مسجل</span>
                        )}
                      </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 shadow-xs ${
                          event.status === 'Published'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                            : event.status === 'Hidden'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {event.status === 'Published' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            منشور علني
                          </>
                        ) : event.status === 'Hidden' ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            مخفي
                          </>
                        ) : (
                          event.status
                        )}
                      </span>

                      {hasReports && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-500/50 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          {event.reportCount} بلاغ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Title, Category & Description */}
                  <div className="p-5 pt-3 space-y-3 flex-1 flex flex-col">
                    <div>
                      {event.categoryNameAr && (
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-800 text-cyan-300 border border-slate-700/80 mb-1.5">
                          {event.categoryNameAr}
                        </span>
                      )}
                      <h3 className="font-black text-base text-white leading-snug line-clamp-2">
                        {event.title || 'منشور بدون عنوان'}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>

                    {/* Uploaded Media Preview */}
                    {thumbnailSrc ? (
                      <div className="relative mt-2 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                        <SafeMediaThumbnail
                          src={thumbnailSrc}
                          alt={event.title || 'صورة المنشور'}
                          title={event.title || 'صورة المنشور'}
                          isVideo={isVid}
                          durationSeconds={firstMedia?.durationSeconds}
                          className="w-full h-64 sm:h-72"
                          onClick={() =>
                            setLightboxData({
                              url: resolveMediaUrl(thumbnailSrc),
                              title: event.title || 'معاينة الوسائط',
                              isVideo: isVid,
                              zoom: 1,
                              rotation: 0,
                            })
                          }
                          badgeText={
                            mediaList.length > 1 ? `+${mediaList.length - 1} وسائط إضافية` : undefined
                          }
                        />
                      </div>
                    ) : null}

                    {/* ========================================================== */}
                    {/* REAL CAPTURE LOCATION (اللوكيشن الحقيقي اللي تم النشر منه) */}
                    {/* ========================================================== */}
                    <div className="mt-auto pt-3">
                      <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate max-w-[190px]">
                              {event.locationPathAr || event.locationNameAr || 'مسار غير محدد'}
                            </span>
                          </span>

                          {/* Privacy Indicator Badge */}
                          {isPubLoc ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" />
                              علني بالبوست
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1" title="مخفي عن الجمهور للإدارة فقط">
                              <Lock className="w-2.5 h-2.5" />
                              خفي للإدارة فقط
                            </span>
                          )}
                        </div>

                        {/* Exact GPS Satellite Coordinates */}
                        {hasGps ? (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/70 text-[11px]">
                            <div className="font-mono text-cyan-300 font-bold flex items-center gap-1" dir="ltr">
                              <Compass className="w-3.5 h-3.5 text-teal-400" />
                              <span>
                                {Number(event.latitude).toFixed(5)}, {Number(event.longitude).toFixed(5)}
                              </span>
                              {event.locationAccuracyMeters != null && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  (±{Math.round(event.locationAccuracyMeters)}م)
                                </span>
                              )}
                            </div>

                            <a
                              href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-[11px] underline underline-offset-2"
                            >
                              الخريطة
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <div className="pt-1 border-t border-slate-800/70 text-[11px] text-slate-500 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-slate-600" />
                            نُشر بدون التقاط إحداثيات GPS حية (مسار إداري فقط)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Social Metrics & Timestamp */}
                  <div className="px-5 py-2.5 bg-slate-950/50 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-bold text-slate-300" title="تأكيدات المجتمع">
                        <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                        {event.confirmCount ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCommentsEvent(event)}
                        className="flex items-center gap-1 font-bold text-slate-300 hover:text-cyan-300 transition"
                        title="عرض التعليقات"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                        {event.commentsCount ?? 0}
                      </button>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {formatRelativeArabicTime(event.createdAt)}
                    </span>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800/90 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEventForModal(event)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition hover:border-cyan-400/50"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      فحص شامل
                    </button>

                    {event.status === 'Published' ? (
                      <button
                        type="button"
                        onClick={() => hideMutation.mutate(event.id)}
                        disabled={hideMutation.isPending}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/40 text-amber-300 text-xs font-bold transition"
                        title="إخفاء المنشور عن العامة"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        إخفاء
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => restoreMutation.mutate(event.id)}
                        disabled={restoreMutation.isPending}
                        className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 text-xs font-bold transition"
                        title="استعادة المنشور علناً"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        استعادة
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDelete(event.id, event.title)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center justify-center p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 transition"
                      title="حذف نهائي من قاعدة البيانات"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================================ */}
        {/* VIEW MODE: TECH TABLE */}
        {/* ================================================================ */}
        {!isLoading && viewMode === 'table' && filteredItems.length > 0 && (
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-950 text-slate-400 text-xs border-b border-slate-800">
                  <tr>
                    <th className="p-4">المنشور والمحتوى</th>
                    <th className="p-4">الناشر ورقم الهاتف</th>
                    <th className="p-4">الموقع وإحداثيات GPS الحية</th>
                    <th className="p-4">الخصوصية</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">التاريخ</th>
                    <th className="p-4 text-center">إجراءات التحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredItems.map((event) => {
                    const hasGps = event.latitude != null && event.longitude != null;
                    const mediaList = event.media && event.media.length > 0 ? event.media : [];
                    const firstMedia = mediaList[0];
                    const thumbnailSrc = firstMedia ? firstMedia.url : event.imageUrl;
                    const isVid = firstMedia ? isVideoMedia(firstMedia.url, firstMedia.type) : isVideoMedia(thumbnailSrc);

                    return (
                      <tr key={event.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {thumbnailSrc && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-800 bg-slate-950">
                                <SafeMediaThumbnail
                                  src={thumbnailSrc}
                                  alt={event.title || 'وسائط'}
                                  title={event.title || 'وسائط'}
                                  isVideo={isVid}
                                  className="w-full h-full"
                                  onClick={() =>
                                    setLightboxData({
                                      url: resolveMediaUrl(thumbnailSrc),
                                      title: event.title || 'معاينة الوسائط',
                                      isVideo: isVid,
                                      zoom: 1,
                                      rotation: 0,
                                    })
                                  }
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-white max-w-[200px] truncate">
                                {event.title || 'منشور بدون عنوان'}
                              </div>
                              <div className="text-xs text-slate-400 max-w-[200px] truncate mt-0.5">
                                {event.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <SafeAvatar
                              src={event.userAvatarUrl || event.user?.avatarUrl}
                              name={event.userName || 'مستخدم'}
                              size={34}
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/users/${event.userId}`}
                                className="font-bold text-cyan-400 hover:underline block truncate max-w-[140px]"
                              >
                                {event.userName || 'مستخدم'}
                              </Link>
                              {event.userPhoneNumber && (
                                <span dir="ltr" className="text-xs font-mono text-slate-400 block mt-0.5">
                                  {event.userPhoneNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs font-bold text-slate-300">
                            {event.locationPathAr || event.locationNameAr || '—'}
                          </div>
                          {hasGps ? (
                            <a
                              href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-cyan-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                              dir="ltr"
                            >
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              {Number(event.latitude).toFixed(4)}, {Number(event.longitude).toFixed(4)}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500">بدون إحداثيات</span>
                          )}
                        </td>
                        <td className="p-4">
                          {event.isLocationPublic ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                              علني
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950 text-purple-300 border border-purple-500/30">
                              خفي للإدارة
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              event.status === 'Published'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                          {formatArabicDate(event.createdAt)}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedEventForModal(event)}
                              className="p-1.5 rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-700 transition"
                              title="فحص شامل"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {event.status === 'Published' ? (
                              <button
                                type="button"
                                onClick={() => hideMutation.mutate(event.id)}
                                className="p-1.5 rounded-lg bg-amber-950 text-amber-300 hover:bg-amber-900 transition"
                                title="إخفاء"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => restoreMutation.mutate(event.id)}
                                className="p-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 transition"
                                title="استعادة"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDelete(event.id, event.title)}
                              className="p-1.5 rounded-lg bg-rose-950 text-rose-300 hover:bg-rose-900 transition"
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* PAGINATION */}
        {/* ================================================================ */}
        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
              الصفحة السابقة
            </button>
            <span className="text-cyan-400 font-black">
              صفحة {page} من {data?.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= (data?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              الصفحة التالية
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* MODAL 1: FULL EVENT INSPECTION DOSSIER (فحص شامل للمنشور) */}
        {/* ================================================================ */}
        {selectedEventForModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden text-right my-8 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">ملف فحص المنشور والتحقق الأمني</h2>
                    <p className="text-xs text-slate-400">معرّف الحدث: {selectedEventForModal.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventForModal(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Publisher Dossier */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SafeAvatar
                      src={selectedEventForModal.userAvatarUrl}
                      name={selectedEventForModal.userName || 'مستخدم'}
                      size={52}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${selectedEventForModal.userId}`}
                          className="font-black text-base text-white hover:text-cyan-300 transition"
                        >
                          {selectedEventForModal.userName || 'مستخدم غير معروف'}
                        </Link>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          معتمد
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        كود الناشر: <span className="font-mono text-slate-300">{selectedEventForModal.userId}</span>
                      </p>
                    </div>
                  </div>

                  {selectedEventForModal.userPhoneNumber && (
                    <div className="flex items-center gap-2">
                      <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-sm font-bold" dir="ltr">
                        {selectedEventForModal.userPhoneNumber}
                      </div>
                      <a
                        href={`https://wa.me/2${selectedEventForModal.userPhoneNumber.replace(/^0+/, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition"
                        title="واتساب مباشر"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${selectedEventForModal.userPhoneNumber}`}
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Content & Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">محتوى المنشور والوصف</span>
                    {selectedEventForModal.categoryNameAr && (
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700">
                        {selectedEventForModal.categoryNameAr}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white">{selectedEventForModal.title}</h3>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedEventForModal.description}
                  </div>
                </div>

                {/* Media Files Slider / Grid */}
                {selectedEventForModal.media && selectedEventForModal.media.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400">
                      معرض الصور والفيديوهات المرفوعة ({selectedEventForModal.media.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedEventForModal.media.map((item, idx) => {
                        const isVid = isVideoMedia(item.url, item.type);
                        return (
                          <SafeMediaThumbnail
                            key={item.id || idx}
                            src={item.url}
                            alt={`ملف ${idx + 1}`}
                            title={`ملف ${idx + 1}`}
                            isVideo={isVid}
                            durationSeconds={item.durationSeconds}
                            className="w-full h-36 sm:h-40"
                            onClick={() =>
                              setLightboxData({
                                url: resolveMediaUrl(item.url),
                                title: `${selectedEventForModal.title} (ملف ${idx + 1})`,
                                isVideo: isVid,
                                zoom: 1,
                                rotation: 0,
                              })
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : selectedEventForModal.imageUrl ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400">
                      {isVideoMedia(selectedEventForModal.imageUrl) ? 'الفيديو الرئيسي المرفوع' : 'الصورة الرئيسية المرفوعة'}
                    </span>
                    <div className="w-full max-w-lg">
                      <SafeMediaThumbnail
                        src={selectedEventForModal.imageUrl}
                        alt="وسائط المنشور"
                        title={selectedEventForModal.title}
                        isVideo={isVideoMedia(selectedEventForModal.imageUrl)}
                        className="w-full h-72 sm:h-80"
                        onClick={() =>
                          setLightboxData({
                            url: resolveMediaUrl(selectedEventForModal.imageUrl!),
                            title: selectedEventForModal.title,
                            isVideo: isVideoMedia(selectedEventForModal.imageUrl),
                            zoom: 1,
                            rotation: 0,
                          })
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {/* Location & GPS Capture Details */}
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-white flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      بيانات الموقع الجغرافي الحقيقي الموثق
                    </h4>

                    {selectedEventForModal.isLocationPublic ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        الناشر اختار مشاركة موقعه علناً على الخريطة
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-950 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        موقع خفي عن العامة (مسجل للإدارة فقط لحماية الخصوصية)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 font-bold block">المسار الإداري:</span>
                      <span className="text-slate-200 font-black mt-1 block">
                        {selectedEventForModal.locationPathAr || selectedEventForModal.locationNameAr || '—'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 font-bold block">إحداثيات الالتقاط من جهاز الناشر:</span>
                      {selectedEventForModal.latitude != null && selectedEventForModal.longitude != null ? (
                        <div className="flex items-center justify-between mt-1">
                          <span dir="ltr" className="text-cyan-300 font-mono font-black">
                            {selectedEventForModal.latitude}, {selectedEventForModal.longitude}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${selectedEventForModal.latitude},${selectedEventForModal.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 underline"
                          >
                            فتح بالخرائط
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-bold mt-1 block">لم يُرسل GPS حقيقي</span>
                      )}
                    </div>
                  </div>

                  {/* Embedded Map if coordinates exist */}
                  {selectedEventForModal.latitude != null && selectedEventForModal.longitude != null && (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 h-64 w-full">
                      <iframe
                        title="خريطة الموقع الدقيق"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedEventForModal.longitude) - 0.02}%2C${Number(selectedEventForModal.latitude) - 0.02}%2C${Number(selectedEventForModal.longitude) + 0.02}%2C${Number(selectedEventForModal.latitude) + 0.02}&layer=mapnik&marker=${selectedEventForModal.latitude}%2C${selectedEventForModal.longitude}`}
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                <Link
                  href={`/admin/events/${selectedEventForModal.id}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  الصفحة المنفردة للحدث
                </Link>

                <div className="flex items-center gap-2">
                  {selectedEventForModal.status === 'Published' ? (
                    <button
                      type="button"
                      onClick={() => hideMutation.mutate(selectedEventForModal.id)}
                      disabled={hideMutation.isPending}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      إخفاء المنشور
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => restoreMutation.mutate(selectedEventForModal.id)}
                      disabled={restoreMutation.isPending}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      استعادة ونشر
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(selectedEventForModal.id, selectedEventForModal.title)}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف نهائي
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* MODAL 2: COMMENTS DRAWER & MODERATION (التعليقات) */}
        {/* ================================================================ */}
        {commentsEvent && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] text-right overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black text-white text-base">
                    تعليقات المجتمع: «{commentsEvent.title || 'منشور'}»
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsEvent(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Comments List */}
              <div className="p-5 space-y-3 overflow-y-auto flex-1">
                {commentsLoading ? (
                  <div className="py-12 text-center text-slate-400 text-sm">جاري جلب التعليقات...</div>
                ) : (commentsList?.length ?? 0) === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    لا توجد تعليقات على هذا المنشور حتى الآن.
                  </div>
                ) : (
                  commentsList?.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-cyan-400">{c.authorName || 'مستخدم'}</span>
                          {c.isAdminAuthor && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-950 text-red-300 border border-red-500/40">
                              إدارة
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">{formatRelativeArabicTime(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Admin Comment */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  value={activeCommentText}
                  onChange={(e) => setActiveCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && activeCommentText.trim()) {
                      addCommentMutation.mutate({ eventId: commentsEvent.id, content: activeCommentText.trim() });
                    }
                  }}
                  placeholder="اكتب رد أو تعقيب إداري رسمي هنا..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
                <button
                  type="button"
                  disabled={!activeCommentText.trim() || addCommentMutation.isPending}
                  onClick={() =>
                    addCommentMutation.mutate({ eventId: commentsEvent.id, content: activeCommentText.trim() })
                  }
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 text-xs font-black transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  إرسال
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* MODAL 3: INTERACTIVE LIGHTBOX STUDIO (معاينة الصور المكبرة) */}
        {/* ================================================================ */}
        {lightboxData && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none">
            {/* Top Toolbar */}
            <div className="w-full max-w-5xl flex items-center justify-between py-2 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-cyan-300 truncate max-w-md">
                  {lightboxData.title}
                </span>
                <span className="text-xs text-slate-400">
                  ({Math.round(lightboxData.zoom * 100)}% زووم)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) => (prev ? { ...prev, zoom: Math.min(3, prev.zoom + 0.25) } : null))
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) => (prev ? { ...prev, zoom: Math.max(0.5, prev.zoom - 0.25) } : null))
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) =>
                      prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null
                    )
                  }
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="تدوير 90 درجة"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxData((prev) => (prev ? { ...prev, zoom: 1, rotation: 0 } : null))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  title="إعادة الضبط"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxData((prev) => (prev ? { ...prev, isVideo: !prev.isVideo } : null))
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-1 border border-slate-700"
                  title="التبديل بين وضع الفيديو والصورة"
                >
                  {lightboxData.isVideo ? <FileText className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{lightboxData.isVideo ? 'وضع الصورة' : 'وضع الفيديو'}</span>
                </button>
                <a
                  href={lightboxData.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                  title="تنزيل الملف الأصلي"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxData(null)}
                  className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold ml-2"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 w-full max-w-5xl flex items-center justify-center p-4 overflow-hidden">
              {lightboxData.isVideo ? (
                <video
                  src={lightboxData.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl border border-slate-800"
                />
              ) : (
                <div className="relative overflow-auto max-h-[80vh] flex items-center justify-center">
                  <img
                    src={lightboxData.url}
                    alt={lightboxData.title}
                    onError={() => {
                      setLightboxData((prev) => (prev ? { ...prev, isVideo: true } : null));
                    }}
                    style={{
                      transform: `scale(${lightboxData.zoom}) rotate(${lightboxData.rotation}deg)`,
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Bottom Info Bar */}
            <div className="text-xs text-slate-400 py-2 border-t border-slate-800/80 w-full max-w-5xl flex items-center justify-between">
              <span>استخدم أزرار التحكم بالأعلى للتكبير والتدوير أو تنزيل المستند الأصلي بدقة كاملة.</span>
              <a
                href={lightboxData.url}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
              >
                فتح الرابط المباشر
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
