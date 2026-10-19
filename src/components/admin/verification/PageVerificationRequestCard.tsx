'use client';

import React from 'react';
import Link from 'next/link';
import { PageVerificationRequestItem } from '@/api/verificationAdmin';
import { resolveMediaUrl } from '@/lib/media';
import { formatArabicDate } from '@/lib/utils';
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
  Eye,
  Phone,
  MessageCircle,
  User,
  Shield,
  Building2,
  Globe,
  Tag,
  Users,
  Check,
  Image as ImageIcon,
  AlertCircle,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import { auditVerificationDocument } from '@/lib/verificationAuditHelper';

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

interface PageVerificationRequestCardProps {
  request: PageVerificationRequestItem;
  onInspect: (request: PageVerificationRequestItem) => void;
  onApprove: (request: PageVerificationRequestItem) => void;
  onReject: (request: PageVerificationRequestItem) => void;
  onPreviewImage?: (url: string, title: string) => void;
}

export function PageVerificationRequestCard({
  request,
  onInspect,
  onApprove,
  onReject,
  onPreviewImage,
}: PageVerificationRequestCardProps) {
  const isPending = request.status === 'Pending';
  const isApproved = request.status === 'Approved';
  const isRejected = request.status === 'Rejected';

  // National ID detection
  const effectiveNationalId = request.applicantNationalId || request.ownerNationalId;
  const hasNationalId = Boolean(effectiveNationalId && effectiveNationalId.length >= 10);
  const parsedNid = parseQuickNationalId(effectiveNationalId);
  const docAudit = auditVerificationDocument(request);

  // Status Badge
  const renderStatusBadge = () => {
    if (isPending) {
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-black inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse">
          <Hourglass className="w-3.5 h-3.5" />
          قيد المراجعة والتدقيق
        </span>
      );
    }
    if (isApproved) {
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-black inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          <ShieldCheck className="w-3.5 h-3.5" />
          معتمدة وموثقة رسمياً
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 font-black inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.25)]">
          <Ban className="w-3.5 h-3.5" />
          مرفوض
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
        {request.status}
      </span>
    );
  };

  const rawPhone = request.ownerPhoneNumber || request.officialPhone;
  const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '').replace(/^0/, '') : '';
  const isPageIdVerified = docAudit.isVerifiedId || Boolean(request.nationalIdFrontUrl && request.nationalIdBackUrl) || Boolean(request.hasOwnerNationalIdOnFile);
  const isPageFrontOnly = !isPageIdVerified && Boolean(request.nationalIdFrontUrl && !request.nationalIdBackUrl);

  return (
    <div
      className={`group relative rounded-3xl p-4 sm:p-5 transition-all duration-300 text-right flex flex-col justify-between overflow-hidden ${
        isPageIdVerified
          ? 'bg-gradient-to-b from-[#06241b] via-[#091b24] to-slate-950 border-2 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/30'
          : isPageFrontOnly
          ? 'bg-gradient-to-b from-[#131d27] via-[#0c1622] to-slate-950 border-2 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30 hover:border-amber-400 hover:shadow-amber-500/20'
          : 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-emerald-500/30 hover:border-emerald-400/70 hover:shadow-[0_0_35px_rgba(16,185,129,0.2)]'
      }`}
    >
      {/* Top glowing ambient highlight */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 opacity-80" />

      {/* DISTINCTIVE TOP VERIFIED ID BANNER FOR PAGE */}
      {isPageIdVerified ? (
        <div className="relative z-10 -mx-1 -mt-1 mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 via-teal-600/20 to-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-black flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🪪 بطاقة هوية منشئ الصفحة مربوطة ومطابقة رسمياً ✓</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/50 text-[10px]">
            {request.nationalIdBackUrl ? 'وجه وظهر' : 'هوية مسجلة'}
          </span>
        </div>
      ) : isPageFrontOnly ? (
        <div className="relative z-10 -mx-1 -mt-1 mb-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-orange-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-black flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ وجه بطاقة منشئ الصفحة مرفوع فقط — الظهر غير مرفوع</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/50 text-[10px]">
            ناقص الظهر ⚠️
          </span>
        </div>
      ) : null}

      <div className="space-y-4">
        {/* ROW 1: TAG + STATUS BADGE */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-black">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>توثيق صفحة رسمية / تجارية</span>
          </div>

          <div className="shrink-0">{renderStatusBadge()}</div>
        </div>

        {/* ROW 2: PAGE IDENTITY (Avatar, Name, Slug, Category, Followers) */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
          <div
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600/30 to-teal-800/40 border border-emerald-400/30 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer hover:opacity-90 shadow-md group/avatar"
            onClick={() => {
              if (request.pageAvatarUrl && onPreviewImage) {
                onPreviewImage(resolveMediaUrl(request.pageAvatarUrl), `شعار صفحة: ${request.pageName}`);
              }
            }}
            title="انقر لتكبير شعار الصفحة"
          >
            {request.pageAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaUrl(request.pageAvatarUrl)}
                alt={request.pageName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
              />
            ) : (
              <Building2 className="w-7 h-7 text-emerald-400" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-white text-base truncate group-hover:text-emerald-300 transition-colors">
                {request.pageName}
              </h4>
              {request.pageSlug && (
                <Link
                  href={`/p/${request.pageSlug}`}
                  target="_blank"
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1"
                  title="عرض الصفحة العامة"
                >
                  <span>@{request.pageSlug}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
              {request.pageCategory && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
                  {request.pageCategory}
                </span>
              )}
              {request.followersCount !== undefined && (
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>{request.followersCount.toLocaleString('ar-EG')} متابع</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: OWNER / CREATOR IDENTITY */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>منشئ ومالك الصفحة:</span>
            </span>

            {request.ownerUserId && (
              <Link
                href={`/admin/users/${request.ownerUserId}`}
                target="_blank"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline inline-flex items-center gap-1"
                title="عرض ملف المستخدم في لوحة الأدمن"
              >
                <span>ملف المستخدم</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-sky-500/20 border border-white/10 flex items-center justify-center font-black text-amber-300 text-xs shrink-0 cursor-pointer overflow-hidden"
                onClick={() => {
                  if (request.ownerAvatarUrl && onPreviewImage) {
                    onPreviewImage(resolveMediaUrl(request.ownerAvatarUrl), `صاحب الصفحة: ${request.ownerName || 'المستخدم'}`);
                  }
                }}
                title="صورة صاحب الصفحة"
              >
                {request.ownerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(request.ownerAvatarUrl)}
                    alt={request.ownerName || 'مالك الصفحة'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(request.ownerName || request.applicantName || 'م').charAt(0)}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">
                  {request.ownerName || request.applicantName || 'غير مسجل'}
                </div>
                {rawPhone && (
                  <div dir="ltr" className="text-[11px] font-mono text-cyan-400 truncate">
                    {rawPhone}
                  </div>
                )}
              </div>
            </div>

            {/* Direct Contact Buttons */}
            {rawPhone && (
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${rawPhone}`}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/80 transition-colors shadow-sm"
                  title="اتصال هاتفي"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                {cleanPhone && (
                  <a
                    href={`https://wa.me/20${cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/80 transition-colors shadow-sm"
                    title="محادثة واتساب مباشرة"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ROW 4: NATIONAL ID & IDENTITY VERIFICATION STATUS */}
        {hasNationalId ? (
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>الرقم القومي مسجل ومطابق لصاحب الحساب</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                مطابق وموثق ✓
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="font-mono font-black text-white text-sm tracking-wider" dir="ltr">
                🪪 {effectiveNationalId}
              </div>
              {parsedNid && (
                <div className="text-[11px] text-slate-300 font-medium flex items-center gap-2">
                  {parsedNid.governorate && <span>📍 {parsedNid.governorate}</span>}
                  <span>• {parsedNid.gender}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-emerald-300/80 font-medium">
              تم سحب وتطابق الرقم القومي تلقائياً من بيانات المستخدم المعتمدة مسبقاً.
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>بانتظار التحقق اليدوي من صور البطاقة المرفقة أدناه</span>
          </div>
        )}

        {/* ROW 4.5: DOCUMENT AUTHENTICITY / DUMMY DETECTOR */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            docAudit.isDummy
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30'
              : docAudit.isVerifiedId
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black flex items-center gap-1.5">
              {docAudit.isDummy ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
              ) : docAudit.isVerifiedId ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span className={docAudit.isDummy ? 'text-rose-300' : docAudit.isVerifiedId ? 'text-emerald-300' : 'text-white'}>
                {docAudit.statusLabel}
              </span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                docAudit.isDummy
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                  : docAudit.isVerifiedId
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {docAudit.isDummy ? 'بانتظار الوثائق ⚠️' : docAudit.isVerifiedId ? 'موثوقة ✓' : 'يدوي'}
            </span>
          </div>
          {docAudit.isDummy && (
            <p className="text-[11px] text-amber-200/80 pt-1.5 leading-relaxed">
              {docAudit.reason}
            </p>
          )}
        </div>

        {/* ROW 5: ATTACHED DOCUMENTS THUMBNAILS (ID Front, Back, Commercial Register, Tax Card) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>المستندات والوثائق المرفقة:</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* National ID Front */}
            {request.nationalIdFrontUrl ? (
              <div
                className="relative group/doc h-16 rounded-xl bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-1 shadow-sm"
                onClick={() => onPreviewImage?.(resolveMediaUrl(request.nationalIdFrontUrl!), 'وجه البطاقة الشخصية لمنشئ الصفحة')}
                title="عرض وجه البطاقة لمنشئ الصفحة"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(request.nationalIdFrontUrl)}
                  alt="وجه البطاقة"
                  className="w-full h-full object-cover rounded-lg group-hover/doc:scale-105 transition-transform"
                />
                <span className="absolute bottom-0 inset-x-0 bg-emerald-950/90 text-[9px] text-emerald-200 font-black text-center py-0.5">
                  وجه البطاقة ✓
                </span>
              </div>
            ) : null}

            {/* National ID Back */}
            {request.nationalIdBackUrl ? (
              <div
                className="relative group/doc h-16 rounded-xl bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 overflow-hidden cursor-pointer flex flex-col items-center justify-center p-1 shadow-sm"
                onClick={() => onPreviewImage?.(resolveMediaUrl(request.nationalIdBackUrl!), 'ظهر البطاقة الشخصية لمنشئ الصفحة')}
                title="عرض ظهر البطاقة لمنشئ الصفحة"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(request.nationalIdBackUrl)}
                  alt="ظهر البطاقة"
                  className="w-full h-full object-cover rounded-lg group-hover/doc:scale-105 transition-transform"
                />
                <span className="absolute bottom-0 inset-x-0 bg-emerald-950/90 text-[9px] text-emerald-200 font-black text-center py-0.5">
                  ظهر البطاقة ✓
                </span>
              </div>
            ) : request.nationalIdFrontUrl ? (
              <div
                className="relative h-16 rounded-xl bg-amber-950/20 border-2 border-dashed border-amber-500/50 flex flex-col items-center justify-center p-1 text-center"
                title="ظهر البطاقة لمنشئ الصفحة غير مرفوع"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 mb-0.5" />
                <span className="text-[9px] font-bold text-amber-300">ظهر البطاقة غير مرفوع ⚠️</span>
              </div>
            ) : null}

            {/* Commercial Register */}
            {request.commercialRegister ? (
              <div
                className={`h-16 rounded-xl border p-2 flex flex-col justify-between ${
                  request.commercialRegisterDocumentUrl
                    ? 'bg-slate-950 border-amber-500/40 cursor-pointer hover:border-amber-400'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
                onClick={() => {
                  if (request.commercialRegisterDocumentUrl && onPreviewImage) {
                    onPreviewImage(resolveMediaUrl(request.commercialRegisterDocumentUrl), 'السجل التجاري');
                  }
                }}
                title={request.commercialRegisterDocumentUrl ? 'انقر لعرض مستند السجل التجاري' : 'سجل تجاري'}
              >
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>سجل تجاري</span>
                </div>
                <div className="font-mono text-[11px] text-white truncate font-bold" dir="ltr">
                  {request.commercialRegister}
                </div>
              </div>
            ) : null}

            {/* Tax Number */}
            {request.taxNumber ? (
              <div
                className={`h-16 rounded-xl border p-2 flex flex-col justify-between ${
                  request.taxCardDocumentUrl
                    ? 'bg-slate-950 border-cyan-500/40 cursor-pointer hover:border-cyan-400'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
                onClick={() => {
                  if (request.taxCardDocumentUrl && onPreviewImage) {
                    onPreviewImage(resolveMediaUrl(request.taxCardDocumentUrl), 'البطاقة الضريبية');
                  }
                }}
                title={request.taxCardDocumentUrl ? 'انقر لعرض مستند البطاقة الضريبية' : 'بطاقة ضريبية'}
              >
                <div className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span>بطاقة ضريبية</span>
                </div>
                <div className="font-mono text-[11px] text-white truncate font-bold" dir="ltr">
                  {request.taxNumber}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ROW 6: TIMESTAMPS & DETAILS */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>تاريخ تقديم الطلب:</span>
            <span className="text-white font-bold">{formatArabicDate(request.createdAt)}</span>
          </div>

          {request.planName && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-bold text-[10px] border border-amber-500/20">
              {request.planName}
            </span>
          )}
        </div>

        {/* REJECTION REASON IF REJECTED */}
        {isRejected && request.rejectionReason && (
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs space-y-1">
            <div className="font-black flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" />
              <span>سبب الرفض:</span>
            </div>
            <p className="text-[11px] leading-relaxed">{request.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS: Direct Approve, Reject, and Inspect */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2">
        {isPending ? (
          <>
            <button
              type="button"
              onClick={() => onApprove(request)}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>اعتماد وتوثيق ✅</span>
            </button>

            <button
              type="button"
              onClick={() => onReject(request)}
              className="h-10 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              title="رفض الطلب"
            >
              <XCircle className="w-4 h-4" />
              <span>رفض</span>
            </button>
          </>
        ) : (
          <div className="flex-1 text-center py-1 text-xs text-slate-400 font-bold">
            {isApproved ? 'تم تفعيل شارة التوثيق بنجاح' : 'تم إنهاء مراجعة الطلب'}
          </div>
        )}

        <button
          type="button"
          onClick={() => onInspect(request)}
          className="h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
          title="معاينة وفحص كافة المستندات والتفاصيل"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
          <span>معاينة وفحص</span>
        </button>
      </div>
    </div>
  );
}
