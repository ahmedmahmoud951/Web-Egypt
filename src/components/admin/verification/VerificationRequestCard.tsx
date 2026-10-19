'use client';

import React, { useState } from 'react';
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
  AlertTriangle,
  Bell,
  Smartphone,
  ZoomIn,
} from 'lucide-react';
import { auditVerificationDocument } from '@/lib/verificationAuditHelper';
import { AvatarZoomModal } from './AvatarZoomModal';

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
  const century = clean[0] === '3' ? 2000 : clean[0] === '2' ? 1900 : null;
  const year = century ? century + parseInt(clean.slice(1, 3), 10) : null;
  const age = year ? new Date().getFullYear() - year : null;
  const govCode = clean.slice(7, 9);
  const governorate = EGYPT_GOVERNORATES_MAP[govCode] || null;
  const genderDigit = parseInt(clean[12], 10);
  const gender = genderDigit % 2 === 1 ? 'ذكر' : 'أنثى';
  const formatted = `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;
  return { governorate, gender, age, formatted, clean };
}

interface VerificationRequestCardProps {
  request: VerificationRequestItem;
  onInspect: (request: VerificationRequestItem) => void;
  onApprove: (request: VerificationRequestItem) => void;
  onReject: (request: VerificationRequestItem) => void;
  onReview: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  onRequestReupload?: (request: VerificationRequestItem) => void;
  onPreviewAvatar?: (request: VerificationRequestItem) => void;
  onPreviewImage?: (url: string, title: string) => void;
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
  onRequestReupload,
  onPreviewAvatar,
  onPreviewImage,
  normalizeStatus,
  isActionable,
}: VerificationRequestCardProps) {
  const [avatarZoomOpen, setAvatarZoomOpen] = useState(false);
  const statusCode = normalizeStatus(request.status, request.statusName);
  const rawId = request.extractedNationalId;
  const parsed = parseQuickNationalId(rawId);
  const docAudit = auditVerificationDocument(request);
  const isReuploadSent = Boolean(
    request.adminNotes?.includes('إعادة رفع') ||
    statusCode === 2 ||
    request.status === 2 ||
    (request as any).status === 'UnderReview'
  );

  const userAvatar =
    request.userAvatarUrl ||
    (request.userAvatarMediaId ? `/api/media/${request.userAvatarMediaId}/file` : null);
  const resolvedAvatarUrl = resolveMediaUrl(userAvatar);

  const docs = request.documents || [];
  const docsCount = Number(request.documentsCount ?? docs.length ?? 0);

  const isFront = (d: any) => {
    if (!d) return false;
    const typeId = Number(d.documentType);
    if (typeId === 1) return true;
    if ([2, 3, 4, 5, 6, 7, 8, 99].includes(typeId)) return false;

    const t = String(d.documentType ?? '').toLowerCase();
    const name = String(d.documentTypeName ?? '').toLowerCase();
    const notes = String(d.notes ?? '').toLowerCase();
    const fileName = String(d.fileName ?? '').toLowerCase();

    // Explicit exclusions for selfies, personal photos, passports, etc.
    if (
      t.includes('selfie') || name.includes('selfie') || name.includes('سيلفي') ||
      name.includes('شخصية') || notes.includes('شخصية') || fileName.includes('selfie') ||
      t.includes('passport') || name.includes('جواز') ||
      t.includes('press') || name.includes('صحافة') ||
      t.includes('commercial') || name.includes('سجل') ||
      t.includes('tax') || name.includes('ضريب') ||
      t.includes('other') || name.includes('مستند آخر') || name.includes('أخرى')
    ) {
      return false;
    }

    return (
      t === 'nationalidfront' ||
      t.includes('front') ||
      name.includes('front') ||
      name.includes('وجه') ||
      name.includes('وش') ||
      notes.includes('وجه') ||
      notes.includes('وش')
    );
  };

  const isBack = (d: any) => {
    if (!d) return false;
    const typeId = Number(d.documentType);
    if (typeId === 2) return true;
    if ([1, 3, 4, 5, 6, 7, 8, 99].includes(typeId)) return false;

    const t = String(d.documentType ?? '').toLowerCase();
    const name = String(d.documentTypeName ?? '').toLowerCase();
    const notes = String(d.notes ?? '').toLowerCase();
    const fileName = String(d.fileName ?? '').toLowerCase();

    // Explicit exclusions
    if (
      t.includes('selfie') || name.includes('selfie') || name.includes('سيلفي') ||
      name.includes('شخصية') || notes.includes('شخصية') || fileName.includes('selfie') ||
      t.includes('passport') || name.includes('جواز') ||
      t.includes('press') || name.includes('صحافة') ||
      t.includes('commercial') || name.includes('سجل') ||
      t.includes('tax') || name.includes('ضريب') ||
      t.includes('other') || name.includes('مستند آخر') || name.includes('أخرى')
    ) {
      return false;
    }

    return (
      t === 'nationalidback' ||
      t.includes('back') ||
      name.includes('back') ||
      name.includes('ظهر') ||
      name.includes('ضهر') ||
      notes.includes('ظهر') ||
      notes.includes('ضهر')
    );
  };

  // Find genuine front and back National ID documents (NO blind fallback to docs[0])
  const frontDoc = docs.find(isFront) || null;
  const backDoc = docs.find(isBack) || null;
  const frontUrl = frontDoc ? resolveMediaUrl(frontDoc.documentUrl || frontDoc.fileUrl || frontDoc.mediaUrl || '') : null;
  const backUrl = backDoc ? resolveMediaUrl(backDoc.documentUrl || backDoc.fileUrl || backDoc.mediaUrl || '') : null;

  // Valid 14-digit Egyptian National ID check
  const isHasValid14Digits = Boolean(parsed?.clean && /^\d{14}$/.test(parsed.clean));
  const isOcrFailedOrZero = request.ocrConfidenceScore === 0;

  // 5 Distinct Mutually Exclusive Verification States:
  // 1. FULLY VERIFIED (مكتمل الوجهين - وجه وظهر معاً لبطاقة الرقم القومي الرسمية المعتمدة)
  const isFullyVerified = Boolean(
    ((frontDoc != null && backDoc != null) || (frontUrl && backUrl) || (docAudit.isVerifiedId && docAudit.hasBothSides)) &&
    isHasValid14Digits &&
    !isOcrFailedOrZero
  );

  // 2. GENUINE FRONT ONLY (وجه بطاقة الرقم القومي الرسمي فقط مرفوع — وبانتظار الظهر)
  // يتحقق فقط إذا كان هناك وجه معتمد ورقم قومي صالح، ومظهر الوجه مؤكد!
  const isFrontOnly = !isFullyVerified && Boolean(
    (frontDoc != null || Boolean(frontUrl)) && !backDoc && !backUrl &&
    isHasValid14Digits &&
    !isOcrFailedOrZero
  );

  // 3. UNVERIFIED OR RANDOM DOC (مرفوع صورة أو مستند ولكن لم يتم التأكد من أنه بطاقة رقم قومي رسمية)
  // يغطي حالة رفع صورة شخصية عادية أو أي صورة أخرى لم يتعرف عليها فاحص البطاقات
  const isUnverifiedOrRandomDoc = !isFullyVerified && !isFrontOnly && Boolean(
    (docs.length > 0 || frontDoc != null || Boolean(frontUrl) || docsCount > 0) &&
    (!isHasValid14Digits || isOcrFailedOrZero)
  );

  // 4. NON-ID DOCS ONLY (مرفق مستند بديل معروف كالسجل التجاري أو السيلفي)
  const isNonIdDocsOnly = !isFullyVerified && !isFrontOnly && !isUnverifiedOrRandomDoc && Boolean(
    (docs.length > 0 && !frontDoc && !backDoc) || docsCount > 0
  );

  // 5. MISSING ALL DOCS (لم يرفع أي مستندات إطلاقاً - 0 وثائق)
  const isMissingAllDocs = !isFullyVerified && !isFrontOnly && !isUnverifiedOrRandomDoc && !isNonIdDocsOnly;

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

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 transition-all duration-300 text-right flex flex-col justify-between ${
        isFullyVerified
          ? 'bg-gradient-to-b from-[#06241b] via-[#091b24] to-slate-950 border-2 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/30'
          : isFrontOnly
          ? 'bg-gradient-to-b from-[#131d27] via-[#0c1622] to-slate-950 border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.18)] ring-1 ring-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/25'
          : isUnverifiedOrRandomDoc
          ? 'bg-gradient-to-b from-[#22170d] via-[#161112] to-slate-950 border-2 border-amber-500/60 shadow-[0_0_28px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/25'
          : isNonIdDocsOnly
          ? 'bg-gradient-to-b from-[#1c1810] via-[#141215] to-slate-950 border-2 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/20'
          : 'bg-gradient-to-b from-[#1a0e14] via-[#120a11] to-slate-950 border-2 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.18)] ring-1 ring-rose-500/30 hover:border-rose-400 hover:shadow-rose-500/25'
      }`}
    >
      {/* Ambient hover glow */}
      <div
        className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none transition-colors ${
          isFullyVerified
            ? 'bg-emerald-500/15 group-hover:bg-emerald-500/25'
            : isFrontOnly || isUnverifiedOrRandomDoc
            ? 'bg-amber-500/15 group-hover:bg-amber-500/25'
            : isNonIdDocsOnly
            ? 'bg-amber-500/15 group-hover:bg-amber-500/25'
            : 'bg-rose-500/15 group-hover:bg-rose-500/25'
        }`}
      />

      {/* DISTINCTIVE TOP STATUS BANNERS */}
      {isFullyVerified ? (
        <div className="relative z-10 -mx-1 -mt-1 mb-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 via-emerald-600/20 to-teal-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-black flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🪪 بطاقة رقم قومي رسمية مكتملة ومطابقة (وجه وظهر) ✓</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 text-[10px] font-mono">
            وجه وظهر ✓
          </span>
        </div>
      ) : isFrontOnly ? (
        <div className="relative z-10 -mx-1 -mt-1 mb-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-orange-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-black flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ وجه البطاقة فقط مرفوع — ظهر البطاقة غير مرفوع</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/50 text-[10px] font-mono">
            ناقص الظهر ⚠️
          </span>
        </div>
      ) : isUnverifiedOrRandomDoc ? (
        <div className="relative z-10 -mx-1 -mt-1 mb-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-orange-600/25 to-amber-600/20 border border-amber-500/50 text-amber-300 text-[11px] font-black flex items-center justify-between shadow-[0_0_18px_rgba(245,158,11,0.2)]">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ صورة مرفقة قيد الفحص — لم يتم التأكد من أنها بطاقة رقم قومي</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/50 text-[10px] font-mono">
            فحص يدوي ⚠️
          </span>
        </div>
      ) : isNonIdDocsOnly ? (
        <div className="relative z-10 -mx-1 -mt-1 mb-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-orange-600/20 to-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-black flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ مرفق صورة شخصية / مستند غير متعلق بالبطاقة — بطاقة الرقم القومي غير مرفقة</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/50 text-[10px] font-mono">
            مطلوب البطاقة ⚠️
          </span>
        </div>
      ) : (
        <div className="relative z-10 -mx-1 -mt-1 mb-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/25 via-rose-600/20 to-red-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-black flex items-center justify-between shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <span>❌ تنبيه: لم يتم إرفاق بطاقة هوية حتى الآن</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/50 text-[10px] font-mono">
            غير مرفقة ❌
          </span>
        </div>
      )}

      <div className="space-y-3 sm:space-y-3.5 relative z-10">
        {/* TOP ROW: USER IDENTITY & STATUS */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* USER AVATAR WITH CLICK-TO-ENLARGE */}
            {resolvedAvatarUrl ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPreviewAvatar) {
                    onPreviewAvatar(request);
                  } else {
                    setAvatarZoomOpen(true);
                  }
                }}
                className={`group/avatar relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border-2 bg-slate-950 shrink-0 cursor-pointer shadow-lg transition-all duration-300 hover:scale-105 ring-2 ring-black/40 ${
                  isFullyVerified
                    ? 'border-emerald-500/60 hover:border-emerald-400 hover:shadow-emerald-500/25'
                    : isFrontOnly
                    ? 'border-amber-500/50 hover:border-amber-400 hover:shadow-amber-500/25'
                    : isNonIdDocsOnly
                    ? 'border-amber-500/50 hover:border-amber-400 hover:shadow-amber-500/25'
                    : 'border-rose-500/50 hover:border-rose-400 hover:shadow-rose-500/25'
                }`}
                title="انقر لتكبير صورة المستخدم 🔍"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvedAvatarUrl}
                  alt={request.userName || 'المستخدم'}
                  className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity text-amber-300">
                  <ZoomIn className="w-4 h-4 drop-shadow" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow" />
              </div>
            ) : (
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-slate-800 to-cyan-500/20 border border-white/10 flex items-center justify-center font-black text-amber-300 text-base sm:text-lg shrink-0 shadow-md">
                {(request.userName || 'م').charAt(0)}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow" />
              </div>
            )}

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-white text-xs sm:text-sm truncate group-hover:text-amber-300 transition-colors">
                  {request.userName || 'مستخدم بدون اسم'}
                </h4>
                {resolvedAvatarUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPreviewAvatar) {
                        onPreviewAvatar(request);
                      } else {
                        setAvatarZoomOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 px-1.5 py-0.5 rounded-md border border-amber-500/30 transition-colors cursor-pointer"
                    title="تكبير صورة المستخدم"
                  >
                    <ZoomIn className="w-2.5 h-2.5" />
                    <span>تكبير الصورة</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span dir="ltr" className="text-cyan-400 font-semibold">{request.userPhoneNumber}</span>
                {request.userPhoneNumber && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${request.userPhoneNumber}`}
                      className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="اتصال هاتفي"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://wa.me/20${request.userPhoneNumber.replace(/\D/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="مراسلة عبر واتساب"
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

        {/* NATIONAL ID STRIP (STRICT LTR - GUARANTEED NOT INVERTED) */}
        {rawId ? (
          <div
            className={`p-3 rounded-2xl bg-black/50 space-y-2 shadow-inner border ${
              isFullyVerified
                ? 'border-emerald-500/30'
                : isFrontOnly
                ? 'border-amber-500/30'
                : 'border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="text-xs">🦅</span>
                <span className={`text-[10px] font-bold ${
                  isFullyVerified
                    ? 'text-emerald-400/90'
                    : isFrontOnly
                    ? 'text-amber-400/90'
                    : 'text-rose-400/90'
                }`}>
                  الرقم القومي:
                </span>
                <span
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className="font-mono font-black text-white tracking-wider text-xs sm:text-sm select-all"
                >
                  {parsed?.formatted || rawId}
                </span>
              </span>
              {request.isAutoVerified && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  فحص ذكي ✓
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] text-slate-400 font-medium pt-0.5 border-t border-white/5">
              {parsed?.governorate && (
                <span className={isFullyVerified ? "text-emerald-300 font-bold" : "text-amber-300 font-bold"}>
                  📍 {parsed.governorate}
                </span>
              )}
              {parsed?.age && (
                <span>• 🎂 {parsed.age} سنة</span>
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
          <div
            className={`p-2.5 rounded-2xl bg-black/30 text-[11px] flex items-center gap-2 border ${
              isMissingAllDocs
                ? 'border-rose-500/30 text-rose-300/80'
                : 'border-slate-800 text-slate-400'
            }`}
          >
            <span className={isMissingAllDocs ? "text-rose-400 shrink-0" : "text-amber-400 shrink-0"}>
              {isMissingAllDocs ? "❌" : "📄"}
            </span>
            <span className="truncate">
              {isMissingAllDocs ? "لم يتم استخراج أو إرفاق رقم قومي للطلب" : "بانتظار الفحص والمعاينة لصور البطاقة المرفقة"}
            </span>
          </div>
        )}

        {/* DOCUMENT AUTHENTICITY & STATUS BOX */}
        <div
          className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col gap-2 text-xs transition-all ${
            isFullyVerified
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
              : isFrontOnly
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/20'
              : isUnverifiedOrRandomDoc
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20'
              : isNonIdDocsOnly
              ? 'bg-amber-950/40 border-orange-500/40 text-amber-300 shadow-[0_0_15px_rgba(249,115,22,0.12)] ring-1 ring-orange-500/20'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {isFullyVerified ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isFrontOnly ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : isUnverifiedOrRandomDoc ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : isNonIdDocsOnly ? (
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              )}
              <span className="font-black text-[11px] truncate">
                {isFullyVerified
                  ? 'بطاقة رقم قومي رسمية مكتملة (وجه وظهر) ✓'
                  : isFrontOnly
                  ? 'وجه البطاقة مرفوع فقط — ظهر البطاقة غير مرفوع ⚠️'
                  : isUnverifiedOrRandomDoc
                  ? 'صورة مرفقة قيد الفحص — لم يتم التأكد من أنها بطاقة رقم قومي ⚠️'
                  : isNonIdDocsOnly
                  ? 'مرفق صورة شخصية أو مستند بديل — بطاقة الرقم القومي غير مرفقة ⚠️'
                  : 'لم يتم إرفاق بطاقة هوية حتى الآن ❌'}
              </span>
            </div>

            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                isFullyVerified
                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50'
                  : isFrontOnly
                  ? 'bg-amber-500/25 text-amber-200 border-amber-500/50'
                  : isUnverifiedOrRandomDoc
                  ? 'bg-amber-500/25 text-amber-200 border-amber-500/50'
                  : isNonIdDocsOnly
                  ? 'bg-orange-500/25 text-orange-200 border-orange-500/50'
                  : 'bg-rose-500/25 text-rose-200 border-rose-500/50'
              }`}
            >
              {isFullyVerified
                ? 'رسمية ومطابقة ✓'
                : isFrontOnly
                ? 'ناقص الظهر ⚠️'
                : isUnverifiedOrRandomDoc
                ? 'فحص يدوي ⚠️'
                : isNonIdDocsOnly
                ? 'مطلوب البطاقة ⚠️'
                : 'غير مرفقة ❌'}
            </span>
          </div>

          {!isFullyVerified && isActionable && (
            <div
              className={`flex items-center justify-between gap-2 pt-1 border-t text-[10px] ${
                isFrontOnly || isUnverifiedOrRandomDoc ? 'border-amber-500/20' : isNonIdDocsOnly ? 'border-orange-500/20' : 'border-rose-500/20'
              }`}
            >
              {isReuploadSent ? (
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>تم إرسال الإشعار للمستخدم برفع البطاقة (بانتظار العميل)</span>
                </div>
              ) : (
                <>
                  <span className={`truncate font-semibold ${isFrontOnly || isUnverifiedOrRandomDoc ? 'text-amber-200' : isNonIdDocsOnly ? 'text-amber-200' : 'text-rose-200'}`}>
                    {isFrontOnly
                      ? 'بانتظار إرفاق ظهر البطاقة لاستكمال الاعتماد'
                      : isUnverifiedOrRandomDoc
                      ? 'الصورة المرفقة غير مؤكدة كبطاقة هوية (يرجى فحصها أو طلب إعادة الرفع)'
                      : isNonIdDocsOnly
                      ? 'المستند المرفق ليس بطاقة هوية (يرجى إشعار العميل برفع البطاقة)'
                      : 'بانتظار قيام العميل برفع صور بطاقة الهوية'}
                  </span>
                  {onRequestReupload && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestReupload(request);
                      }}
                      className={`px-2 py-1 rounded-lg text-slate-950 font-black flex items-center gap-1 transition shadow-sm active:scale-95 shrink-0 cursor-pointer ${
                        isFrontOnly || isUnverifiedOrRandomDoc ? 'bg-amber-500 hover:bg-amber-400' : isNonIdDocsOnly ? 'bg-amber-500 hover:bg-amber-400' : 'bg-rose-500 hover:bg-rose-400'
                      }`}
                      title={isFrontOnly ? 'إرسال إشعار للمستخدم لرفع ظهر البطاقة' : 'إرسال إشعار للمستخدم برفع بطاقة الهوية'}
                    >
                      <Bell className="w-3 h-3" />
                      <span>{isFrontOnly ? 'إشعار برفع ظهر البطاقة 🔔' : 'إشعار برفع بطاقة صالحة 🔔'}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

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

        {/* ATTACHED DOCUMENTS & NATIONAL ID CARDS PREVIEW */}
        {isMissingAllDocs ? (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-rose-400/90 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>المستندات الثبوتية (0):</span>
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString('ar-EG') : ''}
              </span>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onRequestReupload && isActionable) {
                  onRequestReupload(request);
                } else {
                  onInspect(request);
                }
              }}
              className="group/nodocs h-16 rounded-xl bg-rose-950/25 border-2 border-dashed border-rose-500/50 hover:border-rose-400 hover:bg-rose-950/40 flex items-center justify-center gap-2.5 p-2 text-rose-300 text-xs font-bold cursor-pointer transition-all shadow-sm"
              title="لم يتم رفع بطاقة الهوية — اضغط لإشعار المستخدم"
            >
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 group-hover/nodocs:scale-110 transition-transform animate-pulse" />
              <div className="flex flex-col items-center text-center">
                <span className="text-[11px] font-black text-rose-200">لم يتم إرفاق بطاقة الهوية حتى الآن ❌</span>
                <span className="text-[9px] text-rose-400 underline font-medium">اضغط لإرسال إشعار للعميل برفع البطاقة 🔔</span>
              </div>
            </div>
          </div>
        ) : isNonIdDocsOnly ? (
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-bold text-amber-400/90 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>المستندات المرفقة (غير مطابقة للبطاقة - {docs.length || docsCount}):</span>
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString('ar-EG') : ''}
              </span>
            </div>

            {/* Display non-ID documents with real labels */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              {docs.slice(0, 3).map((d) => {
                const url = resolveMediaUrl(d.documentUrl || d.fileUrl || d.mediaUrl || '');
                const label = verificationDocumentTypeLabel(d.documentType, d.documentTypeName);
                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (url && onPreviewImage) {
                        onPreviewImage(url, `${label} - ${request.userName}`);
                      } else {
                        onInspect(request);
                      }
                    }}
                    className="cursor-pointer group/doc relative w-20 h-14 rounded-xl bg-slate-950 border border-amber-500/50 hover:border-amber-400 overflow-hidden shrink-0 shadow-sm"
                    title={`${label} - انقر للمعاينة`}
                  >
                    {url ? (
                      <>
                        <img src={url} alt={label} className="w-full h-full object-cover group-hover/doc:scale-110 transition-transform" />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 text-[8px] font-black text-amber-300 text-center py-0.5 truncate px-1">
                          {label}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-[9px] p-1 text-center">
                        <FileText className="w-4 h-4 mb-0.5 text-amber-400/70" />
                        <span className="truncate">{label}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dashed alert box explaining that National ID is missing */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onRequestReupload && isActionable) {
                  onRequestReupload(request);
                } else {
                  onInspect(request);
                }
              }}
              className="h-14 rounded-xl bg-amber-950/20 border-2 border-dashed border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/40 flex items-center justify-between px-3 text-amber-300 text-xs font-bold cursor-pointer transition-all shadow-sm"
              title="اضغط لإشعار المستخدم برفع بطاقة الرقم القومي"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[10px] font-black">بطاقة الرقم القومي (وجه وظهر) غير مرفقة ⚠️</span>
              </div>
              <span className="text-[9px] text-amber-400 underline font-medium">طلب البطاقة 🔔</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
              <span>المستندات الثبوتية ({docs.length || docsCount || 1}):</span>
              <span className="text-slate-500 font-mono text-[10px]">
                {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString('ar-EG') : ''}
              </span>
            </div>

            {/* 2-Column Grid for Front & Back National ID */}
            {(frontUrl || backUrl) ? (
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                {/* Slot 1: National ID Front */}
                {frontUrl ? (
                  <div
                    className={`relative group/doc h-16 rounded-xl bg-slate-950 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-1 shadow-sm transition-transform active:scale-95 border ${
                      isUnverifiedOrRandomDoc
                        ? 'border-amber-500/50 hover:border-amber-400'
                        : 'border-emerald-500/50 hover:border-emerald-400'
                    }`}
                    onClick={() => {
                      if (onPreviewImage) {
                        onPreviewImage(frontUrl, isUnverifiedOrRandomDoc ? `صورة مرفقة قيد الفحص - ${request.userName}` : `وجه البطاقة الشخصية - ${request.userName}`);
                      } else {
                        onInspect(request);
                      }
                    }}
                    title={isUnverifiedOrRandomDoc ? "صورة مرفقة لم يتم التأكد من أنها بطاقة رقم قومي - انقر للمعاينة" : "عرض وجه بطاقة الرقم القومي"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frontUrl}
                      alt={isUnverifiedOrRandomDoc ? "صورة مرفقة قيد الفحص" : "وجه البطاقة"}
                      className="w-full h-full object-cover rounded-lg group-hover/doc:scale-105 transition-transform"
                    />
                    <span className={`absolute bottom-0 inset-x-0 text-[9px] font-black text-center py-0.5 ${
                      isUnverifiedOrRandomDoc ? 'bg-amber-950/90 text-amber-200' : 'bg-emerald-950/90 text-emerald-200'
                    }`}>
                      {isUnverifiedOrRandomDoc ? 'صورة قيد الفحص ⚠️' : 'وجه البطاقة ✓'}
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRequestReupload && isActionable) {
                        onRequestReupload(request);
                      } else {
                        onInspect(request);
                      }
                    }}
                    className="group/missing relative h-16 rounded-xl bg-amber-950/25 border-2 border-dashed border-amber-500/50 hover:border-amber-400 hover:bg-amber-950/40 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-1 text-center transition-all shadow-sm"
                    title="وجه البطاقة غير مرفوع — انقر لإشعار المستخدم برفع وجه البطاقة"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 mb-0.5 group-hover/missing:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-amber-300">وجه البطاقة غير مرفوع ⚠️</span>
                    <span className="text-[9px] text-amber-400/90 underline font-medium">إشعار برفع الوجه 🔔</span>
                  </div>
                )}

                {/* Slot 2: National ID Back */}
                {backUrl ? (
                  <div
                    className="relative group/doc h-16 rounded-xl bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-1 shadow-sm transition-transform active:scale-95"
                    onClick={() => {
                      if (onPreviewImage) {
                        onPreviewImage(backUrl, `ظهر البطاقة الشخصية - ${request.userName}`);
                      } else {
                        onInspect(request);
                      }
                    }}
                    title="عرض ظهر بطاقة الرقم القومي"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={backUrl}
                      alt="ظهر البطاقة"
                      className="w-full h-full object-cover rounded-lg group-hover/doc:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-emerald-950/90 text-[9px] text-emerald-200 font-black text-center py-0.5">
                      ظهر البطاقة ✓
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRequestReupload && isActionable) {
                        onRequestReupload(request);
                      } else {
                        onInspect(request);
                      }
                    }}
                    className="group/missing relative h-16 rounded-xl bg-amber-950/25 border-2 border-dashed border-amber-500/50 hover:border-amber-400 hover:bg-amber-950/40 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-1 text-center transition-all shadow-sm"
                    title="ظهر البطاقة غير مرفوع — انقر لإشعار المستخدم برفع ظهر البطاقة"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 mb-0.5 group-hover/missing:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-amber-300">ظهر البطاقة غير مرفوع ⚠️</span>
                    <span className="text-[9px] text-amber-400/90 underline font-medium">إشعار برفع الظهر 🔔</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ACTION BUTTONS FOOTER */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onInspect(request)}
          className="flex-1 py-2 px-2.5 sm:px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm min-h-[38px] active:scale-95 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span>فحص ومعاينة</span>
        </button>

        {onRequestReupload && isActionable && (
          <button
            type="button"
            onClick={() => onRequestReupload(request)}
            className={`p-2 rounded-xl border transition min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0 active:scale-95 cursor-pointer ${
              isReuploadSent
                ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35 hover:bg-emerald-500/25'
                : 'text-amber-300 bg-amber-500/15 border-amber-500/35 hover:bg-amber-500/25'
            }`}
            title={isReuploadSent ? "تم إرسال الإشعار للمستخدم ✓ (اضغط لإعادة الإشعار)" : "إرسال إشعار للمستخدم لتغيير صورة البطاقة 🔔"}
          >
            {isReuploadSent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Bell className="w-3.5 h-3.5" />}
          </button>
        )}

        {isActionable && (
          <>
            <button
              type="button"
              onClick={() => onApprove(request)}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md flex items-center gap-1 min-h-[38px] active:scale-95 shrink-0 cursor-pointer"
              title="اعتماد وتفعيل"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>اعتماد</span>
            </button>

            <button
              type="button"
              onClick={() => onReject(request)}
              className="py-2 px-2.5 sm:px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold transition min-h-[38px] active:scale-95 shrink-0 cursor-pointer"
              title="رفض الطلب"
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onDelete(request.id)}
          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
          title="حذف الطلب"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AVATAR ZOOM LIGHTBOX MODAL */}
      <AvatarZoomModal
        isOpen={avatarZoomOpen}
        onClose={() => setAvatarZoomOpen(false)}
        imageUrl={resolvedAvatarUrl}
        userName={request.userName}
        userPhoneNumber={request.userPhoneNumber}
        badgeName={request.badgeName}
      />
    </div>
  );
}
