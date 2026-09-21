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
import { Ban, Search, ShieldOff, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';

export default function AdminBlockedUsersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebouncedValue(q, 400);
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();
  const flash = useFlash();

  const queryKey = useMemo(
    () => ['admin', 'users', 'blocked', { q: debouncedQ, page }],
    [debouncedQ, page]
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      adminApi.getUsers({
        q: debouncedQ.trim() || undefined,
        isBlocked: true,
        page,
        pageSize: 20,
        signal,
      }),
    enabled: adminReady,
    staleTime: 60_000,
    retry: 0,
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => adminApi.unblockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      flash.success('تم إعادة تفعيل الحساب بنجاح.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل إعادة التفعيل.'),
  });

  const onUnblock = async (id: string, name: string) => {
    const ok = await flash.confirm({
      title: 'إعادة تفعيل الحساب؟',
      message: `سيتمكن «${name}» من الدخول مجددًا.`,
      confirmLabel: 'إعادة التشغيل',
      cancelLabel: 'إلغاء',
      tone: 'info',
    });
    if (!ok) return;
    await unblockMutation.mutateAsync(id);
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-5 text-right">
        <div className="admin-page-head">
          <div className="admin-row items-start gap-3">
            <span className="admin-page-icon" data-tone="danger">
              <Ban className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <div className="admin-col">
              <h1 className="text-2xl font-black text-[#0F1B2D]">الحسابات الموقوفة</h1>
              <p className="text-sm text-[#5A6D80] mt-1">
                ابحث عن حساب محظور وأعد تفعيله. طالما الحساب موقوف لا يمكن الدخول أو إنشاء حساب جديد بنفس البيانات.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#9E1B2C]" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="بحث بالاسم أو رقم الموبايل..."
              className="admin-input pr-10"
            />
          </div>
        </div>

        <div className="admin-data-grid">
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-sm">
              <thead className="admin-thead text-xs">
                <tr>
                  <th className="text-right">الاسم</th>
                  <th className="text-right">الموبايل</th>
                  <th className="text-right">سبب الإيقاف</th>
                  <th className="text-right">تاريخ الإيقاف</th>
                  <th className="text-right">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-[#8A9AAB]">جاري التحميل...</td>
                  </tr>
                )}
                {!isLoading && (data?.items?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-[#8A9AAB]">لا توجد حسابات موقوفة</td>
                  </tr>
                )}
                {data?.items?.map((user) => (
                  <tr key={user.id} className="admin-tr">
                    <td className="admin-cell-title">
                      <Link href={`/admin/users/${user.id}`} className="text-[#1F6B7A] hover:underline">
                        {user.name}
                      </Link>
                    </td>
                    <td className="admin-cell-mono">{user.phoneNumber}</td>
                    <td className="text-xs max-w-[220px]">
                      <span className="admin-badge admin-badge-gold inline-flex max-w-full truncate">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{user.blockReason || '—'}</span>
                      </span>
                    </td>
                    <td className="admin-cell-mono whitespace-nowrap">
                      {user.blockedAt ? formatArabicDate(user.blockedAt) : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onUnblock(user.id, user.name)}
                        className="btn-glow btn-glow-primary px-3 h-8 text-xs"
                        disabled={unblockMutation.isPending}
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        إعادة التشغيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(data?.totalPages ?? 0) > 1 && (
            <div className="admin-row justify-between p-3.5 border-t border-[rgba(15,27,45,0.08)] text-xs bg-white/40">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-glow btn-glow-ghost px-3 h-8 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                السابق
              </button>
              <span className="font-bold text-[#5A6D80]">
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
      </div>
    </AdminShell>
  );
}
