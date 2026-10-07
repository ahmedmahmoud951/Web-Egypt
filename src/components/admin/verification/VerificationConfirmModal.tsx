'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface VerificationConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  requiresInput?: boolean;
  inputPlaceholder?: string;
  inputLabel?: string;
  initialInputValue?: string;
  onConfirm: (inputValue?: string) => void;
  onClose: () => void;
  isPending?: boolean;
}

export function VerificationConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد الإجراء',
  cancelText = 'إلغاء',
  isDestructive = false,
  requiresInput = false,
  inputPlaceholder = '',
  inputLabel = '',
  initialInputValue = '',
  onConfirm,
  onClose,
  isPending = false,
}: VerificationConfirmModalProps) {
  const [inputValue, setInputValue] = useState(initialInputValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialInputValue);
    }
  }, [isOpen, initialInputValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-slate-900 border rounded-3xl max-w-md w-full p-6 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 ${
          isDestructive ? 'border-rose-500/40 shadow-rose-500/10' : 'border-amber-500/40 shadow-amber-500/10'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDestructive ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base sm:text-lg text-white truncate">{title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{message}</p>

        {/* Optional Input / Reason Field */}
        {requiresInput && (
          <div className="space-y-1.5 pt-1">
            {inputLabel && (
              <label className="block text-xs font-bold text-slate-300">{inputLabel} *</label>
            )}
            <textarea
              rows={3}
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={(requiresInput && !inputValue.trim()) || isPending}
            onClick={() => onConfirm(inputValue)}
            className={`px-5 py-2.5 text-xs font-black rounded-2xl transition shadow-lg disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
            }`}
          >
            {isPending ? 'جاري التنفيذ...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
