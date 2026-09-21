'use client';

import React, { useState } from 'react';
import { useConfirmEvent } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

export function ConfirmButton({
  eventId,
  initialCount = 0,
}: {
  eventId: string;
  initialCount?: number;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasConfirmedLocally, setHasConfirmedLocally] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirmMutation = useConfirmEvent(eventId);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const isAdminPath = pathname?.startsWith('/admin');
      const login = isAdminPath ? '/admin/login' : '/login';
      const redirect = encodeURIComponent(pathname || `/events/${eventId}`);
      router.push(`${login}?redirect=${redirect}`);
      return;
    }

    if (hasConfirmedLocally) return;

    setErrorMessage(null);
    try {
      await confirmMutation.mutateAsync();
      setHasConfirmedLocally(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'سبق وأكدت هذا الحدث.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleConfirm}
        disabled={confirmMutation.isPending || hasConfirmedLocally}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border select-none',
          hasConfirmedLocally
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 active:scale-95'
        )}
        title={hasConfirmedLocally ? 'تم تأكيد الحدث' : 'أكّد أنك شاهدت هذا الحدث'}
      >
        <CheckCircle2
          className={cn(
            'w-4 h-4',
            hasConfirmedLocally ? 'text-emerald-600 fill-emerald-100' : 'text-slate-400'
          )}
        />
        <span>{hasConfirmedLocally ? 'أكّدت ذلك' : 'حدث فعلًا'}</span>
        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
          {initialCount + (hasConfirmedLocally ? 1 : 0)}
        </span>
      </button>
      {errorMessage && (
        <span className="text-[10px] text-amber-600 mt-1 font-medium">{errorMessage}</span>
      )}
    </div>
  );
}
