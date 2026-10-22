'use client';

import React, { useState, useEffect } from 'react';
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
  LayoutDashboard,
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
  CreditCard,
  Wallet,
  CircleDollarSign,
  Landmark,
  ShieldAlert,
  ShoppingBag,
  Globe,
  Video,
  Scale,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  HeartPulse,
  Sliders,
  Compass,
  FileText,
  Activity,
  type LucideIcon,
} from 'lucide-react';

type CardCategory = 'all' | 'financial' | 'security' | 'business' | 'community' | 'media' | 'users';

interface PlatformModuleCard {
  title: string;
  category: CardCategory;
  categoryLabel: string;
  value: string | number;
  description: string;
  badge?: string;
  icon: LucideIcon;
  href: string;
  glowTheme: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'gold' | 'blue';
  superAdminOnly?: boolean;
}

export default function AdminDashboardPage() {
  const adminReady = useAdminQueryEnabled();
  const { isSuperAdmin, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<CardCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Complete List of All Modules Across the Web Platform
  const allModules: PlatformModuleCard[] = [
    // 1. القطاع المالي والمصرفي
    {
      title: 'سجل المدفوعات والعمليات',
      category: 'financial',
      categoryLabel: 'المالية',
      value: 'مباشر وتدقيق',
      description: 'تتبع شامل للعمليات المالية الصادرة والواردة، رسوم المعالجة، والمدفوعات عبر البطاقات والمحافظ الإلكترونية.',
      badge: 'الدفتر المالي',
      icon: CreditCard,
      href: '/admin/payments',
      glowTheme: 'cyan',
    },
    {
      title: 'المطابقة المالية وبوابات الدفع',
      category: 'financial',
      categoryLabel: 'المالية',
      value: 'فحص Webhooks',
      description: 'تدقيق ومطابقة قيود النظام مع إشارات بوابات الدفع لمنع الفروقات والازدواجية المحاسبية وحماية الأرصدة.',
      badge: 'التدقيق الآلي',
      icon: Scale,
      href: '/admin/payments/reconciliation',
      glowTheme: 'amber',
    },
    {
      title: 'بوابات الدفع وهيكل الرسوم',
      category: 'financial',
      categoryLabel: 'المالية',
      value: 'Paymob & InstaPay',
      description: 'إدارة البوابات الإلكترونية، الحسابات البنكية لاستقبال الأموال، وضبط نسب الرسوم والعمولات للمنصة.',
      badge: 'البوابات والحسابات',
      icon: Landmark,
      href: '/admin/payment-providers',
      glowTheme: 'blue',
    },
    {
      title: 'محافظ وأرصدة المستخدمين',
      category: 'financial',
      categoryLabel: 'المالية',
      value: 'الأرصدة والقيود',
      description: 'مراقبة المحافظ الرقمية للعملاء، الأرصدة المتاحة والمقفولة، تنفيذ التسويات المحاسبية، وقفل المحافظ احترازياً.',
      badge: 'إدارة الأرصدة',
      icon: Wallet,
      href: '/admin/wallets',
      glowTheme: 'emerald',
    },
    {
      title: 'طلبات سحب الأرباح',
      category: 'financial',
      categoryLabel: 'المالية',
      value: 'مراجعة وتحويل',
      description: 'مراجعة طلبات السحب للعملاء والمتاجر، التحويل البنكي أو المحافظ، أو الرفض مع استعادة الرصيد تلقائياً.',
      badge: 'سحب الأرباح',
      icon: CircleDollarSign,
      href: '/admin/withdrawals',
      glowTheme: 'rose',
    },

    // 2. التوثيق والأمان والرقابة
    {
      title: 'إدارة وتوثيق الحسابات والصفحات',
      category: 'security',
      categoryLabel: 'الأمان والتوثيق',
      value: verifyStats?.pendingRequests != null ? `${verifyStats.pendingRequests} طلب معلق` : 'اعتماد رسمي',
      description: 'فحص واعتماد الشارات الزرقاء والذهبية للأفراد والصفحات والشركات مع تدقيق الرقم القومي والسجل التجاري.',
      badge: 'توثيق رسمي',
      icon: BadgeCheck,
      href: '/admin/verification',
      glowTheme: 'gold',
    },
    {
      title: 'الرقابة الذكية AI',
      category: 'security',
      categoryLabel: 'الأمان والتوثيق',
      value: 'فحص فوري',
      description: 'تحليل آلي للمحتوى والصور والنصوص بالذكاء الاصطناعي لكشف الكلمات النابية، الاحتيال، والمخالفات فوراً.',
      badge: 'ذكاء اصطناعي',
      icon: ShieldAlert,
      href: '/admin/moderation',
      glowTheme: 'purple',
    },
    {
      title: 'الحسابات الموقوفة والمحظورة',
      category: 'security',
      categoryLabel: 'الأمان والتوثيق',
      value: stats?.blockedUsers ?? 0,
      description: 'قائمة الحسابات المعطلة أو المحظورة إدارياً، مراجعة أسباب العقوبات وإمكانية رفع الحظر أو تمديده.',
      badge: 'قائمة الحظر',
      icon: Ban,
      href: '/admin/blocked',
      glowTheme: 'rose',
    },
    {
      title: 'طاقم الإدارة والمديرين',
      category: 'security',
      categoryLabel: 'الأمان والتوثيق',
      value: 'صلاحيات الإشراف',
      description: 'تعيين المشرفين والمديرين، ضبط الصلاحيات الأمنية وإدارة الأدوار القيادية على مستوى المنصة.',
      badge: 'سوبر أدمن فقط',
      icon: UserCog,
      href: '/admin/staff',
      glowTheme: 'gold',
      superAdminOnly: true,
    },

    // 3. الأعمال والمتاجر والصفحات
    {
      title: 'إدارة الصفحات العامة والرسمية',
      category: 'business',
      categoryLabel: 'الأعمال والصفحات',
      value: 'Pages & Brands',
      description: 'متابعة صفحات المؤسسات والأنشطة التجارية، اعتمادها، تعيين المديرين، وتوثيق الكيانات الاقتصادية.',
      badge: 'الصفحات الرسمية',
      icon: Globe,
      href: '/admin/pages',
      glowTheme: 'cyan',
    },
    {
      title: 'المتاجر والمعارض والطلبات',
      category: 'business',
      categoryLabel: 'الأعمال والصفحات',
      value: 'كتالوج وطلبات',
      description: 'متابعة المحلات والمتاجر الإلكترونية، فهارس المنتجات، وحالات طلبات الشراء والشحن والعمولات.',
      badge: 'التجارة الإلكترونية',
      icon: ShoppingBag,
      href: '/admin/shops',
      glowTheme: 'emerald',
    },
    {
      title: 'سوق مصر والخدمات',
      category: 'business',
      categoryLabel: 'الأعمال والصفحات',
      value: 'إعلانات مبوبة',
      description: 'مراقبة إعلانات البيع والشراء والخدمات والعقارات والسيارات بين الأفراد بالمحافظات مع الفلترة الذكية.',
      badge: 'الماركت بليس',
      icon: Compass,
      href: '/admin/marketplace',
      glowTheme: 'amber',
    },
    {
      title: 'ترويج الماركات (Brand Boosts)',
      category: 'business',
      categoryLabel: 'الأعمال والصفحات',
      value: 'باقات الظهور',
      description: 'تسعير وإدارة باقات الترويج للشركات، كاش ونقاط ولاء، والتحكم في ظهور الإعلانات المميزة بالصفحات الأولى.',
      badge: 'الترويج المميز',
      icon: Sparkles,
      href: '/admin/marketplace/packages',
      glowTheme: 'gold',
    },

    // 4. المجتمع والطوارئ والمحادثات
    {
      title: 'غرفة طوارئ وفزعة مصر',
      category: 'community',
      categoryLabel: 'الطوارئ والمجتمع',
      value: communityLoading ? '...' : (communityStats?.totalCount != null && communityStats.totalCount > 0 ? `${communityStats.totalCount} استغاثة نشطة` : 'مستقرة ✓'),
      description: 'متابعة استغاثات المواطنين العاجلة، طلبات التبرع بالدم الحرجة، وبلاغات الحوادث مع إرسال إشعارات جغرافية.',
      badge: 'فزعة مصر 🚨',
      icon: Siren,
      href: '/admin/community',
      glowTheme: 'rose',
    },
    {
      title: 'مشاوير — مشاركة الرحلات (Carpooling)',
      category: 'community',
      categoryLabel: 'الطوارئ والمجتمع',
      value: 'مشاوير ورحلات',
      description: 'متابعة كافة المشاوير المعلنة والجارية والمكتملة، طلبات الركاب، تأكيد الركوب عبر OTP، وضبط تسويات السائقين.',
      badge: 'مشاوير 🚗',
      icon: Car,
      href: '/admin/community',
      glowTheme: 'emerald',
    },
    {
      title: 'اعتماد سائقي ومركبات مشاوير',
      category: 'community',
      categoryLabel: 'الطوارئ والمجتمع',
      value: 'فحص التراخيص',
      description: 'مراجعة بيانات الرقم القومي، رخص القيادة والسيارة، وصور المركبات مع اعتماد السائقين أو إرسال أسباب الرفض لحظياً.',
      badge: 'توثيق السائقين 🛡️',
      icon: ShieldCheck,
      href: '/admin/drivers',
      glowTheme: 'cyan',
    },
    {
      title: 'شبكة المفقودات الذكية',
      category: 'community',
      categoryLabel: 'الطوارئ والمجتمع',
      value: 'مطابقة 14 رقم',
      description: 'استرداد الأوراق الرسمية والمقتنيات المفقودة بمطابقة ذكية مشفرة عبر الرقم القومي ورقم الهاتف.',
      badge: 'المفقودات',
      icon: Search,
      href: '/admin/community',
      glowTheme: 'blue',
    },
    {
      title: 'مراقبة المحادثات اللحظية',
      category: 'community',
      categoryLabel: 'الطوارئ والمجتمع',
      value: 'شات مباشر',
      description: 'متابعة حية للمحادثات لضمان الأمان والنزاهة ومنع الاحتيال وتبادل المعاملات الخارجية دون وضع علامة Seen.',
      badge: 'الشات المباشر',
      icon: MessageCircle,
      href: '/admin/chat',
      glowTheme: 'cyan',
    },

    // 5. الوسائط والخرائط والإعلانات
    {
      title: 'المنشورات والأحداث النشطة',
      category: 'media',
      categoryLabel: 'المحتوى والإعلام',
      value: stats?.publishedEvents ?? 0,
      description: 'إدارة جميع المنشورات والفعاليات المنشورة في شوارع مصر، التعديل عليها، تثبيتها أو حجبها إدارياً.',
      badge: 'الأحداث اليومية',
      icon: Newspaper,
      href: '/admin/events',
      glowTheme: 'cyan',
    },
    {
      title: 'المواقع والأماكن المعلقة',
      category: 'media',
      categoryLabel: 'المحتوى والإعلام',
      value: stats?.pendingLocations != null ? `${stats.pendingLocations} موقع معلق` : 'خريطة مصر',
      description: 'مراجعة الأماكن والمنشآت والمطاعم المقترحة من المواطنين واعتماد إضافتها على خريطة الجمهورية.',
      badge: 'خريطة الأماكن',
      icon: MapPin,
      href: '/admin/locations',
      glowTheme: 'amber',
    },
    {
      title: 'إدارة مقاطع الريلز (Reels)',
      category: 'media',
      categoryLabel: 'المحتوى والإعلام',
      value: reelStats?.totalReels != null ? `${reelStats.totalReels} فيديو` : 'مقاطع مرئية',
      description: 'مراجعة فيديوهات الريلز القصيرة، عدد المشاهدات، بلاغات المحتوى، والتحكم في إخفائها أو نشرها.',
      badge: 'فيديوهات الريلز',
      icon: Film,
      href: '/admin/reels',
      glowTheme: 'emerald',
    },
    {
      title: 'الحالات اليومية (Statuses)',
      category: 'media',
      categoryLabel: 'المحتوى والإعلام',
      value: statusStats?.activeCount != null ? `${statusStats.activeCount} حالة نشطة` : 'قصص المجتمع',
      description: 'متابعة الستوري والحالات المؤقتة، البلاغات المرفوعة ضدها، وإدارتها فورياً قبل انتهاء صلاحيتها.',
      badge: 'الحالات المؤقتة',
      icon: Sparkles,
      href: '/admin/statuses',
      glowTheme: 'gold',
    },
    {
      title: 'منصة الإعلانات الممولة',
      category: 'media',
      categoryLabel: 'المحتوى والإعلام',
      value: adStats?.activeCampaigns != null ? `${adStats.activeCampaigns} حملة نشطة` : 'إعلانات ممولة',
      description: 'مراجعة واعتماد الحملات الإعلانية الممولة، ميزانيات الدفع، الاستهداف الجغرافي، وإحصائيات النقرات.',
      badge: 'الحملات الإعلانية',
      icon: Megaphone,
      href: '/admin/advertising',
      glowTheme: 'purple',
    },
    {
      title: 'إعلانات الفيديو الرقمية',
      category: 'media',
      categoryLabel: 'المحتوى والإعلام',
      value: 'فيديو سبوت',
      description: 'إدارة إعلانات الفيديو الرقمية الترويجية التي تظهر للمستخدمين بين المنشورات والريلز.',
      badge: 'إعلانات الفيديو',
      icon: Video,
      href: '/admin/video-ads',
      glowTheme: 'blue',
    },

    // 6. المستخدمون والنزاعات
    {
      title: 'المستخدمون والحسابات',
      category: 'users',
      categoryLabel: 'المستخدمون والنزاعات',
      value: stats?.usersCount ?? 0,
      description: 'إدارة قاعدة بيانات أعضاء المنصة، مراجعة ملفاتهم، توثيق صور الـ Avatar، ومعالجة الحسابات.',
      badge: 'قاعدة المستخدمين',
      icon: Users,
      href: '/admin/users',
      glowTheme: 'cyan',
    },
    {
      title: 'مركز البلاغات والمخالفات',
      category: 'users',
      categoryLabel: 'المستخدمون والنزاعات',
      value: stats?.reportedEvents != null ? `${stats.reportedEvents} بلاغ مفتوح` : 'إدارة البلاغات',
      description: 'متابعة ومعالجة البلاغات الواردة من المواطنين ضد المنشورات أو الحسابات أو التعليقات المسيئة.',
      badge: 'البلاغات والانتهاكات',
      icon: Flag,
      href: '/admin/reports',
      glowTheme: 'rose',
    },
    {
      title: 'الشكاوى ومنازعات العملاء',
      category: 'users',
      categoryLabel: 'المستخدمون والنزاعات',
      value: stats?.pendingComplaints != null ? `${stats.pendingComplaints} شكوى معلقة` : 'شكاوى المواطنين',
      description: 'فحص وحل شكاوى المواطنين والمنازعات المالية أو الخدمية وإرسال الردود الرسمية لأصحابها.',
      badge: 'مركز الشكاوى',
      icon: MessageSquareWarning,
      href: '/admin/complaints',
      glowTheme: 'amber',
    },
  ];

  // Filtering modules
  const filteredModules = allModules
    .filter((m) => !m.superAdminOnly || isSuperAdmin)
    .filter((m) => selectedCategory === 'all' || m.category === selectedCategory)
    .filter((m) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.categoryLabel.toLowerCase().includes(q)
      );
    });

  const getGlowStyles = (theme: PlatformModuleCard['glowTheme']) => {
    switch (theme) {
      case 'cyan':
        return {
          border: 'border-cyan-500/30 hover:border-cyan-400',
          shadow: 'hover:shadow-[0_0_35px_rgba(6,182,212,0.22)]',
          badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
          hoverTitle: 'group-hover:text-cyan-300',
          arrowColor: 'text-cyan-400',
        };
      case 'emerald':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-400',
          shadow: 'hover:shadow-[0_0_35px_rgba(16,185,129,0.22)]',
          badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          hoverTitle: 'group-hover:text-emerald-300',
          arrowColor: 'text-emerald-400',
        };
      case 'amber':
        return {
          border: 'border-amber-500/30 hover:border-amber-400',
          shadow: 'hover:shadow-[0_0_35px_rgba(245,158,11,0.22)]',
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          hoverTitle: 'group-hover:text-amber-300',
          arrowColor: 'text-amber-400',
        };
      case 'rose':
        return {
          border: 'border-rose-500/30 hover:border-rose-400',
          shadow: 'hover:shadow-[0_0_35px_rgba(244,63,94,0.25)]',
          badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          hoverTitle: 'group-hover:text-rose-300',
          arrowColor: 'text-rose-400',
        };
      case 'purple':
        return {
          border: 'border-purple-500/30 hover:border-purple-400',
          shadow: 'hover:shadow-[0_0_35px_rgba(168,85,247,0.22)]',
          badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          hoverTitle: 'group-hover:text-purple-300',
          arrowColor: 'text-purple-400',
        };
      case 'gold':
        return {
          border: 'border-yellow-500/30 hover:border-yellow-400',
          shadow: 'hover:shadow-[0_0_35px_rgba(234,179,8,0.22)]',
          badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
          iconBg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
          hoverTitle: 'group-hover:text-yellow-300',
          arrowColor: 'text-yellow-400',
        };
      case 'blue':
      default:
        return {
          border: 'border-blue-500/30 hover:border-blue-400',
          shadow: 'hover:shadow-[0_0_35px_rgba(59,130,246,0.22)]',
          badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          hoverTitle: 'group-hover:text-blue-300',
          arrowColor: 'text-blue-400',
        };
    }
  };

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
      <div className="space-y-8 text-right max-w-7xl mx-auto pb-20" dir="rtl">
        {/* Hero Header with Egypt Flag Accent */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-blue-950/40 to-slate-900/95 border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl">
          <div className="admin-flag-stripe absolute top-0 inset-x-0" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div className="flex items-start gap-4">
              <BrandLogo size={68} priority className="rounded-2xl hidden sm:block brand-logo-ring shrink-0" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <EgyptFlagMark className="w-8 h-5" />
                  <span className="text-xs font-black text-cyan-400 tracking-wider uppercase">
                    TODAY IN EGYPT · مركز العمليات والتحكم المركزي
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  لوحة القيادة الرئيسية الشاملة
                </h1>
                <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  منظومة التحكم الموحدة — وصول فوري لكافة صفحات وأقسام المنصة من مكان واحد بكروت ذكية متوهجة وتحديثات حية.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0">
              <LiveStatusBadge />
              {updatedLabel && (
                <span className="text-xs text-amber-400 font-semibold inline-flex items-center gap-1.5 bg-slate-950/60 px-3 py-1 rounded-full border border-amber-500/20">
                  <Radio className={`w-3 h-3 text-amber-400 ${isFetching ? 'animate-pulse' : ''}`} />
                  <span>تحديث لحظي: {updatedLabel}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => refetch()}
                disabled={anyLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? 'animate-spin' : ''}`} />
                <span>تحديث عام الآن</span>
              </button>
            </div>
          </div>
        </div>

        {isError && (
          <FlashBanner tone="error" title="تعذر تحميل بعض الإحصائيات" className="admin-row justify-between">
            <span className="admin-col">
              {(error as Error)?.message || 'تأكد من الاتصال بالخادم، وسيتم التحديث التلقائي فور استقرار الشبكة.'}
            </span>
            <button type="button" onClick={() => refetch()} className="btn-glow btn-glow-primary px-3 h-9 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </FlashBanner>
        )}

        {/* Categories Tab Navigation & Search Filter */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/70 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-2 rounded-xl transition ${
                  selectedCategory === 'all'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                جميع الأقسام ({allModules.filter((m) => !m.superAdminOnly || isSuperAdmin).length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('financial')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  selectedCategory === 'financial'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>المالية والمدفوعات</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('security')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  selectedCategory === 'security'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5 text-yellow-400" />
                <span>الأمان والتوثيق</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('business')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  selectedCategory === 'business'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                <span>الأعمال والمتاجر</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('community')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  selectedCategory === 'community'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Siren className="w-3.5 h-3.5 text-rose-400" />
                <span>الطوارئ والمجتمع</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('media')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  selectedCategory === 'media'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>المحتوى والإعلام</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('users')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  selectedCategory === 'users'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>المستخدمين والنزاعات</span>
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث عن أي صفحة أو وظيفة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Iconic Futuristic Glowing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const glow = getGlowStyles(module.glowTheme);

            return (
              <Link
                key={module.title}
                href={module.href}
                className={`group relative overflow-hidden rounded-3xl bg-slate-900/80 border ${glow.border} ${glow.shadow} p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 backdrop-blur-md`}
              >
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4">
                  {/* Top Bar of the Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl ${glow.iconBg} border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-md`}
                    >
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {module.badge && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${glow.badgeBg}`}
                        >
                          {module.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold">{module.categoryLabel}</span>
                    </div>
                  </div>

                  {/* Title & Live Value */}
                  <div>
                    <h2
                      className={`text-lg font-black text-white transition-colors duration-200 ${glow.hoverTitle} flex items-center gap-2`}
                    >
                      <span>{module.title}</span>
                    </h2>
                    <div className="text-xl font-black text-cyan-300 mt-1 font-mono tracking-tight flex items-center gap-1.5">
                      <span>{module.value}</span>
                    </div>
                  </div>

                  {/* Description: Exactly what this card does */}
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">
                    {module.description}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-white transition">
                  <span className="text-[11px] text-slate-500 group-hover:text-cyan-400 transition">
                    انقر لفتح الصفحة والتحكم
                  </span>
                  <div
                    className={`inline-flex items-center gap-1 text-xs font-black ${glow.arrowColor} group-hover:translate-x-[-4px] transition-transform`}
                  >
                    <span>دخول</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-white/5 space-y-3">
            <Search className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-bold text-white">لم يتم العثور على أي قسم يطابق بحثك.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
            >
              عرض جميع الأقسام
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
