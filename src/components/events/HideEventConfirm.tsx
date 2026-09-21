'use client';

import React from 'react';
import { EyeOff, X } from 'lucide-react';

interface HideEventConfirmProps {
  isOpen: boolean;
  eventTitle: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function HideEventConfirm({
  isOpen,
  eventTitle,
  isLoading,
  onConfirm,
  onClose,
}: HideEventConfirmProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="إغلاق"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <EyeOff className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-right space-y-1 pt-0.5">
              <h3 className="text-[15px] font-bold text-slate-900 leading-snug">إخفاء المنشور؟</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                لن يظهر «{eventTitle}» في موجزك بعد الآن. سيبقى ظاهرًا لباقي المستخدمين.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-10 rounded-xl text-sm font-bold text-white bg-[#1877F2] hover:bg-[#166FE5] transition disabled:opacity-60 shadow-sm"
          >
            {isLoading ? 'جاري الإخفاء...' : 'إخفاء المنشور'}
          </button>
        </div>
      </div>
    </div>
  );
}
