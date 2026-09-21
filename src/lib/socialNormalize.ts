import type { MediaType, ReelStatus, StatusItemStatus } from '@/types/social';
import { resolveMediaUrl } from '@/lib/media';

const REEL_BY_INDEX = ['Draft', 'Published', 'Hidden', 'Deleted'] as const;
/** Domain: Active=1, Hidden=2, Deleted=3, Expired=4 */
const STATUS_BY_VALUE: Record<number, StatusItemStatus> = {
  1: 'Active',
  2: 'Hidden',
  3: 'Deleted',
  4: 'Expired',
};
const MEDIA_BY_INDEX = ['Image', 'Video', 'Document'] as const;

function matchNamed<T extends string>(value: string, allowed: readonly T[]): T | null {
  const hit = allowed.find((s) => s.toLowerCase() === value.toLowerCase());
  return hit ?? null;
}

export function normalizeReelStatus(status: unknown): ReelStatus {
  if (typeof status === 'number' && status >= 0 && status <= 3) {
    return REEL_BY_INDEX[status];
  }
  if (typeof status === 'string') {
    const named = matchNamed(status, REEL_BY_INDEX);
    if (named) return named;
    const n = Number(status);
    if (!Number.isNaN(n) && n >= 0 && n <= 3) return REEL_BY_INDEX[n];
  }
  return 'Draft';
}

export function normalizeStatusItemStatus(status: unknown): StatusItemStatus {
  if (typeof status === 'number' && STATUS_BY_VALUE[status]) {
    return STATUS_BY_VALUE[status];
  }
  if (typeof status === 'string') {
    const named = matchNamed(status, ['Active', 'Hidden', 'Deleted', 'Expired'] as const);
    if (named) return named;
    const n = Number(status);
    if (!Number.isNaN(n) && STATUS_BY_VALUE[n]) return STATUS_BY_VALUE[n];
  }
  return 'Active';
}

export function normalizeMediaType(mediaType: unknown): MediaType | string {
  if (typeof mediaType === 'number' && mediaType >= 0 && mediaType <= 2) {
    return MEDIA_BY_INDEX[mediaType];
  }
  if (typeof mediaType === 'string') {
    const named = matchNamed(mediaType, MEDIA_BY_INDEX);
    if (named) return named;
    const n = Number(mediaType);
    if (!Number.isNaN(n) && n >= 0 && n <= 2) return MEDIA_BY_INDEX[n];
    return mediaType;
  }
  return 'Image';
}

export function normalizeReelDto<T extends { status: unknown; mediaUrl?: string | null; thumbnailUrl?: string | null; authorAvatar?: string | null }>(
  reel: T
): T & { status: ReelStatus; mediaUrl: string; thumbnailUrl?: string | null } {
  return {
    ...reel,
    status: normalizeReelStatus(reel.status),
    mediaUrl: resolveMediaUrl(reel.mediaUrl),
    thumbnailUrl: reel.thumbnailUrl ? resolveMediaUrl(reel.thumbnailUrl) : reel.thumbnailUrl,
    authorAvatar: reel.authorAvatar ? resolveMediaUrl(reel.authorAvatar) : reel.authorAvatar,
  };
}

export function normalizeStatusDto<
  T extends { status: unknown; mediaType?: unknown; mediaUrl?: string | null; authorAvatar?: string | null },
>(status: T): T & { status: StatusItemStatus; mediaType: MediaType | string; mediaUrl: string } {
  return {
    ...status,
    status: normalizeStatusItemStatus(status.status),
    mediaType: normalizeMediaType(status.mediaType),
    mediaUrl: resolveMediaUrl(status.mediaUrl),
    authorAvatar: status.authorAvatar ? resolveMediaUrl(status.authorAvatar) : status.authorAvatar,
  };
}
