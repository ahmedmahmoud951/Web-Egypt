'use client';

import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface AdminVerifiedBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}

/** Admin-only verified seal shown next to the Public display name "Admin". */
export function AdminVerifiedBadge({
  size = 'sm',
  className = '',
  title = 'حساب إدارة موثّق',
}: AdminVerifiedBadgeProps) {
  const dim = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  const icon = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <span
      className={`admin-verified-seal ${dim} ${className}`}
      title={title}
      aria-label={title}
      role="img"
    >
      <BadgeCheck className={icon} strokeWidth={2.75} aria-hidden />
    </span>
  );
}

interface CommentAuthorLabelProps {
  name: string;
  isAdminAuthor?: boolean;
  hasAdminVerifiedBadge?: boolean;
  className?: string;
}

export function CommentAuthorLabel({
  name,
  isAdminAuthor,
  hasAdminVerifiedBadge,
  className = '',
}: CommentAuthorLabelProps) {
  const showBadge = Boolean(isAdminAuthor || hasAdminVerifiedBadge);
  const display = isAdminAuthor ? 'Admin' : name;

  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <span className={`font-bold truncate ${isAdminAuthor ? 'text-[#1F6B7A]' : 'text-slate-900'}`}>
        {display}
      </span>
      {showBadge && <AdminVerifiedBadge />}
    </span>
  );
}
