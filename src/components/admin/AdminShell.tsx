'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'لوحة القيادة', icon: LayoutDashboard, exact: true },
  { href: '/admin/verification', label: 'توثيق الحسابات', icon: BadgeCheck },
  { href: '/admin/events', label: 'المنشورات', icon: Newspaper },
  { href: '/admin/users', label: 'المستخدمون', icon: Users },
  { href: '/admin/blocked', label: 'الحسابات الموقوفة', icon: Ban },
  { href: '/admin/complaints', label: 'الشكاوى', icon: MessageSquareWarning },
  { href: '/admin/reports', label: 'البلاغات', icon: Flag },
  { href: '/admin/locations', label: 'المواقع المعلقة', icon: MapPin },
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
    // log once per authenticated admin session on this mount
    devLog.ok('shell', 'Admin shell ready', {
      pathname,
      user: user?.name,
      isSuperAdmin,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid remount loops on pathname/name churn
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen admin-canvas flex flex-col items-center justify-center gap-4 text-[#2A6B78] text-sm">
        <BrandLogo size={72} priority />
        <EgyptFlagMark className="w-12 h-8" />
        <span className="font-bold">جاري التحقق من صلاحيات الإدارة...</span>
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen admin-canvas text-[#1A2433] flex" dir="rtl">
      <aside className="admin-sidebar w-[17.5rem] shrink-0 hidden md:flex flex-col relative overflow-hidden">
        <div className="admin-flag-stripe absolute top-0 inset-x-0" />

        <div className="px-5 pt-7 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <BrandLogo size={52} priority />
            <div className="min-w-0">
              <div className="font-black text-white text-[15px] tracking-tight leading-tight">
                النهارده في مصر
              </div>
              <div className="text-[11px] text-[#B8954A] font-bold mt-0.5 flex items-center gap-1.5">
                <EgyptFlagMark className="w-5 h-3.5" />
                مركز التحكم
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-smooth ${
                  active
                    ? 'bg-[rgba(42,107,120,0.4)] text-white shadow-[0_0_18px_rgba(184,149,74,0.25),inset_0_0_0_1px_rgba(184,149,74,0.35)]'
                    : 'text-[#C5D0DC] hover:bg-white/5 hover:text-white hover:shadow-[0_0_12px_rgba(42,107,120,0.2)]'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    active ? 'bg-[rgba(184,149,74,0.2)] text-[#B8954A]' : 'bg-white/5 text-[#8FA3B8]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                {item.label}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <Link
              href="/admin/staff"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-smooth ${
                isActive('/admin/staff')
                  ? 'bg-[rgba(184,149,74,0.2)] text-[#F5E6B8] shadow-[inset_0_0_0_1px_rgba(184,149,74,0.35)]'
                  : 'text-[#C5D0DC] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(184,149,74,0.12)] text-[#B8954A]">
                <UserCog className="w-4 h-4" />
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
          <button
            type="button"
            onClick={logout}
            className="btn-glow btn-glow-danger w-full h-10 text-sm"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="admin-flag-stripe" />
        <header className="sticky top-0 z-30 h-14 glass-card border-b border-[rgba(26,36,51,0.07)] px-4 md:px-6 flex items-center justify-between gap-3">
          <div className="md:hidden flex items-center gap-2.5 font-black text-[#152238]">
            <BrandLogo size={34} />
            <span className="text-sm">النهارده في مصر</span>
          </div>
          <div className="text-xs text-[#5B6B7C] hidden sm:flex items-center gap-2 font-medium">
            <BrandLogo size={28} className="rounded-lg" />
            <EgyptFlagMark className="w-6 h-4" />
            مراقبة المنشورات والمستخدمين — بث لحظي
          </div>
          <LiveStatusBadge />
        </header>

        <div className="md:hidden flex gap-1.5 overflow-x-auto px-3 py-2.5 bg-[#E8EEF2]/90 border-b border-[rgba(26,36,51,0.07)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  isActive(item.href, item.exact)
                    ? 'bg-[#2A6B78] text-white'
                    : 'bg-[#FBFDFF] text-[#3D4F63] border border-[rgba(26,36,51,0.08)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link
              href="/admin/staff"
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                isActive('/admin/staff')
                  ? 'bg-[#B8954A] text-[#152238]'
                  : 'bg-[#FBFDFF] text-[#3D4F63] border border-[rgba(26,36,51,0.08)]'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              طاقم الأدمن
            </Link>
          )}
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
