import { apiClient } from './client';
import { ApiResponse } from '@/types/api';
import { CategoryDto } from '@/types/category';

export const categoriesApi = {
  getCategories: async (): Promise<CategoryDto[]> => {
    const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/categories');
    return res.data.data || [];
  },
};
