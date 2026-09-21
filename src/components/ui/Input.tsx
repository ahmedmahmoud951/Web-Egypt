import React, { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="w-full text-right">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-500',
            error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
