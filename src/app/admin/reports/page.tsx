'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatArabicDate } from '@/lib/utils';
import { Flag, Eye, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminReportsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-[#8A9AAB]">جاري التحميل...</div>}>
      <AdminReportsContent />
    </React.Suspense>
  );
}

function AdminReportsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') === 'hidden' ? 'hidden' : 'reported';
  const [activeTab, setActiveTab] = useState<'reported' | 'hidden'>(initialTab);
  const { isAdmin } = useAuth();
  const flash = useFlash();

  const { data: reportedEvents, isLoading: isReportedLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: adminApi.getReportedEvents,
    enabled: isAdmin && activeTab === 'reported',
  });

  const { data: hiddenEvents, isLoading: isHiddenLoading } = useQuery({
    queryKey: ['admin', 'hidden'],
    queryFn: adminApi.getHiddenEvents,
    enabled: isAdmin && activeTab === 'hidden',
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => adminApi.hideEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      flash.success('تم حجب المنشور.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل الحجب.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminApi.restoreEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      flash.success('تمت استعادة المنشور.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشلت الاستعادة.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      flash.success('تم الحذف النهائي.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل الحذف.'),
  });

  const onDelete = async (id: string, title: string) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي؟',
      message: `«${title}» — لن يبقى في قاعدة البيانات.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    await deleteMutation.mutateAsync(id);
  };

  const isLoading = activeTab === 'reported' ? isReportedLoading : isHiddenLoading;
  const eventsList = activeTab === 'reported' ? reportedEvents : hiddenEvents;

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-6 text-right">
        <div className="admin-page-head">
          <div className="admin-row items-start gap-3">
            <span className="admin-page-icon" data-tone="danger">
              <Flag className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <div className="admin-col gap-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#0F1B2D]">البلاغات والأحداث المحجوبة</h1>
              <p className="text-xs text-[#5A6D80]">متابعة بلاغات المجتمع والمحتوى المحجوب</p>
            </div>
          </div>

          <div className="admin-row gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('reported')}
              className={`btn-glow px-4 h-9 text-xs ${
                activeTab === 'reported' ? 'btn-glow-danger' : 'btn-glow-ghost'
              }`}
            >
              بلاغات ({reportedEvents?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hidden')}
              className={`btn-glow px-4 h-9 text-xs ${
                activeTab === 'hidden' ? 'btn-glow-primary' : 'btn-glow-ghost'
              }`}
            >
              محجوبة ({hiddenEvents?.length ?? 0})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-grid admin-grid-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="admin-card p-5 space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : eventsList?.length === 0 ? (
          <div className="admin-card p-12 text-center space-y-2">
            <h3 className="text-base font-bold text-[#0F1B2D]">لا توجد عناصر</h3>
          </div>
        ) : (
          <div className="admin-col gap-3">
            {eventsList?.map((event) => (
              <div
                key={event.id}
                className="admin-card p-5 admin-row items-start md:items-center justify-between"
              >
                <div className="admin-col gap-2 flex-1">
                  <div className="admin-row gap-2 flex-wrap">
                    <span className="font-bold text-base text-[#0F1B2D]">{event.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-[rgba(158,27,44,0.1)] text-[#9E1B2C] shadow-[0_0_10px_rgba(158,27,44,0.12)]">
                      {event.reportCount} بلاغ
                    </span>
                  </div>
                  <p className="text-xs text-[#5A6D80] line-clamp-2">{event.description}</p>
                  <div className="admin-row gap-4 text-[11px] text-[#8A9AAB]">
                    <span>{event.locationPathAr || event.locationNameAr || 'غير محدد'}</span>
                    <span>{formatArabicDate(event.createdAt)}</span>
                  </div>
                </div>

                <div className="admin-row gap-2 shrink-0">
                  <Link href={`/admin/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="gap-1 text-xs px-2.5">
                      <Eye className="w-3.5 h-3.5" />
                      عرض
                    </Button>
                  </Link>
                  {event.status === 'Published' && (
                    <Button
                      variant="gold"
                      size="sm"
                      className="gap-1 text-xs"
                      isLoading={hideMutation.isPending}
                      onClick={() => hideMutation.mutate(event.id)}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      حجب
                    </Button>
                  )}
                  {event.status === 'Hidden' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1 text-xs"
                      isLoading={restoreMutation.isPending}
                      onClick={() => restoreMutation.mutate(event.id)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      استعادة
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    className="gap-1 text-xs"
                    isLoading={deleteMutation.isPending}
                    onClick={() => onDelete(event.id, event.title)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
