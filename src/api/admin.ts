import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import { EventDto, EventStatus } from '@/types/event';
import { LocationDto, LocationSuggestionDto } from '@/types/location';
import {
  AdminComplaint,
  AdminDashboardStats,
  AdminEventDetail,
  AdminStaffMember,
  AdminUserDetail,
  AdminUserListItem,
  CreateAdminStaffRequest,
} from '@/types/admin';

export const adminApi = {
  getDashboardStats: async (signal?: AbortSignal): Promise<AdminDashboardStats> => {
    const res = await apiClient.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard/stats', {
      signal,
    });
    return res.data.data!;
  },

  getEvents: async (params?: {
    status?: EventStatus | string;
    q?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  }): Promise<PagedResponse<EventDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<EventDto>>>('/admin/events', {
      params: {
        status: params?.status,
        q: params?.q,
        userId: params?.userId,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      },
      signal: params?.signal,
    });
    return res.data.data!;
  },

  getEventById: async (id: string, signal?: AbortSignal): Promise<AdminEventDetail> => {
    const res = await apiClient.get<ApiResponse<AdminEventDetail>>(`/admin/events/${id}`, { signal });
    return res.data.data!;
  },

  getReportedEvents: async (): Promise<EventDto[]> => {
    const res = await apiClient.get<ApiResponse<EventDto[]>>('/admin/events/reported');
    return res.data.data || [];
  },

  getHiddenEvents: async (): Promise<EventDto[]> => {
    const res = await apiClient.get<ApiResponse<EventDto[]>>('/admin/events/hidden');
    return res.data.data || [];
  },

  restoreEvent: async (id: string): Promise<EventDto> => {
    const res = await apiClient.post<ApiResponse<EventDto>>(`/admin/events/${id}/restore`);
    return res.data.data!;
  },

  hideEvent: async (id: string): Promise<EventDto> => {
    const res = await apiClient.post<ApiResponse<EventDto>>(`/admin/events/${id}/hide`);
    return res.data.data!;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/events/${id}`);
  },

  getUsers: async (params?: {
    q?: string;
    isBlocked?: boolean;
    page?: number;
    pageSize?: number;
    signal?: AbortSignal;
  }): Promise<PagedResponse<AdminUserListItem>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminUserListItem>>>('/admin/users', {
      params: {
        q: params?.q,
        isBlocked: params?.isBlocked,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      },
      signal: params?.signal,
    });
    return res.data.data!;
  },

  getUserById: async (id: string, signal?: AbortSignal): Promise<AdminUserDetail> => {
    const res = await apiClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`, { signal });
    return res.data.data!;
  },

  blockUser: async (id: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/block`, { reason: reason || undefined });
  },

  unblockUser: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/unblock`);
  },

  changeUserRole: async (id: string, role: 'Admin' | 'User'): Promise<void> => {
    await apiClient.post(`/admin/users/${id}/role`, { role });
  },

  getComplaints: async (params?: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PagedResponse<AdminComplaint>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminComplaint>>>('/admin/complaints', {
      params: {
        q: params?.q,
        status: params?.status,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      },
    });
    return res.data.data!;
  },

  reviewComplaint: async (
    id: string,
    body: { status: string; notes?: string }
  ): Promise<AdminComplaint> => {
    const res = await apiClient.post<ApiResponse<AdminComplaint>>(`/admin/complaints/${id}/review`, body);
    return res.data.data!;
  },

  getStaff: async (): Promise<AdminStaffMember[]> => {
    const res = await apiClient.get<ApiResponse<AdminStaffMember[]>>('/admin/staff');
    return res.data.data || [];
  },

  createStaff: async (body: CreateAdminStaffRequest): Promise<AdminStaffMember> => {
    const res = await apiClient.post<ApiResponse<AdminStaffMember>>('/admin/staff', body);
    return res.data.data!;
  },

  getPendingLocations: async (): Promise<LocationSuggestionDto[]> => {
    const res = await apiClient.get<ApiResponse<LocationSuggestionDto[]>>('/admin/locations/pending');
    return res.data.data || [];
  },

  approveLocation: async (id: string): Promise<LocationDto> => {
    const res = await apiClient.post<ApiResponse<LocationDto>>(`/admin/locations/${id}/approve`);
    return res.data.data!;
  },

  rejectLocation: async (id: string): Promise<LocationSuggestionDto> => {
    const res = await apiClient.post<ApiResponse<LocationSuggestionDto>>(`/admin/locations/${id}/reject`);
    return res.data.data!;
  },
};
