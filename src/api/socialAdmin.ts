import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  AdminReelFilter,
  AdminReelStats,
  AdminStatusDetailDto,
  AdminStatusFilter,
  AdminStatusStats,
  CentralReportDto,
  ReelDto,
  UserStatusGroupDto,
} from '@/types/social';

export const socialAdminApi = {
  // === Reels ===
  getReels: async (params?: AdminReelFilter, signal?: AbortSignal): Promise<PagedResponse<ReelDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<ReelDto>>>('/admin/reels', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        status: params?.status || undefined,
        userId: params?.userId,
        locationId: params?.locationId,
        categoryId: params?.categoryId,
        eventId: params?.eventId,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        isReported: params?.isReported,
        search: params?.search,
      },
      signal,
    });
    return res.data.data!;
  },

  getReelStats: async (signal?: AbortSignal): Promise<AdminReelStats> => {
    const res = await apiClient.get<ApiResponse<AdminReelStats>>('/admin/reels/stats', { signal });
    return res.data.data!;
  },

  hideReel: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/reels/${id}/hide`);
  },

  restoreReel: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/reels/${id}/restore`);
  },

  deleteReel: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/reels/${id}`);
  },

  // === Statuses ===
  getStatuses: async (params?: AdminStatusFilter, signal?: AbortSignal): Promise<PagedResponse<AdminStatusDetailDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminStatusDetailDto>>>('/admin/statuses', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        userId: params?.userId,
        status: params?.status || undefined,
        mediaType: params?.mediaType || undefined,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        isReported: params?.isReported,
        search: params?.search,
      },
      signal,
    });
    return res.data.data!;
  },

  getStatusStats: async (signal?: AbortSignal): Promise<AdminStatusStats> => {
    const res = await apiClient.get<ApiResponse<AdminStatusStats>>('/admin/statuses/stats', { signal });
    return res.data.data!;
  },

  getStatusById: async (id: string, signal?: AbortSignal): Promise<AdminStatusDetailDto> => {
    const res = await apiClient.get<ApiResponse<AdminStatusDetailDto>>(`/admin/statuses/${id}`, { signal });
    return res.data.data!;
  },

  hideStatus: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/statuses/${id}/hide`);
  },

  restoreStatus: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/statuses/${id}/restore`);
  },

  deleteStatus: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/statuses/${id}`);
  },

  getStatusFeed: async (signal?: AbortSignal): Promise<UserStatusGroupDto[]> => {
    const res = await apiClient.get<ApiResponse<UserStatusGroupDto[]>>('/statuses/feed', { signal });
    return res.data.data || [];
  },

  viewStatus: async (id: string): Promise<void> => {
    await apiClient.post(`/statuses/${id}/view`);
  },

  // === Central Reports ===
  getReports: async (params?: {
    page?: number;
    pageSize?: number;
    contentType?: string;
    reason?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }, signal?: AbortSignal): Promise<PagedResponse<CentralReportDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<CentralReportDto>>>('/admin/reports', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        contentType: params?.contentType || undefined,
        reason: params?.reason || undefined,
        status: params?.status || undefined,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        search: params?.search,
      },
      signal,
    });
    return res.data.data!;
  },

  getReportById: async (id: string, signal?: AbortSignal): Promise<CentralReportDto> => {
    const res = await apiClient.get<ApiResponse<CentralReportDto>>(`/admin/reports/${id}`, { signal });
    return res.data.data!;
  },

  resolveReport: async (id: string, notes?: string): Promise<CentralReportDto> => {
    const res = await apiClient.post<ApiResponse<CentralReportDto>>(`/admin/reports/${id}/resolve`, {
      status: 'ActionTaken',
      notes,
    });
    return res.data.data!;
  },

  rejectReport: async (id: string, notes?: string): Promise<CentralReportDto> => {
    const res = await apiClient.post<ApiResponse<CentralReportDto>>(`/admin/reports/${id}/reject`, {
      status: 'Dismissed',
      notes,
    });
    return res.data.data!;
  },

  hideReportContent: async (id: string): Promise<CentralReportDto> => {
    const res = await apiClient.post<ApiResponse<CentralReportDto>>(`/admin/reports/${id}/hide-content`);
    return res.data.data!;
  },

  restoreReportContent: async (id: string): Promise<CentralReportDto> => {
    const res = await apiClient.post<ApiResponse<CentralReportDto>>(`/admin/reports/${id}/restore-content`);
    return res.data.data!;
  },

  deleteReportContent: async (id: string): Promise<CentralReportDto> => {
    const res = await apiClient.delete<ApiResponse<CentralReportDto>>(`/admin/reports/${id}/delete-content`);
    return res.data.data!;
  },

  warnUser: async (id: string, notes?: string): Promise<CentralReportDto> => {
    const res = await apiClient.post<ApiResponse<CentralReportDto>>(`/admin/reports/${id}/warn-user`, {
      status: 'ActionTaken',
      notes,
    });
    return res.data.data!;
  },
};
