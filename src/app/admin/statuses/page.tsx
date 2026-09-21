'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialAdminApi } from '@/api/socialAdmin';
import { AdminStatusDetailDto, AdminStatusFilter, StatusItemStatus } from '@/types/social';
import { AdminShell } from '@/components/admin/AdminShell';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { StatusStoryViewerModal } from '@/components/social/StatusStoryViewerModal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatArabicDate } from '@/lib/utils';
import { signalRService } from '@/lib/signalr';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  EyeOff,
  Trash2,
  Flag,
  Eye,
  Image as ImageIcon,
  Video,
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';

export default function AdminStatusesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-[#8A9AAB]">جاري التحميل...</div>}>
      <AdminStatusesContent />
    </React.Suspense>
  );
}

function AdminStatusesContent() {
  const queryClient = useQueryClient();
  const flash = useFlash();

  // Filters State
  const [filter, setFilter] = useState<AdminStatusFilter>({
    page: 1,
    pageSize: 15,
    status: '',
    mediaType: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    isReported: false,
  });

  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Queries
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin', 'statuses', 'stats'],
    queryFn: () => socialAdminApi.getStatusStats(),
  });

  const { data: pagedStatuses, isLoading: isStatusesLoading, refetch } = useQuery({
    queryKey: ['admin', 'statuses', filter],
    queryFn: () => socialAdminApi.getStatuses(filter),
  });

  // Real-time synchronization
  useEffect(() => {
    signalRService.start();

    const unsubs = [
      signalRService.onStatusPublished(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      }),
      signalRService.onStatusDeleted(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      }),
      signalRService.onStatusHidden(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      }),
      signalRService.onStatusRestored(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      }),
      signalRService.onNewStatusReport((msg) => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
        flash.info(`بلاغ جديد على حالة: ${msg.reason}`);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, flash]);

  // Mutations
  const hideMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.hideStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      flash.success('تم حجب الحالة بنجاح.');
    },
    onError: () => flash.error('فشل حجب الحالة.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.restoreStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      flash.success('تمت استعادة الحالة بنجاح.');
    },
    onError: () => flash.error('فشلت استعادة الحالة.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.deleteStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      flash.success('تم حذف الحالة نهائياً.');
    },
    onError: () => flash.error('فشل حذف الحالة.'),
  });

  const handleDelete = async (status: AdminStatusDetailDto) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للحالة؟',
      message: `«${status.text?.slice(0, 35) || 'حالة اجتماعية'}» — سيتم حذف الحالة نهائياً.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(status.id);
  };

  const handleOpenViewer = (statusIndex: number) => {
    setSelectedStatusIndex(statusIndex);
    setIsViewerOpen(true);
  };

  const totalPages = Math.ceil((pagedStatuses?.totalCount || 0) / (filter.pageSize || 15));

  return (
    <AdminShell>
      <div className="social-stage text-right" dir="rtl">
        <div className="social-hero" data-tone="stories">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 grid place-items-center shadow-lg">
              <Sparkles className="w-6 h-6 text-[#C4A35A]" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">إدارة الحالات والقصص</h1>
                <span className="social-hero-badge">
                  <ShieldCheck className="w-3 h-3" />
                  WhatsApp Stories Style
                </span>
              </div>
              <p className="text-xs text-white/75 mt-1 font-semibold">
                متابعة الحالات المؤقتة بحلقات قصص خضراء ومعاينة كاملة مثل واتساب
              </p>
            </div>
          </div>
        </div>

        <div className="social-kpi-grid kpi-7">
          {[
            { label: 'إجمالي الحالات', value: stats?.totalStatuses ?? 0, icon: Sparkles, tone: 'wa' },
            { label: 'نشطة حالياً', value: stats?.activeCount ?? 0, icon: CheckCircle2, tone: 'ok' },
            { label: 'منتهية', value: stats?.expiredCount ?? 0, icon: Clock, tone: 'mute' },
            { label: 'محجوبة', value: stats?.hiddenCount ?? 0, icon: EyeOff, tone: 'warn' },
            { label: 'محذوفة', value: stats?.deletedCount ?? 0, icon: Trash2, tone: 'danger' },
            { label: 'بلاغات', value: stats?.reportedCount ?? 0, icon: Flag, tone: 'danger' },
            { label: 'المشاهدات', value: stats?.totalViews ?? 0, icon: Eye, tone: 'cyan' },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="social-kpi" data-tone={kpi.tone}>
                <span className="ico">
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
                <div className="lbl">{kpi.label}</div>
                <div className="val">
                  {isStatsLoading ? '…' : Number(kpi.value).toLocaleString('ar-EG')}
                </div>
              </div>
            );
          })}
        </div>

        <div className="social-filter space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-black text-[#0F1B2D]">
              <Filter className="w-4 h-4 text-[#128C7E]" />
              تصفية الحالات والبحث
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() =>
                setFilter({
                  page: 1,
                  pageSize: 15,
                  status: '',
                  mediaType: '',
                  search: '',
                  dateFrom: '',
                  dateTo: '',
                  isReported: false,
                })
              }
            >
              <RotateCcw className="w-3 h-3" />
              إعادة ضبط
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#128C7E] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث باسم الناشر أو النص..."
                value={filter.search}
                onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
                className="!pr-9"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value as any, page: 1 }))}
            >
              <option value="">كافة الحالات</option>
              <option value="Active">نشطة</option>
              <option value="Expired">منتهية</option>
              <option value="Hidden">محجوبة</option>
              <option value="Deleted">محذوفة</option>
            </select>
            <select
              value={filter.mediaType}
              onChange={(e) => setFilter((f) => ({ ...f, mediaType: e.target.value as any, page: 1 }))}
            >
              <option value="">نوع الوسائط (الكل)</option>
              <option value="Image">صورة</option>
              <option value="Video">فيديو</option>
            </select>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              title="تاريخ الإنشاء"
            />
            <label className="flex items-center gap-2 text-xs font-bold text-[#9E1B2C] cursor-pointer select-none bg-rose-50 px-3 rounded-xl border border-rose-200 h-[2.55rem]">
              <input
                type="checkbox"
                checked={filter.isReported}
                onChange={(e) => setFilter((f) => ({ ...f, isReported: e.target.checked, page: 1 }))}
                className="rounded text-[var(--egypt-red)] w-4 h-4"
              />
              المبلغ عنها فقط
            </label>
          </div>
        </div>

        {/* WhatsApp-style story bubbles rail */}
        {!isStatusesLoading && (pagedStatuses?.items?.length ?? 0) > 0 && (
          <div className="stories-rail">
            {pagedStatuses!.items.map((st, idx) => {
              const active = st.status === 'Active' && !st.isExpired;
              return (
                <button
                  key={`bubble-${st.id}`}
                  type="button"
                  className="wa-story-bubble"
                  onClick={() => handleOpenViewer(idx)}
                  title={st.authorName}
                >
                  <div className="wa-story-ring" data-seen={active ? 'false' : 'true'}>
                    <div className="wa-story-ring-inner">
                      {st.authorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={st.authorAvatar} alt={st.authorName} />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-white font-black text-sm bg-[#128C7E]">
                          {st.authorName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="wa-story-name">{st.authorName}</div>
                </button>
              );
            })}
          </div>
        )}

        {isStatusesLoading ? (
          <div className="stories-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : (pagedStatuses?.items?.length ?? 0) === 0 ? (
          <div className="social-empty mt-4">
            <div className="ico" style={{ background: 'linear-gradient(145deg,#25d366,#128c7e)' }}>
              <Sparkles className="w-7 h-7" />
            </div>
            لا توجد حالات مسجلة تطابق التصفية.
          </div>
        ) : (
          <div className="stories-list">
            {pagedStatuses!.items.map((st, idx) => {
              const isVideo = st.mediaType === 'Video' || st.mediaUrl.endsWith('.mp4');
              const active = st.status === 'Active' && !st.isExpired;
              return (
                <div key={st.id} className="wa-status-row">
                  <button
                    type="button"
                    className="wa-story-ring shrink-0 !w-[3.6rem] !h-[3.6rem]"
                    data-seen={active ? 'false' : 'true'}
                    onClick={() => handleOpenViewer(idx)}
                  >
                    <div className="wa-story-ring-inner relative">
                      {isVideo ? (
                        <video src={st.mediaUrl} muted className="pointer-events-none" />
                      ) : (
                        <Image src={st.mediaUrl} alt="" fill className="object-cover" />
                      )}
                    </div>
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserAvatarWithStory
                        name={st.authorName}
                        avatarUrl={st.authorAvatar}
                        verificationBadge={st.authorVerificationBadge}
                        hasStory={active}
                        hasUnseenStory={active}
                        onClickStory={() => handleOpenViewer(idx)}
                        size="sm"
                        showName
                      />
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          active
                            ? 'bg-emerald-100 text-emerald-700'
                            : st.status === 'Hidden'
                              ? 'bg-amber-100 text-amber-700'
                              : st.status === 'Deleted'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {active
                          ? 'نشطة'
                          : st.isExpired || st.status === 'Expired'
                            ? 'منتهية'
                            : st.status === 'Hidden'
                              ? 'محجوبة'
                              : 'محذوفة'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5A6D80] bg-slate-100 px-2 py-0.5 rounded-lg">
                        {isVideo ? <Video className="w-3 h-3 text-purple-600" /> : <ImageIcon className="w-3 h-3 text-cyan-600" />}
                        {isVideo ? 'فيديو' : 'صورة'}
                      </span>
                    </div>
                    <p
                      className="text-xs font-bold text-[#0F1B2D] line-clamp-2 cursor-pointer hover:text-[#128C7E]"
                      onClick={() => handleOpenViewer(idx)}
                    >
                      {st.text || 'بدون نص'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#5A6D80]">
                      <span>{formatArabicDate(st.createdAt)}</span>
                      <span className={st.isExpired ? 'text-slate-400' : 'text-emerald-600'}>
                        حتى {formatArabicDate(st.expiresAt)}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {st.viewsCount.toLocaleString('ar-EG')}
                      </span>
                      {st.reportsCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-600">
                          <Flag className="w-3 h-3" /> {st.reportsCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1" onClick={() => handleOpenViewer(idx)}>
                      <Eye className="w-3.5 h-3.5" />
                      عرض
                    </Button>
                    {st.status === 'Active' && (
                      <Button variant="gold" size="sm" className="h-8 px-2 text-xs" onClick={() => hideMutation.mutate(st.id)} title="حجب">
                        <EyeOff className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {st.status === 'Hidden' && (
                      <Button variant="primary" size="sm" className="h-8 px-2 text-xs" onClick={() => restoreMutation.mutate(st.id)} title="استعادة">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="danger" size="sm" className="h-8 px-2 text-xs" onClick={() => handleDelete(st)} title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-[#5A6D80] font-bold px-1">
            <div>إجمالي النتائج: {pagedStatuses?.totalCount || 0} حالة</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filter.page === 1}
                onClick={() => setFilter((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                className="h-8 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-[#0F1B2D]">
                صفحة {filter.page} من {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={filter.page === totalPages}
                onClick={() => setFilter((f) => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {pagedStatuses?.items && (
        <StatusStoryViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          statuses={pagedStatuses.items}
          initialIndex={selectedStatusIndex}
          onStatusUpdated={() => refetch()}
        />
      )}
    </AdminShell>
  );
}
