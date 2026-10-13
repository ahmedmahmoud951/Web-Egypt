'use client';

import React, { useState } from 'react';
import {
  PageVerificationRequestItem,
  ReviewPageVerificationPayload,
} from '@/api/verificationAdmin';
import {
  ShieldCheck,
  Ban,
  X,
  BadgeCheck,
  Sparkles,
  Calendar,
  FileText,
  Building2,
  AlertTriangle,
  Award,
  Crown,
} from 'lucide-react';

interface ApprovePageModalProps {
  request: PageVerificationRequestItem | null;
  onClose: () => void;
  onConfirm: (payload: ReviewPageVerificationPayload) => void;
  isSubmitting?: boolean;
}

export function ApprovePageVerificationModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
}: ApprovePageModalProps) {
  const [badgeColor, setBadgeColor] = useState<'blue' | 'gold'>('blue');
  const [category, setCategory] = useState<string>(request?.verificationCategory || 'OfficialBrand');
  const [durationDays, setDurationDays] = useState<number>(365);
  const [notes, setNotes] = useState<string>('');

  if (!request) return null;

  const handleApprove = () => {
    onConfirm({
      approved: true,
      verificationBadge: badgeColor,
      verificationCategory: category,
      customDurationDays: durationDays > 0 ? durationDays : undefined,
      adminNotes: notes.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(16,185,129,0.25)] space-y-5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg">اعتماد وتوثيق الصفحة رسمياً</h3>
              <p className="text-xs text-emerald-300 font-bold">{request.pageName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Badge Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">نوع ولون شارة التوثيق:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBadgeColor('blue')}
                className={`p-3 rounded-2xl border flex items-center gap-3 text-right transition-all ${
                  badgeColor === 'blue'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">شارة زرقاء رسمية 🔵</div>
                  <div className="text-[10px] text-slate-400">للأنشطة والعلامات المعتمدة</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBadgeColor('gold')}
                className={`p-3 rounded-2xl border flex items-center gap-3 text-right transition-all ${
                  badgeColor === 'gold'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">شارة ذهبية فاخرة 🌟</div>
                  <div className="text-[10px] text-slate-400">للشركات الكبرى والجهات الرسمية</div>
                </div>
              </button>
            </div>
          </div>

          {/* Verification Category */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">تصنيف التوثيق الرسمي:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
            >
              <option value="OfficialBrand">علامة تجارية رسمية (Official Brand)</option>
              <option value="VerifiedBusiness">نشاط تجاري وشركة معتمدة (Verified Business)</option>
              <option value="GovOrganization">جهة أو مؤسسة رسمية (Gov Organization)</option>
              <option value="PublicFigure">شخصية عامة ومؤثر معتمد (Public Figure)</option>
              <option value="MediaNews">إعلام وصحافة موثقة (Media & News)</option>
            </select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">مدة صلاحية التوثيق:</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'شهر (30 يوم)', days: 30 },
                { label: '3 شهور (90 يوم)', days: 90 },
                { label: 'سنة (365 يوم)', days: 365 },
                { label: 'دائم (مستمر)', days: 3650 },
              ].map((item) => (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => setDurationDays(item.days)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                    durationDays === item.days
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">ملاحظات الإدارة (اختياري):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="تم مراجعة السجل التجاري والبطاقة والتأكد من مطابقة النشاط..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري الاعتماد...' : 'تأكيد واعتماد التوثيق ✅'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface RejectPageModalProps {
  request: PageVerificationRequestItem | null;
  onClose: () => void;
  onConfirm: (payload: ReviewPageVerificationPayload) => void;
  isSubmitting?: boolean;
}

export function RejectPageVerificationModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
}: RejectPageModalProps) {
  const [reason, setReason] = useState<string>('السجل التجاري أو رخصة النشاط غير واضحة أو منتهية الصلاحية.');
  const [notes, setNotes] = useState<string>('');

  if (!request) return null;

  const presets = [
    'السجل التجاري أو رخصة النشاط غير واضحة أو منتهية الصلاحية.',
    'صورة بطاقة الرقم القومي غير مطابقة لمنشئ الصفحة أو غير مقروءة.',
    'النشاط التجاري لا يستوفي شروط ومعايير التوثيق الرسمية المعتمدة.',
    'عدم كفاية إثبات الشهرة أو التمثيل الرسمي للعلامة التجارية.',
    'بيانات الصفحة ناقصة ولا تحتوي على وسيلة اتصال أو مقر عمل واضح.',
  ];

  const handleReject = () => {
    onConfirm({
      approved: false,
      rejectionReason: reason.trim(),
      adminNotes: notes.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)] space-y-5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg">رفض طلب توثيق الصفحة</h3>
              <p className="text-xs text-rose-300 font-bold">{request.pageName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">أسباب الرفض الشائعة:</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(p)}
                  className={`w-full p-2.5 rounded-xl text-xs text-right border transition-all ${
                    reason === p
                      ? 'bg-rose-500/15 border-rose-500/60 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">سبب الرفض الموجه لمقدم الطلب:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 block">ملاحظات داخلية للأدمن (اختياري):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظة خاصة بالأدمن..."
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={isSubmitting || !reason.trim()}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            <span>{isSubmitting ? 'جاري الرفض...' : 'تأكيد رفض الطلب ❌'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
