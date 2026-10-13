'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageVerificationRequestItem } from '@/api/verificationAdmin';
import { resolveMediaUrl } from '@/lib/media';
import { formatArabicDate } from '@/lib/utils';
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Ban,
  ScanSearch,
  ZoomIn,
  ImageIcon,
  User,
  Phone,
  Calendar,
  MapPin,
  Cpu,
  Copy,
  Check,
  Shield,
  RotateCw,
  MessageCircle,
  Building2,
  Globe,
  Mail,
  Users,
  X,
  Hash,
  Share2,
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
  '88': 'خارج جمهورية مصر',
};

function parseEgyptianNationalId(id?: string) {
  if (!id || !/^\d{14}$/.test(id.trim())) return null;
  const clean = id.trim();
  const centuryDigit = parseInt(clean[0], 10);
  const century = centuryDigit === 2 ? 1900 : centuryDigit === 3 ? 2000 : null;
  if (!century) return null;
  const year = century + parseInt(clean.slice(1, 3), 10);
  const month = parseInt(clean.slice(3, 5), 10);
  const day = parseInt(clean.slice(5, 7), 10);
  const govCode = clean.slice(7, 9);
  const governorate = EGYPT_GOVERNORATES_MAP[govCode] || 'محافظة غير معروفة';
  const genderDigit = parseInt(clean[12], 10);
  const gender = genderDigit % 2 === 1 ? 'ذكر' : 'أنثى';
  const age = new Date().getFullYear() - year;

  const segments = {
    century: clean[0],
    year: clean.slice(1, 3),
    month: clean.slice(3, 5),
    day: clean.slice(5, 7),
    govCode,
    sequence: clean.slice(9),
  };

  const formatted = `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;
  return { year, month, day, governorate, gender, age, formatted, clean, segments };
}

interface PageVerificationInspectorModalProps {
  request: PageVerificationRequestItem;
  onClose: () => void;
  onApprove: (request: PageVerificationRequestItem) => void;
  onReject: (request: PageVerificationRequestItem) => void;
}

export function PageVerificationInspectorModal({
  request,
  onClose,
  onApprove,
  onReject,
}: PageVerificationInspectorModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);

  const effectiveNationalId = request.applicantNationalId || request.ownerNationalId;
  const parsedId = parseEgyptianNationalId(effectiveNationalId);
  const docAudit = auditVerificationDocument(request);

  const handleCopyId = () => {
    if (effectiveNationalId) {
      navigator.clipboard.writeText(effectiveNationalId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Compile all available documents into a unified list
  interface DocEntry {
    title: string;
    url: string;
    type: string;
  }
  const docs: DocEntry[] = [];
  if (request.nationalIdFrontUrl) {
    docs.push({ title: 'وجه بطاقة الرقم القومي', url: resolveMediaUrl(request.nationalIdFrontUrl), type: 'id_front' });
  }
  if (request.nationalIdBackUrl) {
    docs.push({ title: 'ظهر بطاقة الرقم القومي', url: resolveMediaUrl(request.nationalIdBackUrl), type: 'id_back' });
  }
  if (request.commercialRegisterDocumentUrl) {
    docs.push({ title: 'مستند السجل التجاري', url: resolveMediaUrl(request.commercialRegisterDocumentUrl), type: 'cr' });
  }
  if (request.taxCardDocumentUrl) {
    docs.push({ title: 'مستند البطاقة الضريبية', url: resolveMediaUrl(request.taxCardDocumentUrl), type: 'tax' });
  }
  if (request.businessLicenseUrl) {
    docs.push({ title: 'رخصة النشاط التجاري', url: resolveMediaUrl(request.businessLicenseUrl), type: 'license' });
  }
  if (request.officialLetterUrl) {
    docs.push({ title: 'الخطاب والتفويض الرسمي', url: resolveMediaUrl(request.officialLetterUrl), type: 'letter' });
  }
  if (request.documentUrl) {
    docs.push({ title: 'مستند إضافي مرفق', url: resolveMediaUrl(request.documentUrl), type: 'extra' });
  }

  const currentDoc = docs[selectedDocIndex] || docs[0];
  const isPending = request.status === 'Pending';
  const rawPhone = request.ownerPhoneNumber || request.officialPhone;
  const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '').replace(/^0/, '') : '';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[94vh] bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-950/80 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <Building2 className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white truncate">
                  معاينة وتدقيق توثيق: {request.pageName}
                </h2>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  صفحة رسمية
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>تاريخ التقديم: {formatArabicDate(request.createdAt)}</span>
                {request.planName && (
                  <span className="text-amber-300 font-bold">• {request.planName}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: PAGE & CREATOR SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Page Info */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Building2 className="w-4 h-4" />
                <span>بيانات ومعلومات الصفحة</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                  {request.pageAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(request.pageAvatarUrl)}
                      alt={request.pageName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-7 h-7 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-black text-white text-sm truncate">{request.pageName}</div>
                  {request.pageSlug && (
                    <Link
                      href={`/p/${request.pageSlug}`}
                      target="_blank"
                      className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>@{request.pageSlug}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  <div className="text-[11px] text-slate-400">
                    {request.pageCategory || 'نشاط عام'} • {request.followersCount?.toLocaleString('ar-EG') || 0} متابع
                  </div>
                </div>
              </div>

              {/* Extra business metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {request.commercialRegister && (
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">السجل التجاري:</span>
                    <span className="font-mono font-bold text-amber-300" dir="ltr">{request.commercialRegister}</span>
                  </div>
                )}
                {request.taxNumber && (
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">البطاقة الضريبية:</span>
                    <span className="font-mono font-bold text-cyan-300" dir="ltr">{request.taxNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Creator / Owner Info */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="text-xs font-black text-amber-400 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>بيانات منشئ ومقدم الطلب</span>
                </span>
                {request.ownerUserId && (
                  <Link
                    href={`/admin/users/${request.ownerUserId}`}
                    target="_blank"
                    className="text-[11px] text-cyan-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>فتح الحساب</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center font-black text-amber-300 text-lg">
                  {request.ownerAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(request.ownerAvatarUrl)}
                      alt="صاحب الصفحة"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(request.ownerName || request.applicantName || 'م').charAt(0)}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-black text-white text-sm truncate">
                    {request.ownerName || request.applicantName || 'غير مسجل'}
                  </div>
                  {rawPhone && (
                    <div className="text-xs font-mono text-cyan-400" dir="ltr">
                      {rawPhone}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    المعرف: <span className="font-mono">{request.ownerUserId?.slice(0, 8) || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Direct Call / WhatsApp */}
              {rawPhone && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${rawPhone}`}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال</span>
                  </a>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/20${cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: NATIONAL ID CARD - ENRICHED AND AUTOMATICALLY VERIFIED */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-black text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>حالة التحقق من الهوية والرقم القومي</span>
              </span>

              {effectiveNationalId && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {effectiveNationalId ? (
              <div className="space-y-3">
                <div className="p-3.5 sm:p-4 rounded-xl bg-black/60 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>الرقم القومي المسجل لصاحب الصفحة (14 رقم - من اليسار لليمين):</span>
                    </div>
                    <div
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="font-mono text-lg sm:text-xl font-black text-white tracking-widest select-all"
                    >
                      {parsedId?.formatted || effectiveNationalId}
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black self-start sm:self-auto shrink-0">
                    مسجل ومطابق مسبقاً ✓
                  </div>
                </div>

                {parsedId && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-400 block">المحافظة:</span>
                      <span className="font-black text-amber-300">{parsedId.governorate}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-400 block">النوع / الجنس:</span>
                      <span className="font-black text-cyan-300">{parsedId.gender}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-400 block">تاريخ الميلاد:</span>
                      <span className="font-black text-white">{parsedId.year}/{parsedId.month}/{parsedId.day}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-400 block">السن التقديري:</span>
                      <span className="font-black text-white">{parsedId.age} سنة</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                <div className="font-bold">بانتظار التحقق اليدوي من المستندات المرفقة:</div>
                <p className="text-[11px] text-slate-400">
                  يمكنك مراجعة وثائق وصور البطاقة الشخصية المرفقة أدناه والتحقق منها يدوياً ثم اعتماد وتوثيق الصفحة مباشرة.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 2.5: DOCUMENT AUTHENTICITY & FRAUD AUDIT */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              docAudit.isDummy
                ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/70 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.18)] ring-1 ring-rose-500/30'
                : docAudit.isVerifiedId
                ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3 mb-2.5">
              <div className="flex items-center gap-2">
                {docAudit.isDummy ? (
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                  </div>
                ) : docAudit.isVerifiedId ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="font-black text-white text-xs sm:text-sm">
                    فاحص أصالة المستند وصور البطاقة الشخصية (Authenticity Check)
                  </h4>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">
                    التحقق من أن الصور المرفوعة بطاقات رسمية وليست صوراً تجريبية أو شخصية
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 border shadow-sm ${
                    docAudit.isDummy
                      ? 'bg-rose-500/25 text-rose-200 border-rose-500/50 animate-pulse'
                      : docAudit.isVerifiedId
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {docAudit.isDummy ? '⚠️ مستند تجريبي (غير صالح)' : docAudit.isVerifiedId ? '✅ بطاقة رسمية معتمدة' : '📄 بانتظار الفحص'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className={`font-semibold leading-relaxed ${docAudit.isDummy ? 'text-rose-200' : docAudit.isVerifiedId ? 'text-emerald-200' : 'text-slate-300'}`}>
                {docAudit.reason}
              </p>
              {docAudit.details && (
                <p className="text-[11px] text-slate-400">
                  {docAudit.details}
                </p>
              )}
            </div>
          </div>

          {/* SECTION 3: ATTACHED DOCUMENTS GALLERY & LIGHTBOX */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>الوثائق والمستندات الرسمية المرفقة ({docs.length})</span>
              </h3>

              {currentDoc && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImageRotation((r) => (r + 90) % 360)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 transition-colors"
                    title="تدوير الصورة"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>تدوير</span>
                  </button>
                  <a
                    href={currentDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-400 flex items-center gap-1 transition-colors"
                    title="فتح بالحجم الكامل"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>الحجم الكامل</span>
                  </a>
                </div>
              )}
            </div>

            {docs.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/30 border border-slate-800 text-center space-y-2 text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <div>لم يتم إرفاق مستندات أو صور إضافية مع هذا الطلب.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Thumbnails row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {docs.map((doc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedDocIndex(idx);
                        setImageRotation(0);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 ${
                        selectedDocIndex === idx
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                          : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{doc.title}</span>
                    </button>
                  ))}
                </div>

                {/* Main Image Preview */}
                <div className="relative rounded-2xl bg-black/60 border border-slate-800 min-h-[300px] max-h-[460px] flex items-center justify-center p-4 overflow-hidden">
                  {/* Floating Authenticity Badge on Image */}
                  {docAudit.isDummy ? (
                    <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-black border border-white/20 shadow-2xl flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                      <span>⚠️ مستند تجريبي (ليس بطاقة تحقيق شخصية رسمية)</span>
                    </div>
                  ) : docAudit.isVerifiedId ? (
                    <div className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-black border border-white/20 shadow-2xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>✅ بطاقة هوية رسمية سليمة ومطابقة</span>
                    </div>
                  ) : null}

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentDoc.url}
                    alt={currentDoc.title}
                    style={{ transform: `rotate(${imageRotation}deg)` }}
                    className="max-h-[420px] max-w-full object-contain rounded-xl transition-transform duration-300"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-md text-xs font-bold text-white border border-white/10">
                    {currentDoc.title}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER WITH DIRECT APPROVE & REJECT BUTTONS */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 sticky bottom-0 z-20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            إغلاق المعاينة
          </button>

          {isPending && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onReject(request);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض الطلب</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onApprove(request);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>اعتماد وتوثيق الصفحة ✅</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
