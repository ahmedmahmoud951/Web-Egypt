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
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net').replace(/\/$/, '');
}

/** Pull media GUID from `/api/media/{guid}/file`, B2 URL, or raw GUID. */
export function extractMediaId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // 1. Hyphenated GUID (36 chars)
  const hyphenated = trimmed.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  if (hyphenated) return hyphenated[0];

  // 2. 32-character hex GUID (used in Backblaze B2 paths: .../8de7d9eb32fb41bdb6109c1d05317c00/...)
  const hex32 = trimmed.match(/[0-9a-fA-F]{32}/);
  if (hex32) {
    const raw = hex32[0];
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
  }

  return null;
}

/**
 * Robustly resolves any image/media URL so it loads in <img>, <video>, or Lightbox.
 * Handles:
 * - Backblaze B2 expired presigned URLs (rewrites to /api/media/{guid}/file)
 * - Stored URLs on older/sleeping hosts (redirects through active API origin)
 * - /uploads/images paths with old hostnames
 * - Relative `/api/media/...` paths
 * - Raw GUIDs (hyphenated or 32-hex)
 * - Blob and base64 URLs
 */
export function resolveMediaUrl(url: string | null | undefined, apiBase?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;

  const origin = (apiBase || getApiOrigin()).replace(/\/$/, '');

  // 1. Backblaze B2 URLs or media endpoint URLs containing GUID -> direct to active backend
  if (
    trimmed.includes('backblazeb2.com') ||
    trimmed.includes('today-in-egypt-media') ||
    trimmed.includes('/api/media/')
  ) {
    const mediaId = extractMediaId(trimmed);
    if (mediaId) {
      return `${origin}/api/media/${mediaId}/file`;
    }
  }

  // 2. Normalize /uploads/ paths (even if having old localhost or sleeping domains)
  const uploadsIdx = trimmed.indexOf('/uploads/');
  if (uploadsIdx >= 0) {
    return `${origin}${trimmed.slice(uploadsIdx)}`;
  }

  // 3. Bare GUID (hyphenated or 32-hex)
  const mediaId = extractMediaId(trimmed);
  if (mediaId && (trimmed.length === 36 || trimmed.length === 32)) {
    return `${origin}/api/media/${mediaId}/file`;
  }

  // 4. Absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 5. Relative path
  if (trimmed.startsWith('/')) {
    return `${origin}${trimmed}`;
  }
  return `${origin}/${trimmed}`;
}

/**
 * Returns alternative candidate URLs to try in sequence if an image fails to load.
 */
export function getMediaCandidateUrls(url: string | null | undefined): string[] {
  if (!url) return [];
  const candidates: string[] = [];
  const primary = resolveMediaUrl(url);
  if (primary) candidates.push(primary);

  const mediaId = extractMediaId(url);
  if (mediaId) {
    // Relative rewrite through Next.js dev server proxy
    const relativeProxy = `/api/media/${mediaId}/file`;
    if (!candidates.includes(relativeProxy)) candidates.push(relativeProxy);

    // Direct from runasp backend
    const runaspDirect = `https://todayegypt.runasp.net/api/media/${mediaId}/file`;
    if (!candidates.includes(runaspDirect)) candidates.push(runaspDirect);
  }

  // If original was an absolute URL and not equal to primary, add as fallback
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!candidates.includes(url)) candidates.push(url);
  }

  return candidates;
}
