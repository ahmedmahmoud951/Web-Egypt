import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { CreateLocationSuggestionDto, LocationDto, LocationSuggestionDto } from '@/types/location';

export const locationsApi = {
  getGovernorates: async (): Promise<LocationDto[]> => {
    const res = await apiClient.get<ApiResponse<LocationDto[]>>('/locations/governorates');
    return res.data.data || [];
  },

  getChildren: async (parentId: number): Promise<LocationDto[]> => {
    const res = await apiClient.get<ApiResponse<LocationDto[]>>(`/locations/${parentId}/children`);
    return res.data.data || [];
  },

  getLocation: async (id: number): Promise<LocationDto> => {
    const res = await apiClient.get<ApiResponse<LocationDto>>(`/locations/${id}`);
    return res.data.data!;
  },

  suggest: async (data: CreateLocationSuggestionDto): Promise<LocationSuggestionDto> => {
    const res = await apiClient.post<ApiResponse<LocationSuggestionDto>>('/locations/suggest', data);
    return res.data.data!;
  },
};
