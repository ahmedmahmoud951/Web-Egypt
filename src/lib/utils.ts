export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * API stores UTC. Older payloads omit "Z"; browsers then treat the value as local
 * (Egypt UTC+3 → relative times look ~3 hours old). Treat timezone-less ISO as UTC.
 */
export function parseApiUtcDate(dateString: string): Date {
  const s = dateString?.trim();
  if (!s) return new Date(NaN);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) && !/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(s)) {
    return new Date(`${s}Z`);
  }
  return new Date(s);
}

export function formatArabicDate(dateString: string): string {
  try {
    const date = parseApiUtcDate(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Relative Arabic time for feeds:
 * minutes → hours → 1–3 days → then full date+time.
 */
export function formatRelativeArabicTime(dateString: string): string {
  try {
    const date = parseApiUtcDate(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffInSeconds < 60) {
      return 'منذ لحظات';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      if (diffInMinutes === 1) return 'منذ دقيقة';
      if (diffInMinutes === 2) return 'منذ دقيقتين';
      if (diffInMinutes >= 3 && diffInMinutes <= 10) return `منذ ${diffInMinutes} دقائق`;
      return `منذ ${diffInMinutes} دقيقة`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      if (diffInHours === 1) return 'منذ ساعة';
      if (diffInHours === 2) return 'منذ ساعتين';
      if (diffInHours >= 3 && diffInHours <= 10) return `منذ ${diffInHours} ساعات`;
      return `منذ ${diffInHours} ساعة`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'منذ يوم';
    if (diffInDays === 2) return 'منذ يومين';
    if (diffInDays === 3) return 'منذ 3 أيام';

    return formatArabicDate(dateString);
  } catch {
    return dateString;
  }
}

/**
 * Returns precise remaining time countdown for 24-hour status expiration:
 * "متبقي 18 ساعة و 40 دقيقة" or "منتهية (تجاوزت 24 ساعة)"
 */
export function formatRemainingTime(expiresAtString: string): string {
  try {
    const expiresAt = parseApiUtcDate(expiresAtString);
    if (Number.isNaN(expiresAt.getTime())) return '';

    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    if (diffMs <= 0) {
      return 'منتهية (تجاوزت 24 ساعة)';
    }

    const totalMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `متبقي ${hours} ساعة و ${minutes} دقيقة`;
    }
    return `متبقي ${minutes} دقيقة`;
  } catch {
    return '';
  }
}

/** Prefer publish time when available (drafts fall back to createdAt). */
export function reelPublishedAt(reel: { publishedAt?: string | null; createdAt: string }): string {
  return reel.publishedAt || reel.createdAt;
}

/**
 * Compact chat-list timestamp: today → time only; else date + time.
 */
export function formatChatListTime(dateString: string): string {
  try {
    const date = parseApiUtcDate(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    const now = new Date();
    const time = new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round((startOfToday.getTime() - startOfMsg.getTime()) / 86400000);

    if (dayDiff === 0) return time;
    if (dayDiff === 1) return `أمس ${time}`;

    const datePart = new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date);
    return `${datePart} · ${time}`;
  } catch {
    return dateString;
  }
}

/** WhatsApp-style last-seen label in Arabic. */
export function formatLastSeenArabic(dateString?: string | null): string {
  if (!dateString) return 'آخر ظهور غير متاح';
  try {
    const date = parseApiUtcDate(dateString);
    if (Number.isNaN(date.getTime())) return 'آخر ظهور غير متاح';

    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
    const time = new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

    if (diffSec < 60) return 'آخر ظهور منذ لحظات';
    if (diffSec < 3600) {
      const m = Math.floor(diffSec / 60);
      return m <= 1 ? 'آخر ظهور منذ دقيقة' : `آخر ظهور منذ ${m} دقيقة`;
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000);

    if (dayDiff === 0) return `آخر ظهور اليوم الساعة ${time}`;
    if (dayDiff === 1) return `آخر ظهور أمس الساعة ${time}`;

    const datePart = new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
    }).format(date);
    return `آخر ظهور ${datePart} الساعة ${time}`;
  } catch {
    return 'آخر ظهور غير متاح';
  }
}
