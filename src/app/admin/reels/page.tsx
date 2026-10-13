'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialAdminApi } from '@/api/socialAdmin';
import { AdminReelFilter, ReelDto, ReelStatus } from '@/types/social';
import { AdminShell } from '@/components/admin/AdminShell';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { ReelPreviewModal } from '@/components/social/ReelPreviewModal';
import { ReelCardMedia } from '@/components/social/ReelCardMedia';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatRelativeArabicTime, reelPublishedAt } from '@/lib/utils';
import { signalRService, SignalRConnectionStatus } from '@/lib/signalr';
import {
  Film,
  CheckCircle2,
  FileEdit,
  EyeOff,
  Trash2,
  Flag,
  Eye,
  Heart,
  Share2,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  CalendarDays,
  Layers,
  AlertTriangle,
  Radio,
  Music2,
  Copy,
  Check,
  RefreshCw,
  Clock,
  MapPin,
  Tag,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  Play,
} from 'lucide-react';

export default function AdminReelsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-[#8A9AAB]">جاري التحميل...</div>}>
      <AdminReelsContent />
    </React.Suspense>
  );
}

function AdminReelsContent() {
  const queryClient = useQueryClient();
  const flash = useFlash();

  // Filters State
  const [filter, setFilter] = useState<AdminReelFilter>({
    page: 1,
    pageSize: 16,
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    isReported: false,
  });

  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'reactions' | 'comments' | 'reports'>('newest');
  const [selectedReel, setSelectedReel] = useState<ReelDto | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});

  // Real-time SignalR State
  const [signalRStatus, setSignalRStatus] = useState<SignalRConnectionStatus>('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Queries
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin', 'reel-stats'],
    queryFn: () => socialAdminApi.getReelStats(),
  });

  const {
    data: pagedReels,
    isLoading: isReelsLoading,
    isError: isReelsError,
    error: reelsError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'reels', filter],
    queryFn: () => socialAdminApi.getReels(filter),
  });

  // Real-time synchronization via SignalR
  useEffect(() => {
    signalRService.start();

    const unsubStatus = signalRService.onStatusChange((status) => {
      setSignalRStatus(status);
    });

    const refreshLive = () => {
      setIsSyncing(true);
      setLastSyncedAt(new Date());
      refetch().finally(() => setIsSyncing(false));
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reel-stats'] });
    };

    const unsubs = [
      unsubStatus,
      signalRService.onReelPublished(() => {
        refreshLive();
        flash.success('🎬 تم نشر مقطع ريلز جديد في الوقت الفعلي!');
      }),
      signalRService.onReelHidden(() => {
        refreshLive();
        flash.info('تم إخفاء مقطع ريلز في الوقت الفعلي.');
      }),
      signalRService.onReelRestored(() => {
        refreshLive();
        flash.success('تمت استعادة مقطع ريلز في الوقت الفعلي.');
      }),
      signalRService.onReelDeleted(() => {
        refreshLive();
        flash.info('تم حذف مقطع ريلز في الوقت الفعلي.');
      }),
      signalRService.onReelReactionUpdated(() => {
        refreshLive();
      }),
      signalRService.onReelCommentAdded(() => {
        refreshLive();
      }),
      signalRService.onNewReelReport((msg) => {
        refreshLive();
        flash.warn(`🚨 بلاغ جديد على مقطع ريلز: ${msg.reason || 'مخالفة معايير'}`);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, flash, refetch, refetchStats]);

  // Mutations
  const hideMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.hideReel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      refetchStats();
      flash.success('تم حجب المقطع بنجاح.');
    },
    onError: () => flash.error('فشل حجب المقطع.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.restoreReel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      refetchStats();
      flash.success('تمت استعادة المقطع بنجاح.');
    },
    onError: () => flash.error('فشلت استعادة المقطع.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.deleteReel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      refetchStats();
      flash.success('تم حذف المقطع نهائياً.');
    },
    onError: () => flash.error('فشل حذف المقطع.'),
  });

  const handleDelete = async (reel: ReelDto) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للريلز؟',
      message: `«${(reel.caption || 'مقطع ريلز').slice(0, 40)}» — سيتم حذف المقطع نهائياً من قاعدة البيانات ومساحة التخزين السحابي.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(reel.id);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([refetch(), refetchStats()]);
      setLastSyncedAt(new Date());
      flash.success('تمت المزامنة الفورية وتحديث البيانات.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    flash.success('تم نسخ معرف الريلز.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleCaption = (id: string) => {
    setExpandedCaptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fmt = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('ar-EG');

  const handleOpenPreview = (reel: ReelDto) => {
    setSelectedReel(reel);
    setIsPreviewOpen(true);
  };

  // Sort items locally if needed
  const sortedReels = useMemo(() => {
    if (!pagedReels?.items) return [];
    const list = [...pagedReels.items];
    switch (sortBy) {
      case 'views':
        return list.sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0));
      case 'reactions':
        return list.sort((a, b) => (b.reactionsCount ?? 0) - (a.reactionsCount ?? 0));
      case 'comments':
        return list.sort((a, b) => (b.commentsCount ?? 0) - (a.commentsCount ?? 0));
      case 'reports':
        return list.sort((a, b) => (b.reportsCount ?? 0) - (a.reportsCount ?? 0));
      case 'newest':
      default:
        return list;
    }
  }, [pagedReels?.items, sortBy]);

  const totalPages = Math.ceil((pagedReels?.totalCount || 0) / (filter.pageSize || 16));

  return (
    <AdminShell>
      <div className="social-stage text-right" dir="rtl">
        {/* ========================================================
            1. HERO HEADER WITH LIVE SIGNALR BADGE & ACTIONS
            ======================================================== */}
        <div className="social-hero" data-tone="reels">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0E1A29] to-[#1F6B7A]/60 border border-[#C4A35A]/50 grid place-items-center shadow-[0_0_25px_rgba(196,163,90,0.4)]">
                <Film className="w-7 h-7 text-[#F5E6B8]" strokeWidth={2.4} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    إدارة مقاطع الريلز
                  </h1>
                  <span className="social-hero-badge">
                    <Sparkles className="w-3.5 h-3.5 text-[#C4A35A]" />
                    استوديو المراقبة المتوهج
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/70 mt-1 font-semibold">
                  بث فوري · كروت مضيئة · إحصائيات متكاملة وتغطية مباشرة للأحداث
                </p>
              </div>
            </div>

            {/* Live Real-Time SignalR Indicator & Sync Button */}
            <div className="flex items-center flex-wrap gap-2.5">
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold backdrop-blur-md transition-all ${
                  signalRStatus === 'connected'
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : signalRStatus === 'connecting' || signalRStatus === 'reconnecting'
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                      : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                }`}
                title={`حالة الاتصال: ${signalRStatus}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    signalRStatus === 'connected'
                      ? 'bg-emerald-400 radar-pulse'
                      : signalRStatus === 'connecting' || signalRStatus === 'reconnecting'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-rose-400'
                  }`}
                />
                <span>
                  {signalRStatus === 'connected'
                    ? 'بث حي متصل (SignalR 🟢)'
                    : signalRStatus === 'connecting' || signalRStatus === 'reconnecting'
                      ? 'جاري ربط البث الحي…'
                      : 'البث الحي غير متصل'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="h-9 px-3 gap-1.5 !bg-white/10 !text-white !border-white/20 hover:!bg-[#C4A35A] hover:!text-[#0F1B2D] hover:!border-[#C4A35A] transition-all shadow-[0_0_15px_rgba(255,255,255,0.08)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold">مزامنة فورية</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. EPIC GLOWING KPI STATS CARDS
            ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-4">
          {[
            {
              label: 'إجمالي الريلز',
              value: stats?.totalReels ?? 0,
              icon: Film,
              glowClass: 'glow-cyan',
              iconColor: 'text-cyan-400',
              badge: 'كافة الحالات',
            },
            {
              label: 'المنشورة للعامة',
              value: stats?.publishedCount ?? 0,
              icon: CheckCircle2,
              glowClass: 'glow-emerald',
              iconColor: 'text-emerald-400',
              badge: 'نشط',
            },
            {
              label: 'إجمالي المشاهدات',
              value: stats?.totalViews ?? 0,
              icon: Eye,
              glowClass: 'glow-gold',
              iconColor: 'text-[#E6D19A]',
              badge: 'مشاهدة',
            },
            {
              label: 'إجمالي التفاعلات',
              value: (stats?.totalLikes ?? 0) + (stats?.totalShares ?? 0),
              icon: Heart,
              glowClass: 'glow-pink',
              iconColor: 'text-pink-400',
              badge: 'إعجاب ومشاركة',
            },
            {
              label: 'المحجوبة والمسودات',
              value: (stats?.hiddenCount ?? 0) + (stats?.draftCount ?? 0),
              icon: EyeOff,
              glowClass: 'glow-amber',
              iconColor: 'text-amber-400',
              badge: 'غير معروض',
            },
            {
              label: 'البلاغات النشطة',
              value: stats?.reportedCount ?? 0,
              icon: AlertTriangle,
              glowClass: 'glow-ruby',
              iconColor: 'text-rose-400',
              badge: 'تتطلب مراجعة',
            },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`kpi-card-epic ${kpi.glowClass} flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/60">{kpi.label}</span>
                  <span className={`p-1.5 rounded-xl bg-white/5 border border-white/10 ${kpi.iconColor}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                  </span>
                </div>
                <div className="my-2">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isStatsLoading ? '…' : fmt(kpi.value)}
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-white/40 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  {kpi.badge}
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================
            3. ADVANCED SEARCH & FILTER COMMAND BAR
            ======================================================== */}
        <div className="social-filter space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="social-filter-title">
              <span className="ico-wrap">
                <Filter className="w-4 h-4 text-[#C4A35A]" />
              </span>
              تصفية وتحكم متقدم في المحتوى
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50 font-bold hidden sm:inline">
                آخر مزامنة: {lastSyncedAt.toLocaleTimeString('ar-EG')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 !text-[#E6D19A] hover:!bg-white/10"
                onClick={() => {
                  setFilter({
                    page: 1,
                    pageSize: 16,
                    status: '',
                    search: '',
                    dateFrom: '',
                    dateTo: '',
                    isReported: false,
                  });
                  setSortBy('newest');
                }}
              >
                <RotateCcw className="w-3 h-3 ml-1" />
                إعادة ضبط الفلاتر
              </Button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="social-field">
            <span className="social-field-label">
              <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
              حالة عرض المقطع
            </span>
            <div className="social-status-chips">
              {[
                { value: '', label: 'كافة الريلز', tone: undefined as string | undefined, icon: Layers },
                { value: 'Published', label: 'المنشورة', tone: 'ok', icon: CheckCircle2 },
                { value: 'Draft', label: 'مسودات', tone: 'mute', icon: FileEdit },
                { value: 'Hidden', label: 'المحجوبة', tone: 'warn', icon: EyeOff },
                { value: 'Deleted', label: 'المحذوفة', tone: 'danger', icon: Trash2 },
              ].map((chip) => {
                const Icon = chip.icon;
                const active = (filter.status || '') === chip.value;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    className="social-chip"
                    data-active={active ? 'true' : 'false'}
                    data-tone={chip.tone}
                    onClick={() => setFilter((f) => ({ ...f, status: chip.value as any, page: 1 }))}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search, Sort, and Date Range Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="social-field sm:col-span-2">
              <span className="social-field-label">
                <Search className="w-3.5 h-3.5 text-[#C4A35A]" />
                بحث سريع وفوري
              </span>
              <div className="social-search">
                <Search className="w-4 h-4 search-ico text-white/40" />
                <input
                  type="text"
                  placeholder="ابحث بالوصف · اسم الناشر · معرف الريلز GUID..."
                  value={filter.search}
                  onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
                />
                {filter.search && (
                  <button
                    type="button"
                    onClick={() => setFilter((f) => ({ ...f, search: '', page: 1 }))}
                    className="text-xs text-white/50 hover:text-white px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="social-field">
              <span className="social-field-label">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#38bdf8]" />
                ترتيب حسب
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-[#0e1724] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#C4A35A] transition-colors"
              >
                <option value="newest">🕒 الأحدث تاريخاً</option>
                <option value="views">👁️ الأكثر مشاهدة</option>
                <option value="reactions">❤️ الأكثر تفاعلاً (إعجابات)</option>
                <option value="comments">💬 الأكثر تعليقاً</option>
                <option value="reports">🚨 الأكثر بلاغات</option>
              </select>
            </div>

            {/* Reported Only Toggle */}
            <div className="social-field flex items-end">
              <label
                className="social-toggle-report w-full h-10 flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-rose-500/30 px-3 font-bold text-xs"
                data-on={filter.isReported ? 'true' : 'false'}
              >
                <input
                  type="checkbox"
                  checked={filter.isReported}
                  onChange={(e) => setFilter((f) => ({ ...f, isReported: e.target.checked, page: 1 }))}
                  className="hidden"
                />
                <ShieldAlert className={`w-4 h-4 ${filter.isReported ? 'text-rose-400' : 'text-white/40'}`} />
                <span className={filter.isReported ? 'text-rose-300' : 'text-white/70'}>
                  المبلغ عنها فقط 🚨
                </span>
              </label>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/5">
            <div className="social-field">
              <span className="social-field-label">
                <CalendarDays className="w-3.5 h-3.5 text-white/60" />
                من تاريخ
              </span>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              />
            </div>

            <div className="social-field">
              <span className="social-field-label">
                <CalendarDays className="w-3.5 h-3.5 text-white/60" />
                إلى تاريخ
              </span>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            4. EPIC GLOWING REELS GRID
            ======================================================== */}
        {isReelsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="reel-card-epic p-4 space-y-4 animate-pulse">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <div className="flex items-center gap-2">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : isReelsError ? (
          <div className="social-empty mt-6">
            <div className="ico" style={{ background: 'linear-gradient(145deg,#b45309,#7f1d1d)' }}>
              <AlertTriangle className="w-7 h-7 text-amber-300" />
            </div>
            <p className="font-bold text-white">تعذر تحميل مقاطع الريلز من الخادم.</p>
            <p className="text-xs text-white/55 mt-1 font-semibold">
              {(reelsError as Error)?.message || 'يرجى التحقق من اتصال الشبكة وإعادة المحاولة.'}
            </p>
            <Button variant="gold" size="sm" className="mt-3" onClick={() => refetch()}>
              إعادة المحاولة الآن
            </Button>
          </div>
        ) : sortedReels.length === 0 ? (
          <div className="social-empty mt-6">
            <div className="ico">
              <Film className="w-7 h-7 text-[#C4A35A]" />
            </div>
            <p className="font-bold text-white">لا توجد مقاطع ريلز مطابقة لمعايير البحث الحالية.</p>
            <p className="text-xs text-white/50 mt-1">جرّب تغيير فلاتر الحالة أو مسح نص البحث.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {sortedReels.map((reel) => {
              const isCaptionExpanded = !!expandedCaptions[reel.id];
              const isReported = (reel.reportsCount ?? 0) > 0;
              const hasMusic = !!(reel.music || reel.musicTitle);

              return (
                <article
                  key={reel.id}
                  className="reel-card-epic group"
                  data-status={reel.status}
                  data-reported={isReported ? 'true' : 'false'}
                >
                  {/* Visual Video Preview Container with Instant Frame Rendering */}
                  <div className="relative">
                    <ReelCardMedia
                      mediaUrl={reel.mediaUrl}
                      posterUrl={reel.thumbnailUrl}
                      durationSeconds={reel.durationSeconds || reel.music?.durationSeconds}
                      onOpen={() => handleOpenPreview(reel)}
                    />

                    {/* Floating Status Badge Top Left */}
                    <div className="absolute top-3 left-3 z-[6] flex items-center gap-1.5 pointer-events-none">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border shadow-md flex items-center gap-1 ${
                          reel.status === 'Published'
                            ? 'bg-emerald-500/80 border-emerald-300/40 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                            : reel.status === 'Hidden'
                              ? 'bg-amber-500/80 border-amber-300/40 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                              : reel.status === 'Draft'
                                ? 'bg-slate-600/80 border-slate-300/40 text-white'
                                : 'bg-rose-600/80 border-rose-300/40 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {reel.status === 'Published'
                          ? 'منشور'
                          : reel.status === 'Draft'
                            ? 'مسودة'
                            : reel.status === 'Hidden'
                              ? 'محجوب'
                              : 'محذوف'}
                      </span>
                    </div>

                    {/* Floating Report Warning Badge if Flagged */}
                    {isReported && (
                      <div className="absolute top-3 right-3 z-[6] flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600/90 border border-rose-400/60 text-white text-[10px] font-black shadow-[0_0_16px_rgba(239,68,68,0.6)] animate-pulse pointer-events-none">
                        <Flag className="w-3 h-3 fill-white" />
                        <span>{reel.reportsCount} بلاغ</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body & Rich Metadata Information */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5 bg-gradient-to-b from-[#111B29] to-[#0A1017]">
                    {/* 1. Author Profile & Timestamp */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <UserAvatarWithStory
                          name={reel.authorName}
                          avatarUrl={reel.authorAvatar}
                          verificationBadge={reel.authorVerificationBadge}
                          size="sm"
                          showName
                        />
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/50 font-bold">
                          <Clock className="w-3 h-3 text-white/40" />
                          <span title={reelPublishedAt(reel)}>
                            {formatRelativeArabicTime(reelPublishedAt(reel))}
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Copy Reel ID Badge */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(reel.id, e)}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono text-white/60 hover:text-white flex items-center gap-1 transition-all"
                        title="انقر لنسخ المعرف"
                      >
                        {copiedId === reel.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-emerald-300 font-bold">تم!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>#{reel.id.slice(0, 6)}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 2. Caption Text with Hashtags & Read More */}
                    <div className="space-y-1">
                      <p
                        className={`text-xs text-white/90 leading-relaxed font-medium transition-all ${
                          isCaptionExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {reel.caption ? (
                          reel.caption.split(' ').map((word, idx) => {
                            if (word.startsWith('#')) {
                              return (
                                <span key={idx} className="text-[#38bdf8] font-bold ml-1">
                                  {word}{' '}
                                </span>
                              );
                            }
                            return word + ' ';
                          })
                        ) : (
                          <span className="text-white/40 italic">بدون وصف نصي</span>
                        )}
                      </p>
                      {reel.caption && reel.caption.length > 70 && (
                        <button
                          type="button"
                          onClick={() => toggleCaption(reel.id)}
                          className="text-[10px] font-bold text-[#E6D19A] hover:underline"
                        >
                          {isCaptionExpanded ? 'عرض أقل' : 'المزيد…'}
                        </button>
                      )}
                    </div>

                    {/* 3. Attached Music Track Pill with Equalizer Animation */}
                    {hasMusic && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-transparent border border-sky-400/25 text-[11px] font-bold text-sky-200">
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                          <span className="equalizer-bar" />
                        </div>
                        <Music2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                        <span className="truncate">
                          {reel.music?.title || reel.musicTitle || 'موسيقى مرفقة'}
                          {(reel.music?.artistName || reel.musicArtist) && (
                            <span className="text-white/50 text-[10px] mr-1">
                              · {reel.music?.artistName || reel.musicArtist}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* 4. Context Metadata (Location, Category, Event) */}
                    {(reel.locationName || reel.categoryName || reel.eventTitle) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-white/60">
                        {reel.locationName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            <MapPin className="w-2.5 h-2.5 text-[#C4A35A]" />
                            {reel.locationName}
                          </span>
                        )}
                        {reel.categoryName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            <Tag className="w-2.5 h-2.5 text-teal-400" />
                            {reel.categoryName}
                          </span>
                        )}
                        {reel.eventTitle && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-pink-300">
                            🎪 {reel.eventTitle}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 5. Rich Engagement Metrics Grid (5 stats) */}
                    <div className="grid grid-cols-5 gap-1 py-2 px-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                      <div className="space-y-0.5" title="المشاهدات">
                        <div className="flex items-center justify-center text-cyan-400">
                          <Eye className="w-3 h-3" />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-white/90">
                          {fmt(reel.viewsCount)}
                        </div>
                        <div className="text-[8px] text-white/40">مشاهدة</div>
                      </div>

                      <div className="space-y-0.5" title="الإعجابات">
                        <div className="flex items-center justify-center text-pink-400">
                          <Heart className="w-3 h-3" />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-white/90">
                          {fmt(reel.reactionsCount)}
                        </div>
                        <div className="text-[8px] text-white/40">إعجاب</div>
                      </div>

                      <div className="space-y-0.5" title="التعليقات">
                        <div className="flex items-center justify-center text-amber-300">
                          <MessageCircle className="w-3 h-3" />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-white/90">
                          {fmt(reel.commentsCount)}
                        </div>
                        <div className="text-[8px] text-white/40">تعليق</div>
                      </div>

                      <div className="space-y-0.5" title="المشاركات">
                        <div className="flex items-center justify-center text-[#C4A35A]">
                          <Share2 className="w-3 h-3" />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-white/90">
                          {fmt(reel.sharesCount)}
                        </div>
                        <div className="text-[8px] text-white/40">مشاركة</div>
                      </div>

                      <div className="space-y-0.5" title="البلاغات">
                        <div className="flex items-center justify-center text-rose-400">
                          <Flag className="w-3 h-3" />
                        </div>
                        <div
                          className={`text-[10px] font-mono font-bold ${
                            isReported ? 'text-rose-400 font-black' : 'text-white/90'
                          }`}
                        >
                          {fmt(reel.reportsCount)}
                        </div>
                        <div className="text-[8px] text-white/40">بلاغ</div>
                      </div>
                    </div>

                    {/* 6. Card Action Buttons Toolbar */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
                      <Button
                        variant="gold"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1 font-bold shadow-[0_0_15px_rgba(196,163,90,0.3)] hover:scale-105 transition-all"
                        onClick={() => handleOpenPreview(reel)}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        معاينة
                      </Button>

                      <div className="flex items-center gap-1">
                        {reel.status === 'Published' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs !bg-amber-500/15 !text-amber-300 !border-amber-400/30 hover:!bg-amber-500 hover:!text-black"
                            onClick={() => hideMutation.mutate(reel.id)}
                            title="حجب المقطع"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {(reel.status === 'Hidden' || reel.status === 'Deleted') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs !bg-emerald-500/15 !text-emerald-300 !border-emerald-400/30 hover:!bg-emerald-500 hover:!text-white"
                            onClick={() => restoreMutation.mutate(reel.id)}
                            title="استعادة المقطع"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="danger"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleDelete(reel)}
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ========================================================
            5. PAGINATION CONTROLS
            ======================================================== */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-xs text-[#8B9CB0] font-bold px-2 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div>
              إجمالي النتائج:{' '}
              <span className="text-white font-extrabold">{pagedReels?.totalCount || 0}</span> مقطع ريلز
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filter.page === 1}
                onClick={() => setFilter((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                className="h-8 px-2.5 gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </Button>
              <span className="px-3 py-1 rounded-lg bg-black/40 text-white font-mono">
                {filter.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filter.page === totalPages}
                onClick={() => setFilter((f) => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                className="h-8 px-2.5 gap-1"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Cinematic Reel Preview Modal */}
      <ReelPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        reel={selectedReel}
        onReelUpdated={() => {
          refetch();
          refetchStats();
        }}
      />
    </AdminShell>
  );
}
