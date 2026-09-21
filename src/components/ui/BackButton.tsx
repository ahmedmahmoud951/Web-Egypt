'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BackButtonProps {
  label?: string;
  fallbackUrl?: string;
  variant?: 'default' | 'pill' | 'ghost' | 'outline';
  className?: string;
  onClick?: () => void;
  showIcon?: boolean;
}

export function BackButton({
  label = 'رجوع',
  fallbackUrl = '/',
  variant = 'pill',
  className,
  onClick,
  showIcon = true,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  const variants = {
    default:
      'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-xs transition-smooth',
    pill: 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-slate-700 bg-white/90 backdrop-blur-md border border-slate-200/70 hover:bg-red-50/50 hover:text-red-700 hover:border-red-200 shadow-xs transition-smooth',
    ghost:
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 transition-smooth',
    outline:
      'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50/80 transition-smooth',
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn('group cursor-pointer select-none', variants[variant], className)}
      title={label}
      aria-label={label}
    >
      {showIcon && (
        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-current group-hover:translate-x-1 transition-transform duration-200 shrink-0" />
      )}
      <span>{label}</span>
    </button>
  );
}
