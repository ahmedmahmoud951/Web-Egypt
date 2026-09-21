'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { adminApi } from '@/api/admin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import {
  Search,
  Shield,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Users,
  Ban,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebouncedValue(q, 400);
  const adminReady = useAdminQueryEnabled();

  const queryKey = useMemo(() => ['admin', 'users', { q: debouncedQ, page }], [debouncedQ, page]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      adminApi.getUsers({ q: debouncedQ.trim() || undefined, page, pageSize: 20, signal }),
    enabled: adminReady,
    staleTime: 60_000,
    retry: 0,
  });

  return (
    <AdminShell>
      <div className="space-y-5 text-right max-w-6xl mx-auto">
        <div className="admin-page-head">
          <div className="admin-row items-start gap-3">
            <span className="admin-page-icon">
              <Users className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <div className="admin-col">
              <h1 className="text-2xl font-black text-[#0F1B2D]">المستخدمون</h1>
              <p className="text-sm text-[#5A6D80] mt-1">بحث بالاسم أو رقم الموبايل — متابعة كل الحسابات</p>
            </div>
          </div>
        </div>

        {isError && (
          <FlashBanner tone="error" title="فشل تحميل المستخدمين" className="admin-row justify-between">
            <span>{(error as Error)?.message || 'تعذر الاتصال بالخادم.'}</span>
            <button type="button" onClick={() => refetch()} className="btn-glow btn-glow-primary px-3 h-9 text-xs">
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </FlashBanner>
        )}

        <div className="admin-card p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="اسم أو رقم موبايل..."
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
                  <th className="text-right">الدور</th>
                  <th className="text-right">منشورات</th>
                  <th className="text-right">الحالة</th>
                  <th className="text-right">تفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#8A9AAB]">جاري التحميل...</td>
                  </tr>
                )}
                {data?.items?.map((user) => (
                  <tr key={user.id} className="admin-tr">
                    <td className="admin-cell-title">
                      <span className="inline-flex items-center gap-1.5">
                        {user.name}
                        {user.isSuperAdmin && <Shield className="w-3.5 h-3.5 text-[#C4A35A]" />}
                      </span>
                    </td>
                    <td className="admin-cell-mono">{user.phoneNumber}</td>
                    <td>
                      <span className="admin-badge admin-badge-nile">{user.role}</span>
                    </td>
                    <td className="tabular-nums font-bold text-[#0F1B2D]">{user.eventsCount}</td>
                    <td>
                      {user.isBlocked ? (
                        <span className="admin-badge admin-badge-danger">
                          <Ban className="w-3 h-3" />
                          محظور
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-ok">
                          <CheckCircle2 className="w-3 h-3" />
                          نشط
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="btn-glow btn-glow-ghost px-2.5 h-8 text-xs inline-flex"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        فتح
                      </Link>
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
