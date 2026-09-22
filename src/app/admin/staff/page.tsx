'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { useFlash } from '@/components/ui/FlashProvider';
import { adminApi } from '@/api/admin';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Shield, UserPlus, Phone, KeyRound, Sparkles, Edit3, Trash2 } from 'lucide-react';
import { EditStaffModal } from '@/components/admin/EditStaffModal';
import { AdminStaffMember } from '@/types/admin';

export default function AdminStaffPage() {
  const { isSuperAdmin, isLoading, user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const flash = useFlash();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<AdminStaffMember | null>(null);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [isLoading, isSuperAdmin, router]);

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: adminApi.getStaff,
    enabled: isSuperAdmin,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createStaff({ name, phoneNumber, password }),
    onSuccess: () => {
      setName('');
      setPhoneNumber('');
      setPassword('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      flash.success('تم إنشاء حساب الأدمن بنجاح.');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'تعذر إنشاء الأدمن';
      setError(msg);
      flash.error(msg);
    },
  });

  const handleDeleteStaff = async (member: AdminStaffMember) => {
    if (member.id === currentUser?.id) {
      flash.error('لا يمكنك مسح حسابك الخاص.');
      return;
    }

    const ok = await flash.confirm({
      title: 'مسح عضو الإدارة نهائياً؟',
      message: `هل أنت متأكد من حذف «${member.name}» نهائياً من طاقم الإدارة والنظام؟ سيتم إزالة جميع بياناته بالكامل. لا يمكن التراجع!`,
      confirmLabel: 'مسح نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });

    if (!ok) return;

    try {
      await adminApi.deleteStaff(member.id);
      flash.success('تم مسح عضو الإدارة بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر مسح عضو الإدارة';
      flash.error(msg);
    }
  };

  if (!isSuperAdmin) {
    return (
      <AdminShell>
        <div className="text-sm text-[#8A9AAB]">غير مصرح...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-6 text-right">
        <div className="admin-page-head">
          <div className="admin-row items-start gap-3">
            <span className="admin-page-icon" data-tone="gold">
              <Shield className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <div className="admin-col">
              <h1 className="text-2xl font-black text-[#F2F6FA]">طاقم الأدمن</h1>
              <p className="text-sm text-[#8B9CB0] mt-1">
                إنشاء أدمن جديد من الداخل فقط — لا يمكن تسجيل أدمن من صفحة الدخول العامة.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card p-5 md:p-6 space-y-4 relative overflow-hidden">
          <div className="admin-flag-stripe absolute top-0 inset-x-0" />
          <h2 className="font-black text-[#F2F6FA] inline-flex items-center gap-2 pt-1">
            <span className="admin-page-icon !w-9 !h-9">
              <UserPlus className="w-4 h-4" />
            </span>
            إضافة مسؤول
          </h2>

          {error && (
            <FlashBanner tone="error" title="تعذر الإنشاء">
              {error}
            </FlashBanner>
          )}

          <div className="admin-col gap-3">
            <div className="relative">
              <Sparkles className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#C4A35A]" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم"
                className="admin-input pr-10"
              />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="رقم الموبايل"
                className="admin-input pr-10"
                dir="ltr"
              />
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1F6B7A]" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="كلمة المرور"
                className="admin-input pr-10"
                dir="ltr"
              />
            </div>
            <button
              type="button"
              disabled={createMutation.isPending || !name || !phoneNumber || !password}
              onClick={() => createMutation.mutate()}
              className="btn-glow btn-glow-primary w-full h-11 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              إنشاء حساب أدمن
            </button>
          </div>
        </div>

        <div className="admin-data-grid">
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-sm">
              <thead className="admin-thead text-xs">
                <tr>
                  <th className="text-right">الاسم</th>
                  <th className="text-right">الموبايل</th>
                  <th className="text-right">النوع</th>
                  <th className="text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {staffLoading && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-[#8A9AAB]">
                      جاري التحميل...
                    </td>
                  </tr>
                )}
                {staff?.map((m) => (
                  <tr key={m.id} className="admin-tr">
                    <td className="admin-cell-title">{m.name}</td>
                    <td className="admin-cell-mono">{m.phoneNumber}</td>
                    <td>
                      {m.isSuperAdmin ? (
                        <span className="admin-badge admin-badge-gold">
                          <Crown className="w-3 h-3" />
                          سوبر أدمن
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-nile">
                          <Shield className="w-3 h-3" />
                          أدمن
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => setEditingStaff(m)}
                          className="btn-glow btn-glow-secondary px-2.5 h-8 text-xs inline-flex text-[#2AA9B9]"
                          title="تعديل"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStaff(m)}
                          className="btn-glow btn-glow-danger px-2.5 h-8 text-xs inline-flex"
                          title="مسح نهائي"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          مسح
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EditStaffModal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        staff={editingStaff}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })}
      />
    </AdminShell>
  );
}
