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

export function formatRelativeArabicTime(dateString: string): string {
  try {
    const date = parseApiUtcDate(dateString);
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
    if (diffInDays === 1) {
      return 'أمس';
    }
    if (diffInDays === 2) {
      return 'منذ يومين';
    }
    if (diffInDays >= 3 && diffInDays <= 10) {
      return `منذ ${diffInDays} أيام`;
    }
    if (diffInDays < 30) {
      return `منذ ${diffInDays} يوماً`;
    }
    return formatArabicDate(dateString);
  } catch {
    return dateString;
  }
}
