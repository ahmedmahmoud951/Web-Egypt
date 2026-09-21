import { LocationDto } from './location';
import { CategoryDto } from './category';
import { UserDto } from './auth';

export type EventStatus = 'Published' | 'Hidden' | 'Deleted';

export type ReportReason = 
  | 'FalseInformation'
  | 'WrongLocation'
  | 'OldEvent'
  | 'Spam'
  | 'Inappropriate'
  | 'Other';

export interface EventSummaryDto {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  imageUrl: string | null;
  primaryMediaType?: 'Image' | 'Video' | string | null;
  status?: EventStatus;
  confirmCount: number;
  reportCount?: number;
  commentsCount: number;
  lastConfirmedAt?: string | null;
  createdAt: string;
  locationId: number;
  locationNameAr: string;
  locationNameEn?: string;
  categoryId: number;
  categoryNameAr: string;
  categoryIcon?: string | null;
}

export interface MediaItemDto {
  id: string;
  type: 'Image' | 'Video' | 'Document';
  contentType: string;
  url: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface EventDto {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: EventStatus;
  confirmCount: number;
  reportCount: number;
  commentsCount: number;
  lastConfirmedAt: string | null;
  createdAt: string;
  updatedAt?: string | null;
  userId: string;
  userName?: string;
  user?: UserDto | null;
  locationId: number;
  locationNameAr?: string;
  locationPathAr?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyMeters?: number | null;
  location?: LocationDto | null;
  categoryId: number;
  categoryNameAr?: string;
  category?: CategoryDto | null;
  media?: MediaItemDto[];
}

export interface CommentDto {
  id: string;
  eventId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  /** True when the author is an Admin account (public name shows as "Admin"). */
  isAdminAuthor?: boolean;
  /** Admin-only verified seal next to the name. */
  hasAdminVerifiedBadge?: boolean;
}

export interface CreateCommentDto {
  content: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  imageUrl?: string | null;
  locationId: number;
  categoryId: number;
  mediaIds?: string[];
  /** GPS from device — required for admin exact-location map */
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyMeters?: number | null;
}

export type UpdateEventDto = CreateEventDto;

export interface HideEventResponseDto {
  eventId: string;
  hidden: boolean;
  hiddenAt: string;
}

export interface CreateEventReportDto {
  reason: ReportReason;
}

export interface EventConfirmationResponseDto {
  eventId: string;
  confirmCount: number;
  isConfirmed: boolean;
  confirmedAt: string;
}

export interface EventReportResponseDto {
  eventId: string;
  reportCount: number;
  status: string;
  reportedAt: string;
}

export interface EventFilterQuery {
  governorateId?: number;
  cityId?: number;
  locationId?: number;
  categoryId?: number;
  sort?: 'recent' | 'confirmed' | 'active';
  page?: number;
  pageSize?: number;
}
