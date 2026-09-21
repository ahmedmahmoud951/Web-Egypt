'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { LiveStatusBadge } from '@/components/admin/LiveStatusBadge';
import { EgyptFlagMark } from '@/components/brand/EgyptFlagMark';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { adminApi } from '@/api/admin';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const adminReady = useAdminQueryEnabled();
  const { data: stats, isLoading, isError, error, dataUpdatedAt, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: ({ signal }) => adminApi.getDashboardStats(signal),
    enabled: adminReady,
    staleTime: 120_000,
    retry: 0,
  });

  const cards = [
    { label: 'المستخدمون', value: stats?.usersCount, icon: Users, href: '/admin/users', tone: 'text-[#1F6B7A] bg-[rgba(31,107,122,0.12)]' },
    { label: 'حسابات موقوفة', value: stats?.blockedUsers, icon: Ban, href: '/admin/blocked', tone: 'text-[#9E1B2C] bg-[rgba(158,27,44,0.1)]' },
    { label: 'شكاوى معلّقة', value: stats?.pendingComplaints, icon: MessageSquareWarning, href: '/admin/complaints', tone: 'text-[#8A6A1F] bg-[rgba(196,163,90,0.18)]' },
    { label: 'منشورات اليوم', value: stats?.eventsToday, icon: Newspaper, href: '/admin/events', tone: 'text-[#0F1B2D] bg-[rgba(15,27,45,0.08)]' },
    { label: 'منشورات منشورة', value: stats?.publishedEvents, icon: Sparkles, href: '/admin/events', tone: 'text-[#0F766E] bg-teal-50' },
    { label: 'بلاغات أحداث', value: stats?.reportedEvents, icon: Flag, href: '/admin/reports', tone: 'text-[#9E1B2C] bg-[rgba(158,27,44,0.1)]' },
    { label: 'مواقع معلّقة', value: stats?.pendingLocations, icon: MapPin, href: '/admin/locations', tone: 'text-[#8A6A1F] bg-[rgba(196,163,90,0.16)]' },
    { label: 'مخفية', value: stats?.hiddenEvents, icon: EyeOff, href: '/admin/reports', tone: 'text-[#5A6D80] bg-[#E4ECF2]' },
  ];

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
        <div className="admin-card p-6 md:p-8 relative overflow-hidden">
          <div className="admin-flag-stripe absolute top-0 inset-x-0" />
          <div className="admin-row justify-between pt-1">
            <div className="admin-row items-start gap-4">
              <BrandLogo size={64} priority className="rounded-2xl hidden sm:block" />
              <div className="admin-col">
                <div className="admin-row gap-2 mb-1">
                  <EgyptFlagMark className="w-8 h-5" />
                  <span className="text-[11px] font-extrabold text-[#1F6B7A] tracking-wide">TODAY IN EGYPT</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-[#0F1B2D]">لوحة القيادة</h1>
                <p className="text-sm text-[#5A6D80] mt-1.5 max-w-lg">
                  شبكة مراقبة حية — أي منشور أو بلاغ يظهر فورًا مع تباين وأيقونات واضحة.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <LiveStatusBadge />
              {updatedLabel && (
                <span className="text-[11px] text-[#8A6A1F] font-semibold inline-flex items-center gap-1">
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

        <div className="admin-grid admin-grid-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} href={card.href} className="admin-stat rounded-2xl p-5">
                <div className="admin-row justify-between items-start">
                  <div className="admin-col">
                    <div className="text-xs font-extrabold text-[#5A6D80]">{card.label}</div>
                    <div className="text-3xl font-black text-[#0F1B2D] mt-2 tabular-nums">
                      {isLoading ? '—' : (card.value ?? 0)}
                    </div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_14px_rgba(31,107,122,0.15)] ${card.tone}`}>
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
