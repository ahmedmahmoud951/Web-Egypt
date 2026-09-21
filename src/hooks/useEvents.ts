'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import {
  CreateEventDto,
  CreateEventReportDto,
  EventDto,
  EventFilterQuery,
  EventSummaryDto,
  UpdateEventDto,
} from '@/types/event';
import { PagedResponse } from '@/types/api';

export const EVENTS_QUERY_KEYS = {
  all: ['events'] as const,
  list: (filters: EventFilterQuery) => ['events', 'list', filters] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
};

export function useEvents(query: EventFilterQuery = {}) {
  return useQuery<PagedResponse<EventSummaryDto>>({
    queryKey: EVENTS_QUERY_KEYS.list(query),
    queryFn: () => eventsApi.getEvents(query),
  });
}

export function useEvent(id: string) {
  return useQuery<EventDto>({
    queryKey: EVENTS_QUERY_KEYS.detail(id),
    queryFn: ({ signal }) => eventsApi.getEvent(id, signal),
    enabled: !!id,
    retry: 0,
    staleTime: 60_000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventDto) => eventsApi.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
    },
  });
}

export function useUpdateEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateEventDto) => eventsApi.updateEvent(eventId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(EVENTS_QUERY_KEYS.detail(eventId), updated);
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.removeQueries({ queryKey: EVENTS_QUERY_KEYS.detail(eventId) });
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
    },
  });
}

export function useHideEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.hideEvent(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.setQueriesData<PagedResponse<EventSummaryDto>>(
        { queryKey: EVENTS_QUERY_KEYS.all },
        (old) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.filter((e) => e.id !== eventId),
            totalCount: Math.max(0, (old.totalCount ?? old.items.length) - 1),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
    },
  });
}

export function useConfirmEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => eventsApi.confirmEvent(eventId),
    onSuccess: (data) => {
      queryClient.setQueryData<EventDto>(EVENTS_QUERY_KEYS.detail(eventId), (old) => {
        if (!old) return old;
        return {
          ...old,
          confirmCount: data.confirmCount,
          lastConfirmedAt: data.confirmedAt,
        };
      });

      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
    },
  });
}

export function useReportEvent(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventReportDto) => eventsApi.reportEvent(eventId, data),
    onSuccess: (data) => {
      if (data.status === 'Hidden') {
        queryClient.removeQueries({ queryKey: EVENTS_QUERY_KEYS.detail(eventId) });
        queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
      }
    },
  });
}
