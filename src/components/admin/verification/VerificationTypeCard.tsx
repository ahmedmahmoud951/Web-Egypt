'use client';

import React from 'react';
import { VerificationTypeItem } from '@/api/verificationAdmin';
import {
  BadgeCheck,
  Edit2,
  Trash2,
  FileCheck2,
  FileX2,
  Smartphone,
  Lock,
  Tag,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface VerificationTypeCardProps {
  type: VerificationTypeItem;
  onEdit: (type: VerificationTypeItem) => void;
  onDelete: (type: VerificationTypeItem) => void;
  onToggleStatus: (typeId: string, currentStatus: boolean) => void;
  isToggling?: boolean;
}

export function VerificationTypeCard({
  type,
  onEdit,
  onDelete,
  onToggleStatus,
  isToggling = false,
}: VerificationTypeCardProps) {
  return (
    <div
      className={`group relative rounded-2xl sm:rounded-3xl bg-slate-900/90 border transition-all duration-300 p-4 sm:p-6 flex flex-col justify-between overflow-hidden text-right shadow-xl hover:shadow-2xl ${
        type.isActive
          ? 'border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-500/10'
          : 'border-slate-800/60 opacity-75 hover:opacity-100 hover:border-slate-700'
      }`}
    >
      {/* Top Ambient Glow on Hover */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />

      <div className="space-y-3.5 sm:space-y-4 relative z-10">
        {/* Header: Icon + Name + Active Switch */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg transition-transform duration-300 group-hover:scale-105 ${
                type.isActive
                  ? 'bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-amber-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-500'
              }`}
            >
              <BadgeCheck className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </div>

            <div className="min-w-0">
              <h3 className="font-black text-white text-sm sm:text-lg truncate group-hover:text-emerald-300 transition-colors">
                {type.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">اسم الشارة:</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] sm:text-xs font-black inline-flex items-center gap-1 truncate">
                  <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{type.badgeName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Active Status Badge & Toggle Button */}
          <button
            type="button"
            disabled={isToggling}
            onClick={() => onToggleStatus(type.id, type.isActive)}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-black border transition-all flex items-center gap-1.5 shrink-0 min-h-[34px] active:scale-95 ${
              type.isActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title={type.isActive ? 'انقر للتعطيل' : 'انقر للتفعيل'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                type.isActive ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'
              }`}
            />
            <span>{type.isActive ? 'مفعل' : 'معطل'}</span>
          </button>
        </div>

        {/* Live Profile Simulation Pill */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[10px] sm:text-[11px]">معاينة الشارة في الملف:</span>
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-900 border border-white/5 truncate">
            <span className="font-bold text-white text-xs truncate">محمد علي</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-black text-[10px] border border-emerald-500/40 shrink-0">
              <BadgeCheck className="w-3 h-3" />
              <span>{type.badgeName}</span>
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {type.description || 'لا يوجد وصف مخصص لهذا النوع من التوثيق في النظام.'}
        </p>

        {/* Specifications & Rules Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 min-w-0">
            {type.requiresDocuments ? (
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <FileX2 className="w-4 h-4 text-slate-500 shrink-0" />
            )}
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block">المستندات</span>
              <span className="font-bold text-slate-200 text-[11px] truncate block">
                {type.requiresDocuments ? 'إلزامية' : 'غير مطلوبة'}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 min-w-0">
            {type.allowUserRequest ? (
              <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block">تقديم الطلب</span>
              <span className="font-bold text-slate-200 text-[11px] truncate block">
                {type.allowUserRequest ? 'متاح بالتطبيق' : 'إدارة فقط 🔒'}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 min-w-0">
            <Tag className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block">الباقات الفعالة</span>
              <span className="font-black text-amber-300 text-[11px] truncate block">
                {type.activePlansCount} {type.activePlansCount === 1 ? 'باقة' : 'باقات'}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block">التدقيق</span>
              <span className="font-bold text-slate-200 text-[11px] truncate block">
                {type.requiresReview ? 'مراجعة يدوية' : 'فحص فوري'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Action Controls */}
      <div className="mt-4 sm:mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-2 relative z-10">
        <button
          type="button"
          onClick={() => onToggleStatus(type.id, type.isActive)}
          disabled={isToggling}
          className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          {type.isActive ? 'تعطيل النوع مؤقتاً' : 'تفعيل النوع الآن'}
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onEdit(type)}
            className="p-2 sm:p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
            title="تعديل بيانات النوع والشارة"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(type)}
            className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
            title="حذف النوع"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
