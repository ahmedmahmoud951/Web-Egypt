export enum ConversationType {
  Direct = 1,
  Group = 2,
  Channel = 3,
}

export enum ConversationMemberRole {
  Member = 1,
  Admin = 2,
  Owner = 3,
}

export enum MessageType {
  Text = 1,
  Image = 2,
  Video = 3,
  Audio = 4,
  Voice = 5,
  File = 6,
  Location = 7,
  Contact = 8,
  System = 9,
  Call = 10,
}

export enum MessageDeliveryStatus {
  Sending = 0,
  Sent = 1,
  Delivered = 2,
  Read = 3,
  Failed = 4,
}

export enum CallType {
  Voice = 1,
  Video = 2,
}

export enum CallStatus {
  Calling = 1,
  Ringing = 2,
  Accepted = 3,
  Rejected = 4,
  Busy = 5,
  Missed = 6,
  Cancelled = 7,
  Ended = 8,
  Failed = 9,
  Connected = 10,
}

export enum LastSeenPrivacy {
  Everyone = 1,
  Followers = 2,
  Nobody = 3,
}

export enum MediaAutoDownloadSetting {
  WiFi = 1,
  MobileData = 2,
  Never = 3,
}

export interface ConversationMemberDto {
  userId: string;
  name: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  role: ConversationMemberRole;
  isMuted: boolean;
  isPinned: boolean;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  joinedAt: string;
}

export interface MessageAttachmentDto {
  id: string;
  mediaFileId?: string | null;
  fileUrl: string;
  thumbnailUrl?: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface MessageReactionDto {
  id: string;
  userId: string;
  userName: string;
  reaction: string;
  createdAt: string;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  type: MessageType;
  text?: string | null;
  replyToMessageId?: string | null;
  replyToMessageText?: string | null;
  replyToSenderName?: string | null;
  deliveryStatus: MessageDeliveryStatus;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  attachments: MessageAttachmentDto[];
  reactions: MessageReactionDto[];
}

export interface ConversationDto {
  id: string;
  type: ConversationType;
  title?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  lastMessage?: ChatMessageDto | null;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived?: boolean;
  otherMember?: ConversationMemberDto | null;
  members: ConversationMemberDto[];
}

export interface ForwardMessageRequest {
  messageId: string;
  targetConversationIds: string[];
  extraText?: string;
}

export interface ChatBackupDto {
  backupAt: string;
  sizeBytes: number;
  totalConversations: number;
  totalMessages: number;
  status: string;
}

export interface CreateDirectConversationRequest {
  targetUserId: string;
}

export interface CreateGroupConversationRequest {
  title: string;
  description?: string;
  avatarMediaId?: string;
  memberUserIds: string[];
}

export interface SendMessageRequest {
  type: MessageType;
  text?: string;
  replyToMessageId?: string;
  clientMessageId?: string;
}

export interface SendMediaMessageRequest {
  type: MessageType;
  mediaFileId: string;
  text?: string;
  replyToMessageId?: string;
  clientMessageId?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  thumbnailMediaId?: string;
}

export interface ChatSettingsDto {
  readReceiptsEnabled: boolean;
  lastSeenEnabled: boolean;
  lastSeenPrivacy: LastSeenPrivacy;
  onlineStatusEnabled: boolean;
  typingIndicatorsEnabled: boolean;
  mediaAutoDownloadEnabled: boolean;
  mediaAutoDownload: MediaAutoDownloadSetting;
  notificationsEnabled: boolean;
  notificationPreviewEnabled?: boolean;
  autoDownloadPhotos?: boolean;
  autoDownloadVideos?: boolean;
  autoDownloadAudio?: boolean;
  autoDownloadDocuments?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  blockedUsersCount?: number;
  archivedChatsCount?: number;
  pinnedChatsCount?: number;
  lastBackupAt?: string | null;
  backupSizeBytes?: number;
}

export interface CallParticipantDto {
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  connectionStatus: number;
  joinedAt?: string | null;
  leftAt?: string | null;
}

export interface CallDto {
  id: string;
  conversationId: string;
  initiatedByUserId: string;
  initiatorName: string;
  initiatorAvatarUrl?: string | null;
  type: CallType;
  status: CallStatus;
  startedAt: string;
  answeredAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  participants: CallParticipantDto[];
}

export interface ChatSearchDto {
  conversations: ConversationDto[];
  messages: ChatMessageDto[];
}

export interface IceServerDto {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface WebRtcConfigurationDto {
  iceServers: IceServerDto[];
  ttlSeconds: number;
}

export interface WebRtcSignalDto {
  callId: string;
  senderUserId: string;
  targetUserId: string;
  signalType: 'offer' | 'answer' | 'ice-candidate';
  sdp?: string | null;
  candidate?: string | null;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

export interface AdminConversationParticipantDto {
  userId: string;
  name: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: ConversationMemberRole;
  joinedAt: string;
  isMuted: boolean;
  isBlocked: boolean;
}

export interface AdminConversationListDto {
  id: string;
  type: ConversationType;
  title?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  lastActivityAt?: string | null;
  messageCount: number;
  attachmentCount: number;
  unreadCountUserPerspective: number;
  lastMessageSnippet?: string | null;
  lastMessageType?: MessageType | null;
  lastMessageAt?: string | null;
  hasReportedContent: boolean;
  hasBlockedMember: boolean;
  participants: AdminConversationParticipantDto[];
}

export interface AdminConversationFilterDto {
  search?: string;
  userId?: string;
  conversationId?: string;
  dateFrom?: string;
  dateTo?: string;
  messageType?: MessageType;
  hasMedia?: boolean;
  reportedOnly?: boolean;
  blockedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminChatAuditLogDto {
  id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  conversationId?: string | null;
  targetUserId?: string | null;
  reason?: string | null;
  timestamp: string;
}

export interface UserCommunicationGraphDto {
  userId: string;
  name: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  conversationCount: number;
  uniqueContactsCount: number;
  lastActivity?: string | null;
  lastConversationId?: string | null;
  lastConversationTitle?: string | null;
  blockedContactsCount: number;
}

export interface UserCommunicationGraphFilterDto {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportChatRequest {
  reportType: 1 | 2 | 3; // 1: User, 2: Message, 3: Conversation
  targetId: string;
  reason: number;
  notes?: string;
}

export interface UpdateGroupInfoDto {
  title: string;
  avatarMediaId?: string | null;
}

export interface AddGroupMembersRequest {
  memberUserIds: string[];
}

export interface GroupMemberDto {
  userId: string;
  name: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: ConversationMemberRole;
  joinedAt: string;
  isMuted: boolean;
}

export interface MessageSearchResultDto {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  text?: string | null;
  messageType: MessageType;
  createdAt: string;
  highlightSnippet: string;
  conversationTitle?: string | null;
}

export interface ChatSearchFilterDto {
  q?: string;
  conversationId?: string;
  from?: string;
  to?: string;
  messageType?: MessageType;
  page?: number;
  pageSize?: number;
}

