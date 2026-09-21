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
