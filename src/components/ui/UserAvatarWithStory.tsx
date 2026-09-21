'use client';

import React from 'react';
import Image from 'next/image';
import { BadgeCheck, Sparkles } from 'lucide-react';

export interface UserAvatarWithStoryProps {
  userId?: string;
  name: string;
  avatarUrl?: string | null;
  verificationBadge?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hasStory?: boolean;
  hasUnseenStory?: boolean;
  onClickStory?: () => void;
  showName?: boolean;
  subtitle?: string;
  className?: string;
  isClickable?: boolean;
}

const sizeConfig = {
  sm: {
    avatar: 'w-9 h-9',
    ringPadding: 'p-[2px]',
    text: 'text-xs',
    subtext: 'text-[10px]',
    badge: 'w-3.5 h-3.5',
    sparkle: 'w-2.5 h-2.5',
  },
  md: {
    avatar: 'w-11 h-11',
    ringPadding: 'p-[2.5px]',
    text: 'text-sm',
    subtext: 'text-xs',
    badge: 'w-4 h-4',
    sparkle: 'w-3 h-3',
  },
  lg: {
    avatar: 'w-14 h-14',
    ringPadding: 'p-[3px]',
    text: 'text-base',
    subtext: 'text-xs',
    badge: 'w-5 h-5',
    sparkle: 'w-3.5 h-3.5',
  },
  xl: {
    avatar: 'w-20 h-20',
    ringPadding: 'p-[4px]',
    text: 'text-lg',
    subtext: 'text-sm',
    badge: 'w-6 h-6',
    sparkle: 'w-4 h-4',
  },
};

export function UserAvatarWithStory({
  name,
  avatarUrl,
  verificationBadge,
  size = 'md',
  hasStory = false,
  hasUnseenStory = false,
  onClickStory,
  showName = false,
  subtitle,
  className = '',
  isClickable,
}: UserAvatarWithStoryProps) {
  const cfg = sizeConfig[size];
  const initials = (name || 'م').trim().slice(0, 2);

  const canClick = isClickable ?? (hasStory && !!onClickStory);

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Avatar Container with Story Ring */}
      <div
        className={`relative shrink-0 rounded-full transition-all duration-300 ${
          canClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        }`}
        onClick={canClick ? onClickStory : undefined}
        title={hasStory ? (hasUnseenStory ? 'حالة جديدة (انقر للمشاهدة)' : 'تمت مشاهدة الحالة') : name}
      >
        {/* Glowing Story Ring */}
        {hasStory && (
          <div
            className={`absolute -inset-[3px] rounded-full transition-all duration-500 ${
              hasUnseenStory
                ? 'bg-gradient-to-tr from-[#9E1B2C] via-[#C4A35A] to-[#0F766E] animate-pulse shadow-[0_0_16px_rgba(196,163,90,0.55),0_0_24px_rgba(15,118,110,0.45)] ring-2 ring-[rgba(196,163,90,0.4)]'
                : 'bg-slate-300/40 border border-slate-300/30' // Disappears/dims when seen like WhatsApp/Facebook
            }`}
          />
        )}

        {/* Inner Avatar Frame */}
        <div
          className={`relative rounded-full overflow-hidden bg-[#0F1B2D] text-white flex items-center justify-center font-black ${
            cfg.avatar
          } shadow-[0_4px_14px_rgba(15,27,45,0.35),0_0_0_1px_rgba(255,255,255,0.2)_inset]`}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 48px, 64px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1F6B7A] via-[#15283C] to-[#0F1B2D] flex items-center justify-center text-[var(--egypt-gold)] font-bold shadow-inner">
              <span className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">{initials}</span>
            </div>
          )}
        </div>

        {/* Story Unseen Sparkle Badge */}
        {hasStory && hasUnseenStory && (
          <div className="absolute -bottom-0.5 -left-0.5 z-10 bg-gradient-to-r from-[#C4A35A] to-[#0F766E] text-white p-0.5 rounded-full shadow-[0_0_8px_rgba(196,163,90,0.8)] border border-white/80 animate-bounce">
            <Sparkles className={cfg.sparkle} />
          </div>
        )}

        {/* Verification Checkmark */}
        {verificationBadge && (
          <div
            className="absolute -top-1 -right-1 z-10 text-[var(--egypt-gold)] drop-shadow-[0_0_6px_rgba(196,163,90,0.7)] bg-[#0F1B2D] rounded-full p-[1px]"
            title="حساب موثق"
          >
            <BadgeCheck className={cfg.badge} />
          </div>
        )}
      </div>

      {/* Name and Subtitle with User Glowing Aesthetics */}
      {showName && (
        <div className="min-w-0 flex flex-col text-right">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-black text-[#0F1B2D] tracking-tight truncate drop-shadow-[0_0_12px_rgba(31,107,122,0.18)] ${cfg.text}`}
              style={{
                textShadow: '0 0 16px rgba(196, 163, 90, 0.22), 0 1px 2px rgba(15, 27, 45, 0.1)',
              }}
            >
              {name}
            </span>
            {hasStory && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-all ${
                  hasUnseenStory
                    ? 'bg-gradient-to-r from-[#0F766E] to-[#1F6B7A] text-white shadow-[0_0_8px_rgba(15,118,110,0.4)] animate-pulse'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {hasUnseenStory ? 'حالة جديدة' : 'حالة'}
              </span>
            )}
          </div>
          {subtitle && (
            <span className={`text-[#5A6D80] font-medium truncate ${cfg.subtext}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
