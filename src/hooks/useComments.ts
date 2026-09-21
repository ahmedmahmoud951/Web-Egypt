'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { CommentDto, CreateCommentDto, EventDto } from '@/types/event';
import { EVENTS_QUERY_KEYS } from './useEvents';

export const COMMENTS_QUERY_KEYS = {
  byEvent: (eventId: string) => ['events', 'comments', eventId] as const,
};

export function useComments(eventId: string) {
  return useQuery<CommentDto[]>({
    queryKey: COMMENTS_QUERY_KEYS.byEvent(eventId),
    queryFn: () => eventsApi.getComments(eventId),
    enabled: !!eventId,
  });
}

export function useAddComment(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentDto) => eventsApi.addComment(eventId, data),
    onSuccess: (newComment) => {
      // 1. Prepend comment to local comments cache
      queryClient.setQueryData<CommentDto[]>(
        COMMENTS_QUERY_KEYS.byEvent(eventId),
        (old) => (old ? [newComment, ...old] : [newComment])
      );

      // 2. Increment commentsCount in event detail cache
      queryClient.setQueryData<EventDto>(
        EVENTS_QUERY_KEYS.detail(eventId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            commentsCount: (old.commentsCount || 0) + 1,
          };
        }
      );

      // 3. Invalidate event list queries to reflect updated commentsCount in feed
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
    },
  });
}

export function useDeleteComment(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => eventsApi.deleteComment(eventId, commentId),
    onSuccess: (_, commentId) => {
      // 1. Remove comment from local comments cache
      queryClient.setQueryData<CommentDto[]>(
        COMMENTS_QUERY_KEYS.byEvent(eventId),
        (old) => (old ? old.filter((c) => c.id !== commentId) : [])
      );

      // 2. Decrement commentsCount in event detail cache
      queryClient.setQueryData<EventDto>(
        EVENTS_QUERY_KEYS.detail(eventId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            commentsCount: Math.max(0, (old.commentsCount || 0) - 1),
          };
        }
      );

      // 3. Invalidate event list queries
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEYS.all });
    },
  });
}
