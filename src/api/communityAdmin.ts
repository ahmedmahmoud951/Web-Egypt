import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  CommunityAlertDto,
  CarpoolRideDto,
  LostAndFoundItemDto,
} from '@/types/community';

export const communityAdminApi = {
  // SOS & Emergency
  getSosAlerts: async (
    page = 1,
    pageSize = 20,
    status?: string,
    signal?: AbortSignal
  ): Promise<PagedResponse<CommunityAlertDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<CommunityAlertDto>>>(
      '/admin/community/sos',
      {
        params: {
          page,
          pageSize,
          ...(status ? { status } : {}),
        },
        signal,
      }
    );
    return res.data?.data!;
  },

  resolveSosAlert: async (id: string): Promise<void> => {
    await apiClient.post(`/community/sos/${id}/resolve`);
  },

  // Carpooling
  getCarpoolRides: async (
    page = 1,
    pageSize = 20,
    status?: string,
    signal?: AbortSignal
  ): Promise<PagedResponse<CarpoolRideDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<CarpoolRideDto>>>(
      '/admin/community/carpool',
      {
        params: {
          page,
          pageSize,
          ...(status ? { status } : {}),
        },
        signal,
      }
    );
    return res.data?.data!;
  },

  // Lost & Found
  getLostAndFoundItems: async (
    page = 1,
    pageSize = 20,
    status?: string,
    signal?: AbortSignal
  ): Promise<PagedResponse<LostAndFoundItemDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<LostAndFoundItemDto>>>(
      '/admin/community/lost-and-found',
      {
        params: {
          page,
          pageSize,
          ...(status ? { status } : {}),
        },
        signal,
      }
    );
    return res.data?.data!;
  },

  // Delete violation
  deleteItem: async (itemType: 'sos' | 'carpool' | 'lost-and-found', id: string): Promise<void> => {
    await apiClient.delete(`/admin/community/${itemType}/${id}`);
  },
};
