'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialAdminApi } from '@/api/socialAdmin';
import { AdminReelFilter, ReelDto } from '@/types/social';
import { AdminShell } from '@/components/admin/AdminShell';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { ReelPreviewModal } from '@/components/social/ReelPreviewModal';
import { ReelCardMedia } from '@/components/social/ReelCardMedia';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatRelativeArabicTime, reelPublishedAt } from '@/lib/utils';
import { signalRService } from '@/lib/signalr';
import {
  Film,
  CheckCircle2,
  FileEdit,
  EyeOff,
  Trash2,
  Flag,
  Eye,
  Heart,
  Share2,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  CalendarDays,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export default function AdminReelsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-[#8A9AAB]">جاري التحميل...</div>}>
      <AdminReelsContent />
    </React.Suspense>
  );
}

function AdminReelsContent() {
  const queryClient = useQueryClient();
  const flash = useFlash();

  // Filters State
  const [filter, setFilter] = useState<AdminReelFilter>({
    page: 1,
    pageSize: 15,
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    isReported: false,
  });

  const [selectedReel, setSelectedReel] = useState<ReelDto | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Queries — keep stats key outside ['admin','reels',…] list prefix to avoid refetch collisions
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin', 'reel-stats'],
    queryFn: () => socialAdminApi.getReelStats(),
  });

  const {
    data: pagedReels,
    isLoading: isReelsLoading,
    isError: isReelsError,
    error: reelsError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'reels', filter],
    queryFn: () => socialAdminApi.getReels(filter),
  });

  // Real-time synchronization
  useEffect(() => {
    signalRService.start();

    const refreshLive = () => {
      refetch();
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'reel-stats'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'reels'], type: 'active' });
    };

    const unsubs = [
      signalRService.onReelPublished(() => {
        refreshLive();
      }),
      signalRService.onReelHidden(() => {
        refreshLive();
      }),
      signalRService.onReelRestored(() => {
        refreshLive();
      }),
      signalRService.onReelDeleted(() => {
        refreshLive();
      }),
      signalRService.onReelReactionUpdated(() => {
        refreshLive();
      }),
      signalRService.onReelCommentAdded(() => {
        refreshLive();
      }),
      signalRService.onNewReelReport((msg) => {
        refreshLive();
        flash.info(`بلاغ جديد على ريلز: ${msg.reason}`);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, flash, refetch, refetchStats]);

  // Mutations
  const hideMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.hideReel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      flash.success('تم حجب المقطع بنجاح.');
    },
    onError: () => flash.error('فشل حجب المقطع.'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.restoreReel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      flash.success('تمت استعادة المقطع بنجاح.');
    },
    onError: () => flash.error('فشلت استعادة المقطع.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.deleteReel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      flash.success('تم حذف المقطع نهائياً.');
    },
    onError: () => flash.error('فشل حذف المقطع.'),
  });

  const handleDelete = async (reel: ReelDto) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للريلز؟',
      message: `«${(reel.caption || 'مقطع ريلز').slice(0, 35)}» — سيتم حذف المقطع نهائياً.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(reel.id);
  };

  const fmt = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('ar-EG');

  const handleOpenPreview = (reel: ReelDto) => {
    setSelectedReel(reel);
    setIsPreviewOpen(true);
  };

  const totalPages = Math.ceil((pagedReels?.totalCount || 0) / (filter.pageSize || 15));

  return (
    <AdminShell>
      <div className="social-stage text-right" dir="rtl">
        <div className="social-hero" data-tone="reels">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-white/15 border border-[#C4A35A]/40 grid place-items-center shadow-[0_0_20px_rgba(196,163,90,0.35)]">
              <Film className="w-6 h-6 text-[#F5E6B8]" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">إدارة مقاطع الريلز</h1>
                <span className="social-hero-badge">
                  <Sparkles className="w-3 h-3" />
                  مراقبة سينمائية
                </span>
              </div>
              <p className="text-xs text-white/75 mt-1 font-semibold">
                فلاتر متوهجة · إحصائيات حيّة · معاينة فورية بدون ضوضاء
              </p>
            </div>
          </div>
        </div>

        <div className="social-kpi-grid kpi-9">
          {[
            { label: 'إجمالي الريلز', value: stats?.totalReels ?? 0, icon: Film, tone: 'nile' },
            { label: 'المنشورة', value: stats?.publishedCount ?? 0, icon: CheckCircle2, tone: 'ok' },
            { label: 'مسودة', value: stats?.draftCount ?? 0, icon: FileEdit, tone: 'mute' },
            { label: 'المحجوبة', value: stats?.hiddenCount ?? 0, icon: EyeOff, tone: 'warn' },
            { label: 'المحذوفة', value: stats?.deletedCount ?? 0, icon: Trash2, tone: 'danger' },
            { label: 'بلاغات', value: stats?.reportedCount ?? 0, icon: Flag, tone: 'danger' },
            { label: 'المشاهدات', value: stats?.totalViews ?? 0, icon: Eye, tone: 'cyan' },
            { label: 'الإعجابات', value: stats?.totalLikes ?? 0, icon: Heart, tone: 'pink' },
            { label: 'المشاركات', value: stats?.totalShares ?? 0, icon: Share2, tone: 'gold' },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="social-kpi" data-tone={kpi.tone}>
                <span className="ico">
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                </span>
                <div className="lbl">{kpi.label}</div>
                <div className="val">
                  {isStatsLoading ? '…' : fmt(kpi.value)}
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
              تصفية وبحث متقدم
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

          <div className="social-field">
            <span className="social-field-label">
              <Layers className="w-3.5 h-3.5" />
              حالة المقطع
            </span>
            <div className="social-status-chips">
              {[
                { value: '', label: 'الكل', tone: undefined as string | undefined, icon: Layers },
                { value: 'Published', label: 'منشور', tone: 'ok', icon: CheckCircle2 },
                { value: 'Draft', label: 'مسودة', tone: 'mute', icon: FileEdit },
                { value: 'Hidden', label: 'محجوب', tone: 'warn', icon: EyeOff },
                { value: 'Deleted', label: 'محذوف', tone: 'danger', icon: Trash2 },
              ].map((chip) => {
                const Icon = chip.icon;
                const active = (filter.status || '') === chip.value;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    className="social-chip"
                    data-active={active ? 'true' : 'false'}
                    data-tone={chip.tone}
                    onClick={() => setFilter((f) => ({ ...f, status: chip.value as any, page: 1 }))}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                    {chip.label}
                  </button>
                );
              })}
            </div>
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
                  placeholder="اسم المستخدم · الوصف · معرف الريلز..."
                  value={filter.search}
                  onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
                />
              </div>
            </div>

            <div className="social-field">
              <span className="social-field-label">
                <CalendarDays className="w-3.5 h-3.5" />
                من تاريخ
              </span>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              />
            </div>

            <div className="social-field">
              <span className="social-field-label">
                <CalendarDays className="w-3.5 h-3.5" />
                إلى تاريخ
              </span>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
              />
            </div>
          </div>

          <label
            className="social-toggle-report"
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

        {isReelsLoading ? (
          <div className="reels-feed">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : isReelsError ? (
          <div className="social-empty mt-4">
            <div className="ico" style={{ background: 'linear-gradient(145deg,#b45309,#7f1d1d)' }}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <p>تعذر تحميل الريلز.</p>
            <p className="text-xs text-white/55 mt-1 font-semibold">
              {(reelsError as Error)?.message || 'أعد المحاولة بعد لحظات.'}
            </p>
            <Button variant="gold" size="sm" className="mt-3" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : (pagedReels?.items?.length ?? 0) === 0 ? (
          <div className="social-empty mt-4">
            <div className="ico">
              <Film className="w-7 h-7" />
            </div>
            لا توجد مقاطع ريلز مطابقة لمعايير البحث الحالية.
          </div>
        ) : (
          <div className="reels-feed">
            {pagedReels?.items?.map((reel) => (
              <article key={reel.id} className="reel-card">
                <div className="relative">
                  <ReelCardMedia
                    mediaUrl={reel.mediaUrl}
                    posterUrl={reel.thumbnailUrl}
                    onOpen={() => handleOpenPreview(reel)}
                  />
                  <div className="reel-card-body space-y-2 pointer-events-none">
                    <div className="flex items-center justify-between gap-2 pointer-events-auto">
                      <UserAvatarWithStory
                        name={reel.authorName}
                        avatarUrl={reel.authorAvatar}
                        verificationBadge={reel.authorVerificationBadge}
                        size="sm"
                        showName
                      />
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          reel.status === 'Published'
                            ? 'bg-emerald-500 text-white'
                            : reel.status === 'Hidden'
                              ? 'bg-amber-400 text-black'
                              : reel.status === 'Draft'
                                ? 'bg-slate-400 text-white'
                                : 'bg-rose-500 text-white'
                        }`}
                      >
                        {reel.status === 'Published'
                          ? 'منشور'
                          : reel.status === 'Draft'
                            ? 'مسودة'
                            : reel.status === 'Hidden'
                              ? 'محجوب'
                              : 'محذوف'}
                      </span>
                    </div>
                    <p className="text-xs font-bold line-clamp-2 text-white/95">
                      {reel.caption || 'بدون وصف'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-white/80">
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {fmt(reel.viewsCount)}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Heart className="w-3 h-3 text-pink-300" /> {fmt(reel.reactionsCount)}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3 text-amber-200" /> {fmt(reel.commentsCount)}
                      </span>
                      {(reel.reportsCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-300">
                          <Flag className="w-3 h-3" /> {reel.reportsCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="reel-card-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs gap-1 !bg-[#F2F6FA] !text-[#0F1B2D] !border-[#F2F6FA] hover:!bg-[#C4A35A] hover:!text-[#0F1B2D] hover:!border-[#C4A35A] shadow-[0_0_12px_rgba(242,246,250,0.25)]"
                    onClick={() => handleOpenPreview(reel)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    عرض
                  </Button>
                  {reel.status === 'Published' && (
                    <Button variant="gold" size="sm" className="h-8 px-2 text-xs" onClick={() => hideMutation.mutate(reel.id)} title="حجب">
                      <EyeOff className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {(reel.status === 'Hidden' || reel.status === 'Deleted') && (
                    <Button variant="primary" size="sm" className="h-8 px-2 text-xs" onClick={() => restoreMutation.mutate(reel.id)} title="استعادة">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="danger" size="sm" className="h-8 px-2 text-xs" onClick={() => handleDelete(reel)} title="حذف">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <span
                    className="ms-auto text-[10px] text-white/50 font-bold self-center"
                    title={reelPublishedAt(reel)}
                  >
                    {formatRelativeArabicTime(reelPublishedAt(reel))}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-[#8B9CB0] font-bold px-1">
            <div>إجمالي النتائج: {pagedReels?.totalCount || 0} مقطع</div>
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

      <ReelPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        reel={selectedReel}
        onReelUpdated={() => refetch()}
      />
    </AdminShell>
  );
}
