'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useReportEvent } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { ReportReason } from '@/types/event';
import { Flag, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ReportModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS: { label: string; value: ReportReason }[] = [
  { label: 'الخبر غير صحيح', value: 'FalseInformation' },
  { label: 'المكان غير صحيح', value: 'WrongLocation' },
  { label: 'الخبر قديم', value: 'OldEvent' },
  { label: 'Spam', value: 'Spam' },
  { label: 'محتوى مخالف', value: 'Inappropriate' },
  { label: 'سبب آخر', value: 'Other' },
];

export function ReportModal({ eventId, isOpen, onClose }: ReportModalProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<ReportReason>('FalseInformation');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reportMutation = useReportEvent(eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setErrorMessage(null);
    try {
      await reportMutation.mutateAsync({ reason: selectedReason });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال البلاغ.';
      setErrorMessage(msg);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إبلاغ عن حدث">
      {isSuccess ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-900">تم إرسال البلاغ بنجاح.</p>
          <p className="text-xs text-slate-500">شكرًا لمساهمتك في الحفاظ على دقة محتوى المنصة.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              سبب الإبلاغ:
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={() => setSelectedReason(r.value)}
                    className="text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={reportMutation.isPending}
              className="gap-1.5"
            >
              <Flag className="w-4 h-4" />
              <span>إرسال البلاغ</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
