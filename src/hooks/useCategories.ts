'use client';

import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories';
import { CategoryDto } from '@/types/category';

export const CATEGORIES_QUERY_KEY = ['categories'] as const;

export function useCategories() {
  return useQuery<CategoryDto[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: categoriesApi.getCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
