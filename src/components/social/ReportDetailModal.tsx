'use client';

import React, { useState } from 'react';
import { CentralReportDto } from '@/types/social';
import { socialAdminApi } from '@/api/socialAdmin';
import { formatArabicDate } from '@/lib/utils';
import { UserAvatarWithStory } from '@/components/ui/UserAvatarWithStory';
import { Button } from '@/components/ui/Button';
import { useFlash } from '@/components/ui/FlashProvider';
import {
  X,
  Flag,
  Calendar,
  EyeOff,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Phone,
  User,
  Film,
  Sparkles,
  Newspaper,
  MessageSquare,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CentralReportDto | null;
  onReportUpdated?: () => void;
}

export function ReportDetailModal({
  isOpen,
  onClose,
  report,
  onReportUpdated,
}: ReportDetailModalProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [warningText, setWarningText] = useState('');
  const [showWarningInput, setShowWarningInput] = useState(false);
  const flash = useFlash();

  if (!isOpen || !report) return null;

  const handleResolve = async () => {
    try {
      await socialAdminApi.resolveReport(report.id, adminNotes);
      flash.success('تم حل البلاغ واعتماد الإجراء.');
      onReportUpdated?.();
      onClose();
    } catch {
      flash.error('فشل حل البلاغ.');
    }
  };

  const handleReject = async () => {
    try {
      await socialAdminApi.rejectReport(report.id, adminNotes);
      flash.success('تم رفض البلاغ وتجاهله.');
      onReportUpdated?.();
      onClose();
    } catch {
      flash.error('فشل رفض البلاغ.');
    }
  };

  const handleHideContent = async () => {
    try {
      await socialAdminApi.hideReportContent(report.id);
      flash.success('تم حجب المحتوى المخالف بنجاح.');
      onReportUpdated?.();
      onClose();
    } catch {
      flash.error('فشل حجب المحتوى.');
    }
  };

  const handleRestoreContent = async () => {
    try {
      await socialAdminApi.restoreReportContent(report.id);
      flash.success('تمت استعادة المحتوى وإتاحته.');
      onReportUpdated?.();
      onClose();
    } catch {
      flash.error('فشلت استعادة المحتوى.');
    }
  };

  const handleDeleteContent = async () => {
    const ok = await flash.confirm({
      title: 'حذف نهائي للمحتوى المبلغ عنه؟',
      message: 'سيتم حذف المحتوى المخالف نهائياً من المنظومة وقاعدة البيانات.',
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;

    try {
      await socialAdminApi.deleteReportContent(report.id);
      flash.success('تم حذف المحتوى المخالف نهائياً.');
      onReportUpdated?.();
      onClose();
    } catch {
      flash.error('فشل حذف المحتوى.');
    }
  };

  const handleWarnUser = async () => {
    if (!warningText.trim()) {
      flash.error('يرجى كتابة نص التحذير للمستخدم.');
      return;
    }

    try {
      await socialAdminApi.warnUser(report.id, warningText.trim());
      flash.success('تم توجيه التحذير لصاحب المحتوى وتوثيق الإجراء.');
      setShowWarningInput(false);
      onReportUpdated?.();
      onClose();
    } catch {
      flash.error('فشل توجيه التحذير.');
    }
  };

  const getContentIcon = () => {
    switch (report.contentType) {
      case 'Reel':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'Status':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'Event':
      case 'Post':
        return <Newspaper className="w-4 h-4 text-cyan-400" />;
      case 'Comment':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      default:
        return <User className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-[#0F1B2D] via-[#15283C] to-[#0A101D] text-white rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_0_1px_rgba(196,163,90,0.3)] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Flag className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                تفاصيل البلاغ #{report.id.slice(0, 8)}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 font-bold flex items-center gap-1">
                  {getContentIcon()}
                  {report.contentType}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تاريخ البلاغ: {formatArabicDate(report.createdAt)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Parties Grid (Reporter & Content Owner) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reporter Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                المُبلّغ (Reporter)
              </span>
              <div className="flex items-center gap-3 pt-1">
                <UserAvatarWithStory name={report.reporterName} size="md" />
                <div>
                  <div className="font-bold text-sm text-white">{report.reporterName}</div>
                  {report.reporterPhone && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" />
                      {report.reporterPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Owner Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[11px] font-bold text-[var(--egypt-gold)] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                صاحب المحتوى (Content Owner)
              </span>
              <div className="flex items-center gap-3 pt-1">
                <UserAvatarWithStory name={report.authorName || 'غير معروف'} size="md" />
                <div>
                  <div className="font-bold text-sm text-white">
                    {report.authorName || 'غير متوفر'}
                  </div>
                  {report.authorId && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      ID: {report.authorId.slice(0, 8)}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reported Content Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--egypt-gold)]">
              <span>المحتوى المُبلّغ عنه</span>
              <span className="text-slate-400 font-mono text-[11px]">ID: {report.contentId}</span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
              <h4 className="font-bold text-sm text-white">{report.contentTitle}</h4>
              {report.contentSnippet && (
                <p className="text-xs text-slate-300 leading-relaxed">{report.contentSnippet}</p>
              )}
            </div>

            {/* Media Link / Preview if available */}
            {report.mediaUrl && (
              <div className="pt-1">
                <a
                  href={report.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  معاينة الوسائط المرتبطة في نافذة آمنة
                </a>
              </div>
            )}
          </div>

          {/* Report Reason & Description */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 space-y-2">
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              سبب البلاغ: {report.reason}
            </div>
            {report.description && (
              <p className="text-xs text-slate-200 leading-relaxed">{report.description}</p>
            )}
            <div className="text-[11px] text-rose-300/80 pt-1">
              الحالة الحالية: <span className="font-bold">{report.reviewStatus}</span>
            </div>
          </div>

          {/* Admin Moderation History & Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">ملاحظات الإشراف / سجل الإجراءات</label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="اكتب ملاحظات إدارية لتوثيق الإجراء المتخذ..."
              className="w-full p-3 text-xs rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:border-[var(--egypt-gold)] focus:outline-none"
            />
            {report.adminNotes && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs text-slate-300">
                <span className="font-bold text-[var(--egypt-gold)]">السجل السابق: </span>
                {report.adminNotes}
              </div>
            )}
          </div>

          {/* User Warning Input (if toggled) */}
          {showWarningInput && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                توجيه تحذير رسمي لصاحب المحتوى
              </div>
              <textarea
                rows={2}
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                placeholder="نص رسالة التحذير التي ستوجه للمستخدم..."
                className="w-full p-3 text-xs rounded-xl bg-black/60 border border-amber-600/40 text-white placeholder-slate-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowWarningInput(false)} className="text-xs">
                  إلغاء
                </Button>
                <Button variant="gold" size="sm" onClick={handleWarnUser} className="text-xs">
                  إرسال وتوثيق التحذير
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-between flex-wrap gap-2">
          {/* Status Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              className="gap-1 text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              حل البلاغ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="gap-1 text-xs border-slate-500/40 text-slate-300 hover:bg-slate-500/20"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              رفض البلاغ
            </Button>
          </div>

          {/* Content Moderation Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWarningInput((s) => !s)}
              className="gap-1 text-xs text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              تحذير المستخدم
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleHideContent}
              className="gap-1 text-xs"
            >
              <EyeOff className="w-3.5 h-3.5" />
              حجب المحتوى
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRestoreContent}
              className="gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              استعادة
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteContent}
              className="gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف المحتوى
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
