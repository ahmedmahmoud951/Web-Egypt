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

  // Format with friendly spaces: 2 98 01 01 01 01234
  const formatted = `${clean[0]} ${clean.slice(1, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)} ${clean.slice(9)}`;

  return { year, month, day, governorate, gender, age, formatted };
}

interface NationalIdInspectorModalProps {
  request: VerificationRequestItem;
  isLoading?: boolean;
  onClose: () => void;
  onApprove: (request: VerificationRequestItem) => void;
  onReject: (request: VerificationRequestItem) => void;
  onReview: (requestId: string) => void;
  onDelete: (requestId: string) => void;
  isActionable: boolean;
  isPending: boolean;
}

export function NationalIdInspectorModal({
  request,
  isLoading,
  onClose,
  onApprove,
  onReject,
  onReview,
  onDelete,
  isActionable,
  isPending,
}: NationalIdInspectorModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);

  // Parse National ID data
  const rawId = request.extractedNationalId;
  const parsedId = parseEgyptianNationalId(rawId);

  const handleCopyId = () => {
    if (rawId) {
      navigator.clipboard.writeText(rawId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const docs = request.documents || [];
  const currentDoc = docs[selectedDocIndex];
  const currentDocUrl = currentDoc ? resolveMediaUrl(currentDoc.documentUrl || currentDoc.mediaUrl || '') : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] overflow-y-auto p-4 sm:p-7 text-right shadow-2xl relative space-y-4 sm:space-y-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* TOP HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4 sm:pb-5">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] sm:text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">فاحص الهوية والتوثيق الحكومي الذكي (Smart OCR Inspector)</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white flex flex-wrap items-center gap-2 mt-1">
              <span>طلب توثيق: {request.userName}</span>
              {request.isAutoVerified && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  توثيق فوري ذكي
                </span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 font-mono mt-1">
              <span className="flex items-center gap-1 text-cyan-400">
                <Phone className="w-3 h-3" />
                <span dir="ltr">{request.userPhoneNumber}</span>
              </span>
              <span>•</span>
              <span>تاريخ التقديم: {new Date(request.requestedAt).toLocaleDateString('ar-EG')}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">{request.verificationTypeName} ({request.badgeName})</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0 active:scale-95"
            title="إغلاق"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: HOLOGRAPHIC EGYPTIAN NATIONAL ID CARD */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-[#131c2e] to-slate-950 border border-amber-500/30 p-4 sm:p-6 shadow-[0_0_35px_rgba(196,163,90,0.1)]">
          {/* Ambient decorative glow */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* National ID Card Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs shrink-0">
                🦅
              </div>
              <div>
                <div className="text-xs font-black text-amber-400 tracking-wider">جمهورية مصر العربية</div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate">بطاقة تحقيق الشخصية · الرقم القومي</div>
              </div>
            </div>

            {rawId && (
              <button
                onClick={handleCopyId}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                title="نسخ الرقم القومي"
              >
                {copiedId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Extracted National ID Display */}
          {rawId ? (
            <div className="space-y-3 sm:space-y-4 relative z-10">
              <div className="p-3 sm:p-4 rounded-2xl bg-black/40 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="text-[10px] sm:text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 shrink-0" />
                    الرقم القومي المستخرج (14 رقم):
                  </div>
                  <div className="text-base sm:text-2xl font-mono font-black tracking-widest text-white select-all break-all">
                    {parsedId?.formatted || rawId}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {request.ocrConfidenceScore && (
                    <div className="px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold text-center">
                      <div className="text-[9px] text-slate-400">دقة القراءة</div>
                      <div className="font-mono font-black">{Math.round(request.ocrConfidenceScore)}%</div>
                    </div>
                  )}
                  {parsedId && (
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold text-center">
                      <div className="text-[9px] text-slate-400">المحافظة</div>
                      <div className="text-xs">{parsedId.governorate}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Grid Extracted from National ID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 min-w-0">
                  <span className="text-slate-400 text-[10px] sm:text-[11px] block">الاسم بالبطاقة:</span>
                  <span className="font-black text-white text-xs sm:text-sm truncate block">
                    {request.extractedFullName || request.userName}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 min-w-0">
                  <span className="text-slate-400 text-[10px] sm:text-[11px] block">تاريخ الميلاد والسن:</span>
                  <span className="font-bold text-white text-xs sm:text-sm truncate block">
                    {parsedId ? `${parsedId.year}/${parsedId.month}/${parsedId.day} (${parsedId.age}س)` : 'غير متوفر'}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 min-w-0">
                  <span className="text-slate-400 text-[10px] sm:text-[11px] block">النوع (الجنس):</span>
                  <span className="font-bold text-cyan-400 text-xs sm:text-sm truncate block">
                    {parsedId?.gender || request.extractedGender || 'غير محدد'}
                  </span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 min-w-0">
                  <span className="text-slate-400 text-[10px] sm:text-[11px] block">محل الإقامة / المحافظة:</span>
                  <span className="font-bold text-amber-300 text-xs sm:text-sm truncate block">
                    {parsedId?.governorate || request.extractedGovernorate || 'غير محدد'}
                  </span>
                </div>
              </div>

              {/* Auto-Verification Summary Note */}
              {request.autoVerificationSummary && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-xs">{request.autoVerificationSummary}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-2xl bg-black/30 border border-slate-800 text-center space-y-2 relative z-10">
              <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 mx-auto" />
              <div className="text-xs sm:text-sm font-bold text-white">لم يتم استخراج رقم قومي تلقائياً لهذا الطلب</div>
              <p className="text-[11px] sm:text-xs text-slate-400 max-w-md mx-auto">
                يمكنك مراجعة وثائق وصور البطاقة المرفقة أدناه والتحقق منها يدوياً ثم اعتماد الطلب مباشرة.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 2: ATTACHED DOCUMENTS GALLERY & LIGHTBOX */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>وثائق ومستندات التحقق المرفقة ({docs.length})</span>
            </h3>

            {/* Rotation and Zoom Controls */}
            {currentDocUrl && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 transition-colors active:scale-95"
                  title="تدوير الصورة 90 درجة"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">تدوير</span>
                </button>
                <a
                  href={currentDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-400 flex items-center gap-1 transition-colors active:scale-95"
                  title="فتح بالحجم الكامل"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">الحجم الكامل</span>
                </a>
              </div>
            )}
          </div>

          {docs.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
              لا توجد مستندات مرفقة مع هذا الطلب.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Document Selection Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x touch-pan-x">
                {docs.map((doc, idx) => {
                  const label = verificationDocumentTypeLabel(doc.documentType, doc.documentTypeName);
                  const isSelected = idx === selectedDocIndex;
                  return (
                    <button
                      key={doc.id || idx}
                      type="button"
                      onClick={() => {
                        setSelectedDocIndex(idx);
                        setImageRotation(0);
                      }}
                      className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 snap-center shrink-0 active:scale-95 ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Main Document Viewer Card */}
              {currentDoc && (
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-black/60 rounded-xl overflow-hidden flex items-center justify-center border border-white/5">
                    {currentDocUrl ? (
                      <img
                        src={currentDocUrl}
                        alt="وثيقة التحقق"
                        className="max-h-full max-w-full object-contain transition-transform duration-300"
                        style={{ transform: `rotate(${imageRotation}deg)` }}
                      />
                    ) : (
                      <div className="text-center text-slate-500 space-y-1">
                        <ImageIcon className="w-10 h-10 mx-auto opacity-50" />
                        <div className="text-xs">الصورة غير متوفرة أو معطلة</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400 pt-1">
                    <div className="truncate">
                      <span className="font-bold text-white">
                        {verificationDocumentTypeLabel(currentDoc.documentType, currentDoc.documentTypeName)}
                      </span>
                      {currentDoc.fileName && <span className="mr-2 text-slate-500 font-mono truncate">({currentDoc.fileName})</span>}
                    </div>
                    <div>تاريخ الرفع: {new Date(currentDoc.createdAt).toLocaleDateString('ar-EG')}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: AUDIT TIMELINE */}
        {request.auditLogs && request.auditLogs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>سجل التدقيق والمراجعة الزمني (Audit Trail)</span>
            </h3>

            <div className="space-y-2 border-r-2 border-slate-800 pr-4 mr-2 text-xs">
              {request.auditLogs.map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{log.actionName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(log.createdAt).toLocaleString('ar-EG')}
                    </span>
                  </div>
                  {log.notes && <p className="text-slate-300 mt-0.5">{log.notes}</p>}
                  {log.performedByUserName && (
                    <span className="text-[10px] text-cyan-400 block mt-0.5">بواسطة: {log.performedByUserName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL ACTION FOOTER */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isActionable && (
              <>
                <button
                  type="button"
                  onClick={() => onApprove(request)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 min-h-[40px] active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>قبول واعتماد التوثيق</span>
                </button>

                <button
                  type="button"
                  onClick={() => onReject(request)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-rose-950/70 text-rose-300 hover:bg-rose-900/80 border border-rose-500/40 text-xs font-black transition flex items-center justify-center gap-1.5 min-h-[40px] active:scale-95"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>رفض الطلب</span>
                </button>

                {isPending && (
                  <button
                    type="button"
                    onClick={() => onReview(request.id)}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-2xl bg-sky-950/70 text-sky-300 hover:bg-sky-900/80 border border-sky-500/40 text-xs font-black transition flex items-center justify-center gap-1.5 min-h-[40px] active:scale-95"
                  >
                    <ScanSearch className="w-4 h-4 shrink-0" />
                    <span>نقل لقيد المراجعة</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => onDelete(request.id)}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/40 text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] active:scale-95"
            >
              <Ban className="w-4 h-4 shrink-0" />
              <span>حذف</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition min-h-[40px] active:scale-95 text-center"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
