import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  CommunityAlertDto,
  CarpoolRideDto,
  CarpoolRequestDto,
  CarpoolTransactionDto,
  LostAndFoundItemDto,
  BroadcastCommunityItemRequest,
  BroadcastCommunityItemResponse,
  BanCommunityItemRequest,
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

  // Carpooling Rides
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

  // Carpool Passenger Requests (طلبات الركاب)
  getCarpoolRequests: async (
    page = 1,
    pageSize = 20,
    status?: string,
    signal?: AbortSignal
  ): Promise<PagedResponse<CarpoolRequestDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<CarpoolRequestDto>>>(
      '/admin/community/carpool-requests',
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

  // Carpool Transactions & Trips History (سجل المعاملات والرحلات)
  getCarpoolTransactions: async (
    page = 1,
    pageSize = 20,
    signal?: AbortSignal
  ): Promise<PagedResponse<CarpoolTransactionDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<CarpoolTransactionDto>>>(
      '/admin/community/carpool-transactions',
      {
        params: {
          page,
          pageSize,
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

  // Ban / Block post
  banItem: async (itemType: 'sos' | 'carpool' | 'lost-and-found', id: string, reason?: string): Promise<void> => {
    await apiClient.post(`/admin/community/${itemType}/${id}/ban`, { reason } as BanCommunityItemRequest);
  },

  // Broadcast / Promote to Urgent Announcement & Flash Ad to All Users
  broadcastItemAsAd: async (
    itemType: 'sos' | 'carpool' | 'lost-and-found',
    id: string,
    req: BroadcastCommunityItemRequest
  ): Promise<BroadcastCommunityItemResponse> => {
    const res = await apiClient.post<ApiResponse<BroadcastCommunityItemResponse>>(
      `/admin/community/${itemType}/${id}/broadcast`,
      req
    );
    return res.data?.data!;
  },
};

