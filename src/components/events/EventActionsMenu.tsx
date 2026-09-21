'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  EyeOff,
  Pencil,
  Trash2,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteEvent, useHideEvent } from '@/hooks/useEvents';
import { HideEventConfirm } from './HideEventConfirm';
import { ReportModal } from './ReportModal';

interface EventActionsMenuProps {
  eventId: string;
  eventTitle: string;
  ownerUserId: string;
  onHidden?: () => void;
  onDeleted?: () => void;
  variant?: 'card' | 'detail';
}

export function EventActionsMenu({
  eventId,
  eventTitle,
  ownerUserId,
  onHidden,
  onDeleted,
  variant = 'card',
}: EventActionsMenuProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [hideConfirmOpen, setHideConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hideMutation = useHideEvent();
  const deleteMutation = useDeleteEvent();

  const isOwner = !!user && user.id === ownerUserId;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  if (!isAuthenticated) {
    return null;
  }

  const handleHide = async () => {
    try {
      await hideMutation.mutateAsync(eventId);
      setHideConfirmOpen(false);
      onHidden?.();
      if (variant === 'detail') {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(eventId);
      setDeleteConfirmOpen(false);
      onDeleted?.();
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          aria-label="المزيد من الخيارات"
          aria-expanded={open}
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-1 z-40 w-56 origin-top-left rounded-xl bg-white border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="menu"
          >
            {isOwner ? (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/events/${eventId}/edit`);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition text-right"
                >
                  <Pencil className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">تعديل المنشور</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition text-right"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium">حذف المنشور</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setHideConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition text-right"
                >
                  <EyeOff className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">إخفاء من موجزي</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    setReportOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition text-right"
                >
                  <Flag className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">إبلاغ عن المنشور</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <HideEventConfirm
        isOpen={hideConfirmOpen}
        eventTitle={eventTitle}
        isLoading={hideMutation.isPending}
        onConfirm={handleHide}
        onClose={() => setHideConfirmOpen(false)}
      />

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            onClick={() => setDeleteConfirmOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-start gap-3 p-5">
              <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-right space-y-1">
                <h3 className="text-[15px] font-bold text-slate-900">حذف المنشور؟</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  سيتم حذف «{eventTitle}» من المنصة ولن يظهر للمستخدمين بعد الآن.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 pt-0 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="h-10 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-10 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف نهائي'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReportModal
        eventId={eventId}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
