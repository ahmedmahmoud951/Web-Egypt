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
import { normalizeReelDto, normalizeStatusDto } from '@/lib/socialNormalize';
import { resolveMediaUrl } from '@/lib/media';

export const socialAdminApi = {
  getReels: async (params?: AdminReelFilter, signal?: AbortSignal): Promise<PagedResponse<ReelDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<ReelDto>>>('/admin/reels', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.userId ? { userId: params.userId } : {}),
        ...(params?.locationId != null ? { locationId: params.locationId } : {}),
        ...(params?.categoryId != null ? { categoryId: params.categoryId } : {}),
        ...(params?.eventId ? { eventId: params.eventId } : {}),
        ...(params?.dateFrom ? { dateFrom: params.dateFrom } : {}),
        ...(params?.dateTo ? { dateTo: params.dateTo } : {}),
        ...(params?.isReported === true ? { isReported: true } : {}),
        ...(params?.search ? { search: params.search } : {}),
      },
      signal,
    });
    const data = res.data?.data;
    if (!data) {
      throw new Error('استجابة الريلز فارغة من الخادم.');
    }
    return {
      ...data,
      items: (data.items ?? []).map((r) => normalizeReelDto(r)),
    };
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

  getStatuses: async (
    params?: AdminStatusFilter,
    signal?: AbortSignal
  ): Promise<PagedResponse<AdminStatusDetailDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminStatusDetailDto>>>('/admin/statuses', {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
        ...(params?.userId ? { userId: params.userId } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.mediaType ? { mediaType: params.mediaType } : {}),
        ...(params?.dateFrom ? { dateFrom: params.dateFrom } : {}),
        ...(params?.dateTo ? { dateTo: params.dateTo } : {}),
        ...(params?.isReported === true ? { isReported: true } : {}),
        ...(params?.search ? { search: params.search } : {}),
      },
      signal,
    });
    const data = res.data.data!;
    return {
      ...data,
      items: (data.items ?? []).map((s) => normalizeStatusDto(s) as AdminStatusDetailDto),
    };
  },

  getStatusStats: async (signal?: AbortSignal): Promise<AdminStatusStats> => {
    const res = await apiClient.get<ApiResponse<AdminStatusStats>>('/admin/statuses/stats', { signal });
    return res.data.data!;
  },

  getStatusById: async (id: string, signal?: AbortSignal): Promise<AdminStatusDetailDto> => {
    const res = await apiClient.get<ApiResponse<AdminStatusDetailDto>>(`/admin/statuses/${id}`, { signal });
    return normalizeStatusDto(res.data.data!) as AdminStatusDetailDto;
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
    return (res.data.data || []).map((g) => ({
      ...g,
      authorAvatar: g.authorAvatar ? resolveMediaUrl(g.authorAvatar) : g.authorAvatar,
      items: (g.items ?? []).map((s) => normalizeStatusDto(s)),
    }));
  },

  viewStatus: async (id: string): Promise<void> => {
    await apiClient.post(`/statuses/${id}/view`);
  },

  getReports: async (
    params?: {
      page?: number;
      pageSize?: number;
      contentType?: string;
      reason?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    },
    signal?: AbortSignal
  ): Promise<PagedResponse<CentralReportDto>> => {
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
    const data = res.data.data!;
    return {
      ...data,
      items: (data.items ?? []).map((r) => ({
        ...r,
        mediaUrl: r.mediaUrl ? resolveMediaUrl(r.mediaUrl) : r.mediaUrl,
        authorAvatar: r.authorAvatar ? resolveMediaUrl(r.authorAvatar) : r.authorAvatar,
      })),
    };
  },

  getReportById: async (id: string, signal?: AbortSignal): Promise<CentralReportDto> => {
    const res = await apiClient.get<ApiResponse<CentralReportDto>>(`/admin/reports/${id}`, { signal });
    const r = res.data.data!;
    return {
      ...r,
      mediaUrl: r.mediaUrl ? resolveMediaUrl(r.mediaUrl) : r.mediaUrl,
      authorAvatar: r.authorAvatar ? resolveMediaUrl(r.authorAvatar) : r.authorAvatar,
    };
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
