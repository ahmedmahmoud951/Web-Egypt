'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialAdminApi } from '@/api/socialAdmin';
import { AdminReelFilter, ReelDto } from '@/types/social';
import { AdminShell } from '@/components/admin/AdminShell';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { ReelPreviewModal } from '@/components/social/ReelPreviewModal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatArabicDate } from '@/lib/utils';
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

  // Queries
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin', 'reels', 'stats'],
    queryFn: () => socialAdminApi.getReelStats(),
  });

  const { data: pagedReels, isLoading: isReelsLoading, refetch } = useQuery({
    queryKey: ['admin', 'reels', filter],
    queryFn: () => socialAdminApi.getReels(filter),
  });

  // Real-time synchronization
  useEffect(() => {
    signalRService.start();

    const unsubs = [
      signalRService.onReelPublished(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      }),
      signalRService.onReelHidden(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      }),
      signalRService.onReelRestored(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      }),
      signalRService.onReelDeleted(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      }),
      signalRService.onReelReactionUpdated(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      }),
      signalRService.onReelCommentAdded(() => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
      }),
      signalRService.onNewReelReport((msg) => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'reels'] });
        flash.info(`بلاغ جديد على ريلز: ${msg.reason}`);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, flash]);

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
      message: `«${reel.caption.slice(0, 35) || 'مقطع ريلز'}» — سيتم حذف المقطع نهائياً.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(reel.id);
  };

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
            <span className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 grid place-items-center shadow-lg">
              <Film className="w-6 h-6 text-[#C4A35A]" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">إدارة مقاطع الريلز</h1>
                <span className="social-hero-badge">
                  <Sparkles className="w-3 h-3" />
                  Facebook Reels Style
                </span>
              </div>
              <p className="text-xs text-white/75 mt-1 font-semibold">
                مراقبة الفيديوهات القصيرة بإحصائيات حيّة ومعاينة سينمائية مثل فيسبوك
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
                  {isStatsLoading ? '…' : Number(kpi.value).toLocaleString('ar-EG')}
                </div>
              </div>
            );
          })}
        </div>

        <div className="social-filter space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-black text-[#0F1B2D]">
              <Filter className="w-4 h-4 text-[#C4A35A]" />
              تصفية وبحث متقدم
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="w-4 h-4 text-[#1F6B7A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث باسم المستخدم، الوصف، أو Reel ID..."
                value={filter.search}
                onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value, page: 1 }))}
                className="!pr-9"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value as any, page: 1 }))}
            >
              <option value="">جميع الحالات</option>
              <option value="Published">منشور</option>
              <option value="Draft">مسودة</option>
              <option value="Hidden">محجوب</option>
              <option value="Deleted">محذوف</option>
            </select>
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter((f) => ({ ...f, dateFrom: e.target.value, page: 1 }))}
              title="من"
            />
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter((f) => ({ ...f, dateTo: e.target.value, page: 1 }))}
              title="إلى"
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

        {isReelsLoading ? (
          <div className="reels-feed">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
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
                <div className="reel-card-media" onClick={() => handleOpenPreview(reel)}>
                  <video src={reel.mediaUrl} muted playsInline preload="metadata" />
                  <div className="reel-card-scrim" />
                  <span className="reel-card-play">
                    <span className="w-12 h-12 rounded-full bg-white/20 backdrop-blur border border-white/40 grid place-items-center">
                      <Eye className="w-5 h-5" />
                    </span>
                  </span>
                  <div className="reel-card-body space-y-2">
                    <div className="flex items-center justify-between gap-2">
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
                        <Eye className="w-3 h-3" /> {reel.viewsCount.toLocaleString('ar-EG')}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Heart className="w-3 h-3 text-pink-300" /> {reel.reactionsCount.toLocaleString('ar-EG')}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3 text-amber-200" /> {reel.commentsCount.toLocaleString('ar-EG')}
                      </span>
                      {reel.reportsCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-rose-300">
                          <Flag className="w-3 h-3" /> {reel.reportsCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="reel-card-actions">
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1 !border-white/20 !text-white hover:!bg-white/10" onClick={() => handleOpenPreview(reel)}>
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
                  <span className="ms-auto text-[10px] text-white/50 font-bold self-center">
                    {formatArabicDate(reel.createdAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-xs text-[#5A6D80] font-bold px-1">
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

      <ReelPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        reel={selectedReel}
        onReelUpdated={() => refetch()}
      />
    </AdminShell>
  );
}
