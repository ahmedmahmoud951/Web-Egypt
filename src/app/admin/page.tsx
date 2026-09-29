'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { LiveStatusBadge } from '@/components/admin/LiveStatusBadge';
import { EgyptFlagMark } from '@/components/brand/EgyptFlagMark';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/api/admin';
import { socialAdminApi } from '@/api/socialAdmin';
import { verificationAdminApi } from '@/api/verificationAdmin';
import { advertisingAdminApi } from '@/api/advertisingAdmin';
import { communityAdminApi } from '@/api/communityAdmin';
import { signalRService } from '@/lib/signalr';
import {
  EyeOff,
  Flag,
  MapPin,
  Newspaper,
  Users,
  Ban,
  MessageSquareWarning,
  Radio,
  Sparkles,
  RefreshCw,
  Film,
  BadgeCheck,
  MessageCircle,
  Megaphone,
  UserCog,
  Siren,
  Car,
  Search,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

type StatTone = 'nile' | 'gold' | 'danger' | 'ok' | 'mute';

type DashCard = {
  label: string;
  value: number | string | undefined;
  hint?: string;
  icon: LucideIcon;
  href: string;
  tone: StatTone;
  superAdminOnly?: boolean;
};

export default function AdminDashboardPage() {
  const adminReady = useAdminQueryEnabled();
  const { isSuperAdmin } = useAuth();

  const {
    data: stats,
    isLoading,
    isError,
    error,
    dataUpdatedAt,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: ({ signal }) => adminApi.getDashboardStats(signal),
    enabled: adminReady,
    staleTime: 120_000,
    retry: 0,
  });

  const { data: reelStats, isLoading: reelsLoading, refetch: refetchReels } = useQuery({
    queryKey: ['admin', 'reels', 'stats'],
    queryFn: ({ signal }) => socialAdminApi.getReelStats(signal),
    enabled: adminReady,
    staleTime: 120_000,
    retry: 0,
  });

  const { data: statusStats, isLoading: statusesLoading, refetch: refetchStatuses } = useQuery({
    queryKey: ['admin', 'statuses', 'stats'],
    queryFn: ({ signal }) => socialAdminApi.getStatusStats(signal),
    enabled: adminReady,
    staleTime: 120_000,
    retry: 0,
  });

  const { data: verifyStats, isLoading: verifyLoading, refetch: refetchVerify } = useQuery({
    queryKey: ['admin', 'verification', 'dashboard'],
    queryFn: ({ signal }) => verificationAdminApi.getDashboard(signal),
    enabled: adminReady,
    staleTime: 120_000,
    retry: 0,
  });

  const { data: adStats, isLoading: adsLoading, refetch: refetchAds } = useQuery({
    queryKey: ['admin', 'advertising', 'dashboard'],
    queryFn: () => advertisingAdminApi.getDashboardStats(),
    enabled: adminReady,
    staleTime: 120_000,
    retry: 0,
  });

  const { data: communityStats, isLoading: communityLoading, refetch: refetchCommunity } = useQuery({
    queryKey: ['admin', 'community', 'sos', 'Active'],
    queryFn: ({ signal }) => communityAdminApi.getSosAlerts(1, 1, 'Active', signal),
    enabled: adminReady,
    staleTime: 60_000,
    retry: 0,
  });

  useEffect(() => {
    signalRService.start();

    const refreshStats = () => {
      refetch();
      refetchReels();
      refetchStatuses();
      refetchVerify();
      refetchAds();
      refetchCommunity();
    };

    const unsubs = [
      signalRService.onEventCreated(refreshStats),
      signalRService.onEventUpdated(refreshStats),
      signalRService.onEventHidden(refreshStats),
      signalRService.onEventRestored(refreshStats),
      signalRService.onEventReported(refreshStats),
      signalRService.onLocationApproved(refreshStats),
      signalRService.onReelPublished(refreshStats),
      signalRService.onReelHidden(refreshStats),
      signalRService.onReelDeleted(refreshStats),
      signalRService.onStatusPublished(refreshStats),
      signalRService.onStatusDeleted(refreshStats),
      signalRService.onStatusHidden(refreshStats),
      signalRService.onNewReelReport(refreshStats),
      signalRService.onNewStatusReport(refreshStats),
      signalRService.onAdvertisingCampaignUpdated(refreshStats),
      signalRService.onAdvertisingPaymentUpdated(refreshStats),
      signalRService.onCommunitySosAlertCreated(refreshStats),
      signalRService.onCommunitySosAlertResolved(refreshStats),
      signalRService.onCommunityCarpoolRideCreated(refreshStats),
      signalRService.onCommunityLostAndFoundItemCreated(refreshStats),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [refetch, refetchReels, refetchStatuses, refetchVerify, refetchAds, refetchCommunity]);

  const anyLoading = isLoading || reelsLoading || statusesLoading || verifyLoading || adsLoading || communityLoading;

  const cards: DashCard[] = [
    {
      label: 'المجتمع والطوارئ والمفقودات',
      value: communityLoading ? '...' : (communityStats?.totalCount != null ? `${communityStats.totalCount} استغاثة نشطة` : 'مباشر'),
      hint: 'فزعة مصر · عربية رايحة · مفقودات',
      icon: Siren,
      href: '/admin/community',
      tone: 'danger',
    },
    {
      label: 'المستخدمون',
      value: stats?.usersCount,
      hint: 'كل الحسابات',
      icon: Users,
      href: '/admin/users',
      tone: 'nile',
    },
    {
      label: 'منصة الإعلانات',
      value: adStats?.activeCampaigns ?? (adsLoading ? '...' : 0),
      hint: adStats
        ? `${adStats.activeCampaigns} نشطة · ${adStats.pendingReviewCampaigns} معلقة`
        : 'حملات وترويج',
      icon: Megaphone,
      href: '/admin/advertising',
      tone: 'gold',
    },
    {
      label: 'توثيق الحسابات',
      value: verifyStats?.pendingRequests,
      hint: 'طلبات معلّقة',
      icon: BadgeCheck,
      href: '/admin/verification',
      tone: 'gold',
    },
    {
      label: 'الريلز',
      value: reelStats?.totalReels,
      hint: `${reelStats?.publishedCount ?? 0} منشور · ${reelStats?.reportedCount ?? 0} بلاغ`,
      icon: Film,
      href: '/admin/reels',
      tone: 'ok',
    },
    {
      label: 'الحالات',
      value: statusStats?.activeCount ?? statusStats?.totalStatuses,
      hint: `${statusStats?.totalStatuses ?? 0} إجمالي · ${statusStats?.reportedCount ?? 0} بلاغ`,
      icon: Sparkles,
      href: '/admin/statuses',
      tone: 'gold',
    },
    {
      label: 'مراقبة المحادثات',
      value: 'مباشر',
      hint: 'مين بيكلم مين · بدون Seen',
      icon: MessageCircle,
      href: '/admin/chat',
      tone: 'ok',
    },
    {
      label: 'المنشورات',
      value: stats?.publishedEvents,
      hint: 'منشورة الآن',
      icon: Newspaper,
      href: '/admin/events',
      tone: 'nile',
    },
    {
      label: 'منشورات اليوم',
      value: stats?.eventsToday,
      hint: 'آخر 24 ساعة',
      icon: Radio,
      href: '/admin/events',
      tone: 'mute',
    },
    {
      label: 'مركز البلاغات',
      value: stats?.reportedEvents,
      hint: 'بلاغات أحداث',
      icon: Flag,
      href: '/admin/reports',
      tone: 'danger',
    },
    {
      label: 'المواقع المعلّقة',
      value: stats?.pendingLocations,
      hint: 'بانتظار الموافقة',
      icon: MapPin,
      href: '/admin/locations',
      tone: 'gold',
    },
    {
      label: 'الحسابات الموقوفة',
      value: stats?.blockedUsers,
      hint: 'محظورة',
      icon: Ban,
      href: '/admin/blocked',
      tone: 'danger',
    },
    {
      label: 'الشكاوى',
      value: stats?.pendingComplaints,
      hint: 'معلّقة للمراجعة',
      icon: MessageSquareWarning,
      href: '/admin/complaints',
      tone: 'gold',
    },
    {
      label: 'منشورات مخفية',
      value: stats?.hiddenEvents,
      hint: 'مخفية إداريًا',
      icon: EyeOff,
      href: '/admin/reports',
      tone: 'mute',
    },
    {
      label: 'طاقم الأدمن',
      value: 'إدارة',
      hint: 'سوبر أدمن فقط',
      icon: UserCog,
      href: '/admin/staff',
      tone: 'nile',
      superAdminOnly: true,
    },
  ];

  const visibleCards = cards.filter((c) => !c.superAdminOnly || isSuperAdmin);

  const updatedLabel =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : null;

  return (
    <AdminShell>
      <div className="space-y-6 text-right max-w-6xl mx-auto">
        <div className="admin-card admin-hero p-6 md:p-8 relative overflow-hidden">
          <div className="admin-flag-stripe absolute top-0 inset-x-0" />
          <div className="admin-row justify-between pt-1">
            <div className="admin-row items-start gap-4">
              <BrandLogo size={64} priority className="rounded-2xl hidden sm:block brand-logo-ring" />
              <div className="admin-col">
                <div className="admin-row gap-2 mb-1.5">
                  <EgyptFlagMark className="w-8 h-5" />
                  <span className="text-[11px] font-extrabold text-[#5ec4d4] tracking-[0.14em] uppercase">
                    TODAY IN EGYPT
                  </span>
                </div>
                <h1 className="text-[1.75rem] md:text-[2.15rem] font-black text-[#F2F6FA] tracking-tight leading-tight">
                  لوحة القيادة
                </h1>
                <p className="text-sm text-[#8B9CB0] mt-2 max-w-lg leading-relaxed">
                  مركز تحكم غامق ومريح — كل قسم له كارت مباشر مع توهج حسب الحالة.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <LiveStatusBadge />
              {updatedLabel && (
                <span className="text-[11px] text-[#C4A35A] font-semibold inline-flex items-center gap-1">
                  <Radio className={`w-3 h-3 ${isFetching ? 'animate-pulse' : ''}`} />
                  آخر تحديث: {updatedLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {isError && (
          <FlashBanner
            tone="error"
            title="تعذر تحميل الإحصائيات"
            className="admin-row justify-between"
          >
            <span className="admin-col">
              {(error as Error)?.message || 'تأكد من نشر الـ API وتشغيل سكربتات 25–28 ثم سجّل دخولاً من جديد.'}
            </span>
            <button type="button" onClick={() => refetch()} className="btn-glow btn-glow-primary px-3 h-9 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </FlashBanner>
        )}

        {/* FEATURED SPOTLIGHT: شبكة الطوارئ والمجتمع الذكي في مصر */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/70 via-slate-900/90 to-slate-900 border border-red-500/30 p-5 md:p-6 shadow-2xl backdrop-blur-xl group hover:border-red-500/60 transition-all">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                  بث رادار حي Real-Time 🚨
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {communityStats?.totalCount != null && communityStats.totalCount > 0
                    ? `(${communityStats.totalCount} استغاثة نشطة بالمحافظات)`
                    : 'حالة الاستقرار طبيعية'}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
                <Siren className="w-6 h-6 text-red-500 animate-pulse" />
                شبكة الطوارئ والمجتمع الذكي («فزعة مصر» · «عربية رايحة» · المفقودات)
              </h2>

              <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                غرفة العمليات المركزية لمتابعة استغاثات المواطنين وحوادث الطرق، طلبات التبرع بالدم الحرجة، مشاوير Carpooling الآمنة، واسترداد المفقودات بالمطابقة التلقائية بالرقم القومي.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-rose-300 border border-rose-500/20 font-bold flex items-center gap-1.5">
                  <Siren className="w-3.5 h-3.5 text-rose-400" />
                  فزعة مصر (طوارئ ودم)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  عربية رايحة (مشاوير مشتركة)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-indigo-300 border border-indigo-500/20 font-bold flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  المفقودات (مطابقة ذكية 14 رقم)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/admin/community"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs md:text-sm font-black bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 border border-red-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>فتح غرفة عمليات المجتمع</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="admin-grid admin-grid-4">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            const display =
              typeof card.value === 'string'
                ? card.value
                : anyLoading && card.value === undefined
                  ? '—'
                  : (card.value ?? 0);

            return (
              <Link
                key={card.label}
                href={card.href}
                className={`admin-stat admin-stat--${card.tone} p-5`}
              >
                <div className="admin-row justify-between items-start">
                  <div className="admin-col">
                    <div className="admin-stat-label">{card.label}</div>
                    <div className="admin-stat-value">{display}</div>
                    {card.hint && <div className="admin-stat-hint">{card.hint}</div>}
                  </div>
                  <div className="admin-stat-icon">
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
