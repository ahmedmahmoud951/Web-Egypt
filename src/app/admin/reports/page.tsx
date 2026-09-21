'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialAdminApi } from '@/api/socialAdmin';
import { CentralReportDto, ReportContentType } from '@/types/social';
import { AdminShell } from '@/components/admin/AdminShell';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { ReportDetailModal } from '@/components/social/ReportDetailModal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFlash } from '@/components/ui/FlashProvider';
import { formatArabicDate } from '@/lib/utils';
import { signalRService } from '@/lib/signalr';
import {
  Flag,
  Film,
  Sparkles,
  Newspaper,
  MessageSquare,
  User,
  Search,
  Filter,
  RotateCcw,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-[#8A9AAB]">جاري التحميل...</div>}>
      <AdminReportsContent />
    </React.Suspense>
  );
}

function AdminReportsContent() {
  const queryClient = useQueryClient();
  const flash = useFlash();

  // Filter State
  const [contentType, setContentType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const [selectedReport, setSelectedReport] = useState<CentralReportDto | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Queries
  const { data: pagedReports, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'reports', { page, pageSize, contentType, status, reason, dateFrom, dateTo, search }],
    queryFn: () =>
      socialAdminApi.getReports({
        page,
        pageSize,
        contentType,
        status,
        reason,
        dateFrom,
        dateTo,
        search,
      }),
  });

  // Real-time synchronization
  useEffect(() => {
    signalRService.start();

    const refreshLive = () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'reports'], type: 'active' });
    };

    const unsubs = [
      signalRService.onNewReelReport((msg) => {
        refreshLive();
        flash.info(`تم تلقي بلاغ جديد عن ريلز (${msg.reason})`);
      }),
      signalRService.onNewStatusReport((msg) => {
        refreshLive();
        flash.info(`تم تلقي بلاغ جديد عن حالة (${msg.reason})`);
      }),
      signalRService.onEventReported(() => {
        refreshLive();
      }),
      signalRService.onReelHidden(() => {
        refreshLive();
      }),
      signalRService.onReelDeleted(() => {
        refreshLive();
      }),
      signalRService.onStatusHidden(() => {
        refreshLive();
      }),
      signalRService.onStatusDeleted(() => {
        refreshLive();
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [queryClient, flash, refetch]);

  // Actions
  const hideMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.hideReportContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      flash.success('تم حجب المحتوى المخالف بنجاح.');
    },
    onError: () => flash.error('فشل حجب المحتوى.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => socialAdminApi.deleteReportContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      flash.success('تم حذف المحتوى المخالف نهائياً.');
    },
    onError: () => flash.error('فشل حذف المحتوى.'),
  });

  const handleDelete = async (rep: CentralReportDto) => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للمحتوى المخالف؟',
      message: `«${rep.contentTitle}» — سيتم حذف المحتوى نهائياً.`,
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    deleteMutation.mutate(rep.id);
  };

  const handleOpenDetail = (rep: CentralReportDto) => {
    setSelectedReport(rep);
    setIsDetailOpen(true);
  };

  const totalPages = Math.ceil((pagedReports?.totalCount || 0) / pageSize);

  const getContentIcon = (type: ReportContentType) => {
    switch (type) {
      case 'Reel':
        return <Film className="w-3.5 h-3.5 text-purple-600" />;
      case 'Status':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Event':
      case 'Post':
        return <Newspaper className="w-3.5 h-3.5 text-cyan-600" />;
      case 'Comment':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <User className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 text-right max-w-7xl mx-auto">
        {/* Page Head */}
        <div className="admin-page-head relative overflow-hidden">
          <div className="admin-row items-center gap-3">
            <span className="admin-page-icon bg-gradient-to-br from-[#9E1B2C] to-[#0F1B2D] text-[var(--egypt-gold)] shadow-[0_0_20px_rgba(158,27,44,0.35)] p-2.5 rounded-2xl">
              <ShieldAlert className="w-6 h-6" strokeWidth={2.2} />
            </span>
            <div className="admin-col gap-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#0F1B2D] flex items-center gap-2">
                المركز المركزي للبلاغات والإشراف (Central Moderation)
              </h1>
              <p className="text-xs text-[#5A6D80]">
                منظومة موحدة لإدارة وفحص بلاغات المجتمع على المنشورات، الريلز، الحالات، التعليقات، والحسابات
              </p>
            </div>
          </div>
        </div>

        {/* Content Type Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: '', label: 'كافة البلاغات', icon: Flag },
            { key: 'Event', label: 'المنشورات والأحداث', icon: Newspaper },
            { key: 'Reel', label: 'مقاطع الريلز', icon: Film },
            { key: 'Status', label: 'الحالات', icon: Sparkles },
            { key: 'Comment', label: 'التعليقات', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = contentType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setContentType(tab.key);
                  setPage(1);
                }}
                className={`btn-glow px-4 h-9 text-xs flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'btn-glow-primary bg-[#0F1B2D] text-white border-[var(--egypt-gold)] shadow-[0_0_15px_rgba(196,163,90,0.35)]'
                    : 'btn-glow-ghost text-slate-700 bg-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="admin-card p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-[#0F1B2D]">
              <Filter className="w-4 h-4 text-[var(--egypt-red)]" />
              <span>تصفية البلاغات والبحث</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => {
                setContentType('');
                setStatus('');
                setReason('');
                setDateFrom('');
                setDateTo('');
                setSearch('');
                setPage(1);
              }}
            >
              <RotateCcw className="w-3 h-3" />
              إعادة ضبط
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث بالمُبلّغ، الهاتف، أو العنوان..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 pr-9 pl-3 text-xs rounded-xl bg-white border border-slate-200 focus:border-[var(--egypt-nile)] shadow-sm"
              />
            </div>

            {/* Review Status */}
            <div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 text-xs rounded-xl bg-white border border-slate-200 focus:border-[var(--egypt-nile)] shadow-sm font-medium"
              >
                <option value="">جميع حالات المراجعة</option>
                <option value="Pending">قيد الانتظار (Pending)</option>
                <option value="ActionTaken">تم اتخاذ إجراء (ActionTaken)</option>
                <option value="Reviewed">تمت المراجعة (Reviewed)</option>
                <option value="Dismissed">تم الرفض / التجاهل (Dismissed)</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 text-xs rounded-xl bg-white border border-slate-200 focus:border-[var(--egypt-nile)] shadow-sm font-medium"
              >
                <option value="">جميع الأسباب</option>
                <option value="InaccurateLocation">موقع غير دقيق</option>
                <option value="SpamOrFake">محتوى مضلل أو زائف</option>
                <option value="Inappropriate">محتوى غير لائق</option>
                <option value="Duplicate">منشور مكرر</option>
                <option value="Expired">حدث منتهي</option>
                <option value="ViolenceOrHate">عنف أو كراهية</option>
                <option value="Harassment">مضايقة أو إساءة</option>
                <option value="Other">سبب آخر</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 text-xs rounded-xl bg-white border border-slate-200 focus:border-[var(--egypt-nile)] shadow-sm text-slate-700"
                title="تاريخ البدء"
              />
            </div>

            {/* Date To */}
            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 text-xs rounded-xl bg-white border border-slate-200 focus:border-[var(--egypt-nile)] shadow-sm text-slate-700"
                title="تاريخ الانتهاء"
              />
            </div>
          </div>
        </div>

        {/* Central Reports Table */}
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0F1B2D] text-white border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold">معرّف البلاغ</th>
                  <th className="py-3.5 px-4 font-bold">نوع المحتوى</th>
                  <th className="py-3.5 px-4 font-bold">المحتوى المُبلّغ عنه</th>
                  <th className="py-3.5 px-4 font-bold">المُبلّغ (Reporter)</th>
                  <th className="py-3.5 px-4 font-bold">السبب</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ البلاغ</th>
                  <th className="py-3.5 px-4 font-bold">الحالة</th>
                  <th className="py-3.5 px-4 font-bold">المشرف المسؤول</th>
                  <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/60">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-36" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-8 w-28" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="py-4 px-4 text-center"><Skeleton className="h-8 w-24 mx-auto" /></td>
                    </tr>
                  ))
                ) : pagedReports?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-bold">
                      لا توجد بلاغات مسجلة مطابقة لمعايير البحث.
                    </td>
                  </tr>
                ) : (
                  pagedReports?.items?.map((rep) => (
                    <tr
                      key={rep.id}
                      className="hover:bg-slate-50/80 transition-colors duration-150 group"
                    >
                      {/* Report ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        #{rep.id.slice(0, 8)}
                      </td>

                      {/* Content Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-bold text-[11px] text-slate-800">
                          {getContentIcon(rep.contentType)}
                          {rep.contentType}
                        </span>
                      </td>

                      {/* Content Details */}
                      <td className="py-3 px-4 max-w-xs">
                        <p
                          className="line-clamp-2 font-bold text-[#0F1B2D] cursor-pointer hover:text-[var(--egypt-nile)]"
                          onClick={() => handleOpenDetail(rep)}
                          title={rep.contentTitle}
                        >
                          {rep.contentTitle}
                        </p>
                        {rep.authorName && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            الناشر: {rep.authorName}
                          </span>
                        )}
                      </td>

                      {/* Reporter with Story Ring */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <UserAvatarWithStory
                          name={rep.reporterName}
                          avatarUrl={rep.reporterAvatar}
                          size="sm"
                          showName
                          subtitle={rep.reporterPhone}
                        />
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[#9E1B2C] font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          {rep.reason}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {formatArabicDate(rep.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${
                            rep.reviewStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : rep.reviewStatus === 'ActionTaken'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rep.reviewStatus === 'Reviewed'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {rep.reviewStatus === 'Pending'
                            ? 'قيد الانتظار'
                            : rep.reviewStatus === 'ActionTaken'
                            ? 'تم اتخاذ إجراء'
                            : rep.reviewStatus === 'Reviewed'
                            ? 'تمت المراجعة'
                            : 'تم الرفض'}
                        </span>
                      </td>

                      {/* Assigned Admin */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                        {rep.reviewedByAdminName || <span className="text-slate-400 italic">غير محدد</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1"
                            onClick={() => handleOpenDetail(rep)}
                            title="عرض التفاصيل واتخاذ إجراء"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            فحص
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => hideMutation.mutate(rep.id)}
                            title="حجب المحتوى مباشرة"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleDelete(rep)}
                            title="حذف المحتوى نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                إجمالي النتائج: {pagedReports?.totalCount || 0} بلاغ
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="font-bold text-[#0F1B2D]">
                  صفحة {page} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      <ReportDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        report={selectedReport}
        onReportUpdated={() => refetch()}
      />
    </AdminShell>
  );
}
