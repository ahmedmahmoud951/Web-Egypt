'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ShareButton({ title, text, url }: { title: string; text?: string; url?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: shareUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          // Fallback to copy link
        }
      }
    }

    // Fallback: Copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className="text-slate-500 hover:text-slate-800 gap-1.5 text-xs"
      title="مشاركة الحدث"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
      <span>{copied ? 'تم النسخ!' : 'مشاركة'}</span>
    </Button>
  );
}
