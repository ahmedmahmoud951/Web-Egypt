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

export function isMessageRead(status: any): boolean {
  if (status === null || status === undefined) return false;
  return status === MessageDeliveryStatus.Read || status === 3 || status === 'Read' || status === 'read';
}

export function isMessageDelivered(status: any): boolean {
  if (status === null || status === undefined) return false;
  return status === MessageDeliveryStatus.Delivered || status === 2 || status === 'Delivered' || status === 'delivered';
}

export function isMessageSent(status: any): boolean {
  if (status === null || status === undefined) return false;
  return status === MessageDeliveryStatus.Sent || status === 1 || status === 'Sent' || status === 'sent';
}

export function isTypeVoice(type: any): boolean {
  return type === MessageType.Voice || type === MessageType.Audio || type === 'Voice' || type === 'voice' || type === 5 || type === 'Audio' || type === 4;
}

export function isTypeImage(type: any): boolean {
  return type === MessageType.Image || type === 'Image' || type === 'image' || type === 2;
}

export function isTypeVideo(type: any): boolean {
  return type === MessageType.Video || type === 'Video' || type === 'video' || type === 3;
}

export function isTypeFile(type: any): boolean {
  return type === MessageType.File || type === 'File' || type === 'file' || type === 6;
}

export function isTypeCall(type: any): boolean {
  return type === MessageType.Call || type === 'Call' || type === 'call' || type === 10;
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
  /** Display name from API (other user full name for direct, group title for groups). */
  name?: string | null;
  /** Legacy/alternate field some clients used; prefer `name`. */
  title?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  /** Plain preview string from API (not a full message object). */
  lastMessage?: string | ChatMessageDto | null;
  lastMessageId?: string | null;
  lastMessageType?: MessageType | null;
  lastMessageAt?: string | null;
  lastMessageSenderId?: string | null;
  lastMessageSenderName?: string | null;
  /** Delivery ticks for last outbound message (Sent/Delivered/Read). Null when last msg is incoming. */
  lastMessageDeliveryStatus?: MessageDeliveryStatus | string | number | null;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  isArchived?: boolean;
  otherUserId?: string | null;
  isOtherUserOnline?: boolean;
  otherUserLastSeen?: string | null;
  /** Legacy nested shape — prefer otherUserId + name. */
  otherMember?: ConversationMemberDto | null;
  members?: ConversationMemberDto[];
}

/** Full display name for a conversation list/header row. */
export function getConversationDisplayName(conv: {
  name?: string | null;
  title?: string | null;
  otherMember?: { name?: string | null } | null;
  members?: { userId?: string; name?: string | null }[] | null;
  otherUserId?: string | null;
}): string {
  const fromName = (conv.name || '').trim();
  if (fromName) return fromName;

  const fromTitle = (conv.title || '').trim();
  if (fromTitle) return fromTitle;

  const fromOther = (conv.otherMember?.name || '').trim();
  if (fromOther) return fromOther;

  if (conv.members?.length) {
    const peer = conv.otherUserId
      ? conv.members.find((m) => m.userId === conv.otherUserId)
      : null;
    const peerName = (peer?.name || '').trim();
    if (peerName) return peerName;

    const joined = conv.members
      .map((m) => (m.name || '').trim())
      .filter(Boolean)
      .join(' ↔ ');
    if (joined) return joined;
  }

  return 'محادثة';
}

export function getConversationLastPreview(conv: {
  lastMessage?: string | ChatMessageDto | null;
  lastMessageType?: MessageType | null;
}): string {
  const lm = conv.lastMessage;
  if (typeof lm === 'string' && lm.trim()) {
    // API sometimes returns "[Image]" style tokens
    const token = lm.trim();
    if (/^\[(Image|Video|Audio|Voice|File|Location|Contact|Call)\]$/i.test(token)) {
      const kind = token.slice(1, -1).toLowerCase();
      if (kind === 'voice' || kind === 'audio') return 'رسالة صوتية';
      if (kind === 'image') return 'صورة';
      if (kind === 'video') return 'فيديو';
      if (kind === 'call') return 'مكالمة';
      return 'مرفق';
    }
    return token;
  }
  if (lm && typeof lm === 'object') {
    if (lm.text?.trim()) return lm.text.trim();
    if (lm.type === MessageType.Voice || lm.type === MessageType.Audio) return 'رسالة صوتية';
    if (lm.type === MessageType.Image) return 'صورة';
    if (lm.type === MessageType.Video) return 'فيديو';
    if (lm.type === MessageType.Call) return 'مكالمة';
    return 'مرفق';
  }
  if (conv.lastMessageType === MessageType.Voice || conv.lastMessageType === MessageType.Audio) {
    return 'رسالة صوتية';
  }
  if (conv.lastMessageType === MessageType.Image) return 'صورة';
  if (conv.lastMessageType === MessageType.Video) return 'فيديو';
  if (conv.lastMessageType === MessageType.Call) return 'مكالمة';
  if (conv.lastMessageType != null && conv.lastMessageType !== MessageType.Text) return 'مرفق';
  return 'بدء المحادثة...';
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
  /** Matches API CreateDirectChatRequest.UserId (camelCase: userId). */
  userId: string;
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

/** Full names of people in an admin-monitored conversation. */
export function getAdminConversationPeople(conv: {
  title?: string | null;
  participants?: { name?: string | null; phoneNumber?: string | null }[] | null;
}): string {
  const parts = (conv.participants || [])
    .map((p) => {
      const n = (p.name || '').trim();
      if (n && n !== 'مستخدم') return n;
      const phone = (p.phoneNumber || '').trim();
      return phone || n;
    })
    .filter(Boolean);
  if (parts.length > 0) return parts.join(' ↔ ');
  const title = (conv.title || '').trim();
  return title || 'محادثة';
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

