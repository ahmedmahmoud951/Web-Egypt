export type ReelStatus = 'Draft' | 'Published' | 'Hidden' | 'Deleted';

export interface ReelDto {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorVerificationBadge?: string | null;
  caption: string;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  status: ReelStatus;
  locationId?: number | null;
  locationName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  eventId?: string | null;
  eventTitle?: string | null;
  viewsCount: number;
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
  reportsCount: number;
  currentUserReaction?: string | null;
  isOwner: boolean;
  createdAt: string;
  publishedAt?: string | null;
}

export interface AdminReelStats {
  totalReels: number;
  publishedCount: number;
  draftCount: number;
  hiddenCount: number;
  deletedCount: number;
  reportedCount: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
}

export interface AdminReelFilter {
  page?: number;
  pageSize?: number;
  status?: ReelStatus | '';
  userId?: string;
  locationId?: number;
  categoryId?: number;
  eventId?: string;
  dateFrom?: string;
  dateTo?: string;
  isReported?: boolean;
  search?: string;
}

export type StatusItemStatus = 'Active' | 'Expired' | 'Hidden' | 'Deleted';
export type MediaType = 'Image' | 'Video';

export interface StatusDto {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorVerificationBadge?: string | null;
  mediaUrl: string;
  mediaType: MediaType | string;
  text?: string | null;
  status: StatusItemStatus;
  locationId?: number | null;
  locationName?: string | null;
  viewsCount: number;
  reactionsCount: number;
  createdAt: string;
  expiresAt: string;
  isViewedByCurrentUser: boolean;
  isOwner: boolean;
}

export interface AdminStatusDetailDto extends StatusDto {
  reportsCount: number;
  fileSizeBytes: number;
  contentType: string;
  durationSeconds?: number | null;
  isExpired: boolean;
}

export interface AdminStatusStats {
  totalStatuses: number;
  activeCount: number;
  expiredCount: number;
  hiddenCount: number;
  deletedCount: number;
  reportedCount: number;
  totalViews: number;
}

export interface AdminStatusFilter {
  page?: number;
  pageSize?: number;
  userId?: string;
  status?: StatusItemStatus | '';
  mediaType?: MediaType | '';
  dateFrom?: string;
  dateTo?: string;
  isReported?: boolean;
  search?: string;
}

export interface UserStatusGroupDto {
  userId: string;
  authorName: string;
  authorAvatar?: string | null;
  authorVerificationBadge?: string | null;
  hasUnseenStatus: boolean;
  latestCreatedAt: string;
  items: StatusDto[];
}

export type ReportContentType = 'Event' | 'Post' | 'Reel' | 'Status' | 'Comment' | 'User';
export type ReportReviewStatus = 'Pending' | 'Reviewed' | 'Dismissed' | 'ActionTaken';

export interface CentralReportDto {
  id: string;
  contentType: ReportContentType;
  contentId: string;
  contentTitle?: string;
  contentSnippet?: string;
  mediaUrl?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  reporterUserId: string;
  reporterName: string;
  reporterPhone?: string;
  reporterAvatar?: string;
  reason: string;
  description?: string;
  reviewStatus: ReportReviewStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByAdminId?: string | null;
  reviewedByAdminName?: string | null;
}

export interface PostMediaDto {
  id: string;
  url: string;
  mediaType: string;
  width?: number | null;
  height?: number | null;
}

export interface PostDto {
  id: string;
  userId: string;
  authorName: string;
  authorUsername?: string | null;
  authorAvatarUrl?: string | null;
  text?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
  commentsCount: number;
  reactionsCount: number;
  viewerReaction?: string | null;
  media: PostMediaDto[];
}

export interface ProfilePhotoDto {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  createdAt: string;
  width?: number | null;
  height?: number | null;
}
