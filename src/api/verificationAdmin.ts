import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';

export interface VerificationDashboardStats {
  pendingRequests: number;
  underReviewRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  activeVerifications: number;
  expiringSoon: number;
  expired: number;
  freeVerifications: number;
  totalRevenue?: number;
}

export interface UserLookupItem {
  id: string;
  name: string;
  username?: string;
  phoneNumber: string;
  hasActiveVerification: boolean;
  activeVerificationId?: string;
  badgeName?: string;
  expiresAt?: string;
  daysRemaining?: number;
}

export interface VerificationTypeItem {
  id: string;
  name: string;
  description?: string;
  badgeName: string;
  badgeIcon?: string;
  isActive: boolean;
  requiresDocuments: boolean;
  requiresReview: boolean;
  allowUserRequest: boolean;
  activePlansCount: number;
  createdAt: string;
  plans?: VerificationPlanItem[];
}

export interface VerificationPlanItem {
  id: string;
  verificationTypeId: string;
  verificationTypeName?: string;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  currency: string;
  isActive: boolean;
  isFree: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface VerificationRequestDocumentItem {
  id: string;
  verificationRequestId: string;
  mediaFileId: string;
  documentType: number;
  documentTypeName: string;
  /** API field — relative path like /api/media/{id}/file */
  documentUrl?: string;
  fileName?: string;
  notes?: string;
  createdAt: string;
  /** Legacy aliases (older clients) */
  mediaUrl?: string;
  mediaFileName?: string;
  fileSizeBytes?: number;
}

/** Arabic labels for VerificationDocumentType enum values from the API. */
export function verificationDocumentTypeLabel(
  documentType: number,
  fallbackName?: string
): string {
  switch (documentType) {
    case 1:
      return 'وش بطاقة الرقم القومي';
    case 2:
      return 'ظهر بطاقة الرقم القومي';
    case 3:
      return 'جواز سفر';
    case 4:
      return 'كارنيه صحافة';
    case 5:
      return 'ترخيص جهة';
    case 6:
      return 'سجل تجاري';
    case 7:
      return 'بطاقة ضريبية';
    case 99:
      return 'مستند آخر';
    default:
      return fallbackName || `مستند (${documentType})`;
  }
}

export interface VerificationAuditLogItem {
  id: string;
  action: number;
  actionName: string;
  performedByUserId?: string;
  performedByUserName?: string;
  oldStatus?: string;
  newStatus?: string;
  notes?: string;
  createdAt: string;
}

export interface VerificationRequestItem {
  id: string;
  userId: string;
  userName: string;
  userPhoneNumber: string;
  verificationTypeId: string;
  verificationTypeName: string;
  badgeName: string;
  badgeIcon?: string;
  verificationPlanId?: string;
  planName?: string;
  planPrice?: number;
  status: number; // 1: Pending, 2: UnderReview, 3: Approved, 4: Rejected, 5: Cancelled, 6: Expired
  statusName: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  rejectionReason?: string;
  adminNotes?: string;
  paymentStatus: number;
  requestedDurationDays: number;
  approvedDurationDays?: number;
  documentsCount: number;
  createdAt: string;
  documents?: VerificationRequestDocumentItem[];
  auditLogs?: VerificationAuditLogItem[];
}

export interface ApproveVerificationPayload {
  approvedDurationDays?: number;
  isFree: boolean;
  adminNotes?: string;
}

export interface RejectVerificationPayload {
  rejectionReason: string;
  adminNotes?: string;
}

export interface DirectGrantPayload {
  verificationTypeId: string;
  durationDays: number;
  isFree: boolean;
  reason?: string;
  adminNotes?: string;
}

export interface CreateTypePayload {
  name: string;
  description?: string;
  badgeName: string;
  badgeIcon?: string;
  requiresDocuments: boolean;
  requiresReview: boolean;
  allowUserRequest: boolean;
}

export interface CreatePlanPayload {
  verificationTypeId: string;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  currency?: string;
  isActive: boolean;
  isFree: boolean;
  sortOrder?: number;
}

export const verificationAdminApi = {
  getDashboard: async (signal?: AbortSignal): Promise<VerificationDashboardStats> => {
    const res = await apiClient.get<ApiResponse<VerificationDashboardStats>>('/admin/verification/dashboard', { signal });
    return res.data.data!;
  },

  getRequests: async (params?: {
    status?: number;
    verificationTypeId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  }): Promise<PagedResponse<VerificationRequestItem>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<VerificationRequestItem>>>('/admin/verification/requests', {
      params: {
        status: params?.status,
        verificationTypeId: params?.verificationTypeId,
        search: params?.search,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 15,
      },
      signal: params?.signal,
    });
    return res.data.data!;
  },

