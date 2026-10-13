'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialAdminApi } from '@/api/socialAdmin';
import { AdminStatusDetailDto, AdminStatusFilter, StatusItemStatus } from '@/types/social';
import { AdminShell } from '@/components/admin/AdminShell';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { StatusStoryViewerModal } from '@/components/social/StatusStoryViewerModal';
import { WhatsAppStoryRing } from '@/components/ui/WhatsAppStoryRing';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatArabicDate, formatRelativeArabicTime, formatRemainingTime } from '@/lib/utils';
import { signalRService, SignalRConnectionStatus } from '@/lib/signalr';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  EyeOff,
  Trash2,
  Flag,
  Eye,
  Image as ImageIcon,
  Video,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Heart,
  Play,
  Layers,
  AlertTriangle,
  MapPin,
  Music2,
  Grid,
  Users,
  ShieldAlert,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import Image from 'next/image';

type UserStatusGroup = {
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorVerificationBadge?: string | null;
  items: AdminStatusDetailDto[];
  latest: AdminStatusDetailDto;
  hasActive: boolean;
  hasUnseen: boolean;
  totalReports: number;
};

export default function AdminStatusesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-[#8A9AAB]">جاري التحميل...</div>}>
      <AdminStatusesContent />
    </React.Suspense>
  );
}

