'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { useFlash } from '@/components/ui/FlashProvider';
import { adminApi } from '@/api/admin';
import { useAuth } from '@/hooks/useAuth';
import { Ban, Newspaper, Shield, ShieldOff } from 'lucide-react';

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const flash = useFlash();

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: ({ signal }) => adminApi.getUserById(id, signal),
    enabled: !!id,
  });

  const { data: events } = useQuery({
    queryKey: ['admin', 'events', 'by-user', id],
    queryFn: ({ signal }) => adminApi.getEvents({ userId: id, page: 1, pageSize: 50, signal }),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', id] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const blockMutation = useMutation({
    mutationFn: (reason?: string) => adminApi.blockUser(id, reason),
    onSuccess: () => {
      invalidate();
      flash.success('تم إيقاف الحساب.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل إيقاف الحساب.'),
  });

  const unblockMutation = useMutation({
    mutationFn: () => adminApi.unblockUser(id),
    onSuccess: () => {
      invalidate();
      flash.success('تم إعادة تفعيل الحساب.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل إعادة التفعيل.'),
  });

  const roleMutation = useMutation({
    mutationFn: (role: 'Admin' | 'User') => adminApi.changeUserRole(id, role),
    onSuccess: () => {
      invalidate();
      flash.success('تم تحديث الدور.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل تحديث الدور.'),
  });

  const onBlock = async () => {
    const reason = window.prompt('سبب إيقاف الحساب (اختياري):', 'مخالفة سياسات المنصة') || undefined;
    const ok = await flash.confirm({
      title: 'إيقاف الحساب؟',
      message: 'لن يستطيع الدخول أو إنشاء حساب جديد بنفس البيانات.',
      confirmLabel: 'إيقاف',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    await blockMutation.mutateAsync(reason);
  };

  const onUnblock = async () => {
    const ok = await flash.confirm({
      title: 'إعادة تفعيل الحساب؟',
      message: 'سيتمكن المستخدم من الدخول مجددًا.',
      confirmLabel: 'إعادة التشغيل',
      cancelLabel: 'إلغاء',
      tone: 'info',
    });
    if (!ok) return;
    await unblockMutation.mutateAsync();
  };

  const onRoleChange = async () => {
    if (!user) return;
    const next = user.role === 'Admin' ? 'User' : 'Admin';
    const ok = await flash.confirm({
      title: next === 'Admin' ? 'ترقية لـ Admin؟' : 'تخفيض لـ User؟',
      message: `سيتم تغيير دور «${user.name}» إلى ${next}.`,
      confirmLabel: 'تأكيد',
      cancelLabel: 'إلغاء',
      tone: 'warn',
    });
    if (!ok) return;
    await roleMutation.mutateAsync(next);
  };

  if (isLoading || !user) {
    return (
      <AdminShell>
        <div className="text-[#8A9AAB] text-sm">جاري التحميل...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-5 text-right">
        <div className="admin-card p-6 space-y-4">
          <div className="admin-row items-start justify-between">
            <div className="admin-col">
              <h1 className="text-2xl font-black text-[#0F1B2D] inline-flex items-center gap-2">
                {user.name}
                {user.isSuperAdmin && <Shield className="w-5 h-5 text-[#C4A35A]" />}
              </h1>
              <p className="text-sm font-mono text-[#5A6D80] mt-1" dir="ltr">
                {user.phoneNumber}
              </p>
              <p className="text-xs text-[#5A6D80] mt-2">
                الدور: {user.role} · المنشورات: {user.eventsCount}
              </p>
            </div>
            <div className="admin-row gap-2 flex-wrap">
              {!user.isSuperAdmin && (
                <>
                  {user.isBlocked ? (
                    <button
                      type="button"
                      onClick={onUnblock}
                      className="btn-glow btn-glow-primary px-3 h-9 text-xs"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                      إعادة التشغيل
                    </button>
                  ) : (
                    <button type="button" onClick={onBlock} className="btn-glow btn-glow-danger px-3 h-9 text-xs">
                      <Ban className="w-3.5 h-3.5" />
                      إيقاف الحساب
                    </button>
                  )}
                </>
              )}
              {isSuperAdmin && !user.isSuperAdmin && (
                <button type="button" onClick={onRoleChange} className="btn-glow btn-glow-gold px-3 h-9 text-xs">
                  {user.role === 'Admin' ? 'تخفيض لـ User' : 'ترقية لـ Admin'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="admin-card p-5 space-y-3">
          <h2 className="font-black text-[#0F1B2D] inline-flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#1F6B7A]" />
            منشورات المستخدم
          </h2>
          <div className="admin-col gap-2">
            {(events?.items?.length ?? 0) === 0 && (
              <p className="text-sm text-[#8A9AAB]">لا توجد منشورات</p>
            )}
            {events?.items?.map((ev) => (
              <Link
                key={ev.id}
                href={`/admin/events/${ev.id}`}
                className="block rounded-xl border border-[rgba(15,27,45,0.08)] px-3 py-2.5 hover:bg-[rgba(31,107,122,0.05)] hover:shadow-[0_0_16px_rgba(31,107,122,0.1)] transition-smooth"
              >
                <div className="font-semibold text-sm text-[#0F1B2D]">{ev.title}</div>
                <div className="text-xs text-[#5A6D80] mt-0.5">
                  {ev.status} · {ev.locationPathAr || ev.locationNameAr}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
