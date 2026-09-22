import { apiClient } from './client';
import { ApiResponse, PagedResponse } from '@/types/api';
import { resolveMediaUrl } from '@/lib/media';
import {
  ConversationDto,
  ChatMessageDto,
  CreateDirectConversationRequest,
  CreateGroupConversationRequest,
  SendMessageRequest,
  SendMediaMessageRequest,
  MessageReactionDto,
  ChatSettingsDto,
  ChatSearchDto,
  CallDto,
  WebRtcConfigurationDto,
  AdminConversationListDto,
  AdminConversationFilterDto,
  AdminChatAuditLogDto,
  UserCommunicationGraphDto,
  UserCommunicationGraphFilterDto,
  ReportChatRequest,
  UpdateGroupInfoDto,
  AddGroupMembersRequest,
  MessageSearchResultDto,
  ChatSearchFilterDto,
  ForwardMessageRequest,
  ChatBackupDto,
} from '@/types/chat';

function resolveAvatar(url?: string | null): string | null {
  if (!url) return null;
  const resolved = resolveMediaUrl(url);
  return resolved || null;
}

function mapConversation(c: ConversationDto): ConversationDto {
  return {
    ...c,
    avatarUrl: resolveAvatar(c.avatarUrl),
    otherMember: c.otherMember
      ? { ...c.otherMember, avatarUrl: resolveAvatar(c.otherMember.avatarUrl) }
      : c.otherMember,
    members: c.members?.map((m) => ({ ...m, avatarUrl: resolveAvatar(m.avatarUrl) })),
  };
}

function mapAdminConversation(c: AdminConversationListDto): AdminConversationListDto {
  return {
    ...c,
    avatarUrl: resolveAvatar(c.avatarUrl),
    participants: c.participants?.map((p) => ({
      ...p,
      avatarUrl: resolveAvatar(p.avatarUrl),
    })),
  };
}

