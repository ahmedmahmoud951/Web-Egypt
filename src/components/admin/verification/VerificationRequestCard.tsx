'use client';

import React from 'react';
import {
  VerificationRequestItem,
  verificationDocumentTypeLabel,
} from '@/api/verificationAdmin';
import { resolveMediaUrl } from '@/lib/media';
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Ban,
  ScanSearch,
  Hourglass,
  CircleSlash,
  ShieldOff,
  Eye,
  Trash2,
  Phone,
  MessageCircle,
  Cpu,
  User,
  Shield,
} from 'lucide-react';

const EGYPT_GOVERNORATES_MAP: Record<string, string> = {
  '01': 'القاهرة',
  '02': 'الإسكندرية',
  '03': 'بورسعيد',
  '04': 'السويس',
  '11': 'دمياط',
  '12': 'الدقهلية',
  '13': 'الشرقية',
  '14': 'القليوبية',
  '15': 'كفر الشيخ',
  '16': 'الغربية',
  '17': 'المنوفية',
  '18': 'البحيرة',
  '19': 'الإسماعيلية',
  '21': 'الجيزة',
  '22': 'بني سويف',
  '23': 'الفيوم',
  '24': 'المنيا',
  '25': 'أسيوط',
  '26': 'سوهاج',
  '27': 'قنا',
  '28': 'أسوان',
  '29': 'الأقصر',
  '31': 'البحر الأحمر',
  '32': 'الوادي الجديد',
  '33': 'مطروح',
  '34': 'شمال سيناء',
  '35': 'جنوب سيناء',
  '88': 'خارج مصر',
};

function parseQuickNationalId(id?: string) {
  if (!id || !/^\d{14}$/.test(id.trim())) return null;
  const clean = id.trim();
  const govCode = clean.slice(7, 9);
  const governorate = EGYPT_GOVERNORATES_MAP[govCode] || null;
  const genderDigit = parseInt(clean[12], 10);
  const gender = genderDigit % 2 === 1 ? 'ذكر' : 'أنثى';
  return { governorate, gender };
}

interface VerificationRequestCardProps {
  request: VerificationRequestItem;
  onInspect: (request: VerificationRequestItem) => void;
  onApprove: (request: VerificationRequestItem) => void;
  onReject: (request: VerificationRequestItem) => void;
  onReview: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  normalizeStatus: (status: any, name?: string) => number;
  isActionable: boolean;
}

