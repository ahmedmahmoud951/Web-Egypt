'use client';

import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/api/admin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatArabicDate } from '@/lib/utils';
import { Check, X, MapPin } from 'lucide-react';

export default function AdminLocationsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const flash = useFlash();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['admin', 'locations', 'pending'],
    queryFn: adminApi.getPendingLocations,
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'locations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      flash.success('تم اعتماد الموقع.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل الاعتماد.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'locations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      flash.warn('تم رفض الاقتراح.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل الرفض.'),
  });

  const onReject = async (id: string, name: string) => {
    const ok = await flash.confirm({
      title: 'رفض اقتراح الموقع؟',
      message: `«${name}» لن يُضاف للقائمة.`,
      confirmLabel: 'رفض',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    await rejectMutation.mutateAsync(id);
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-6 text-right">
        <div className="admin-page-head">
          <div className="admin-row items-start gap-3">
            <span className="admin-page-icon">
              <MapPin className="w-5 h-5" strokeWidth={2.4} />
            </span>
            <div className="admin-col space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#0F1B2D]">المواقع المعلقة</h1>
              <p className="text-xs text-[#5A6D80]">
                اعتماد أو رفض الأماكن المقترحة من مستخدمي تطبيق الموبايل
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="admin-card p-5 space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : suggestions?.length === 0 ? (
          <div className="admin-card p-12 text-center space-y-2">
            <h3 className="text-base font-bold text-[#0F1B2D]">لا توجد اقتراحات معلقة</h3>
          </div>
        ) : (
          <div className="admin-col gap-3">
            {suggestions?.map((item) => (
              <div
                key={item.id}
                className="admin-card p-5 admin-row items-start sm:items-center justify-between"
              >
                <div className="admin-col gap-1">
                  <div className="admin-row gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-[#0F1B2D]">{item.nameAr}</h3>
                    {item.nameEn && (
                      <span className="text-xs text-[#8A9AAB] font-mono">({item.nameEn})</span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-[rgba(196,163,90,0.16)] text-[#8A6A1F] rounded-md font-semibold shadow-[0_0_10px_rgba(196,163,90,0.15)]">
                      {item.type}
                    </span>
                  </div>
                  <div className="admin-row gap-4 text-xs text-[#5A6D80]">
                    <span>{formatArabicDate(item.createdAt)}</span>
                    {item.parentId && <span>Parent ID: {item.parentId}</span>}
                  </div>
                </div>

                <div className="admin-row gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1 text-xs"
                    isLoading={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(item.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                    اعتماد
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="gap-1 text-xs"
                    isLoading={rejectMutation.isPending}
                    onClick={() => onReject(item.id, item.nameAr)}
                  >
                    <X className="w-3.5 h-3.5" />
                    رفض
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