export const chatApi = {
  async getConversations(page: number = 1, pageSize: number = 30, isArchived?: boolean): Promise<PagedResponse<ConversationDto>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ConversationDto>>>('/chat/conversations', {
      params: { page, pageSize, isArchived },
    });
    const data = res.data.data!;
    return {
      ...data,
      items: (data.items || []).map(mapConversation),
    };
  },

  async getConversation(id: string): Promise<ConversationDto> {
    const res = await apiClient.get<ApiResponse<ConversationDto>>(`/chat/conversations/${id}`);
    return mapConversation(res.data.data!);
  },

  async createDirectConversation(request: CreateDirectConversationRequest): Promise<ConversationDto> {
    const res = await apiClient.post<ApiResponse<ConversationDto>>('/chat/conversations/direct', request);
    return mapConversation(res.data.data!);
  },

  async createGroupConversation(request: CreateGroupConversationRequest): Promise<ConversationDto> {
    const res = await apiClient.post<ApiResponse<ConversationDto>>('/chat/conversations/group', request);
    return mapConversation(res.data.data!);
  },

  async getMessages(conversationId: string, before?: string, limit: number = 50): Promise<ChatMessageDto[]> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ChatMessageDto> | ChatMessageDto[]>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        params: { page: 1, pageSize: limit },
      }
    );
    const data = res.data.data;
    const items = Array.isArray(data)
      ? data
      : Array.isArray((data as PagedResponse<ChatMessageDto> | null)?.items)
        ? (data as PagedResponse<ChatMessageDto>).items
        : [];
    // Deduplicate by id and sort oldest → newest
    const map = new Map<string, ChatMessageDto>();
    for (const item of items) {
      if (item && item.id) {
        map.set(item.id.toLowerCase(), {
          ...item,
          senderAvatarUrl: resolveAvatar(item.senderAvatarUrl),
          attachments: item.attachments?.map((a) => ({
            ...a,
            fileUrl: a.fileUrl ? resolveMediaUrl(a.fileUrl) : a.fileUrl,
            thumbnailUrl: a.thumbnailUrl ? resolveMediaUrl(a.thumbnailUrl) : a.thumbnailUrl,
          })),
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  async sendMessage(conversationId: string, request: SendMessageRequest): Promise<ChatMessageDto> {
    const res = await apiClient.post<ApiResponse<ChatMessageDto>>(`/chat/conversations/${conversationId}/messages`, request);
    return res.data.data!;
  },

  async sendMediaMessage(conversationId: string, request: SendMediaMessageRequest): Promise<ChatMessageDto> {
    const res = await apiClient.post<ApiResponse<ChatMessageDto>>(`/chat/conversations/${conversationId}/messages/media`, request);
    return res.data.data!;
  },

  async editMessage(messageId: string, text: string): Promise<ChatMessageDto> {
    const res = await apiClient.put<ApiResponse<ChatMessageDto>>(`/chat/messages/${messageId}`, { text });
    return res.data.data!;
  },

  async deleteMessage(messageId: string): Promise<boolean> {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/chat/messages/${messageId}`);
    return res.data.data!;
  },

  async addReaction(messageId: string, reaction: string): Promise<MessageReactionDto> {
    const res = await apiClient.post<ApiResponse<MessageReactionDto>>(`/chat/messages/${messageId}/reactions`, { reaction });
    return res.data.data!;
  },

  async removeReaction(messageId: string): Promise<boolean> {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/chat/messages/${messageId}/reactions`);
    return res.data.data!;
  },

  async markAsRead(conversationId: string, messageId: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/conversations/${conversationId}/read`, { messageId });
    return res.data.data!;
  },

  async markAsDelivered(conversationId: string, messageId: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/conversations/${conversationId}/delivered`, { messageId });
    return res.data.data!;
  },

  async pinConversation(conversationId: string, isPinned: boolean): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/conversations/${conversationId}/pin`, { isPinned });
    return res.data.data!;
  },

  async muteConversation(conversationId: string, isMuted: boolean): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/conversations/${conversationId}/mute`, { isMuted });
    return res.data.data!;
  },

  async authorizeUpload(folder: string, fileName: string, contentType: string, sizeBytes: number): Promise<{
    uploadUrl: string;
    mediaFileId: string;
    fileKey: string;
  }> {
    const res = await apiClient.post<ApiResponse<{ uploadUrl: string; mediaFileId: string; fileKey: string }>>(
      '/chat/media/authorize-upload',
      { folder, fileName, contentType, sizeBytes }
    );
    return res.data.data!;
  },

  async searchChat(query: string): Promise<ChatSearchDto> {
    const res = await apiClient.get<ApiResponse<ChatSearchDto>>('/chat/search', {
      params: { q: query },
    });
    return res.data.data!;
  },

  async getSettings(): Promise<ChatSettingsDto> {
    const res = await apiClient.get<ApiResponse<ChatSettingsDto>>('/chat/settings');
    return res.data.data!;
  },

  async updateSettings(settings: Partial<ChatSettingsDto>): Promise<ChatSettingsDto> {
    const res = await apiClient.put<ApiResponse<ChatSettingsDto>>('/chat/settings', settings);
    return res.data.data!;
  },

  async initiateCall(conversationId: string, type: number): Promise<CallDto> {
    const res = await apiClient.post<ApiResponse<CallDto>>('/chat/calls/initiate', { conversationId, type });
    return res.data.data!;
  },

  async updateCallStatus(callId: string, status: number): Promise<CallDto> {
    const res = await apiClient.post<ApiResponse<CallDto>>(`/chat/calls/${callId}/status`, { status });
    return res.data.data!;
  },

  async getIceServers(): Promise<WebRtcConfigurationDto> {
    const res = await apiClient.get<ApiResponse<WebRtcConfigurationDto>>('/chat/webrtc/ice-servers');
    return res.data.data!;
  },

  async searchMessages(filter: ChatSearchFilterDto): Promise<PagedResponse<MessageSearchResultDto>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<MessageSearchResultDto>>>('/chat/search', {
      params: filter,
    });
    return res.data.data!;
  },

  async updateGroupInfo(id: string, data: UpdateGroupInfoDto): Promise<ConversationDto> {
    const res = await apiClient.put<ApiResponse<ConversationDto>>(`/chat/groups/${id}`, data);
    return res.data.data!;
  },

  async addGroupMembers(id: string, memberUserIds: string[]): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/groups/${id}/members`, { memberUserIds });
    return res.data.data!;
  },

  async removeGroupMember(id: string, userId: string): Promise<boolean> {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/chat/groups/${id}/members/${userId}`);
    return res.data.data!;
  },

  async leaveGroup(id: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/groups/${id}/leave`);
    return res.data.data!;
  },

  async promoteGroupMember(id: string, userId: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/groups/${id}/members/${userId}/promote`);
    return res.data.data!;
  },

  async demoteGroupMember(id: string, userId: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/groups/${id}/members/${userId}/demote`);
    return res.data.data!;
  },

  async reportChat(request: ReportChatRequest): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>('/chat/report', request);
    return res.data.data!;
  },

  async forwardMessage(request: ForwardMessageRequest): Promise<ChatMessageDto[]> {
    const res = await apiClient.post<ApiResponse<ChatMessageDto[]>>('/chat/messages/forward', request);
    return res.data.data!;
  },

  async archiveConversation(id: string, isArchived: boolean = true): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/conversations/${id}/archive`, null, {
      params: { isArchived },
    });
    return res.data.data!;
  },

  async markAsUnread(id: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/conversations/${id}/unread`);
    return res.data.data!;
  },

  async clearConversation(id: string): Promise<boolean> {
    const res = await apiClient.post<ApiResponse<boolean>>(`/chat/conversations/${id}/clear`);
    return res.data.data!;
  },

  async getCallHistory(page: number = 1, pageSize: number = 20): Promise<PagedResponse<CallDto>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<CallDto>>>('/chat/calls/history', {
      params: { page, pageSize },
    });
    return res.data.data!;
  },

  async triggerBackup(): Promise<ChatBackupDto> {
    const res = await apiClient.post<ApiResponse<ChatBackupDto>>('/chat/backup');
    return res.data.data!;
  },
};

export const adminChatApi = {
  async getAdminConversations(filter: AdminConversationFilterDto): Promise<PagedResponse<AdminConversationListDto>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminConversationListDto>>>('/admin/chat/conversations', {
      params: filter,
    });
    const data = res.data.data!;
    return {
      ...data,
      items: (data.items || []).map(mapAdminConversation),
    };
  },

  async getAdminConversationMessages(
    id: string,
    reason?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PagedResponse<ChatMessageDto>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<ChatMessageDto>>>(`/admin/chat/conversations/${id}/messages`, {
      params: { reason, page, pageSize },
    });
    return res.data.data!;
  },

  async getUserCommunicationGraph(filter: UserCommunicationGraphFilterDto): Promise<PagedResponse<UserCommunicationGraphDto>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<UserCommunicationGraphDto>>>('/admin/chat/communication-graph', {
      params: filter,
    });
    return res.data.data!;
  },

  async getAdminAuditLogs(
    conversationId?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PagedResponse<AdminChatAuditLogDto>> {
    const res = await apiClient.get<ApiResponse<PagedResponse<AdminChatAuditLogDto>>>('/admin/chat/audit-logs', {
      params: { conversationId, page, pageSize },
    });
    return res.data.data!;
  },
};

