export interface EventCreatedMessage {
  eventId: string;
  locationId: number;
  governorateId?: number | null;
  categoryId: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  createdAt: string;
}

export interface EventUpdatedMessage {
  eventId: string;
  title: string;
  description: string;
  locationId: number;
  categoryId: number;
}

export interface EventConfirmedMessage {
  eventId: string;
  confirmCount: number;
  lastConfirmedAt: string | null;
}

export interface EventReportedMessage {
  eventId: string;
  reportCount: number;
}

export interface EventHiddenMessage {
  eventId: string;
  reason: string;
}

export interface EventRestoredMessage {
  eventId: string;
  title: string;
}

export interface LocationApprovedMessage {
  locationId: number;
  nameAr: string;
  nameEn: string;
  type: string;
  parentId: number | null;
}

// Social - Reels Events
export interface ReelPublishedMessage {
  reelId: string;
  userId: string;
  authorName: string;
  caption: string;
  mediaUrl: string;
  locationId?: number | null;
  categoryId?: number | null;
  eventId?: string | null;
  publishedAt: string;
}

export interface ReelHiddenMessage {
  reelId: string;
  reason: string;
}

export interface ReelRestoredMessage {
  reelId: string;
}

export interface ReelDeletedMessage {
  reelId: string;
}

export interface ReelReactionUpdatedMessage {
  reelId: string;
  reactionsCount: number;
  reactionType: string;
  userId: string;
}

export interface ReelCommentAddedMessage {
  reelId: string;
  commentId: string;
  userId: string;
  userName: string;
  commentText: string;
  commentsCount: number;
  createdAt: string;
}

// Social - Status Events
export interface StatusPublishedMessage {
  statusId: string;
  userId: string;
  authorName: string;
  mediaUrl: string;
  mediaType: string;
  text?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface StatusDeletedMessage {
  statusId: string;
  userId: string;
}

export interface StatusHiddenMessage {
  statusId: string;
  reason: string;
}

export interface StatusRestoredMessage {
  statusId: string;
}

// Social - Admin Events
export interface NewReelReportMessage {
  reportId: string;
  reelId: string;
  reporterUserId: string;
  reporterName: string;
  reason: string;
  createdAt: string;
}

export interface NewStatusReportMessage {
  reportId: string;
  statusId: string;
  reporterUserId: string;
  reporterName: string;
  reason: string;
  createdAt: string;
}

// User Management Events
export interface UserCreatedMessage {
  userId: string;
  name: string;
  phoneNumber: string;
  username?: string | null;
  role: string;
  createdAt: string;
}

export interface UserUpdatedMessage {
  userId: string;
  name: string;
  phoneNumber: string;
  username?: string | null;
  role: string;
  isBlocked: boolean;
  updatedAt: string;
}

export interface UserDeletedMessage {
  userId: string;
  deletedAt: string;
}