export function VerificationRequestCard({
  request,
  onInspect,
  onApprove,
  onReject,
  onReview,
  onDelete,
  normalizeStatus,
  isActionable,
}: VerificationRequestCardProps) {
  const statusCode = normalizeStatus(request.status, request.statusName);
  const rawId = request.extractedNationalId;
  const parsed = parseQuickNationalId(rawId);

  // Status Badge Helper
  const renderStatusBadge = () => {
    switch (statusCode) {
      case 1:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-black inline-flex items-center gap-1 shadow-sm">
            <Hourglass className="w-3 h-3" />
            قيد الانتظار
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-black inline-flex items-center gap-1 shadow-sm">
            <ScanSearch className="w-3 h-3" />
            قيد المراجعة
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black inline-flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3 h-3" />
            معتمد وموثق
          </span>
        );
      case 4:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-black inline-flex items-center gap-1 shadow-sm">
            <Ban className="w-3 h-3" />
            مرفوض
          </span>
        );
      case 5:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-gray-500/15 text-gray-300 border border-gray-500/30 font-black inline-flex items-center gap-1">
            <CircleSlash className="w-3 h-3" />
            ملغي
          </span>
        );
      case 6:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-slate-500/15 text-slate-300 border border-slate-500/30 font-black inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            منتهي
          </span>
        );
      case 7:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-black inline-flex items-center gap-1">
            <ShieldOff className="w-3 h-3" />
            مسحوب
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] rounded-full bg-white/10 text-slate-300 border border-white/15 font-bold">
            {request.statusName}
          </span>
        );
    }
  };

  const docs = request.documents || [];

  return (
    <div className="group rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 p-4 sm:p-5 space-y-3.5 sm:space-y-4 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 text-right flex flex-col justify-between">
      <div className="space-y-3 sm:space-y-3.5">
        {/* TOP ROW: USER IDENTITY & STATUS */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center font-black text-amber-400 text-sm shrink-0 shadow-md">
              {(request.userName || 'م').charAt(0)}
            </div>
            <div className="min-w-0 space-y-0.5">
              <h4 className="font-black text-white text-xs sm:text-sm truncate group-hover:text-amber-400 transition-colors">
                {request.userName || 'مستخدم بدون اسم'}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span dir="ltr" className="text-cyan-400 font-semibold">{request.userPhoneNumber}</span>
                {request.userPhoneNumber && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${request.userPhoneNumber}`}
                      className="p-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="اتصال هاتفي"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://wa.me/20${request.userPhoneNumber.replace(/\D/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="واتساب"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0">{renderStatusBadge()}</div>
        </div>

        {/* NATIONAL ID STRIP (IF EXTRACTED) */}
        {rawId ? (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="font-mono font-black text-white tracking-wider flex items-center gap-1 min-w-0 truncate">
                <span className="text-amber-400 shrink-0">🪪</span>
                <span dir="ltr" className="truncate">{rawId}</span>
              </span>
              {request.isAutoVerified && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  فحص ذكي ✓
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-slate-400 font-medium">
              {parsed?.governorate && (
                <span className="text-amber-300 font-bold">📍 {parsed.governorate}</span>
              )}
              {parsed?.gender && (
                <span>• {parsed.gender === 'ذكر' ? '👨 ذكر' : '👩 أنثى'}</span>
              )}
              {request.ocrConfidenceScore && (
                <span className="text-cyan-400 font-mono">
                  • دقة: {Math.round(request.ocrConfidenceScore)}%
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-amber-400 shrink-0">📄</span>
            <span className="truncate">بانتظار الفحص اليدوي للوثائق المرفقة</span>
          </div>
        )}

        {/* BADGE & PLAN INFO */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-slate-400">نوع الشارة المطلوبة:</div>
            <div className="font-black text-white text-xs truncate flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{request.verificationTypeName}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-0.5">
            <div className="text-[10px] text-slate-400">الباقة والمدة:</div>
            <div className="font-bold text-emerald-400 text-xs truncate">
              {request.planPrice ? `${request.planPrice} ج.م` : 'مجاني'} • {request.requestedDurationDays} يوم
            </div>
          </div>
        </div>

        {/* ATTACHED DOCUMENTS THUMBNAILS */}
        {docs.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
              <span>المستندات المرفقة ({docs.length}):</span>
              <span className="text-slate-500 font-mono text-[10px]">{new Date(request.requestedAt).toLocaleDateString('ar-EG')}</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              {docs.slice(0, 3).map((d) => {
                const url = resolveMediaUrl(d.documentUrl || d.mediaUrl || '');
                const label = verificationDocumentTypeLabel(d.documentType, d.documentTypeName);
                return (
                  <div
                    key={d.id}
                    onClick={() => onInspect(request)}
                    className="cursor-pointer group/doc relative w-16 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 hover:border-cyan-500/50 transition-all active:scale-95"
                    title={label}
                  >
                    {url ? (
                      <img src={url} alt={label} className="w-full h-full object-cover group-hover/doc:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
              {docs.length > 3 && (
                <div
                  onClick={() => onInspect(request)}
                  className="cursor-pointer w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 hover:text-white shrink-0 active:scale-95"
                >
                  +{docs.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS FOOTER */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onInspect(request)}
          className="flex-1 py-2 px-2.5 sm:px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm min-h-[38px] active:scale-95"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span>فحص ومعاينة</span>
        </button>

        {isActionable && (
          <>
            <button
              type="button"
              onClick={() => onApprove(request)}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1 min-h-[38px] active:scale-95 shrink-0"
              title="اعتماد وتفعيل"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>اعتماد</span>
            </button>

            <button
              type="button"
              onClick={() => onReject(request)}
              className="py-2 px-2.5 sm:px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold transition min-h-[38px] active:scale-95 shrink-0"
              title="رفض"
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onDelete(request.id)}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0 active:scale-95"
          title="حذف الطلب"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
