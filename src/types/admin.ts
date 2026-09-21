export interface AdminDashboardStats {
  usersCount: number;
  eventsToday: number;
  publishedEvents: number;
  reportedEvents: number;
  pendingLocations: number;
  hiddenEvents: number;
  blockedUsers?: number;
  pendingComplaints?: number;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  isSuperAdmin: boolean;
  isBlocked: boolean;
  blockedAt?: string | null;
  blockReason?: string | null;
  eventsCount: number;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {}

export interface AdminStaffMember {
  id: string;
  name: string;
  phoneNumber: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export interface CreateAdminStaffRequest {
  phoneNumber: string;
  name: string;
  password: string;
}

export interface AdminComplaint {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  reporterUserId: string;
  reporterName: string;
  reporterPhone: string;
  reason: string;
  reviewStatus: string;
  adminNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface AdminEventDetail {
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  locationId: number;
  locationNameAr: string;
  locationPathAr: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyMeters?: number | null;
  mapsUrl?: string | null;
  categoryId: number;
  categoryNameAr: string;
  title: string;
  description: string;
  imageUrl: string | null;
  status: string;
  confirmCount: number;
  reportCount: number;
  commentsCount: number;
  createdAt: string;
  lastConfirmedAt?: string | null;
  media?: Array<{
    id: string;
    type: string;
    contentType: string;
    url: string;
    fileSize: number;
  }>;
}
