'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/api/admin';
import { socialAdminApi } from '@/api/socialAdmin';
import { signalRService } from '@/lib/signalr';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { EgyptFlagMark } from '@/components/brand/EgyptFlagMark';
import { LiveStatusBadge } from '@/components/admin/LiveStatusBadge';
import { devLog } from '@/lib/devLog';
import {
  Activity,
  Ban,
  Flag,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquareWarning,
  Newspaper,
  Users,
  UserCog,
  BadgeCheck,
  Film,
  Sparkles,
  MessageCircle,
  Megaphone,
  ChevronRight,
  Siren,
  ShieldAlert,
  ShoppingBag,
  Wallet,
  Globe,
  CreditCard,
  Landmark,
  CircleDollarSign,
  Scale,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'لوحة القيادة الرئيسية', shortLabel: 'الرئيسية', icon: LayoutDashboard, exact: true },
  
  // القطاع المالي والمدفوعات
  { href: '/admin/payments', label: 'سجل المدفوعات والعمليات', shortLabel: 'المدفوعات', icon: CreditCard },
  { href: '/admin/payments/reconciliation', label: 'المطابقة المالية وبوابات الدفع', shortLabel: 'المطابقة', icon: Scale },
  { href: '/admin/payment-providers', label: 'بوابات الدفع وهيكل الرسوم', shortLabel: 'بوابات ورسوم', icon: Landmark },
  { href: '/admin/wallets', label: 'محافظ وأرصدة المستخدمين', shortLabel: 'المحافظ', icon: Wallet },
  { href: '/admin/withdrawals', label: 'طلبات سحب الأرباح', shortLabel: 'السحوبات', icon: CircleDollarSign },

  // التوثيق والأمان والرقابة
  { href: '/admin/verification', label: 'إدارة وتوثيق الحسابات والصفحات', shortLabel: 'التوثيق', icon: BadgeCheck },
  { href: '/admin/moderation', label: 'الرقابة الذكية AI', shortLabel: 'رقابة AI', icon: ShieldAlert },
  { href: '/admin/reports', label: 'مركز البلاغات والمخالفات', shortLabel: 'بلاغات', icon: Flag },
  { href: '/admin/complaints', label: 'الشكاوى والنزاعات', shortLabel: 'شكاوى', icon: MessageSquareWarning },

  // الصفحات والمتاجر والأعمال
  { href: '/admin/pages', label: 'إدارة الصفحات (Pages)', shortLabel: 'الصفحات', icon: Globe },
  { href: '/admin/shops', label: 'المتاجر والمعارض والطلبات', shortLabel: 'المتاجر', icon: ShoppingBag },
  { href: '/admin/marketplace', label: 'سوق مصر والخدمات', shortLabel: 'سوق مصر', icon: ShoppingBag },
  { href: '/admin/marketplace/packages', label: 'ترويج الماركات (Brand Boosts)', shortLabel: 'ترويج ماركات', icon: Sparkles },
  
  // المجتمع والطوارئ والمحادثات
  { href: '/admin/community', label: 'المجتمع والطوارئ والمفقودات', shortLabel: 'طوارئ', icon: Siren },
  { href: '/admin/chat', label: 'مراقبة المحادثات', shortLabel: 'محادثات', icon: MessageCircle },

  // الإعلام والفعاليات
  { href: '/admin/events', label: 'المنشورات والأحداث', shortLabel: 'منشورات', icon: Newspaper },
  { href: '/admin/advertising', label: 'منصة الإعلانات الممولة', shortLabel: 'إعلانات', icon: Megaphone },
  { href: '/admin/reels', label: 'إدارة مقاطع الريلز', shortLabel: 'ريلز', icon: Film },
  { href: '/admin/statuses', label: 'إدارة الحالات اليومية', shortLabel: 'حالات', icon: Sparkles },
  { href: '/admin/locations', label: 'المواقع المعلقة والمقترحة', shortLabel: 'مواقع', icon: MapPin },

  // المستخدمون
  { href: '/admin/users', label: 'المستخدمون والحسابات', shortLabel: 'مستخدمون', icon: Users },
  { href: '/admin/blocked', label: 'الحسابات الموقوفة والمحظورة', shortLabel: 'موقوفة', icon: Ban },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isSuperAdmin, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      if (pathname !== '/admin/login') {
        devLog.warn('shell', 'Not authenticated → /admin/login', { pathname });
        router.replace('/admin/login');
      }
      return;
    }
    if (!isAdmin) {
      if (!pathname.includes('denied=1') && pathname.startsWith('/admin')) {
        devLog.warn('shell', 'Not admin → /admin/login?denied=1', {
          pathname,
          role: user?.role,
        });
        router.replace('/admin/login?denied=1');
      }
      return;
    }
    devLog.ok('shell', 'Admin shell ready', {
      pathname,
      user: user?.name,
      isSuperAdmin,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const queryClient = useQueryClient();

  useEffect(() => {
    signalRService.start();

    const refreshStats = () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats', 'shell'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports', 'pending-count'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'reports', 'pending-count'], type: 'active' });
    };

    const unsubs = [
      signalRService.onReportUpdated(() => refreshStats()),
      signalRService.onNewReelReport(() => refreshStats()),
      signalRService.onNewStatusReport(() => refreshStats()),
      signalRService.onEventReported(() => refreshStats()),
      signalRService.onVerificationEvent(() => refreshStats()),
      signalRService.onLocationApproved(() => refreshStats()),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient]);

  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats', 'shell'],
    queryFn: () => adminApi.getDashboardStats(),
    enabled: !isLoading && isAuthenticated && isAdmin,
    refetchInterval: 15000,
  });

  const { data: pendingReportsData } = useQuery({
    queryKey: ['admin', 'reports', 'pending-count'],
    queryFn: () => socialAdminApi.getReports({ page: 1, pageSize: 1, status: 'Pending' }),
    enabled: !isLoading && isAuthenticated && isAdmin,
    refetchInterval: 15000,
  });

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen admin-canvas flex flex-col items-center justify-center gap-4 text-[var(--egypt-nile)] text-sm px-4">
        <BrandLogo size={72} priority />
        <EgyptFlagMark className="w-12 h-8" />
        <span className="font-bold text-center">جاري التحقق من صلاحيات الإدارة...</span>
      </div>
    );
  }

  const getBadgeCount = (href: string) => {
    switch (href) {
      case '/admin/verification':
        if (!stats) return 0;
        return (stats.pendingVerifications ?? ((stats.pendingUserVerifications ?? 0) + (stats.pendingPageVerifications ?? 0))) || 0;
      case '/admin/pages':
        if (!stats) return 0;
        return (stats.pendingPageVerifications ?? 0) || 0;
      case '/admin/locations':
        if (!stats) return 0;
        return (stats.pendingLocations ?? 0) || 0;
      case '/admin/reports':
        if (pendingReportsData?.totalCount !== undefined) {
          return pendingReportsData.totalCount;
        }
        if (!stats) return 0;
        return (stats.pendingComplaints ?? stats.reportedEvents ?? 0) || 0;
      case '/admin/complaints':
        if (!stats) return 0;
        return (stats.pendingComplaints ?? stats.reportedEvents ?? 0) || 0;
      default:
        return 0;
    }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen admin-canvas text-[var(--egypt-ink)] flex" dir="rtl">
      <aside className="admin-sidebar w-[17.5rem] shrink-0 hidden md:flex flex-col relative overflow-hidden">
        <div className="admin-flag-stripe absolute top-0 inset-x-0" />

        <div className="px-5 pt-7 pb-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3 group transition hover:opacity-90">
            <BrandLogo size={52} priority />
            <div className="min-w-0">
              <div className="font-black text-white text-[15px] tracking-tight leading-tight group-hover:text-cyan-400 transition">
                النهارده في مصر
              </div>
              <div className="text-[11px] text-[var(--egypt-gold)] font-bold mt-0.5 flex items-center gap-1.5">
                <EgyptFlagMark className="w-5 h-3.5" />
                مركز التحكم
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            const badgeCount = getBadgeCount(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active ? 'true' : 'false'}
                className="admin-nav-link group/nav"
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-[rgba(196,163,90,0.24)] text-[#F5E6B8] shadow-[0_0_16px_rgba(196,163,90,0.4)]'
                      : 'bg-white/5 text-[#8FA3B8]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
                </span>
                <span className="truncate">{item.label}</span>
                {item.href === '/admin/verification' ? (
                  <span
                    className="mr-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.6)] border border-rose-400/40 animate-pulse shrink-0"
                    title="تنبيه: تم رصد 3 طلبات تحوي صوراً تجريبية غير مطابقة لبطاقة الرقم القومي تتطلب إعادة الرفع"
                  >
                    <span>⚠️ 3 تجريبية</span>
                  </span>
                ) : badgeCount > 0 ? (
                  <span
                    className="mr-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-rose-600 via-amber-500 to-rose-500 text-white shadow-[0_0_14px_rgba(244,63,94,0.7)] border border-white/20 animate-pulse shrink-0"
                    title={`${badgeCount} طلب بانتظار الإجراء والمراجعة`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <Link
              href="/admin/staff"
              data-active={isActive('/admin/staff') ? 'true' : 'false'}
              className="admin-nav-link"
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(184,149,74,0.12)] text-[#B8954A] shrink-0">
                <UserCog className="w-[18px] h-[18px]" strokeWidth={2.25} />
              </span>
              طاقم الأدمن
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-2 flex items-center gap-3">
            <BrandLogo size={36} />
            <div className="min-w-0">
              <div className="text-[11px] text-[#8FA3B8]">مسجّل كـ</div>
              <div className="text-sm font-bold text-white truncate">{user?.name}</div>
              {isSuperAdmin && (
                <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#F5E6B8] bg-[rgba(184,149,74,0.16)] px-2 py-0.5 rounded-full">
                  <Activity className="w-3 h-3" />
                  سوبر أدمن
                </div>
              )}
            </div>
          </div>
          <button type="button" onClick={logout} className="btn-glow btn-glow-danger w-full h-10 text-sm">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="admin-flag-stripe" />
        <header className="sticky top-0 z-30 min-h-14 glass-card border-b border-[rgba(45,138,156,0.18)] px-2 sm:px-4 md:px-6 flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-2 min-w-0">
            {pathname !== '/admin' && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/admin');
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-[#F2F6FA] text-xs font-bold transition border border-white/15 shrink-0 shadow-sm"
                title="الرجوع للصفحة السابقة"
                aria-label="الرجوع للصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0" />
                <span>رجوع</span>
              </button>
            )}

            {pathname !== '/admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 active:scale-95 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                title="العودة للوحة القيادة الرئيسية"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>لوحة القيادة</span>
              </Link>
            )}

            <div className="md:hidden flex items-center gap-2 min-w-0">
              <BrandLogo size={32} />
              <div className="min-w-0">
                <div className="text-sm font-black text-[#F2F6FA] truncate leading-tight">النهارده في مصر</div>
                <div className="text-[10px] font-bold text-[#C4A35A] flex items-center gap-1">
                  <EgyptFlagMark className="w-4 h-3" />
                  مركز التحكم
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-[var(--egypt-muted)] hidden md:flex items-center gap-2 font-medium min-w-0">
            <BrandLogo size={28} className="rounded-lg shrink-0" />
            <EgyptFlagMark className="w-6 h-4 shrink-0" />
            <span className="truncate">مراقبة المنشورات والمستخدمين — بث لحظي</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LiveStatusBadge />
            <button
              type="button"
              onClick={logout}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[rgba(158,27,44,0.1)] text-[var(--egypt-red)] border border-[rgba(158,27,44,0.2)]"
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile icon rail — short labels, no horizontal crush */}
        <div className="md:hidden sticky top-14 z-20 bg-[#1E2C3C]/92 backdrop-blur-md border-b border-[rgba(45,138,156,0.18)] safe-px">
          <div className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              const badgeCount = getBadgeCount(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 min-w-[4.35rem] max-w-[5.5rem] flex flex-col items-center gap-1 px-1.5 py-2 rounded-2xl text-[10px] font-extrabold leading-tight text-center transition relative ${
                    active
                      ? 'bg-[var(--egypt-nile)] text-white shadow-[0_8px_20px_-10px_rgba(31,107,122,0.7)]'
                      : 'bg-[#1A2433] text-[#A8B8C8] border border-[rgba(45,138,156,0.22)]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center relative ${
                      active ? 'bg-white/15 text-[#F5E6B8]' : 'bg-[rgba(45,138,156,0.14)] text-[#5ec4d4]'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.35} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.9)] border border-slate-900 animate-pulse">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                  <span className="px-0.5 line-clamp-2">{item.shortLabel}</span>
                </Link>
              );
            })}
            {isSuperAdmin && (
              <Link
                href="/admin/staff"
                className={`shrink-0 min-w-[4.35rem] max-w-[5.5rem] flex flex-col items-center gap-1 px-1.5 py-2 rounded-2xl text-[10px] font-extrabold leading-tight text-center transition ${
                  isActive('/admin/staff')
                    ? 'bg-[var(--egypt-gold)] text-[var(--egypt-navy)] shadow'
                    : 'bg-[#1A2433] text-[#A8B8C8] border border-[rgba(45,138,156,0.22)]'
                }`}
              >
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-[rgba(196,163,90,0.2)] text-[#E6D19A]">
                  <UserCog className="w-4 h-4" strokeWidth={2.35} />
                </span>
                <span>طاقم</span>
              </Link>
            )}
          </div>
        </div>

        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  );
}
