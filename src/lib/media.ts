/**
 * Detect whether a media URL / type should render as video.
 * B2 covers often use /api/media/{id}/file with no extension — rely on primaryMediaType.
 */
export function isVideoMedia(
  url?: string | null,
  mediaType?: string | null
): boolean {
  if (mediaType?.toLowerCase() === 'video') return true;
  if (!url) return false;
  if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return true;
  if (url.includes('/videos/')) return true;
  return false;
}

export function getApiOrigin(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net').replace(/\/$/, '');
}

/**
 * Relative `/api/media/...` must hit the API host, not Next.js localhost.
 * With NEXT_PUBLIC_API_DIRECT=1, axios already uses the remote API — <img>/<video> must too.
 */
export function resolveMediaUrl(url: string | null | undefined, apiBase?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const origin = (apiBase || getApiOrigin()).replace(/\/$/, '');
  if (url.startsWith('/')) return `${origin}${url}`;
  return `${origin}/${url}`;
}
