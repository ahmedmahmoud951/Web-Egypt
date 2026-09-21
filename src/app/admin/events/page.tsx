'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signalRService } from '@/lib/signalr';
import { AdminShell } from '@/components/admin/AdminShell';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { useFlash } from '@/components/ui/FlashProvider';
import { adminApi } from '@/api/admin';
import { EventStatus } from '@/types/event';
import { formatArabicDate } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import {
  Search,
  Trash2,
  Eye,
  MapPin,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Newspaper,
} from 'lucide-react';

export default function AdminEventsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebouncedValue(q, 400);
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();
  const flash = useFlash();

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

  // Real-time synchronization
  useEffect(() => {
    signalRService.start();

    const refreshLive = () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'events'], type: 'active' });
    };

    const unsubs = [
      signalRService.onEventCreated(() => {
        refreshLive();
      }),
      signalRService.onEventUpdated(() => {
        refreshLive();
      }),
      signalRService.onEventConfirmed(() => {
        refreshLive();
      }),
      signalRService.onEventHidden(() => {
        refreshLive();
      }),
      signalRService.onEventRestored(() => {
        refreshLive();
      }),
      signalRService.onEventReported(() => {
        refreshLive();
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, refetch]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      flash.success('تم حذف المنشور نهائيًا من قاعدة البيانات.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل حذف المنشور.'),
  });

  const onDelete = async (id: string, title: string) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للمنشور؟',
      message: `«${title}» — لن يبقى في قاعدة البيانات.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <AdminShell>
      <div className="space-y-5 text-right max-w-6xl mx-auto">
        <div className="admin-page-head">
          <div className="admin-row items-start gap-3">
            <span className="admin-page-icon">
              <Newspaper className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <div className="admin-col">
              <h1 className="text-2xl font-black text-[#F2F6FA]">كل المنشورات</h1>
              <p className="text-sm text-[#8B9CB0] mt-1">مراقبة وحذف — التحديثات لحظية مع شبكة متوهجة</p>
            </div>
          </div>
        </div>

        <div className="admin-card p-4 admin-row items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="بحث بالعنوان أو الوصف..."
              className="admin-input pr-10"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="admin-input w-auto"
          >
            <option value="">كل الحالات</option>
            <option value="Published">منشور</option>
            <option value="Hidden">مخفي</option>
          </select>
        </div>

        {isError && (
          <FlashBanner tone="error" title="فشل تحميل المنشورات" className="admin-row justify-between">
            <span>{(error as Error)?.message || 'تعذر الاتصال بالخادم.'}</span>
            <button type="button" onClick={() => refetch()} className="btn-glow btn-glow-primary px-3 h-9 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </FlashBanner>
        )}

        <div className="admin-data-grid">
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-sm">
              <thead className="admin-thead text-xs">
                <tr>
                  <th className="text-right">العنوان</th>
                  <th className="text-right">الناشر</th>
                  <th className="text-right">الموقع</th>
                  <th className="text-right">الحالة</th>
                  <th className="text-right">التاريخ</th>
                  <th className="text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#8A9AAB]">جاري التحميل...</td>
                  </tr>
                )}
                {!isLoading && (data?.items?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#8A9AAB]">لا توجد منشورات</td>
                  </tr>
                )}
                {data?.items?.map((event) => (
                  <tr key={event.id} className="admin-tr">
                    <td className="admin-cell-title max-w-[220px] truncate">{event.title}</td>
                    <td>
                      <Link href={`/admin/users/${event.userId}`} className="text-[#1F6B7A] font-bold hover:underline">
                        {event.userName || 'مستخدم'}
                      </Link>
                    </td>
                    <td className="text-[#8B9CB0]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C4A35A] shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {event.locationPathAr || event.locationNameAr || '—'}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          event.status === 'Published'
                            ? 'admin-badge-ok'
                            : event.status === 'Hidden'
                              ? 'admin-badge-gold'
                              : 'admin-badge-nile'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="admin-cell-mono whitespace-nowrap">
                      {formatArabicDate(event.createdAt)}
                    </td>
                    <td>
                      <div className="admin-row gap-2">
                        <Link
                          href={`/admin/events/${event.id}`}
                          className="btn-glow btn-glow-ghost px-2.5 h-8 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          عرض
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(event.id, event.title)}
                          className="btn-glow btn-glow-danger px-2.5 h-8 text-xs"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.totalPages ?? 0) > 1 && (
            <div className="admin-row justify-between p-3.5 border-t border-[rgba(15,27,45,0.08)] text-xs bg-white/5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-glow btn-glow-ghost px-3 h-8 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                السابق
              </button>
              <span className="font-bold text-[#8B9CB0]">
                صفحة {page} من {data?.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= (data?.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="btn-glow btn-glow-ghost px-3 h-8 disabled:opacity-40"
              >
                التالي
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