  getRequestById: async (id: string, signal?: AbortSignal): Promise<VerificationRequestItem> => {
    const res = await apiClient.get<ApiResponse<VerificationRequestItem>>(`/admin/verification/requests/${id}`, { signal });
    return res.data.data!;
  },

  moveToReview: async (id: string): Promise<VerificationRequestItem> => {
    const res = await apiClient.post<ApiResponse<VerificationRequestItem>>(`/admin/verification/requests/${id}/review`);
    return res.data.data!;
  },

  approveRequest: async (id: string, payload: ApproveVerificationPayload): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/verification/requests/${id}/approve`, payload);
    return res.data.data!;
  },

  rejectRequest: async (id: string, payload: RejectVerificationPayload): Promise<VerificationRequestItem> => {
    const res = await apiClient.post<ApiResponse<VerificationRequestItem>>(`/admin/verification/requests/${id}/reject`, payload);
    return res.data.data!;
  },

  deleteRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/verification/requests/${id}`);
  },

  directGrant: async (userId: string, payload: DirectGrantPayload): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/verification/users/${userId}/grant`, payload);
    return res.data.data!;
  },

  grantByIdentifier: async (payload: {
    userIdentifier: string;
    verificationTypeId: string;
    durationDays: number;
    isFree: boolean;
    pricePaid?: number;
    currency?: string;
    adminNotes?: string;
  }): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/verification/grant-by-identifier', payload);
    return res.data.data!;
  },

  revokeVerification: async (verificationId: string, reason: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/verification/${verificationId}/revoke`, { reason });
    return res.data.data!;
  },

  revokeByIdentifier: async (identifier: string, reason: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/verification/revoke-by-identifier', { identifier, reason });
    return res.data.data!;
  },

  extendVerification: async (verificationId: string, extensionDays: number, reason?: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/verification/${verificationId}/extend`, {
      extensionDays,
      reason,
    });
    return res.data.data!;
  },

  extendByIdentifier: async (identifier: string, extensionDays: number, reason?: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/verification/extend-by-identifier', {
      identifier,
      extensionDays,
      reason,
    });
    return res.data.data!;
  },

  lookupUsers: async (query: string, signal?: AbortSignal): Promise<UserLookupItem[]> => {
    if (!query || query.trim().length < 2) return [];
    const res = await apiClient.get<ApiResponse<UserLookupItem[]>>('/admin/verification/users/lookup', {
      params: { q: query.trim() },
      signal,
    });
    return res.data.data || [];
  },

  // Types Management
  getTypes: async (signal?: AbortSignal): Promise<VerificationTypeItem[]> => {
    const res = await apiClient.get<ApiResponse<VerificationTypeItem[]>>('/admin/verification/types', { signal });
    return res.data.data || [];
  },

  createType: async (payload: CreateTypePayload): Promise<VerificationTypeItem> => {
    const res = await apiClient.post<ApiResponse<VerificationTypeItem>>('/admin/verification/types', payload);
    return res.data.data!;
  },

  updateType: async (id: string, payload: Partial<CreateTypePayload>): Promise<VerificationTypeItem> => {
    const res = await apiClient.put<ApiResponse<VerificationTypeItem>>(`/admin/verification/types/${id}`, payload);
    return res.data.data!;
  },

  toggleTypeStatus: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/verification/types/${id}/status`, isActive, {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  deleteType: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/verification/types/${id}`);
  },

  // Plans Management
  getPlans: async (verificationTypeId?: string, signal?: AbortSignal): Promise<VerificationPlanItem[]> => {
    const res = await apiClient.get<ApiResponse<VerificationPlanItem[]>>('/admin/verification/plans', {
      params: { verificationTypeId },
      signal,
    });
    return res.data.data || [];
  },

  createPlan: async (payload: CreatePlanPayload): Promise<VerificationPlanItem> => {
    const res = await apiClient.post<ApiResponse<VerificationPlanItem>>('/admin/verification/plans', payload);
    return res.data.data!;
  },

  updatePlan: async (id: string, payload: Partial<CreatePlanPayload>): Promise<VerificationPlanItem> => {
    const res = await apiClient.put<ApiResponse<VerificationPlanItem>>(`/admin/verification/plans/${id}`, payload);
    return res.data.data!;
  },

  togglePlanStatus: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.patch(`/admin/verification/plans/${id}/status`, isActive, {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  deletePlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/verification/plans/${id}`);
  },
};