function AdminStatusesContent() {
  const queryClient = useQueryClient();
  const flash = useFlash();

  // Filters State
  const [filter, setFilter] = useState<AdminStatusFilter>({
    page: 1,
    pageSize: 16,
    status: '',
    mediaType: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    isReported: false,
  });

  const [sortBy, setSortBy] = useState<'newest' | 'views' | 'reactions' | 'reports' | 'expiringSoon'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'grouped'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Viewer Modal State
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [viewerStatuses, setViewerStatuses] = useState<AdminStatusDetailDto[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Real-time SignalR State
  const [signalRStatus, setSignalRStatus] = useState<SignalRConnectionStatus>('connecting');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Queries
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin', 'statuses', 'stats'],
    queryFn: () => socialAdminApi.getStatusStats(),
  });

  const { data: pagedStatuses, isLoading: isStatusesLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'statuses', filter],
    queryFn: () => socialAdminApi.getStatuses(filter),
  });

  // Real-time synchronization
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
    };

    const unsubs = [
      unsubStatus,
      signalRService.onStatusPublished(() => {
        refreshLive();
        flash.success('✨ تم نشر حالة / قصة جديدة في الوقت الفعلي!');
      }),
      signalRService.onStatusDeleted(() => {
        refreshLive();
        flash.info('تم حذف حالة في الوقت الفعلي.');
      }),
      signalRService.onStatusHidden(() => {
        refreshLive();
        flash.info('تم إخفاء حالة في الوقت الفعلي.');
      }),
      signalRService.onStatusRestored(() => {
        refreshLive();
        flash.success('تمت استعادة حالة في الوقت الفعلي.');
      }),
      signalRService.onNewStatusReport((msg) => {
        refreshLive();
        flash.warn(`🚨 بلاغ جديد على حالة: ${msg.reason || 'مخالفة معايير'}`);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, flash, refetch, refetchStats]);

  // Mutations
  const hideMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.hideStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      refetchStats();
      flash.success('تم حجب الحالة بنجاح.');
    },
    onError: () => flash.error('فشل حجب الحالة.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.restoreStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      refetchStats();
      flash.success('تمت استعادة الحالة بنجاح.');
    },
    onError: () => flash.error('فشلت استعادة الحالة.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.deleteStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      refetchStats();
      flash.success('تم حذف الحالة نهائياً.');
    },
    onError: () => flash.error('فشل حذف الحالة.'),
  });

  const handleDelete = async (status: AdminStatusDetailDto) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للحالة؟',
      message: `«${status.text?.slice(0, 40) || 'حالة اجتماعية'}» — سيتم حذف الحالة نهائياً من النظام ومساحة التخزين.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(status.id);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([refetch(), refetchStats()]);
      setLastSyncedAt(new Date());
      flash.success('تمت المزامنة الفورية وتحديث الحالات.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    flash.success('تم نسخ معرف الحالة.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenViewerForGroup = (group: UserStatusGroup) => {
    setViewerStatuses(group.items);
    const firstUnseenIndex = group.items.findIndex(
      (s) => s.status === 'Active' && !s.isExpired && !s.isViewedByCurrentUser
    );
    setSelectedStatusIndex(firstUnseenIndex >= 0 ? firstUnseenIndex : 0);
    setIsViewerOpen(true);
  };

  const handleOpenViewerSingle = (status: AdminStatusDetailDto) => {
    setViewerStatuses([status]);
    setSelectedStatusIndex(0);
    setIsViewerOpen(true);
  };

  const handleStatusViewed = (statusId: string) => {
    queryClient.setQueryData(['admin', 'statuses', filter], (oldData: any) => {
      if (!oldData?.items) return oldData;
      return {
        ...oldData,
        items: oldData.items.map((s: AdminStatusDetailDto) =>
          s.id === statusId ? { ...s, isViewedByCurrentUser: true } : s
        ),
      };
    });
  };

  // User Groups (for WhatsApp rail and grouped view)
  const userGroups: UserStatusGroup[] = useMemo(() => {
    const items = pagedStatuses?.items ?? [];
    const byUser = new Map<string, AdminStatusDetailDto[]>();
    for (const st of items) {
      const list = byUser.get(st.userId) || [];
      list.push(st);
      byUser.set(st.userId, list);
    }
    return Array.from(byUser.entries())
      .map(([userId, groupItems]) => {
        const sorted = [...groupItems].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const latest = sorted[sorted.length - 1];
        const hasActive = sorted.some((s) => s.status === 'Active' && !s.isExpired);
        const hasUnseen = sorted.some(
          (s) => s.status === 'Active' && !s.isExpired && !s.isViewedByCurrentUser
        );

        return {
          userId,
          authorName: latest.authorName,
          authorAvatar: latest.authorAvatar,
          authorVerificationBadge: latest.authorVerificationBadge,
          items: sorted,
          latest,
          hasActive,
          hasUnseen,
          totalReports: sorted.reduce((n, s) => n + (s.reportsCount || 0), 0),
        };
      })
      .sort((a, b) => {
        if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
        return new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime();
      });
  }, [pagedStatuses?.items]);

  // Sort items for Cards Grid view
  const sortedStatuses = useMemo(() => {
    if (!pagedStatuses?.items) return [];
    const list = [...pagedStatuses.items];
    switch (sortBy) {
      case 'views':
        return list.sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0));
      case 'reactions':
        return list.sort((a, b) => (b.reactionsCount ?? 0) - (a.reactionsCount ?? 0));
      case 'reports':
        return list.sort((a, b) => (b.reportsCount ?? 0) - (a.reportsCount ?? 0));
      case 'expiringSoon':
        return list.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
      case 'newest':
      default:
        return list;
    }
  }, [pagedStatuses?.items, sortBy]);

  const fmt = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('ar-EG');

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalPages = Math.ceil((pagedStatuses?.totalCount || 0) / (filter.pageSize || 16));

  return (
    <AdminShell>
      <div className="social-stage text-right" dir="rtl">
        {/* ========================================================
            1. HERO HEADER WITH LIVE SIGNALR BADGE & ACTIONS
            ======================================================== */}
        <div className="social-hero" data-tone="stories">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F1E19] to-[#128C7E]/70 border border-[#25D366]/40 grid place-items-center shadow-[0_0_25px_rgba(37,211,102,0.35)]">
                <Sparkles className="w-7 h-7 text-[#25D366]" strokeWidth={2.4} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    إدارة الحالات والقصص
                  </h1>
                  <span className="social-hero-badge !border-[#25D366]/40 !bg-[#128C7E]/20 !text-[#25D366]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    استوديو القصص والحالات التفاعلية
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/70 mt-1 font-semibold">
                  مراقبة الحالات المؤقتة (24 ساعة) · حلقات واتساب خضراء · تحكم سينمائي فوري
                </p>
              </div>
            </div>

            {/* Live SignalR Status & View Mode Controls */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* SignalR Badge */}
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

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'cards'
                      ? 'bg-[#128C7E] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="عرض الكروت المتوهجة"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>كروت متوهجة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'grouped'
                      ? 'bg-[#128C7E] text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="عرض مجموعات المستخدمين"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>مجموعات</span>
                </button>
              </div>

              {/* Live Sync Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="h-9 px-3 gap-1.5 !bg-white/10 !text-white !border-white/20 hover:!bg-[#25D366] hover:!text-[#075E54] hover:!border-[#25D366] transition-all shadow-[0_0_15px_rgba(255,255,255,0.08)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold">مزامنة فورية</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================
            2. EPIC GLOWING KPI STATS CARDS (7 METRICS)
            ======================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
          {[
            {
              label: 'إجمالي الحالات',
              value: stats?.totalStatuses ?? 0,
              icon: Sparkles,
              glowClass: 'glow-emerald',
              iconColor: 'text-[#25D366]',
              badge: 'كافة الحالات',
            },
            {
              label: 'نشطة حالياً',
              value: stats?.activeCount ?? 0,
              icon: CheckCircle2,
              glowClass: 'glow-emerald',
              iconColor: 'text-emerald-400',
              badge: 'خلال 24 ساعة',
            },
            {
              label: 'منتهية الصلاحية',
              value: stats?.expiredCount ?? 0,
              icon: Clock,
              glowClass: 'glow-amber',
              iconColor: 'text-amber-400',
              badge: 'أرشيف',
            },
            {
              label: 'المحجوبة',
              value: stats?.hiddenCount ?? 0,
              icon: EyeOff,
              glowClass: 'glow-gold',
              iconColor: 'text-[#E6D19A]',
              badge: 'بأمر الإدارة',
            },
            {
              label: 'المحذوفة',
              value: stats?.deletedCount ?? 0,
              icon: Trash2,
              glowClass: 'glow-ruby',
              iconColor: 'text-rose-400',
              badge: 'محذوفة',
            },
            {
              label: 'البلاغات النشطة',
              value: stats?.reportedCount ?? 0,
              icon: AlertTriangle,
              glowClass: 'glow-ruby',
              iconColor: 'text-red-400',
              badge: 'تتطلب مراجعة',
            },
            {
              label: 'المشاهدات',
              value: stats?.totalViews ?? 0,
              icon: Eye,
              glowClass: 'glow-cyan',
              iconColor: 'text-cyan-400',
              badge: 'إجمالي العرض',
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
                <div className="my-1.5">
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
            3. WHATSAPP-STYLE INTERACTIVE STORY BUBBLES RAIL
            ======================================================== */}
        {!isStatusesLoading && userGroups.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#0F1E19]/80 via-[#101924]/80 to-[#0F1E19]/80 border border-[#25D366]/20 backdrop-blur-md shadow-[0_0_25px_rgba(18,140,126,0.12)]">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                شريط قصص المستخدمين (انقر لتشغيل القصة مباشرة):
              </span>
              <span className="text-[11px] font-bold text-[#25D366]">
                {userGroups.length} ناشر نشط
              </span>
            </div>
            <div className="stories-rail !mt-0 !p-1">
              {userGroups.map((group) => (
                <div
                  key={`bubble-${group.userId}`}
                  className="wa-story-bubble group"
                  onClick={() => handleOpenViewerForGroup(group)}
                  title={`${group.authorName} · ${group.items.length} قصص`}
                >
                  <WhatsAppStoryRing
                    items={group.items}
                    size={64}
                    strokeWidth={3.5}
                    activeColor="#25D366"
                    viewedColor="#64748B"
                    className="transition-transform duration-300 group-hover:scale-110"
                  >
                    {group.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={group.authorAvatar}
                        alt={group.authorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-white font-black text-sm bg-gradient-to-tr from-[#128C7E] to-[#25D366]">
                        {group.authorName?.charAt(0) || '?'}
                      </div>
                    )}
                  </WhatsAppStoryRing>
                  <div className="wa-story-name group-hover:text-[#25D366] transition-colors">
                    {group.authorName}
                  </div>
                  <div
                    className={`text-[9px] font-black mt-0.5 ${
                      group.hasUnseen ? 'text-[#25D366]' : 'text-slate-400'
                    }`}
                  >
                    {group.items.length} {group.items.length === 1 ? 'قصة' : 'حلقات'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            4. ADVANCED SEARCH & FILTER COMMAND BAR
            ======================================================== */}
        <div className="social-filter space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="social-filter-title">
              <span className="ico-wrap">
                <Filter className="w-4 h-4 text-[#25D366]" />
              </span>
              تصفية وبحث متقدم في الحالات والقصص
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/50 font-bold hidden sm:inline">
                آخر مزامنة: {lastSyncedAt.toLocaleTimeString('ar-EG')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 !text-[#25D366] hover:!bg-white/10"
                onClick={() => {
                  setFilter({
                    page: 1,
                    pageSize: 16,
                    status: '',
                    mediaType: '',
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
              <Layers className="w-3.5 h-3.5 text-[#25D366]" />
              حالة القصة / الحالة
            </span>
            <div className="social-status-chips">
              {[
                { value: '', label: 'كافة الحالات', tone: undefined as string | undefined, icon: Layers },
                { value: 'Active', label: 'نشطة (سارية)', tone: 'ok', icon: CheckCircle2 },
                { value: 'Expired', label: 'منتهية الصلاحية', tone: 'mute', icon: Clock },
                { value: 'Hidden', label: 'محجوبة بالإدارة', tone: 'warn', icon: EyeOff },
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

          {/* Search, Media Type, Sort and Reported Toggle Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="social-field sm:col-span-2">
              <span className="social-field-label">
                <Search className="w-3.5 h-3.5 text-[#25D366]" />
                بحث سريع وفوري
              </span>
              <div className="social-search">
                <Search className="w-4 h-4 search-ico text-white/40" />
                <input
                  type="text"
                  placeholder="ابحث بالنص · اسم الناشر · معرف الحالة GUID..."
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

            {/* Media Type Selector */}
            <div className="social-field">
              <span className="social-field-label">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                نوع الوسائط
              </span>
              <select
                value={filter.mediaType}
                onChange={(e) => setFilter((f) => ({ ...f, mediaType: e.target.value as any, page: 1 }))}
                className="w-full h-10 px-3 rounded-xl bg-[#0e1724] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#25D366] transition-colors"
              >
                <option value="">كافة الوسائط (الكل)</option>
                <option value="Image">🖼️ صور فقط</option>
                <option value="Video">🎬 فيديوهات فقط</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="social-field">
              <span className="social-field-label">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#E6D19A]" />
                ترتيب حسب
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-[#0e1724] border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#25D366] transition-colors"
              >
                <option value="newest">🕒 الأحدث تاريخاً</option>
                <option value="expiringSoon">⏳ الأقرب انتهاءً</option>
                <option value="views">👁️ الأكثر مشاهدة</option>
                <option value="reactions">❤️ الأكثر تفاعلاً</option>
                <option value="reports">🚨 الأكثر بلاغات</option>
              </select>
            </div>
          </div>

          {/* Date Range & Reported Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5">
            <div className="social-field">
              <span className="social-field-label">من تاريخ</span>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              />
            </div>

            <div className="social-field">
              <span className="social-field-label">إلى تاريخ</span>
              <input
                type="date"
                value={filter.dateTo || ''}
                onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
              />
            </div>

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
        </div>

        {/* ========================================================
            5. MAIN CONTENT: CARDS GRID VIEW OR GROUPED VIEW
            ======================================================== */}
        {isStatusesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="status-card-epic p-4 space-y-4 animate-pulse">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <div className="flex items-center gap-2">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="social-empty mt-6">
            <div className="ico" style={{ background: 'linear-gradient(145deg,#b45309,#7f1d1d)' }}>
              <AlertTriangle className="w-7 h-7 text-amber-300" />
            </div>
            <p className="font-bold text-white">تعذر تحميل الحالات والقصص من الخادم.</p>
            <p className="text-xs text-white/55 mt-1 font-semibold">
              {(error as Error)?.message || 'يرجى التحقق من الاتصال وإعادة المحاولة.'}
            </p>
            <Button variant="gold" size="sm" className="mt-3" onClick={() => refetch()}>
              إعادة المحاولة الآن
            </Button>
          </div>
        ) : sortedStatuses.length === 0 ? (
          <div className="social-empty mt-6">
            <div className="ico" style={{ background: 'linear-gradient(145deg,#25d366,#128c7e)' }}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <p className="font-bold text-white">لا توجد حالات مسجلة تطابق معايير البحث الحالية.</p>
            <p className="text-xs text-white/50 mt-1">جرّب مسح نص البحث أو تغيير فلتر الحالة ونوع الوسائط.</p>
          </div>
        ) : viewMode === 'cards' ? (
          /* ========================================================
             A. ICONIC GLOWING CARDS GRID VIEW
             ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {sortedStatuses.map((st) => {
              const isVideo = st.mediaType === 'Video' || st.mediaUrl.endsWith('.mp4');
              const isReported = (st.reportsCount ?? 0) > 0;
              const remainingTime = formatRemainingTime(st.expiresAt);
              const fileSizeFormatted = formatFileSize(st.fileSizeBytes);
              const hasText = !!st.text && st.text.trim().length > 0;

              return (
                <article
                  key={st.id}
                  className="status-card-epic group"
                  data-status={st.status}
                  data-reported={isReported ? 'true' : 'false'}
                >
                  {/* Media Visual Area */}
                  <div
                    className="relative aspect-[9/13] bg-[#0A1017] cursor-pointer overflow-hidden"
                    onClick={() => handleOpenViewerSingle(st)}
                  >
                    {isVideo ? (
                      <video
                        src={`${st.mediaUrl}#t=0.1`}
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : st.mediaUrl && !st.mediaUrl.includes('00000000-0000-0000-0000-000000000000') ? (
                      <Image
                        src={st.mediaUrl}
                        alt={st.text || 'صورة القصة'}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      /* Text-only Story Background */
                      <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#128C7E] via-[#0D5C52] to-[#073832]">
                        <FileText className="w-8 h-8 text-white/60 mb-2" />
                        <p className="text-sm font-bold text-white line-clamp-5 leading-relaxed">
                          «{st.text}»
                        </p>
                      </div>
                    )}

                    {/* Gradient Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B121C] via-transparent to-black/40 pointer-events-none" />

                    {/* Floating Status Badge Top Right */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-none">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border shadow-md flex items-center gap-1 ${
                          st.status === 'Active'
                            ? 'bg-emerald-500/80 border-emerald-300/40 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : st.status === 'Hidden'
                              ? 'bg-amber-500/80 border-amber-300/40 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                              : st.status === 'Deleted'
                                ? 'bg-rose-600/80 border-rose-300/40 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                                : 'bg-slate-700/80 border-slate-400/40 text-white'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {st.status === 'Active'
                          ? 'نشطة'
                          : st.isExpired || st.status === 'Expired'
                            ? 'منتهية'
                            : st.status === 'Hidden'
                              ? 'محجوبة'
                              : 'محذوفة'}
                      </span>
                    </div>

                    {/* Floating Media Type Badge Top Left */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 pointer-events-none">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center gap-1">
                        {isVideo ? (
                          <>
                            <Video className="w-3 h-3 text-cyan-400" />
                            <span>فيديو</span>
                            {st.durationSeconds && st.durationSeconds > 0 && (
                              <span className="font-mono text-cyan-300 mr-1">
                                {st.durationSeconds}ث
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3 text-emerald-400" />
                            <span>صورة</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Floating Expiry Pill Bottom of Media */}
                    <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-between text-[10px] font-bold px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10">
                      <div className="flex items-center gap-1 text-white/90">
                        <Clock className="w-3 h-3 text-[#25D366]" />
                        <span className={st.isExpired ? 'text-amber-400' : 'text-emerald-300'}>
                          {remainingTime}
                        </span>
                      </div>
                      {fileSizeFormatted && (
                        <span className="text-white/50 font-mono text-[9px]">{fileSizeFormatted}</span>
                      )}
                    </div>

                    {/* Play/View Hover Center Overlay */}
                    <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                      <span className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white grid place-items-center shadow-[0_0_25px_rgba(37,211,102,0.6)] transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </span>
                    </div>
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5 bg-gradient-to-b from-[#111C28] to-[#0A1017]">
                    {/* 1. Author Profile & Timestamp */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <UserAvatarWithStory
                          name={st.authorName}
                          avatarUrl={st.authorAvatar}
                          verificationBadge={st.authorVerificationBadge}
                          size="sm"
                          showName
                        />
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-white/50 font-bold">
                          <span>{formatRelativeArabicTime(st.createdAt)}</span>
                          <span>·</span>
                          <span title={formatArabicDate(st.createdAt)}>
                            {new Date(st.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Copy Status ID Chip */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(st.id, e)}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono text-white/60 hover:text-white flex items-center gap-1 transition-all"
                        title="انقر لنسخ معرف الحالة"
                      >
                        {copiedId === st.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-emerald-300 font-bold">تم!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>#{st.id.slice(0, 6)}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 2. Text Content / Caption */}
                    {hasText && (
                      <p className="text-xs text-white/90 leading-relaxed font-medium line-clamp-2">
                        {st.text}
                      </p>
                    )}

                    {/* 3. Location Tag if available */}
                    {st.locationName && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-white/70 w-fit">
                        <MapPin className="w-2.5 h-2.5 text-[#25D366]" />
                        <span>{st.locationName}</span>
                      </div>
                    )}

                    {/* 4. Engagement Metrics Grid */}
                    <div className="grid grid-cols-3 gap-1.5 py-2 px-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                      <div className="space-y-0.5" title="المشاهدات">
                        <div className="flex items-center justify-center text-cyan-400">
                          <Eye className="w-3 h-3" />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-white/90">
                          {fmt(st.viewsCount)}
                        </div>
                        <div className="text-[8px] text-white/40">مشاهدة</div>
                      </div>

                      <div className="space-y-0.5" title="التفاعلات">
                        <div className="flex items-center justify-center text-pink-400">
                          <Heart className="w-3 h-3" />
                        </div>
                        <div className="text-[10px] font-mono font-bold text-white/90">
                          {fmt(st.reactionsCount)}
                        </div>
                        <div className="text-[8px] text-white/40">تفاعل</div>
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
                          {fmt(st.reportsCount)}
                        </div>
                        <div className="text-[8px] text-white/40">بلاغ</div>
                      </div>
                    </div>

                    {/* 5. Card Action Toolbar */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
                      <Button
                        variant="gold"
                        size="sm"
                        className="h-8 px-3 text-xs gap-1 font-bold !bg-gradient-to-r !from-[#128C7E] !to-[#25D366] !text-white !border-none shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:scale-105 transition-all"
                        onClick={() => handleOpenViewerSingle(st)}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        تشغيل القصة
                      </Button>

                      <div className="flex items-center gap-1">
                        {st.status === 'Active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs !bg-amber-500/15 !text-amber-300 !border-amber-400/30 hover:!bg-amber-500 hover:!text-black"
                            onClick={() => hideMutation.mutate(st.id)}
                            title="حجب الحالة"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {(st.status === 'Hidden' || st.status === 'Deleted') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs !bg-emerald-500/15 !text-emerald-300 !border-emerald-400/30 hover:!bg-emerald-500 hover:!text-white"
                            onClick={() => restoreMutation.mutate(st.id)}
                            title="استعادة الحالة"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="danger"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleDelete(st)}
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
        ) : (
          /* ========================================================
             B. GROUPED USERS LIST VIEW (WHATSAPP STORIES GROUPS)
             ======================================================== */
          <div className="stories-list space-y-3 mt-6">
            {userGroups.map((group) => {
              const st = group.latest;
              const isVideo = st.mediaType === 'Video' || st.mediaUrl.endsWith('.mp4');
              return (
                <div
                  key={group.userId}
                  className="status-card-epic p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  data-status={group.hasActive ? 'Active' : st.status}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <WhatsAppStoryRing
                      items={group.items}
                      size={58}
                      strokeWidth={3}
                      className="shrink-0"
                      onClick={() => handleOpenViewerForGroup(group)}
                    >
                      {isVideo ? (
                        <video src={st.mediaUrl} muted className="w-full h-full object-cover pointer-events-none" />
                      ) : st.mediaUrl && !st.mediaUrl.includes('00000000-0000-0000-0000-000000000000') ? (
                        <Image src={st.mediaUrl} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-white font-black text-xs bg-gradient-to-br from-[#128C7E] to-[#075E54]">
                          {group.authorName?.charAt(0) || 'ح'}
                        </div>
                      )}
                    </WhatsAppStoryRing>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <UserAvatarWithStory
                          name={group.authorName}
                          avatarUrl={group.authorAvatar}
                          verificationBadge={group.authorVerificationBadge}
                          hasStory={group.hasActive}
                          hasUnseenStory={group.hasUnseen}
                          onClickStory={() => handleOpenViewerForGroup(group)}
                          size="sm"
                          showName
                        />
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            group.hasActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : st.status === 'Hidden'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : st.status === 'Deleted'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-white/10 text-[#A8B8C8] border border-white/10'
                          }`}
                        >
                          {group.hasActive
                            ? 'نشطة حالياً'
                            : st.isExpired || st.status === 'Expired'
                              ? 'منتهية'
                              : st.status === 'Hidden'
                                ? 'محجوبة'
                                : 'محذوفة'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B9CB0] bg-white/10 px-2 py-0.5 rounded-lg">
                          {isVideo ? <Video className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                          {group.items.length > 1 ? `${group.items.length} قصص` : isVideo ? 'فيديو' : 'صورة'}
                        </span>
                      </div>
                      <p
                        className="text-xs font-bold text-[#F2F6FA] line-clamp-1 cursor-pointer hover:text-[#25d366]"
                        onClick={() => handleOpenViewerForGroup(group)}
                      >
                        {st.text || 'بدون نص'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-white/50">
                        <span>{formatArabicDate(st.createdAt)}</span>
                        <span className={st.isExpired ? 'text-amber-400' : 'text-emerald-400'}>
                          {formatRemainingTime(st.expiresAt)}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Eye className="w-3 h-3 text-cyan-400" /> {fmt(st.viewsCount)}
                        </span>
                        {group.totalReports > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-rose-400">
                            <Flag className="w-3 h-3" /> {group.totalReports} بلاغ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs gap-1 !bg-white/10 !text-white hover:!bg-[#25D366] hover:!text-black"
                      onClick={() => handleOpenViewerForGroup(group)}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      عرض القصة
                    </Button>
                    {st.status === 'Active' && (
                      <Button
                        variant="gold"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => hideMutation.mutate(st.id)}
                        title="حجب أحدث حالة"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {st.status === 'Hidden' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => restoreMutation.mutate(st.id)}
                        title="استعادة"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleDelete(st)}
                      title="حذف أحدث حالة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================
            6. PAGINATION CONTROLS
            ======================================================== */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between text-xs text-[#8B9CB0] font-bold px-3 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div>
              إجمالي النتائج:{' '}
              <span className="text-white font-extrabold">{pagedStatuses?.totalCount || 0}</span> حالة ·{' '}
              <span className="text-[#25D366] font-extrabold">{userGroups.length}</span> ناشر
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

      {/* WhatsApp-Style Full Screen Story Viewer Modal */}
      {viewerStatuses.length > 0 && (
        <StatusStoryViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          statuses={viewerStatuses}
          initialIndex={selectedStatusIndex}
          onStatusUpdated={() => {
            refetch();
            refetchStats();
          }}
          onStatusViewed={handleStatusViewed}
        />
      )}
    </AdminShell>
  );
}
