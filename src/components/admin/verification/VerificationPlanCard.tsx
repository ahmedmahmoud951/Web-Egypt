'use client';

import React from 'react';
import { VerificationPlanItem } from '@/api/verificationAdmin';
import {
  Tag,
  Gift,
  Clock,
  Edit2,
  Trash2,
  BadgeCheck,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';

interface VerificationPlanCardProps {
  plan: VerificationPlanItem;
  onEdit: (plan: VerificationPlanItem) => void;
  onDelete: (plan: VerificationPlanItem) => void;
  onToggleStatus: (planId: string, currentStatus: boolean) => void;
  isToggling?: boolean;
}

export function VerificationPlanCard({
  plan,
  onEdit,
  onDelete,
  onToggleStatus,
  isToggling = false,
}: VerificationPlanCardProps) {
  const formatDurationText = (days: number) => {
    if (days === 30) return 'شهر كامل (30 يوم)';
    if (days === 60) return 'شهران (60 يوم)';
    if (days === 90) return '3 أشهر (90 يوم)';
    if (days === 180) return 'نصف سنة (180 يوم)';
    if (days === 365) return 'سنة كاملة (365 يوم)';
    return `${days} يوم`;
  };

  return (
    <div
      className={`group relative rounded-2xl sm:rounded-3xl bg-slate-900/90 border transition-all duration-300 p-4 sm:p-6 flex flex-col justify-between overflow-hidden text-right shadow-xl hover:shadow-2xl ${
        plan.isFree
          ? 'border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950/90 hover:border-amber-400 hover:shadow-amber-500/15'
          : plan.isActive
          ? 'border-slate-800 hover:border-sky-500/50 hover:shadow-sky-500/10'
          : 'border-slate-800/60 opacity-75 hover:opacity-100 hover:border-slate-700'
      }`}
    >
      {/* Top Banner for Free Plan */}
      {plan.isFree && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_15px_#fbbf24]" />
      )}

      {/* Top Ambient Glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all ${
          plan.isFree ? 'bg-amber-500/20 group-hover:bg-amber-500/30' : 'bg-sky-500/10 group-hover:bg-sky-500/20'
        }`}
      />

      <div className="space-y-3.5 sm:space-y-4 relative z-10">
        {/* Header: Type Pill + Name + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] sm:text-[11px] font-black truncate">
              <BadgeCheck className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="truncate">{plan.verificationTypeName || 'نوع عام'}</span>
            </span>

            <h3 className="font-black text-white text-base sm:text-lg truncate group-hover:text-amber-300 transition-colors">
              {plan.name}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {plan.isFree ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] sm:text-xs font-black flex items-center gap-1 shadow-sm">
                <Gift className="w-3 h-3 text-amber-400 shrink-0" />
                <span>عرض مجاني</span>
              </span>
            ) : (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border ${
                  plan.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {plan.isActive ? 'نشطة' : 'معطلة'}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Duration Hero Deck */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-bold mb-0.5">تكلفة الاشتراك:</div>
            <div className="flex items-baseline gap-1.5 truncate">
              {plan.isFree ? (
                <span className="text-xl sm:text-3xl font-black text-amber-300 tracking-tight flex items-center gap-1 truncate">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 inline" />
                  مجاناً 100%
                </span>
              ) : (
                <>
                  <span className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs font-bold text-amber-400">{plan.currency || 'ج.م'}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-left shrink-0">
            <div className="text-[10px] text-slate-400 font-bold mb-0.5">مدة التوثيق:</div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{formatDurationText(plan.durationDays)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {plan.description || 'باقة توثيق معتمدة توفر الشارة الرسمية والمزايا الحصرية للحساب.'}
        </p>

        {/* Feature Checkpoints */}
        <div className="space-y-1.5 pt-1 text-[10px] sm:text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">شارة موثقة معتمدة بجانب الاسم والملف الشخصي</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">صلاحية حية مضمونة لمدة {plan.durationDays} يوماً بالكامل</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">أولوية الحساب في نتائج البحث والخدمات</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 sm:mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-2 relative z-10">
        <button
          type="button"
          onClick={() => onToggleStatus(plan.id, plan.isActive)}
          disabled={isToggling}
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          {plan.isActive ? 'تعطيل الباقة' : 'تفعيل الباقة الآن'}
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
            title="تعديل السعر أو المدة"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(plan)}
            className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
            title="حذف الباقة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
