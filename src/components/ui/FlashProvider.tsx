'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlashBanner, FlashTone } from './FlashBanner';
import { AlertTriangle } from 'lucide-react';

type ToastItem = { id: string; tone: FlashTone; title?: string; message: string };

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warn' | 'info';
};

type FlashContextValue = {
  toast: (message: string, tone?: FlashTone, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warn: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FlashContext = createContext<FlashContextValue | null>(null);

export function useFlash() {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error('useFlash must be used within FlashProvider');
  return ctx;
}

/** Safe optional hook — returns null outside provider */
export function useFlashOptional() {
  return useContext(FlashContext);
}

export function FlashProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, tone: FlashTone = 'info', title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { id, tone, title, message }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const value = useMemo<FlashContextValue>(
    () => ({
      toast,
      success: (m, t) => toast(m, 'success', t ?? 'تم بنجاح'),
      error: (m, t) => toast(m, 'error', t ?? 'حدث خطأ'),
      warn: (m, t) => toast(m, 'warn', t ?? 'تنبيه'),
      info: (m, t) => toast(m, 'info', t ?? 'معلومة'),
      confirm,
    }),
    [toast, confirm]
  );

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <FlashContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <>
            <div className="toast-stack" dir="rtl">
              {toasts.map((t) => (
                <FlashBanner
                  key={t.id}
                  tone={t.tone}
                  title={t.title}
                  onClose={() => dismiss(t.id)}
                >
                  {t.message}
                </FlashBanner>
              ))}
            </div>

            {confirmState && (
              <div className="confirm-overlay" dir="rtl" role="dialog" aria-modal="true">
                <div className="confirm-panel space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flash-icon text-[#B45309]">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-[#0F1B2D]">{confirmState.options.title}</h3>
                      <p className="text-sm text-[#5A6D80] mt-1.5 leading-relaxed whitespace-pre-line">
                        {confirmState.options.message}
                      </p>
                    </div>
                  </div>
                  <div className="admin-row justify-end gap-2 pt-1">
                    <button
                      type="button"
                      className="btn-glow btn-glow-ghost px-4 h-10 text-sm"
                      onClick={() => closeConfirm(false)}
                    >
                      {confirmState.options.cancelLabel ?? 'إلغاء'}
                    </button>
                    <button
                      type="button"
                      className={`btn-glow px-4 h-10 text-sm ${
                        confirmState.options.tone === 'danger' || !confirmState.options.tone
                          ? 'btn-glow-danger'
                          : confirmState.options.tone === 'warn'
                            ? 'btn-glow-gold'
                            : 'btn-glow-primary'
                      }`}
                      onClick={() => closeConfirm(true)}
                    >
                      {confirmState.options.confirmLabel ?? 'تأكيد'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </FlashContext.Provider>
  );
}
