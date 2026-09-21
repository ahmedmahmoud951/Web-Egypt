import { apiClient } from './client';
import { ApiResponse } from '@/types/api';

export const uploadsApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<ApiResponse<{ url: string }>>('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.data!.url;
  },
};
