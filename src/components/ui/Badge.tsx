import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'red' | 'blue' | 'amber' | 'emerald';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-700 border-red-200/60',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
