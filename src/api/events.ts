import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import {
  CommentDto,
  CreateCommentDto,
  CreateEventDto,
  CreateEventReportDto,
  EventConfirmationResponseDto,
  EventDto,
  EventFilterQuery,
  EventReportResponseDto,
  EventSummaryDto,
  HideEventResponseDto,
  UpdateEventDto,
} from '@/types/event';

export const eventsApi = {
  getEvents: async (query: EventFilterQuery = {}): Promise<PagedResponse<EventSummaryDto>> => {
    const res = await apiClient.get<ApiResponse<PagedResponse<EventSummaryDto>>>('/events', {
      params: query,
    });
    return res.data.data!;
  },

  getEvent: async (id: string, signal?: AbortSignal): Promise<EventDto> => {
    const res = await apiClient.get<ApiResponse<EventDto>>(`/events/${id}`, { signal });
    return res.data.data!;
  },

  createEvent: async (data: CreateEventDto): Promise<EventDto> => {
    const res = await apiClient.post<ApiResponse<EventDto>>('/events', data);
    return res.data.data!;
  },

  updateEvent: async (id: string, data: UpdateEventDto): Promise<EventDto> => {
    const res = await apiClient.put<ApiResponse<EventDto>>(`/events/${id}`, data);
    return res.data.data!;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  hideEvent: async (id: string): Promise<HideEventResponseDto> => {
    const res = await apiClient.post<ApiResponse<HideEventResponseDto>>(`/events/${id}/hide`);
    return res.data.data!;
  },

  unhideEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}/hide`);
  },

  confirmEvent: async (id: string): Promise<EventConfirmationResponseDto> => {
    const res = await apiClient.post<ApiResponse<EventConfirmationResponseDto>>(`/events/${id}/confirm`);
    return res.data.data!;
  },

  reportEvent: async (id: string, data: CreateEventReportDto): Promise<EventReportResponseDto> => {
    const res = await apiClient.post<ApiResponse<EventReportResponseDto>>(`/events/${id}/report`, data);
    return res.data.data!;
  },

  getComments: async (eventId: string): Promise<CommentDto[]> => {
    const res = await apiClient.get<ApiResponse<CommentDto[]>>(`/events/${eventId}/comments`);
    return res.data.data || [];
  },

  addComment: async (eventId: string, data: CreateCommentDto): Promise<CommentDto> => {
    const res = await apiClient.post<ApiResponse<CommentDto>>(`/events/${eventId}/comments`, data);
    return res.data.data!;
  },

  deleteComment: async (eventId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/comments/${commentId}`);
  },
};
