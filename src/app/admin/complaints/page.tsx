'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { useFlash } from '@/components/ui/FlashProvider';
import { adminApi } from '@/api/admin';
import { formatArabicDate } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { MessageSquareWarning, Search, ChevronRight, ChevronLeft } from 'lucide-react';

const reasonLabels: Record<string, string> = {
  FalseInformation: 'معلومات خاطئة',
  WrongLocation: 'موقع خاطئ',
  OldEvent: 'حدث قديم',
  Spam: 'سبام',
  Inappropriate: 'محتوى غير لائق',
  Other: 'أخرى',
};

export default function AdminComplaintsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Pending');
  const [page, setPage] = useState(1);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const debouncedQ = useDebouncedValue(q, 400);
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();
  const flash = useFlash();

  const queryKey = useMemo(
    () => ['admin', 'complaints', { q: debouncedQ, status, page }],
    [debouncedQ, status, page]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      adminApi.getComplaints({
        q: debouncedQ.trim() || undefined,
        status: status || undefined,
        page,
        pageSize: 20,
      }),
    enabled: adminReady,
    staleTime: 60_000,
    retry: 0,
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      reviewStatus,
      notes,
    }: {
      id: string;
      reviewStatus: string;
      notes?: string;
    }) => adminApi.reviewComplaint(id, { status: reviewStatus, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      flash.success('تم تحديث حالة الشكوى.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل تحديث الشكوى.'),
  });

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-5 text-right">
        <div className="admin-page-head">
          <div className="admin-row items-start gap-3">
            <span className="admin-page-icon" data-tone="gold">
              <MessageSquareWarning className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <div className="admin-col">
              <h1 className="text-2xl font-black text-[#F2F6FA]">الشكاوى والبلاغات</h1>
              <p className="text-sm text-[#8B9CB0] mt-1">
                كل شكاوى المستخدمين على المنشورات — راجعها وسجّل القرار
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card p-4 admin-row items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9AAB]" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="بحث بعنوان المنشور أو المبلّغ..."
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
            <option value="Pending">قيد المراجعة</option>
            <option value="Reviewed">تمت المراجعة</option>
            <option value="Dismissed">مرفوضة</option>
            <option value="ActionTaken">تم اتخاذ إجراء</option>
          </select>
        </div>

        <div className="admin-col gap-3">
          {isLoading && (
            <div className="admin-card p-8 text-center text-[#8A9AAB] text-sm">
              جاري التحميل...
            </div>
          )}
          {!isLoading && (data?.items?.length ?? 0) === 0 && (
            <div className="admin-card p-8 text-center text-[#8A9AAB] text-sm">
              لا توجد شكاوى في هذا القسم
            </div>
          )}
          {data?.items?.map((c) => (
            <div key={c.id} className="admin-card p-5 space-y-3">
              <div className="admin-row items-start justify-between">
                <div className="admin-col gap-1">
                  <Link
                    href={`/admin/events/${c.eventId}`}
                    className="font-black text-[#F2F6FA] hover:text-[#1F6B7A]"
                  >
                    {c.eventTitle || 'منشور'}
                  </Link>
                  <div className="text-xs text-[#8B9CB0] admin-row gap-2">
                    <span className="font-bold text-[#8A6A1F] bg-[rgba(196,163,90,0.16)] px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(196,163,90,0.2)]">
                      {reasonLabels[c.reason] || c.reason}
                    </span>
                    <span>حالة المنشور: {c.eventStatus}</span>
                    <span dir="ltr">{formatArabicDate(c.createdAt)}</span>
                  </div>
                  <div className="text-xs text-[#8B9CB0]">
                    المبلّغ:{' '}
                    <Link href={`/admin/users/${c.reporterUserId}`} className="text-[#1F6B7A] font-bold">
                      {c.reporterName}
                    </Link>{' '}
                    <span className="font-mono" dir="ltr">
                      ({c.reporterPhone})
                    </span>
                  </div>
                  <div className="text-xs">
                    حالة الشكوى:{' '}
                    <span className="font-bold">{c.reviewStatus}</span>
                    {c.adminNotes && (
                      <span className="text-[#8B9CB0]"> — {c.adminNotes}</span>
                    )}
                  </div>
                </div>
              </div>

              {c.reviewStatus === 'Pending' && (
                <div className="space-y-2 border-t border-[rgba(15,27,45,0.06)] pt-3">
                  <textarea
                    value={notesById[c.id] || ''}
                    onChange={(e) =>
                      setNotesById((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    placeholder="ملاحظات الأدمن (اختياري)"
                    rows={2}
                    className="admin-input"
                  />
                  <div className="admin-row gap-2">
                    <button
                      type="button"
                      className="btn-glow btn-glow-primary px-3 h-8 text-xs"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: c.id,
                          reviewStatus: 'Reviewed',
                          notes: notesById[c.id],
                        })
                      }
                    >
                      تمت المراجعة
                    </button>
                    <button
                      type="button"
                      className="btn-glow btn-glow-gold px-3 h-8 text-xs"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: c.id,
                          reviewStatus: 'ActionTaken',
                          notes: notesById[c.id],
                        })
                      }
                    >
                      تم اتخاذ إجراء
                    </button>
                    <button
                      type="button"
                      className="btn-glow btn-glow-ghost px-3 h-8 text-xs"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: c.id,
                          reviewStatus: 'Dismissed',
                          notes: notesById[c.id],
                        })
                      }
                    >
                      رفض الشكوى
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="admin-row justify-between text-xs">
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
              {page} / {data?.totalPages}
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
    </AdminShell>
  );
}
