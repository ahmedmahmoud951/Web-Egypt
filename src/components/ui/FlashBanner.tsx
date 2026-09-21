'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FlashTone = 'success' | 'error' | 'warn' | 'info';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warn: AlertTriangle,
  info: Info,
};

export function FlashBanner({
  tone = 'info',
  title,
  children,
  onClose,
  className,
}: {
  tone?: FlashTone;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <div className={cn('flash-banner', className)} data-tone={tone} role="status">
      <span className="flash-icon">
        <Icon className="w-4 h-4" strokeWidth={2.4} />
      </span>
      <div className="flex-1 min-w-0">
        {title && <div className="font-black text-[13px] mb-0.5">{title}</div>}
        <div className="text-[13px] font-semibold opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="btn-glow btn-glow-ghost !p-1.5 !h-8 !w-8 shrink-0"
          aria-label="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
