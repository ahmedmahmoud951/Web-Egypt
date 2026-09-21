'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/api/locations';
import { CreateLocationSuggestionDto, LocationDto } from '@/types/location';

export const LOCATIONS_QUERY_KEYS = {
  governorates: ['locations', 'governorates'] as const,
  children: (parentId: number) => ['locations', 'children', parentId] as const,
  detail: (id: number) => ['locations', 'detail', id] as const,
};

export function useGovernorates() {
  return useQuery<LocationDto[]>({
    queryKey: LOCATIONS_QUERY_KEYS.governorates,
    queryFn: locationsApi.getGovernorates,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useLocationChildren(parentId?: number) {
  return useQuery<LocationDto[]>({
    queryKey: LOCATIONS_QUERY_KEYS.children(parentId || 0),
    queryFn: () => locationsApi.getChildren(parentId!),
    enabled: !!parentId && parentId > 0,
    staleTime: 1000 * 60 * 30,
  });
}

export function useLocation(id?: number) {
  return useQuery<LocationDto>({
    queryKey: LOCATIONS_QUERY_KEYS.detail(id || 0),
    queryFn: () => locationsApi.getLocation(id!),
    enabled: !!id && id > 0,
  });
}

export function useSuggestLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLocationSuggestionDto) => locationsApi.suggest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'locations', 'pending'] });
    },
  });
}
