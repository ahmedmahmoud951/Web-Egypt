'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, ZoomIn } from 'lucide-react';

export interface ProfileLightboxItem {
  url: string;
  caption?: string | null;
}

interface ProfilePhotoLightboxProps {
  items: ProfileLightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ProfilePhotoLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: ProfilePhotoLightboxProps) {
  const total = items.length;
  const current = items[index];
  const canPrev = total > 1;
  const canNext = total > 1;

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    onIndexChange((index - 1 + total) % total);
  }, [canPrev, index, onIndexChange, total]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    onIndexChange((index + 1) % total);
  }, [canNext, index, onIndexChange, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goNext(); // RTL: left = next
      if (e.key === 'ArrowRight') goPrev();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [goNext, goPrev, onClose]);

  if (typeof document === 'undefined' || !current) return null;

  return createPortal(
    <div className="profile-lightbox" role="dialog" aria-modal="true" dir="rtl">
      <button type="button" className="profile-lightbox-backdrop" aria-label="إغلاق" onClick={onClose} />

      <div className="profile-lightbox-chrome">
        <div className="profile-lightbox-top">
          <span className="profile-lightbox-count">
            <ZoomIn className="w-3.5 h-3.5" />
            {index + 1} / {total}
          </span>
          <button type="button" className="profile-lightbox-close" onClick={onClose} aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="profile-lightbox-stage">
          {canPrev && (
            <button type="button" className="profile-lightbox-nav profile-lightbox-nav-prev" onClick={goPrev} aria-label="السابق">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <img src={current.url} alt={current.caption || 'صورة'} className="profile-lightbox-img" />

          {canNext && (
            <button type="button" className="profile-lightbox-nav profile-lightbox-nav-next" onClick={goNext} aria-label="التالي">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        {(current.caption || total > 1) && (
          <div className="profile-lightbox-caption">
            {current.caption || `صورة ${index + 1} من ${total}`}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
