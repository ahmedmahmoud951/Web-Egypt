'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialAdminApi } from '@/api/socialAdmin';
import { AdminStatusDetailDto, AdminStatusFilter } from '@/types/social';
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

type UserStatusGroup = {
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorVerificationBadge?: string | null;
  items: AdminStatusDetailDto[];
  latest: AdminStatusDetailDto;
  hasActive: boolean;
  totalReports: number;
};

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
  const [viewerStatuses, setViewerStatuses] = useState<AdminStatusDetailDto[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Queries
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
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

    const refreshLive = () => {
      refetch();
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'statuses'], type: 'active' });
    };

    const unsubs = [
      signalRService.onStatusPublished(() => {
        refreshLive();
      }),
      signalRService.onStatusDeleted(() => {
        refreshLive();
      }),
      signalRService.onStatusHidden(() => {
        refreshLive();
      }),
      signalRService.onStatusRestored(() => {
        refreshLive();
      }),
      signalRService.onNewStatusReport((msg) => {
        refreshLive();
        flash.info(`بلاغ جديد على حالة: ${msg.reason}`);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, flash, refetch, refetchStats]);

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

  const handleOpenViewer = (group: UserStatusGroup) => {
    setViewerStatuses(group.items);
    setSelectedStatusIndex(0);
    setIsViewerOpen(true);
  };

  const userGroups: UserStatusGroup[] = useMemo(() => {
    const items = pagedStatuses?.items ?? [];
    const byUser = new Map<string, AdminStatusDetailDto[]>();
    for (const st of items) {
      const list = byUser.get(st.userId) || [];
      list.push(st);
      byUser.set(st.userId, list);
    }
    return Array.from(byUser.entries())
      .map(([userId, groupItems]) => {
        const sorted = [...groupItems].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const latest = sorted[0];
        return {
          userId,
          authorName: latest.authorName,
          authorAvatar: latest.authorAvatar,
          authorVerificationBadge: latest.authorVerificationBadge,
          items: sorted,
          latest,
          hasActive: sorted.some((s) => s.status === 'Active' && !s.isExpired),
          totalReports: sorted.reduce((n, s) => n + (s.reportsCount || 0), 0),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime()
      );
  }, [pagedStatuses?.items]);

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

        <div className="social-filter space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="social-filter-title">
              <span className="ico-wrap">
                <Filter className="w-4 h-4" />
              </span>
              تصفية الحالات والبحث
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 !text-[#E6D19A] hover:!bg-white/5"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="social-field sm:col-span-2">
              <span className="social-field-label">
                <Search className="w-3.5 h-3.5" />
                بحث سريع
              </span>
              <div className="social-search">
                <Search className="w-4 h-4 search-ico" />
                <input
                  type="text"
                  placeholder="اسم الناشر · النص · معرف الحالة..."
                  value={filter.search}
                  onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
                />
              </div>
            </div>
            <div className="social-field">
              <span className="social-field-label">الحالة</span>
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
            </div>
            <div className="social-field">
              <span className="social-field-label">نوع الوسائط</span>
              <select
                value={filter.mediaType}
                onChange={(e) => setFilter((f) => ({ ...f, mediaType: e.target.value as any, page: 1 }))}
              >
                <option value="">الكل</option>
                <option value="Image">صورة</option>
                <option value="Video">فيديو</option>
              </select>
            </div>
            <div className="social-field">
              <span className="social-field-label">من تاريخ</span>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              />
            </div>
            <div className="social-field">
              <span className="social-field-label">إلى تاريخ</span>
              <input
                type="date"
                value={filter.dateTo || ''}
                onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
              />
            </div>
            <label
              className="social-toggle-report self-end"
              data-on={filter.isReported ? 'true' : 'false'}
            >
              <input
                type="checkbox"
                checked={filter.isReported}
                onChange={(e) => setFilter((f) => ({ ...f, isReported: e.target.checked, page: 1 }))}
              />
              <Flag className="w-3.5 h-3.5" />
              المبلغ عنها فقط
            </label>
          </div>
        </div>

        {/* WhatsApp-style story bubbles — one bubble per user */}
        {!isStatusesLoading && userGroups.length > 0 && (
          <div className="stories-rail">
            {userGroups.map((group) => (
              <button
                key={`bubble-${group.userId}`}
                type="button"
                className="wa-story-bubble"
                onClick={() => handleOpenViewer(group)}
                title={`${group.authorName} · ${group.items.length} حالة`}
              >
                <div className="wa-story-ring" data-seen={group.hasActive ? 'false' : 'true'}>
                  <div className="wa-story-ring-inner">
                    {group.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.authorAvatar} alt={group.authorName} />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-white font-black text-sm bg-[#128C7E]">
                        {group.authorName?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="wa-story-name">{group.authorName}</div>
                {group.items.length > 1 && (
                  <div className="text-[9px] font-black text-[#25d366] mt-0.5">
                    {group.items.length} حلقات
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {isStatusesLoading ? (
          <div className="stories-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : userGroups.length === 0 ? (
          <div className="social-empty mt-4">
            <div className="ico" style={{ background: 'linear-gradient(145deg,#25d366,#128c7e)' }}>
              <Sparkles className="w-7 h-7" />
            </div>
            لا توجد حالات مسجلة تطابق التصفية.
          </div>
        ) : (
          <div className="stories-list">
            {userGroups.map((group) => {
              const st = group.latest;
              const isVideo = st.mediaType === 'Video' || st.mediaUrl.endsWith('.mp4');
              return (
                <div key={group.userId} className="wa-status-row">
                  <button
                    type="button"
                    className="wa-story-ring shrink-0 !w-[3.6rem] !h-[3.6rem]"
                    data-seen={group.hasActive ? 'false' : 'true'}
                    onClick={() => handleOpenViewer(group)}
                  >
                    <div className="wa-story-ring-inner relative">
                      {isVideo ? (
                        <video src={st.mediaUrl} muted className="pointer-events-none" />
                      ) : st.mediaUrl && !st.mediaUrl.includes('00000000-0000-0000-0000-000000000000') ? (
                        <Image src={st.mediaUrl} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-white font-black text-xs bg-gradient-to-br from-[#128C7E] to-[#075E54]">
                          {group.authorName?.charAt(0) || 'ح'}
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserAvatarWithStory
                        name={group.authorName}
                        avatarUrl={group.authorAvatar}
                        verificationBadge={group.authorVerificationBadge}
                        hasStory={group.hasActive}
                        hasUnseenStory={group.hasActive}
                        onClickStory={() => handleOpenViewer(group)}
                        size="sm"
                        showName
                      />
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${group.hasActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : st.status === 'Hidden'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : st.status === 'Deleted'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-white/10 text-[#A8B8C8] border border-white/10'
                          }`}
                      >
                        {group.hasActive
                          ? 'نشطة'
                          : st.isExpired || st.status === 'Expired'
                            ? 'منتهية'
                            : st.status === 'Hidden'
                              ? 'محجوبة'
                              : 'محذوفة'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B9CB0] bg-white/10 px-2 py-0.5 rounded-lg">
                        {isVideo ? <Video className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-cyan-400" />}
                        {group.items.length > 1
                          ? `${group.items.length} حالات`
                          : isVideo
                            ? 'فيديو'
                            : 'صورة'}
                      </span>
                    </div>
                    <p
                      className="text-xs font-bold text-[#F2F6FA] line-clamp-2 cursor-pointer hover:text-[#25d366]"
                      onClick={() => handleOpenViewer(group)}
                    >
                      {st.text || 'بدون نص'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#8B9CB0]">
                      <span>{formatArabicDate(st.createdAt)}</span>
                      <span className={st.isExpired ? 'text-slate-400' : 'text-emerald-400'}>
                        حتى {formatArabicDate(st.expiresAt)}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {st.viewsCount.toLocaleString('ar-EG')}
                      </span>
                      {group.totalReports > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-400">
                          <Flag className="w-3 h-3" /> {group.totalReports}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs gap-1"
                      onClick={() => handleOpenViewer(group)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      عرض
                    </Button>
                    {st.status === 'Active' && (
                      <Button
                        variant="gold"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => hideMutation.mutate(st.id)}
                        title="حجب أحدث حالة"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {st.status === 'Hidden' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => restoreMutation.mutate(st.id)}
                        title="استعادة"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleDelete(st)}
                      title="حذف أحدث حالة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-[#8B9CB0] font-bold px-1">
            <div>
              إجمالي النتائج: {pagedStatuses?.totalCount || 0} حالة · {userGroups.length} مستخدم
            </div>
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
              <span className="text-[#F2F6FA]">
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

      {viewerStatuses.length > 0 && (
        <StatusStoryViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          statuses={viewerStatuses}
          initialIndex={selectedStatusIndex}
          onStatusUpdated={() => refetch()}
        />
      )}
    </AdminShell>
  );
}
