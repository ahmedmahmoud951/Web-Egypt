'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAuth } from '@/hooks/useAuth';
import { chatApi, adminChatApi } from '@/api/chat';
import { adminApi } from '@/api/admin';
import { useChatHub } from '@/hooks/useChatHub';
import { AdminUserListItem } from '@/types/admin';
import { ChatUserAvatar } from '@/components/chat/ChatUserAvatar';
import { devLog } from '@/lib/devLog';
import { formatChatListTime, formatLastSeenArabic, parseApiUtcDate } from '@/lib/utils';
import { enableWebChatPush, showChatMessageNotification } from '@/lib/webChatPush';
import {
  ConversationType,
  ConversationDto,
  ChatMessageDto,
  MessageType,
  MessageDeliveryStatus,
  isMessageRead,
  isMessageDelivered,
  isMessageSent,
  isTypeVoice,
  isTypeImage,
  isTypeVideo,
  isTypeFile,
  isTypeCall,
  MessageReactionDto,
  ChatSettingsDto,
  LastSeenPrivacy,
  MediaAutoDownloadSetting,
  CallDto,
  CallType,
  CallStatus,
  AdminConversationListDto,
  AdminConversationFilterDto,
  AdminChatAuditLogDto,
  UserCommunicationGraphDto,
  MessageSearchResultDto,
  ChatBackupDto,
  getConversationDisplayName,
  getConversationAvatarUrl,
  getConversationLastPreview,
  getAdminConversationPeople,
} from '@/types/chat';
import {
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Bell,
  BellOff,
  Trash2,
  Reply,
  Copy,
  X,
  FileText,
  Play,
  Pause,
  Settings,
  Image as ImageIcon,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Plus,
  BadgeCheck,
  Circle,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Network,
  Activity,
  Filter,
  Download,
  History,
  UserX,
  Flag,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  MessageCircle,
  Share2,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Volume2,
  VolumeX,
  RotateCcw,
  Database,
  Sliders,
  CheckCircle2,
  Sparkles,
  Camera,
  UserPlus,
  ChevronRight,
} from 'lucide-react';

const EMOJI_LIST = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '👏'];

const ADMIN_CHAT_SEEN_KEY = 'todayinegypt.adminChat.seenAt.v1';

function loadAdminChatSeenMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ADMIN_CHAT_SEEN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAdminChatSeenMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_CHAT_SEEN_KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

const toRtcIceServers = (
  servers: { urls: string[]; username?: string | null; credential?: string | null }[]
): RTCIceServer[] =>
  servers.map((s) => ({
    urls: s.urls,
    username: s.username ?? undefined,
    credential: s.credential ?? undefined,
  }));

// Sleek WhatsApp-style Waveform Audio Player with 1x / 1.5x / 2x Speed Controls
function VoiceMessagePlayer({
  audioUrl,
  durationSeconds,
}: {
  audioUrl: string;
  durationSeconds?: number | null;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration) {
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const changeSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl p-2.5 min-w-[250px] max-w-[320px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-emerald-500/20 shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 h-5">
          {[40, 75, 30, 95, 60, 100, 45, 80, 55, 90, 35, 70, 85, 50, 75, 90, 60, 40].map((h, i) => {
            const barProgress = (i / 18) * 100;
            const isPlayed = progress >= barProgress;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-emerald-400' : 'bg-slate-600/50'
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(durationSeconds || 0)}</span>
        </div>
      </div>
      <button
        onClick={changeSpeed}
        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-emerald-400 border border-slate-700 transition-colors shrink-0"
      >
        {playbackSpeed}x
      </button>
    </div>
  );
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  // Monitoring-first: admin watches who talks to whom (no live chat seen receipts)
  const [viewMode, setViewMode] = useState<'live' | 'monitoring' | 'graph' | 'audit'>('monitoring');

  // Live Chat State
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [convFilter, setConvFilter] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all');
  const [activeConvMenuId, setActiveConvMenuId] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessageDto | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [lastSeenByUserId, setLastSeenByUserId] = useState<Record<string, string>>({});
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState('');
  const [userPickerQuery, setUserPickerQuery] = useState('');
  const [userPickerResults, setUserPickerResults] = useState<AdminUserListItem[]>([]);
  const [isUserPickerLoading, setIsUserPickerLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const selectedAdminConvIdRef = useRef<string | null>(null);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMemberIdsInput, setGroupMemberIdsInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  // Message Forwarding State (CHAT-15)
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessageDto | null>(null);
  const [forwardTargetIds, setForwardTargetIds] = useState<string[]>([]);
  const [forwardExtraText, setForwardExtraText] = useState('');
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  // Search Modal State (CHAT-12)
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<MessageSearchResultDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // WebRTC Calling State & History (FLUTTER-CALL-01)
  const [activeCall, setActiveCall] = useState<CallDto | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallDto | null>(null);
  const [callStatusText, setCallStatusText] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [callHistory, setCallHistory] = useState<CallDto[]>([]);
  const [isLoadingCallHistory, setIsLoadingCallHistory] = useState(false);

  // Privacy, Download, Notifications & Backup Settings
  const [settingsTab, setSettingsTab] = useState<'privacy' | 'download' | 'notifications' | 'backup'>('privacy');
  const [backupInfo, setBackupInfo] = useState<ChatBackupDto | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [settings, setSettings] = useState<ChatSettingsDto>({
    readReceiptsEnabled: true,
    lastSeenEnabled: true,
    lastSeenPrivacy: LastSeenPrivacy.Everyone,
    onlineStatusEnabled: true,
    typingIndicatorsEnabled: true,
    mediaAutoDownloadEnabled: true,
    mediaAutoDownload: MediaAutoDownloadSetting.WiFi,
    notificationsEnabled: true,
    notificationPreviewEnabled: true,
    autoDownloadPhotos: true,
    autoDownloadVideos: false,
    autoDownloadAudio: true,
    autoDownloadDocuments: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  // Admin Monitoring Mode State (ADMIN-CHAT-01 & 02)
  const [adminConversations, setAdminConversations] = useState<AdminConversationListDto[]>([]);
  const [selectedAdminConv, setSelectedAdminConv] = useState<AdminConversationListDto | null>(null);
  const [adminMessages, setAdminMessages] = useState<ChatMessageDto[]>([]);
  const [adminFilter, setAdminFilter] = useState<AdminConversationFilterDto>({
    search: '',
    hasMedia: false,
    reportedOnly: false,
    blockedOnly: false,
    page: 1,
    pageSize: 30,
  });
  const [adminInspectionReason, setAdminInspectionReason] = useState('فحص إداري وتحقيق أمني');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  /** Last time admin opened each conversation (local only — no user Seen). */
  const [adminSeenAtMap, setAdminSeenAtMap] = useState<Record<string, string>>(() => loadAdminChatSeenMap());
  /** Extra unread bumps from realtime while list is open. */
  const [adminUnreadBump, setAdminUnreadBump] = useState<Record<string, number>>({});

  // Strictly deduplicated message lists preventing React duplicate key errors
  const displayMessages = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    const map = new Map<string, ChatMessageDto>();
    for (const m of list) {
      if (m && m.id) {
        map.set(m.id.toLowerCase(), m);
      }
    }
    return Array.from(map.values());
  }, [messages]);

  const displayAdminMessages = useMemo(() => {
    const list = Array.isArray(adminMessages) ? adminMessages : [];
    const map = new Map<string, ChatMessageDto>();
    for (const m of list) {
      if (m && m.id) {
        map.set(m.id.toLowerCase(), m);
      }
    }
    return Array.from(map.values());
  }, [adminMessages]);

  // Communication Graph State (ADMIN-CHAT-03)
  const [graphUsers, setGraphUsers] = useState<UserCommunicationGraphDto[]>([]);
  const [graphSearch, setGraphSearch] = useState('');
  const [isGraphLoading, setIsGraphLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminChatAuditLogDto[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC References
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Load Settings
  useEffect(() => {
    chatApi
      .getSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  // Real-Time SignalR Hub
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    joinCall,
    leaveCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  } = useChatHub({
    onMessageSent: (message: ChatMessageDto) => {
      // Live inbox (admin as participant)
      if (message.conversationId?.toLowerCase() === activeConversationId?.toLowerCase()) {
        setMessages((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some((m) => m.id?.toLowerCase() === message.id?.toLowerCase());
          return exists
            ? list.map((m) => (m.id?.toLowerCase() === message.id?.toLowerCase() ? message : m))
            : [...list, message];
        });
        // In live inbox: mark peer messages as read so they get Seen ticks.
        // Monitoring stays silent (never markAsRead).
        if (
          viewMode === 'live' &&
          message.senderId &&
          message.senderId.toLowerCase() !== currentUserId.toLowerCase()
        ) {
          void chatApi.markAsRead(message.conversationId, message.id).catch(() => undefined);
        }
      } else if (
        viewMode === 'live' &&
        message.senderId &&
        message.senderId.toLowerCase() !== currentUserId.toLowerCase()
      ) {
        void showChatMessageNotification({
          title: message.senderName || 'رسالة جديدة',
          body:
            message.text?.trim() ||
            getConversationLastPreview({ lastMessage: message, lastMessageType: message.type }),
          conversationId: message.conversationId,
          tag: message.conversationId,
          force: typeof document !== 'undefined' ? document.hidden : true,
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id?.toLowerCase() === message.conversationId?.toLowerCase()
            ? {
                ...c,
                lastMessage: message.text || (typeof c.lastMessage === 'string' ? c.lastMessage : null),
                lastMessageType: message.type,
                lastMessageAt: message.createdAt,
                unreadCount:
                  c.id?.toLowerCase() === activeConversationId?.toLowerCase() ||
                  message.senderId?.toLowerCase() === currentUserId.toLowerCase()
                    ? 0
                    : (c.unreadCount || 0) + 1,
              }
            : c
        )
      );

      // Silent monitoring inspector — append live without Seen
      if (message.conversationId?.toLowerCase() === selectedAdminConvIdRef.current?.toLowerCase()) {
        setAdminMessages((prev) => {
          const exists = prev.some((m) => m.id?.toLowerCase() === message.id?.toLowerCase());
          return exists
            ? prev.map((m) => (m.id?.toLowerCase() === message.id?.toLowerCase() ? message : m))
            : [...prev, message];
        });
        // Keep admin "seen" cursor up to date while viewing
        setAdminSeenAtMap((prev) => {
          const next = { ...prev, [message.conversationId]: message.createdAt };
          saveAdminChatSeenMap(next);
          return next;
        });
        setAdminUnreadBump((prev) => ({ ...prev, [message.conversationId]: 0 }));
        devLog.ok('admin-chat', 'Realtime message received in monitoring', {
          conversationId: message.conversationId,
          messageId: message.id,
        });
      } else {
        setAdminUnreadBump((prev) => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1,
        }));
      }
      setAdminConversations((prev) =>
        prev.map((c) =>
          c.id?.toLowerCase() === message.conversationId?.toLowerCase()
            ? {
                ...c,
                lastMessageSnippet: message.text || c.lastMessageSnippet,
                lastMessageAt: message.createdAt || c.lastMessageAt,
                lastActivityAt: message.createdAt || c.lastActivityAt,
              }
            : c
        )
      );
    },

    onMessageDelivered: (conversationId: string, messageId: string) => {
      setMessages((prev) => {
        const target = messageId ? prev.find((m) => m.id?.toLowerCase() === messageId?.toLowerCase()) : null;
        const targetTime = target?.createdAt ? new Date(target.createdAt).getTime() : null;
        return prev.map((m) => {
          if (isMessageRead(m.deliveryStatus)) return m;
          const isOutbound = !m.senderId || (currentUserId && m.senderId.toLowerCase() === currentUserId.toLowerCase());
          if (!isOutbound) return m;

          if (
            m.id?.toLowerCase() === messageId?.toLowerCase() ||
            (targetTime && m.createdAt && new Date(m.createdAt).getTime() <= targetTime) ||
            !targetTime
          ) {
            return { ...m, deliveryStatus: MessageDeliveryStatus.Delivered };
          }
          return m;
        });
      });
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id?.toLowerCase() !== conversationId?.toLowerCase()) return c;
          if (isMessageRead(c.lastMessageDeliveryStatus)) return c;
          const lastId = c.lastMessageId?.toLowerCase();
          if (lastId && lastId === messageId?.toLowerCase()) {
            return { ...c, lastMessageDeliveryStatus: MessageDeliveryStatus.Delivered };
          }
          // If we don't have lastMessageId, still bump when last msg is ours
          if (
            c.lastMessageSenderId &&
            currentUserId &&
            c.lastMessageSenderId.toLowerCase() === currentUserId.toLowerCase()
          ) {
            return { ...c, lastMessageDeliveryStatus: MessageDeliveryStatus.Delivered };
          }
          return c;
        })
      );
    },

    onMessageRead: (conversationId: string, messageId: string) => {
      setMessages((prev) => {
        const target = messageId ? prev.find((m) => m.id?.toLowerCase() === messageId?.toLowerCase()) : null;
        const targetTime = target?.createdAt ? new Date(target.createdAt).getTime() : null;
        return prev.map((m) => {
          const isOutbound = !m.senderId || (currentUserId && m.senderId.toLowerCase() === currentUserId.toLowerCase());
          if (!isOutbound) return m;

          if (
            m.id?.toLowerCase() === messageId?.toLowerCase() ||
            (targetTime && m.createdAt && new Date(m.createdAt).getTime() <= targetTime) ||
            !targetTime
          ) {
            return { ...m, deliveryStatus: MessageDeliveryStatus.Read };
          }
          return m;
        });
      });
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id?.toLowerCase() !== conversationId?.toLowerCase()) return c;
          if (
            c.lastMessageSenderId &&
            currentUserId &&
            c.lastMessageSenderId.toLowerCase() === currentUserId.toLowerCase()
          ) {
            return { ...c, lastMessageDeliveryStatus: MessageDeliveryStatus.Read };
          }
          return c;
        })
      );
    },

    onReactionAdded: (_conversationId: string, reaction: MessageReactionDto) => {
      setMessages((prev) =>
        prev.map((m) => {
          const reactions = [...(m.reactions || [])];
          const existingIdx = reactions.findIndex((r) => r.userId === reaction.userId);
          if (existingIdx >= 0) reactions[existingIdx] = reaction;
          else reactions.push(reaction);
          return { ...m, reactions };
        })
      );
    },

    onReactionRemoved: (_conversationId: string, messageId: string, userId: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            reactions: (m.reactions || []).filter((r) => r.userId !== userId),
          };
        })
      );
    },

    onTypingStarted: (conversationId: string, _userId: string, userName: string) => {
      setTypingUsers((prev) => ({ ...prev, [conversationId]: userName }));
    },

    onTypingStopped: (conversationId: string) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    },

    onUserOnline: (userId: string) => {
      const id = (userId || '').toLowerCase();
      if (!id) return;
      setOnlineUserIds((prev) => new Set([...prev, id, userId]));
      setLastSeenByUserId((prev) => {
        const next = { ...prev };
        delete next[id];
        delete next[userId];
        return next;
      });
    },

    onUserOffline: (userId: string, lastSeenAt?: string) => {
      const id = (userId || '').toLowerCase();
      if (!id) return;
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        next.delete(userId);
        return next;
      });
      const stamp = lastSeenAt || new Date().toISOString();
      setLastSeenByUserId((prev) => ({
        ...prev,
        [id]: stamp,
        [userId]: stamp,
      }));
      // Keep conversation list last-seen fresh
      setConversations((prev) =>
        prev.map((c) => {
          const peer = c.otherUserId || c.otherMember?.userId;
          if (!peer || peer.toLowerCase() !== id) return c;
          return { ...c, isOtherUserOnline: false, otherUserLastSeen: stamp };
        })
      );
    },

    onCallIncoming: (call: CallDto) => {
      setIncomingCall(call);
    },

    onCallStateChanged: (callId: string, status: number) => {
      if (activeCall && activeCall.id === callId) {
        setActiveCall((prev) => (prev ? { ...prev, status } : null));
        if (status === CallStatus.Ended || status === CallStatus.Rejected) {
          setCallStatusText('انتهت المكالمة');
          setTimeout(cleanupCall, 1500);
        } else if (status === CallStatus.Accepted || status === CallStatus.Connected) {
          setCallStatusText('المكالمة متصلة');
        }
      }
    },

    onCallEnded: () => {
      setCallStatusText('انتهت المكالمة');
      setTimeout(cleanupCall, 1500);
    },

    onWebRtcOfferReceived: async (callId, senderUserId, sdp) => {
      try {
        if (!peerConnectionRef.current) {
          const iceConfig = await chatApi.getIceServers();
          const pc = new RTCPeerConnection({ iceServers: toRtcIceServers(iceConfig.iceServers) });
          peerConnectionRef.current = pc;

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              sendIceCandidate(callId, senderUserId, JSON.stringify(event.candidate));
            }
          };

          pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
              remoteStreamRef.current = event.streams[0];
              if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
              if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
            }
          };
        }

        const pc = peerConnectionRef.current;
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendAnswer(callId, senderUserId, answer.sdp || '');
      } catch (err) {
        console.error('Error handling WebRTC offer', err);
      }
    },

    onWebRtcAnswerReceived: async (_callId, _senderUserId, sdp) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp })
          );
          setCallStatusText('المكالمة متصلة');
        }
      } catch (err) {
        console.error('Error handling WebRTC answer', err);
      }
    },

    onWebRtcIceCandidateReceived: async (_callId, _senderUserId, candidateJson) => {
      try {
        if (peerConnectionRef.current) {
          const candidate = JSON.parse(candidateJson);
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate', err);
      }
    },
  });

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Call Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      activeCall &&
      (activeCall.status === CallStatus.Accepted ||
        activeCall.status === CallStatus.Connected ||
        callStatusText === 'المكالمة متصلة')
    ) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall, callStatusText]);

  // Load Conversations for Live View
  const loadConversations = useCallback(async () => {
    try {
      const isArchivedParam = convFilter === 'archived' ? true : false;
      const res = await chatApi.getConversations(1, 50, isArchivedParam);
      setConversations(res.items || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }, [convFilter]);

  useEffect(() => {
    if (viewMode === 'live') {
      loadConversations();
    }
  }, [viewMode, loadConversations, convFilter]);

  // Load Admin Monitoring Conversations
  const loadAdminConversations = useCallback(async () => {
    setIsAdminLoading(true);
    try {
      const res = await adminChatApi.getAdminConversations(adminFilter);
      setAdminConversations(res.items || []);
    } catch (err) {
      console.error('Failed to load admin conversations', err);
    } finally {
      setIsAdminLoading(false);
    }
  }, [adminFilter]);

  useEffect(() => {
    if (viewMode === 'monitoring') {
      loadAdminConversations();
    }
  }, [viewMode, loadAdminConversations]);

  // Load Communication Graph
  const loadCommunicationGraph = useCallback(async () => {
    setIsGraphLoading(true);
    try {
      const res = await adminChatApi.getUserCommunicationGraph({ search: graphSearch });
      setGraphUsers(res.items || []);
    } catch (err) {
      console.error('Failed to load communication graph', err);
    } finally {
      setIsGraphLoading(false);
    }
  }, [graphSearch]);

  useEffect(() => {
    if (viewMode === 'graph') {
      loadCommunicationGraph();
    }
  }, [viewMode, loadCommunicationGraph]);

  // Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    setIsAuditLoading(true);
    try {
      const res = await adminChatApi.getAdminAuditLogs();
      setAuditLogs(res.items || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'audit') {
      loadAuditLogs();
    }
  }, [viewMode, loadAuditLogs]);

  // Load Messages for Live Chat Room
  useEffect(() => {
    if (!activeConversationId || viewMode !== 'live') return;

    joinConversation(activeConversationId);

    chatApi
      .getMessages(activeConversationId, undefined, 50)
      .then((msgs) => {
        const list = Array.isArray(msgs) ? msgs : [];
        setMessages(list);
        // Sync list ticks from latest outbound message status
        const lastOutbound = [...list]
          .reverse()
          .find((m) => m.senderId && m.senderId.toLowerCase() === currentUserId.toLowerCase());
        if (lastOutbound) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id?.toLowerCase() === activeConversationId.toLowerCase()
                ? {
                    ...c,
                    lastMessageId: lastOutbound.id,
                    lastMessageSenderId: lastOutbound.senderId,
                    lastMessageDeliveryStatus:
                      lastOutbound.deliveryStatus ?? MessageDeliveryStatus.Sent,
                  }
                : c
            )
          );
        }
        // Participant inbox: acknowledge delivery + read so peer ticks update.
        const lastIncoming = [...list]
          .reverse()
          .find((m) => m.senderId && m.senderId.toLowerCase() !== currentUserId.toLowerCase());
        if (lastIncoming?.id) {
          void chatApi.markAsDelivered(activeConversationId, lastIncoming.id).catch(() => undefined);
          void chatApi.markAsRead(activeConversationId, lastIncoming.id).catch(() => undefined);
          setConversations((prev) =>
            prev.map((c) =>
              c.id?.toLowerCase() === activeConversationId.toLowerCase() ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      })
      .catch((err) => {
        console.error('Failed to load messages', err);
        setMessages([]);
      });

    return () => {
      leaveConversation(activeConversationId);
    };
  }, [activeConversationId, joinConversation, leaveConversation, viewMode, currentUserId]);

  // Enable browser push notifications for live chat
  useEffect(() => {
    if (viewMode !== 'live') return;
    void enableWebChatPush().then((res) => {
      setWebPushEnabled(res.permission === 'granted');
    });
  }, [viewMode]);

  // Seed online / last-seen from conversation list
  useEffect(() => {
    if (!conversations.length) return;
    setOnlineUserIds((prev) => {
      const next = new Set(prev);
      for (const c of conversations) {
        const peerId = c.otherUserId || c.otherMember?.userId;
        if (peerId && c.isOtherUserOnline) {
          next.add(peerId);
          next.add(peerId.toLowerCase());
        }
      }
      return next;
    });
    setLastSeenByUserId((prev) => {
      const next = { ...prev };
      for (const c of conversations) {
        const peerId = c.otherUserId || c.otherMember?.userId;
        if (peerId && c.otherUserLastSeen) {
          next[peerId] = c.otherUserLastSeen;
          next[peerId.toLowerCase()] = c.otherUserLastSeen;
        }
      }
      return next;
    });
  }, [conversations]);

  // Load Messages for Admin Monitoring Inspector (Strict Read-Receipt Isolation)
  const markAdminConversationSeen = useCallback((convId: string, at?: string | null) => {
    const stamp = at || new Date().toISOString();
    setAdminSeenAtMap((prev) => {
      const next = { ...prev, [convId]: stamp };
      saveAdminChatSeenMap(next);
      return next;
    });
    setAdminUnreadBump((prev) => ({ ...prev, [convId]: 0 }));
  }, []);

  const getAdminUnreadCount = useCallback(
    (conv: AdminConversationListDto) => {
      if (selectedAdminConv?.id === conv.id) return 0;
      const bump = adminUnreadBump[conv.id] || 0;
      const lastAt = conv.lastMessageAt || conv.lastActivityAt;
      if (!lastAt) return bump;
      const seenAt = adminSeenAtMap[conv.id];
      if (!seenAt) {
        // Never opened by this admin → treat as unread
        return Math.max(bump, Math.min(conv.messageCount || 1, 99) || 1);
      }
      const lastMs = parseApiUtcDate(lastAt).getTime();
      const seenMs = parseApiUtcDate(seenAt).getTime();
      if (Number.isNaN(lastMs) || Number.isNaN(seenMs)) return bump;
      if (lastMs > seenMs) return Math.max(bump, 1);
      return bump;
    },
    [adminSeenAtMap, adminUnreadBump, selectedAdminConv?.id]
  );

  const handleSelectAdminConversation = async (conv: AdminConversationListDto) => {
    if (selectedAdminConv?.id) {
      leaveConversation(selectedAdminConv.id);
    }
    selectedAdminConvIdRef.current = conv.id;
    setSelectedAdminConv(conv);
    markAdminConversationSeen(conv.id, conv.lastMessageAt || conv.lastActivityAt || new Date().toISOString());
    setIsAdminLoading(true);
    try {
      const res = await adminChatApi.getAdminConversationMessages(conv.id, adminInspectionReason);
      setAdminMessages(res.items || []);
      const latest = res.items?.[res.items.length - 1]?.createdAt || conv.lastMessageAt;
      markAdminConversationSeen(conv.id, latest || new Date().toISOString());
      // Observe live traffic (admin-allowed join after API deploy; safe to attempt now)
      void joinConversation(conv.id);
    } catch (err) {
      console.error('Failed to load admin messages', err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Soft poll while inspecting — works even before API hub patch is deployed
  useEffect(() => {
    if (viewMode !== 'monitoring' || !selectedAdminConv?.id) return;
    const convId = selectedAdminConv.id;
    selectedAdminConvIdRef.current = convId;
    void joinConversation(convId);

    const tick = async () => {
      try {
        const res = await adminChatApi.getAdminConversationMessages(convId, adminInspectionReason);
        const items = res.items || [];
        setAdminMessages((prev) => {
          if (items.length === 0) return prev;
          const byId = new Map(prev.map((m) => [m.id, m]));
          let changed = false;
          for (const m of items) {
            if (!byId.has(m.id)) {
              byId.set(m.id, m);
              changed = true;
            }
          }
          if (!changed && prev.length === items.length) return prev;
          return Array.from(byId.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      } catch {
        // keep silent — hub may still deliver
      }
    };

    const interval = setInterval(tick, 4000);
    return () => {
      clearInterval(interval);
      leaveConversation(convId);
      if (selectedAdminConvIdRef.current === convId) {
        selectedAdminConvIdRef.current = null;
      }
    };
  }, [viewMode, selectedAdminConv?.id, adminInspectionReason, joinConversation, leaveConversation]);

  // Scroll to bottom on new live messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, adminMessages]);

  // WebRTC Cleanup
  const cleanupCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    remoteStreamRef.current = null;
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatusText('');
  }, []);

  // Initiate Call
  const handleStartCall = async (callType: CallType) => {
    if (!activeContact || !activeConversationId) return;

    try {
      setCallStatusText('جاري الاتصال...');
      const call = await chatApi.initiateCall(activeConversationId, callType);
      setActiveCall(call);
      joinCall(call.id);

      const iceConfig = await chatApi.getIceServers();
      const isVideo = callType === CallType.Video;

      const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
      if (!mediaDevices?.getUserMedia) {
        throw new Error(
          'المتصفح لا يدعم الوصول للكاميرا/الميكروفون هنا. افتح اللوحة على HTTPS أو localhost.'
        );
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current && isVideo) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({ iceServers: toRtcIceServers(iceConfig.iceServers) });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(call.id, activeContact.userId, JSON.stringify(event.candidate));
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendOffer(call.id, activeContact.userId, offer.sdp || '');
      setCallStatusText('جاري الرنين...');
    } catch (err) {
      console.error('Call initiation error', err);
      alert('تعذر الوصول إلى الميكروفون أو الكاميرا أو إنشاء المكالمة.');
      cleanupCall();
    }
  };

  // Accept Incoming Call
  const handleAcceptIncomingCall = async () => {
    if (!incomingCall) return;

    try {
      const call = incomingCall;
      setActiveCall(call);
      setIncomingCall(null);
      joinCall(call.id);

      await chatApi.updateCallStatus(call.id, CallStatus.Accepted);

      const isVideo = call.type === CallType.Video;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      localStreamRef.current = stream;

      if (localVideoRef.current && isVideo) {
        localVideoRef.current.srcObject = stream;
      }

      const iceConfig = await chatApi.getIceServers();
      const pc = new RTCPeerConnection({ iceServers: toRtcIceServers(iceConfig.iceServers) });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendIceCandidate(call.id, call.initiatedByUserId, JSON.stringify(event.candidate));
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      setCallStatusText('المكالمة متصلة');
    } catch (err) {
      console.error('Error accepting call', err);
      cleanupCall();
    }
  };

  // End or Reject Call
  const handleEndCall = async () => {
    if (activeCall) {
      try {
        await chatApi.updateCallStatus(activeCall.id, CallStatus.Ended);
        leaveCall(activeCall.id);
      } catch (err) {
        console.error('End call error', err);
      }
    }
    cleanupCall();
  };

  // Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversationId || !inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    const replyId = replyingTo?.id;
    setReplyingTo(null);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    stopTyping(activeConversationId);

    try {
      const newMsg = await chatApi.sendMessage(activeConversationId, {
        type: MessageType.Text,
        text: textToSend,
        replyToMessageId: replyId,
      });
      const withStatus: ChatMessageDto = {
        ...newMsg,
        deliveryStatus: newMsg.deliveryStatus ?? MessageDeliveryStatus.Sent,
      };
      setMessages((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const exists = list.some((m) => m.id?.toLowerCase() === withStatus.id?.toLowerCase());
        return exists
          ? list.map((m) => (m.id?.toLowerCase() === withStatus.id?.toLowerCase() ? withStatus : m))
          : [...list, withStatus];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id?.toLowerCase() === activeConversationId.toLowerCase()
            ? {
                ...c,
                lastMessage: textToSend,
                lastMessageType: MessageType.Text,
                lastMessageAt: withStatus.createdAt,
                lastMessageId: withStatus.id,
                lastMessageSenderId: currentUserId || withStatus.senderId,
                lastMessageDeliveryStatus: MessageDeliveryStatus.Sent,
                unreadCount: 0,
              }
            : c
        )
      );
    } catch (err: any) {
      console.error('Send message failed', err);
      alert(err.response?.data?.message || 'تعذر إرسال الرسالة. تأكد من عدم وجود حظر.');
    }
  };

  // Upload Media (Image/Video/Document/Voice)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isVoice: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;

    setIsUploading(true);
    try {
      let folder = 'files';
      let messageType = MessageType.File;

      if (isVoice || file.type.startsWith('audio/')) {
        folder = 'voice';
        messageType = MessageType.Voice;
      } else if (file.type.startsWith('image/')) {
        folder = 'images';
        messageType = MessageType.Image;
      } else if (file.type.startsWith('video/')) {
        folder = 'videos';
        messageType = MessageType.Video;
      }

      const auth = await chatApi.authorizeUpload(folder, file.name, file.type, file.size);

      await fetch(auth.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const msg = await chatApi.sendMediaMessage(activeConversationId, {
        mediaFileId: auth.mediaFileId,
        type: messageType,
        text: isVoice ? 'تسجيل صوتي' : file.name,
      });

      setMessages((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const exists = list.some((m) => m.id?.toLowerCase() === msg.id?.toLowerCase());
        return exists
          ? list.map((m) => (m.id?.toLowerCase() === msg.id?.toLowerCase() ? msg : m))
          : [...list, msg];
      });
    } catch (err: any) {
      console.error('File upload failed', err);
      alert(err.response?.data?.message || 'فشل رفع الملف.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (voiceInputRef.current) voiceInputRef.current.value = '';
    }
  };

  // Typing event
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConversationId) return;

    if (!typingTimerRef.current) {
      startTyping(activeConversationId);
    } else {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      stopTyping(activeConversationId);
      typingTimerRef.current = null;
    }, 2000);
  };

  // React to Message
  const handleToggleReaction = async (messageId: string, reaction: string) => {
    try {
      await chatApi.addReaction(messageId, reaction);
      setActiveReactionMessageId(null);
    } catch (err) {
      console.error('Reaction failed', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Delete message failed', err);
    }
  };

  // Create Direct Chat with user (admin → user)
  const handleCreateDirectChat = async (userId?: string) => {
    const targetId = (userId || newChatUserId).trim();
    if (!targetId) return;
    setIsStartingChat(true);
    try {
      const conv = await chatApi.createDirectConversation({ userId: targetId });
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setActiveConversationId(conv.id);
      setViewMode('live');
      setShowNewChatModal(false);
      setNewChatUserId('');
      setUserPickerQuery('');
      setUserPickerResults([]);
      void joinConversation(conv.id);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'تعذر بدء المحادثة.';
      alert(msg);
    } finally {
      setIsStartingChat(false);
    }
  };

  // Debounced user search for "كلم مستخدم"
  useEffect(() => {
    if (!showNewChatModal) return;
    const q = userPickerQuery.trim();
    const handle = setTimeout(async () => {
      setIsUserPickerLoading(true);
      try {
        const res = await adminApi.getUsers({ q: q || undefined, page: 1, pageSize: 30 });
        setUserPickerResults(res.items || []);
      } catch {
        setUserPickerResults([]);
      } finally {
        setIsUserPickerLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [userPickerQuery, showNewChatModal]);

  // Create Group Chat (CHAT-13)
  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) return;
    const memberIds = groupMemberIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const conv = await chatApi.createGroupConversation({
        title: groupTitle.trim(),
        memberUserIds: memberIds,
      });
      setConversations((prev) => [conv, ...prev]);
      setActiveConversationId(conv.id);
      setShowCreateGroupModal(false);
      setGroupTitle('');
      setGroupMemberIdsInput('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'تعذر إنشاء المجموعة.');
    }
  };

  // Search Messages (CHAT-12)
  const handleSearchMessages = async () => {
    if (!searchKeyword.trim()) return;
    setIsSearching(true);
    try {
      const res = await chatApi.searchMessages({ q: searchKeyword.trim() });
      setSearchResults(res.items || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Format Call Duration (FLUTTER-CALL-01)
  const formatCallDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Open Call History Modal
  const handleOpenCallHistory = async () => {
    setShowCallHistoryModal(true);
    setIsLoadingCallHistory(true);
    try {
      const res = await chatApi.getCallHistory(1, 30);
      setCallHistory(res.items || []);
    } catch (err) {
      console.error('Failed to load call history', err);
    } finally {
      setIsLoadingCallHistory(false);
    }
  };

  // Re-dial from Call History
  const handleRedial = (targetConvId: string, callType: CallType) => {
    setShowCallHistoryModal(false);
    setActiveConversationId(targetConvId);
    setTimeout(() => {
      handleStartCall(callType);
    }, 400);
  };

  // Message Forwarding Handlers (PROMPT CHAT-15)
  const handleStartForward = (msg: ChatMessageDto) => {
    setForwardingMessage(msg);
    setForwardTargetIds([]);
    setForwardExtraText('');
    setForwardSearchQuery('');
    setForwardModalOpen(true);
  };

  const toggleForwardTarget = (id: string) => {
    setForwardTargetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmForward = async () => {
    if (!forwardingMessage || forwardTargetIds.length === 0) return;
    setIsForwarding(true);
    try {
      const forwardedMsgs = await chatApi.forwardMessage({
        messageId: forwardingMessage.id,
        targetConversationIds: forwardTargetIds,
        extraText: forwardExtraText.trim() || undefined,
      });

      if (activeConversationId && forwardTargetIds.includes(activeConversationId)) {
        const myForward = forwardedMsgs.find((m) => m.conversationId === activeConversationId);
        if (myForward) {
          setMessages((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.some((m) => m.id?.toLowerCase() === myForward.id?.toLowerCase());
            return exists
              ? list.map((m) => (m.id?.toLowerCase() === myForward.id?.toLowerCase() ? myForward : m))
              : [...list, myForward];
          });
        }
      }

      setForwardModalOpen(false);
      setForwardingMessage(null);
      setForwardTargetIds([]);
      setForwardExtraText('');
      alert('تمت إعادة توجيه الرسالة بنجاح.');
      loadConversations();
    } catch (err: any) {
      console.error('Forward failed', err);
      alert(err.response?.data?.message || 'فشلت إعادة توجيه الرسالة.');
    } finally {
      setIsForwarding(false);
    }
  };

  // Chat Management Handlers (PROMPT CHAT-16)
  const handleTogglePin = async (convId: string, currentPinStatus: boolean) => {
    try {
      await chatApi.pinConversation(convId, !currentPinStatus);
      setConversations((prev) =>
        prev
          .map((c) => (c.id === convId ? { ...c, isPinned: !currentPinStatus } : c))
          .sort((a, b) => {
            const aPin = a.id === convId ? !currentPinStatus : a.isPinned;
            const bPin = b.id === convId ? !currentPinStatus : b.isPinned;
            if (aPin && !bPin) return -1;
            if (!aPin && bPin) return 1;
            return 0;
          })
      );
      setActiveConvMenuId(null);
      setShowHeaderMenu(false);
    } catch (err) {
      console.error('Failed to pin conversation', err);
    }
  };

  const handleToggleArchive = async (convId: string, currentArchiveStatus?: boolean) => {
    const newStatus = !currentArchiveStatus;
    try {
      await chatApi.archiveConversation(convId, newStatus);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        setActiveConversationId(null);
      }
      setActiveConvMenuId(null);
      setShowHeaderMenu(false);
    } catch (err) {
      console.error('Failed to archive conversation', err);
    }
  };

  const handleToggleMute = async (convId: string, currentMuteStatus: boolean) => {
    try {
      await chatApi.muteConversation(convId, !currentMuteStatus);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, isMuted: !currentMuteStatus } : c))
      );
      setActiveConvMenuId(null);
      setShowHeaderMenu(false);
    } catch (err) {
      console.error('Failed to mute conversation', err);
    }
  };

  const handleMarkAsUnread = async (convId: string) => {
    try {
      await chatApi.markAsUnread(convId);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: Math.max(1, c.unreadCount || 1) } : c))
      );
      setActiveConvMenuId(null);
      setShowHeaderMenu(false);
    } catch (err) {
      console.error('Failed to mark unread', err);
    }
  };

  const handleClearConversation = async (convId: string) => {
    if (!confirm('هل أنت متأكد من مسح جميع رسائل هذه المحادثة من جهازك؟')) return;
    try {
      await chatApi.clearConversation(convId);
      if (activeConversationId === convId) {
        setMessages([]);
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, lastMessage: null, unreadCount: 0 } : c))
      );
      setActiveConvMenuId(null);
      setShowHeaderMenu(false);
    } catch (err) {
      console.error('Failed to clear conversation', err);
    }
  };

  // Instant Cloud Chat Backup Trigger
  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      const backup = await chatApi.triggerBackup();
      setBackupInfo(backup);
      setSettings((prev) => ({
        ...prev,
        lastBackupAt: backup.backupAt,
        backupSizeBytes: backup.sizeBytes,
      }));
      alert(
        `تم إنشاء النسخة الاحتياطية بنجاح! الحجم: ${(backup.sizeBytes / 1024).toFixed(1)} KB | عدد الرسائل: ${backup.totalMessages}`
      );
    } catch (err) {
      console.error('Backup failed', err);
      alert('تعذر إنشاء النسخة الاحتياطية.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Active contact info
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId),
    [conversations, activeConversationId]
  );

  const activeContact = useMemo(() => {
    if (!activeConversation) return null;
    const name = getConversationDisplayName(activeConversation);
    const userId = activeConversation.otherUserId || activeConversation.otherMember?.userId || '';
    const userIdKey = userId.toLowerCase();
    const avatarUrl = getConversationAvatarUrl(activeConversation);
    const isOnline =
      !!activeConversation.isOtherUserOnline ||
      (userId
        ? onlineUserIds.has(userId) || onlineUserIds.has(userIdKey)
        : false);
    const lastSeen =
      (userIdKey && lastSeenByUserId[userIdKey]) ||
      (userId && lastSeenByUserId[userId]) ||
      activeConversation.otherUserLastSeen ||
      activeConversation.otherMember?.lastReadAt ||
      null;
    return {
      userId,
      name,
      avatarUrl,
      isOnline,
      lastSeen,
      isVerified: activeConversation.otherMember?.isVerified ?? false,
      isGroup: activeConversation.type === ConversationType.Group,
    };
  }, [activeConversation, onlineUserIds, lastSeenByUserId]);

  return (
    <AdminShell>
      {/* Invisible element for remote audio stream */}
      <audio ref={remoteAudioRef} autoPlay />

      <div className="wa-monitor flex flex-col h-[calc(100dvh-125px)] md:h-[calc(100vh-80px)] overflow-hidden rounded-xl md:rounded-2xl border border-[#1a3c34] shadow-2xl">
        {/* Top Mode Bar — WhatsApp monitoring first */}
        <header className="flex flex-wrap items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 bg-[#0b141a] border-b border-[#1f2c34] shrink-0 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#25d366] to-[#128c7e] flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-[#0b141a]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                مراقبة محادثات المستخدمين
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[#25d366]/15 text-[#25d366] font-bold border border-[#25d366]/30">
                  بدون Seen
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-semibold line-clamp-1">
                شوف مين بيكلم مين فقط — فتح المحادثة لا يُعلِم أحداً أن الأدمن اطّلع عليها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-[#111b21] p-0.5 sm:p-1 rounded-xl border border-[#1f2c34]">
              <button
                onClick={() => setViewMode('monitoring')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  viewMode === 'monitoring'
                    ? 'bg-[#25d366] text-[#0b141a] shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>مين بيكلم مين</span>
              </button>
              <button
                onClick={() => setViewMode('live')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  viewMode === 'live'
                    ? 'bg-[#25d366] text-[#0b141a] shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>محادثاتي</span>
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  viewMode === 'graph'
                    ? 'bg-[#128c7e] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>الشبكة</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowNewChatModal(true);
                setUserPickerQuery('');
              }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#25d366] hover:bg-[#1ebe57] text-[11px] sm:text-xs font-black text-[#0b141a] transition-colors shrink-0"
              title="ابدأ محادثة مع مستخدم"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">كلم مستخدم</span>
            </button>

            <button
              onClick={loadAdminConversations}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#1f2c34] hover:bg-[#2a3942] text-[11px] sm:text-xs font-bold text-[#25d366] border border-[#2a3942] transition-colors shrink-0"
              title="تحديث القائمة"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* VIEW MODE 1: LIVE WHATSAPP WEB CHAT & WEBRTC CALLING                      */}
        {/* ========================================================================= */}
        {viewMode === 'live' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Conversations List */}
            <aside className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-[26rem] flex-col bg-[#111b21] border-l border-[#1f2c34] shrink-0`}>
              <div className="p-3 border-b border-[#1f2c34] space-y-2.5 bg-[#111b21]">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#8696a0]" />
                    <input
                      type="text"
                      placeholder="بحث في المحادثات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#202c33] border-0 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#25d366]/40"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="p-2 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-[#25d366]"
                    title="إنشاء مجموعة جديدة"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="p-2 rounded-xl bg-[#25d366] hover:bg-[#1fb855] text-[#0b141a] font-bold"
                    title="محادثة جديدة"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void enableWebChatPush().then((res) => {
                        setWebPushEnabled(res.permission === 'granted');
                        if (res.permission === 'granted') {
                          void showChatMessageNotification({
                            title: 'إشعارات الشات',
                            body: 'تم تفعيل إشعارات الويب بنجاح',
                            force: true,
                          });
                        } else if (res.permission === 'denied') {
                          alert('الإشعارات مرفوضة من المتصفح. فعّلها من إعدادات الموقع.');
                        }
                      });
                    }}
                    className={`p-2 rounded-xl border ${
                      webPushEnabled
                        ? 'bg-[#25d366]/15 border-[#25d366]/40 text-[#25d366]'
                        : 'bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] border-transparent'
                    }`}
                    title={webPushEnabled ? 'إشعارات الويب مفعّلة' : 'تفعيل إشعارات الويب'}
                  >
                    {webPushEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </button>
                </div>

                {/* Filter Tabs (CHAT-16) */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0b141a]">
                  <button
                    onClick={() => setConvFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      convFilter === 'all'
                        ? 'bg-[#25d366] text-[#0b141a] shadow-sm'
                        : 'text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setConvFilter('unread')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      convFilter === 'unread'
                        ? 'bg-[#25d366] text-[#0b141a] shadow-sm'
                        : 'text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    غير مقروءة
                  </button>
                  <button
                    onClick={() => setConvFilter('pinned')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      convFilter === 'pinned'
                        ? 'bg-[#25d366] text-[#0b141a] shadow-sm'
                        : 'text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    المثبتة
                  </button>
                  <button
                    onClick={() => setConvFilter('archived')}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      convFilter === 'archived'
                        ? 'bg-[#25d366] text-[#0b141a] shadow-sm'
                        : 'text-[#8696a0] hover:text-[#e9edef]'
                    }`}
                  >
                    المؤرشفة
                  </button>
                </div>
              </div>

              {/* Conversations Scrollable List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-10 text-center text-[#8696a0] text-xs space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-[#2a3942]" />
                    <p className="font-bold">لا توجد محادثات تطابق الفلتر المحدد.</p>
                  </div>
                ) : (
                  conversations
                    .filter((c) => {
                      const title = getConversationDisplayName(c);
                      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
                      if (!matchesSearch) return false;
                      if (convFilter === 'unread') return c.unreadCount > 0;
                      if (convFilter === 'pinned') return c.isPinned;
                      return true;
                    })
                    .map((conv) => {
                      const isActive = conv.id === activeConversationId;
                      const peerId = conv.otherUserId || conv.otherMember?.userId;
                      const isOnline =
                        !!conv.isOtherUserOnline || (peerId ? onlineUserIds.has(peerId) : false);
                      const convTitle = getConversationDisplayName(conv);
                      const convAvatar = getConversationAvatarUrl(conv);
                      const hasUnread = conv.unreadCount > 0;
                      const lastTime = conv.lastMessageAt
                        ? formatChatListTime(conv.lastMessageAt)
                        : typeof conv.lastMessage === 'object' && conv.lastMessage?.createdAt
                          ? formatChatListTime(conv.lastMessage.createdAt)
                          : '';
                      const lastMsgSnippet = getConversationLastPreview(conv);
                      const lastFromMe =
                        !!currentUserId &&
                        !!conv.lastMessageSenderId &&
                        conv.lastMessageSenderId.toLowerCase() === currentUserId.toLowerCase();

                      return (
                        <div
                          key={conv.id}
                          onClick={() => setActiveConversationId(conv.id)}
                          className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors group relative border-b border-[#1f2c34]/50 ${
                            isActive
                              ? 'bg-[#2a3942]'
                              : hasUnread
                                ? 'bg-[#102a20]/40 hover:bg-[#143528]/50'
                                : 'hover:bg-[#202c33]'
                          }`}
                        >
                          <ChatUserAvatar
                            src={convAvatar}
                            alt={convTitle}
                            size="lg"
                            isGroup={conv.type === ConversationType.Group}
                            online={isOnline}
                            ringClassName={isActive ? 'border-[#2a3942]' : 'border-[#111b21]'}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3
                                  className={`text-[13px] truncate ${
                                    hasUnread ? 'font-black text-white' : 'font-bold text-[#e9edef]'
                                  }`}
                                >
                                  {convTitle}
                                </h3>
                                {conv.isPinned && (
                                  <Pin className="w-3 h-3 text-[#8696a0] shrink-0 fill-[#8696a0]" />
                                )}
                                {conv.isMuted && <BellOff className="w-3 h-3 text-[#667781] shrink-0" />}
                              </div>
                              <span
                                className={`text-[10px] shrink-0 font-bold ${
                                  hasUnread ? 'text-[#25d366]' : 'text-[#8696a0]'
                                }`}
                              >
                                {lastTime}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5 gap-2">
                              <p
                                className={`text-[12px] truncate flex items-center gap-1 min-w-0 ${
                                  hasUnread ? 'text-[#d1d7db] font-semibold' : 'text-[#8696a0]'
                                }`}
                              >
                                {typingUsers[conv.id] ? (
                                  <span className="text-[#25d366] italic font-semibold">يكتب الآن...</span>
                                ) : (
                                  <>
                                    {lastFromMe && (
                                      <span className="shrink-0 inline-flex items-center" title="حالة الرسالة">
                                        {isMessageRead(conv.lastMessageDeliveryStatus) ? (
                                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                        ) : isMessageDelivered(conv.lastMessageDeliveryStatus) ? (
                                          <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                                        )}
                                      </span>
                                    )}
                                    <span className="truncate">{lastMsgSnippet}</span>
                                  </>
                                )}
                              </p>
                              {hasUnread && (
                                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#25d366] text-[10px] font-black text-[#0b141a] shrink-0 grid place-items-center">
                                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Item Menu (CHAT-16) */}
                          <div className="relative shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveConvMenuId(activeConvMenuId === conv.id ? null : conv.id);
                              }}
                              className="p-1.5 rounded-lg text-[#667781] hover:text-[#e9edef] hover:bg-[#111b21]/60 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="خيارات المحادثة"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {activeConvMenuId === conv.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute left-0 top-8 z-30 w-44 rounded-xl bg-[#233138] border border-[#3b4a54] shadow-2xl py-1 text-xs text-[#e9edef]"
                              >
                                <button
                                  onClick={() => handleTogglePin(conv.id, conv.isPinned)}
                                  className="w-full text-right px-3 py-2 hover:bg-[#182229] flex items-center gap-2"
                                >
                                  {conv.isPinned ? <PinOff className="w-3.5 h-3.5 text-amber-400" /> : <Pin className="w-3.5 h-3.5 text-[#25d366]" />}
                                  {conv.isPinned ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}
                                </button>
                                <button
                                  onClick={() => handleToggleMute(conv.id, conv.isMuted)}
                                  className="w-full text-right px-3 py-2 hover:bg-[#182229] flex items-center gap-2"
                                >
                                  {conv.isMuted ? <Volume2 className="w-3.5 h-3.5 text-[#25d366]" /> : <VolumeX className="w-3.5 h-3.5 text-amber-400" />}
                                  {conv.isMuted ? 'إلغاء الكتم' : 'كتم الإشعارات'}
                                </button>
                                <button
                                  onClick={() => handleToggleArchive(conv.id, conv.isArchived)}
                                  className="w-full text-right px-3 py-2 hover:bg-[#182229] flex items-center gap-2"
                                >
                                  {conv.isArchived ? <ArchiveRestore className="w-3.5 h-3.5 text-[#25d366]" /> : <Archive className="w-3.5 h-3.5 text-indigo-400" />}
                                  {conv.isArchived ? 'إلغاء الأرشفة' : 'أرشفة المحادثة'}
                                </button>
                                <button
                                  onClick={() => handleMarkAsUnread(conv.id)}
                                  className="w-full text-right px-3 py-2 hover:bg-[#182229] flex items-center gap-2"
                                >
                                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                                  تحديد كغير مقروءة
                                </button>
                                <button
                                  onClick={() => handleClearConversation(conv.id)}
                                  className="w-full text-right px-3 py-2 hover:bg-red-950/50 text-red-400 flex items-center gap-2 border-t border-[#3b4a54]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  مسح الرسائل
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </aside>

            {/* Right Chat Viewer */}
            <main className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#0b141a] w-full min-w-0`}>
              {activeConversation && activeContact ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-[#202c33] border-b border-[#1f2c34] gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      {/* Mobile Back Button to return to list */}
                      <button
                        type="button"
                        onClick={() => setActiveConversationId(null)}
                        className="md:hidden p-1.5 -mr-1 rounded-xl text-[#e9edef] hover:text-white hover:bg-[#2a3942] active:scale-95 transition shrink-0"
                        title="رجوع للمحادثات"
                        aria-label="رجوع للمحادثات"
                      >
                        <ChevronRight className="w-5 h-5 rtl:rotate-0" />
                      </button>

                      <ChatUserAvatar
                        src={activeContact.avatarUrl}
                        alt={activeContact.name}
                        size="md"
                        isGroup={activeContact.isGroup}
                        online={activeContact.isOnline}
                        ringClassName="border-[#202c33]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <h2 className="text-xs sm:text-sm font-bold text-[#e9edef] flex items-center gap-1 truncate">
                            <span className="truncate">{activeContact.name}</span>
                            {activeContact.isVerified && (
                              <BadgeCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                            )}
                          </h2>
                          {activeConversation.isPinned && <Pin className="w-3 h-3 text-[#8696a0] fill-[#8696a0] shrink-0" />}
                          {activeConversation.isMuted && <BellOff className="w-3 h-3 text-[#667781] shrink-0" />}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-[#8696a0] truncate">
                          {typingUsers[activeConversationId!] ? (
                            <span className="text-[#25d366] font-medium">يكتب الآن...</span>
                          ) : activeContact.isOnline ? (
                            <span className="text-[#25d366]">متصل الآن</span>
                          ) : (
                            formatLastSeenArabic(activeContact.lastSeen)
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Calling & Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 relative">
                      <button
                        onClick={() => handleStartCall(CallType.Voice)}
                        className="p-2 sm:p-2.5 rounded-xl bg-[#2a3942] hover:bg-[#3b4a54] text-[#25d366] transition-colors"
                        title="مكالمة صوتية"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartCall(CallType.Video)}
                        className="p-2 sm:p-2.5 rounded-xl bg-[#2a3942] hover:bg-[#3b4a54] text-[#53bdeb] transition-colors"
                        title="مكالمة فيديو"
                      >
                        <Video className="w-4 h-4" />
                      </button>

                      {/* Conversation Management Dropdown Menu (PROMPT CHAT-16) */}
                      <div className="relative">
                        <button
                          onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                          className="p-2 sm:p-2.5 rounded-xl bg-[#2a3942] hover:bg-[#3b4a54] text-[#e9edef] transition-colors"
                          title="خيارات الدردشة"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showHeaderMenu && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 top-11 z-30 w-48 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 text-xs text-slate-200"
                          >
                            <button
                              onClick={() => handleTogglePin(activeConversation.id, activeConversation.isPinned)}
                              className="w-full text-right px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                            >
                              {activeConversation.isPinned ? <PinOff className="w-3.5 h-3.5 text-amber-400" /> : <Pin className="w-3.5 h-3.5 text-emerald-400" />}
                              {activeConversation.isPinned ? 'إلغاء التثبيت' : 'تثبيت المحادثة'}
                            </button>
                            <button
                              onClick={() => handleToggleMute(activeConversation.id, activeConversation.isMuted)}
                              className="w-full text-right px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                            >
                              {activeConversation.isMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-amber-400" />}
                              {activeConversation.isMuted ? 'إلغاء الكتم' : 'كتم الإشعارات'}
                            </button>
                            <button
                              onClick={() => handleToggleArchive(activeConversation.id, activeConversation.isArchived)}
                              className="w-full text-right px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                            >
                              {activeConversation.isArchived ? <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" /> : <Archive className="w-3.5 h-3.5 text-indigo-400" />}
                              {activeConversation.isArchived ? 'إلغاء الأرشفة' : 'أرشفة المحادثة'}
                            </button>
                            <button
                              onClick={() => handleMarkAsUnread(activeConversation.id)}
                              className="w-full text-right px-3 py-2 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Check className="w-3.5 h-3.5 text-cyan-400" />
                              تحديد كغير مقروءة
                            </button>
                            <button
                              onClick={() => handleClearConversation(activeConversation.id)}
                              className="w-full text-right px-3 py-2 hover:bg-red-950/50 text-red-400 flex items-center gap-2 border-t border-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              مسح محتوى الدردشة
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                    {displayMessages.map((msg) => {
                      const isMe =
                        !!msg.senderId &&
                        !!currentUserId &&
                        msg.senderId.toLowerCase() === currentUserId.toLowerCase();
                      const tickStatus = msg.deliveryStatus ?? (isMe ? MessageDeliveryStatus.Sent : undefined);
                      const isCall = isTypeCall(msg.type);

                      if (isCall) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                              <PhoneCall className="w-4 h-4 text-emerald-400" />
                              <span>{msg.text || 'مكالمة مكتملة'}</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'} group`}>
                          <div
                            className={`relative max-w-md rounded-2xl p-3 shadow-md ${
                              isMe
                                ? 'bg-emerald-700 text-white rounded-tl-sm'
                                : 'bg-slate-800 text-slate-100 rounded-tr-sm'
                            }`}
                          >
                            <div
                              className={`text-[12px] font-black mb-1.5 ${
                                isMe ? 'text-emerald-100' : 'text-cyan-300'
                              }`}
                              title={msg.senderName}
                            >
                              {msg.senderName || (isMe ? 'أنت' : 'مستخدم')}
                            </div>

                            {/* Reply preview */}
                            {msg.replyToMessageText && (
                              <div className="mb-2 p-2 rounded-lg bg-black/20 text-xs border-r-2 border-emerald-300 text-slate-300">
                                <span className="font-bold block text-[11px] text-emerald-200">
                                  {msg.replyToSenderName || 'رسالة سابقة'}
                                </span>
                                <span className="truncate block">{msg.replyToMessageText}</span>
                              </div>
                            )}

                            {/* Voice Message Player */}
                            {isTypeVoice(msg.type) && msg.attachments?.[0] && (
                              <VoiceMessagePlayer
                                audioUrl={msg.attachments[0].fileUrl}
                                durationSeconds={msg.attachments[0].durationSeconds || 0}
                              />
                            )}

                            {/* Image Attachment */}
                            {isTypeImage(msg.type) && msg.attachments?.[0] && (
                              <img
                                src={msg.attachments[0].fileUrl}
                                alt=""
                                onClick={() => setSelectedImageModal(msg.attachments[0].fileUrl)}
                                className="rounded-xl max-h-60 object-cover cursor-pointer hover:opacity-95 mb-2"
                              />
                            )}

                            {/* Video Attachment */}
                            {isTypeVideo(msg.type) && msg.attachments?.[0] && (
                              <video
                                src={msg.attachments[0].fileUrl}
                                controls
                                className="rounded-xl max-h-60 mb-2 w-full"
                              />
                            )}

                            {/* File Attachment */}
                            {isTypeFile(msg.type) && msg.attachments?.[0] && (
                              <a
                                href={msg.attachments[0].fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-xs mb-2 transition-colors"
                              >
                                <FileText className="w-5 h-5 text-emerald-300" />
                                <div className="truncate flex-1">
                                  <p className="font-semibold truncate">{msg.attachments[0].fileName}</p>
                                  <span className="text-[10px] text-slate-300">
                                    {(msg.attachments[0].sizeBytes / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                                <Download className="w-4 h-4 text-slate-400" />
                              </a>
                            )}

                            {/* Text message */}
                            {msg.text && !isTypeVoice(msg.type) && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            )}

                            {/* Timestamp & status ticks */}
                            <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-300/80">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <>
                                  {isMessageRead(tickStatus) ? (
                                    <span title="تمت القراءة (Seen)" className="inline-flex items-center">
                                      <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                                    </span>
                                  ) : isMessageDelivered(tickStatus) ? (
                                    <span title="تم التسليم" className="inline-flex items-center">
                                      <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                                    </span>
                                  ) : isMessageSent(tickStatus) || isMe ? (
                                    <span title="تم الإرسال" className="inline-flex items-center">
                                      <Check className="w-3.5 h-3.5 text-slate-300" />
                                    </span>
                                  ) : (
                                    <span title="جارٍ الإرسال" className="inline-flex items-center">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Reactions display */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                {msg.reactions.map((r) => (
                                  <span
                                    key={r.id}
                                    className="px-1.5 py-0.5 rounded-full bg-slate-900/90 text-xs border border-slate-700 shadow"
                                    title={r.userName}
                                  >
                                    {r.reaction}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Hover Quick Actions */}
                            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900/90 rounded-lg p-1 border border-slate-700 shadow-md">
                              <button
                                onClick={() => handleStartForward(msg)}
                                className="p-1 hover:text-cyan-400 text-slate-300"
                                title="إعادة توجيه (Forward)"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setReplyingTo(msg)}
                                className="p-1 hover:text-emerald-400 text-slate-300"
                                title="رد"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (msg.text) navigator.clipboard.writeText(msg.text);
                                }}
                                className="p-1 hover:text-emerald-400 text-slate-300"
                                title="نسخ"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)}
                                className="p-1 hover:text-emerald-400 text-slate-300"
                                title="تفاعل"
                              >
                                <Smile className="w-3.5 h-3.5" />
                              </button>
                              {isMe && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="p-1 hover:text-red-400 text-slate-300"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Emoji Reaction Picker Bar */}
                            {activeReactionMessageId === msg.id && (
                              <div className="absolute -top-9 left-0 flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-full px-2 py-1 shadow-xl z-20">
                                {EMOJI_LIST.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className="hover:scale-125 transition-transform text-sm px-0.5"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Banner */}
                  {replyingTo && (
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs">
                      <div className="border-r-2 border-emerald-500 pr-2">
                        <span className="font-bold text-emerald-400">رد على: {replyingTo.senderName}</span>
                        <p className="text-slate-400 truncate max-w-sm">{replyingTo.text}</p>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-200">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Input Composer */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, false)}
                    />
                    <input
                      type="file"
                      ref={voiceInputRef}
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, true)}
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="إرفاق ملف أو صورة"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => voiceInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="إرسال رسالة صوتية مسجلة"
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="اكتب رسالة..."
                        value={inputText}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim() || isUploading}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-emerald-600/20"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">اختر محادثة للبدء</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    يمكنك إجراء مكالمات صوتية ومرئية فورية عبر WebRTC وإرسال رسائل نصية وصوتية ومشفرة.
                  </p>
                </div>
              )}
            </main>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 2: ADMIN CHAT MONITORING (ADMIN-CHAT-01 & ADMIN-CHAT-02)       */}
        {/* ========================================================================= */}
        {viewMode === 'monitoring' && (
          <div className="flex flex-1 overflow-hidden bg-[#0b141a]">
            {/* WhatsApp-style conversation list */}
            <aside className={`${selectedAdminConv ? 'hidden md:flex' : 'flex'} w-full md:max-w-md flex-col bg-[#111b21] border-l border-[#1f2c34] shrink-0`}>
              <div className="p-3 border-b border-[#1f2c34] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#e9edef] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#25d366]" />
                    محادثات المستخدمين
                    <span className="text-[10px] font-bold text-[#8696a0]">({adminConversations.length})</span>
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#8696a0]" />
                  <input
                    type="text"
                    placeholder="ابحث باسم أو رقم مستخدم..."
                    value={adminFilter.search || ''}
                    onChange={(e) => setAdminFilter({ ...adminFilter, search: e.target.value, page: 1 })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') loadAdminConversations();
                    }}
                    className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#202c33] border-0 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#25d366]/40"
                  />
                </div>
                <p className="text-[10px] text-[#8696a0] font-semibold">
                  عرض صامت · لا Seen · لا إشعار للأطراف
                </p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isAdminLoading && adminConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8696a0]">جاري تحميل المحادثات...</div>
                ) : adminConversations.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#8696a0] space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto text-[#2a3942]" />
                    <p className="font-bold">لا توجد محادثات بين المستخدمين حالياً</p>
                  </div>
                ) : (
                  adminConversations.map((conv) => {
                    const isSelected = selectedAdminConv?.id === conv.id;
                    const unread = getAdminUnreadCount(conv);
                    const hasUnread = unread > 0;
                    const people = getAdminConversationPeople(conv);
                    const avatars = conv.participants?.slice(0, 2) || [];
                    const when = conv.lastMessageAt || conv.lastActivityAt || conv.createdAt;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => handleSelectAdminConversation(conv)}
                        className={`w-full text-right p-3 flex items-center gap-3 border-b border-[#1f2c34]/60 transition-colors ${
                          isSelected
                            ? 'bg-[#2a3942]'
                            : hasUnread
                              ? 'bg-[#102a20] hover:bg-[#143528] border-r-2 border-r-[#25d366]'
                              : 'hover:bg-[#202c33]'
                        }`}
                      >
                        <div className="relative shrink-0 w-12 h-12">
                          {avatars.length >= 2 ? (
                            <>
                              <div className="absolute top-0 right-0 rounded-full overflow-hidden border-2 border-[#111b21]">
                                <ChatUserAvatar src={avatars[0].avatarUrl} size="sm" />
                              </div>
                              <div className="absolute bottom-0 left-0 rounded-full overflow-hidden border-2 border-[#111b21]">
                                <ChatUserAvatar src={avatars[1].avatarUrl} size="sm" />
                              </div>
                            </>
                          ) : (
                            <ChatUserAvatar
                              src={avatars[0]?.avatarUrl || conv.avatarUrl}
                              size="lg"
                              isGroup={conv.type === ConversationType.Group}
                            />
                          )}
                          {hasUnread && (
                            <span className="absolute -bottom-0.5 -left-0.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-[#25d366] text-[#0b141a] text-[10px] font-black grid place-items-center shadow-[0_0_0_2px_#111b21]">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`text-[13px] truncate ${
                                hasUnread ? 'font-black text-white' : 'font-bold text-[#e9edef]'
                              }`}
                            >
                              {people}
                            </h4>
                            <span
                              className={`text-[10px] shrink-0 font-bold ${
                                hasUnread ? 'text-[#25d366]' : 'text-[#8696a0]'
                              }`}
                              title={when}
                            >
                              {formatChatListTime(when)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p
                              className={`text-[12px] truncate ${
                                hasUnread ? 'text-[#d1d7db] font-semibold' : 'text-[#8696a0]'
                              }`}
                            >
                              {conv.lastMessageSnippet ||
                                (conv.lastMessageType && conv.lastMessageType !== MessageType.Text
                                  ? getConversationLastPreview({ lastMessageType: conv.lastMessageType })
                                  : 'بدون رسائل بعد')}
                            </p>
                            {hasUnread ? (
                              <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#25d366] text-[#0b141a]">
                                {unread} جديدة
                              </span>
                            ) : (
                              <span className="shrink-0 text-[10px] text-[#667781] font-bold">
                                {conv.messageCount} رسالة
                              </span>
                            )}
                          </div>
                          {conv.type === ConversationType.Group && (
                            <span className="inline-block mt-1 text-[10px] text-[#53bdeb] font-bold">مجموعة</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Chat thread — silent inspect */}
            <main
              className={`${selectedAdminConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col w-full min-w-0`}
              style={{
                backgroundColor: '#0b141a',
                backgroundImage:
                  'radial-gradient(ellipse at top, rgba(37,211,102,0.06), transparent 55%), linear-gradient(180deg,#0b141a,#111b21)',
              }}
            >
              {selectedAdminConv ? (
                <>
                  <div className="bg-[#202c33] border-b border-[#1f2c34] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Mobile Back Button for monitoring */}
                      <button
                        type="button"
                        onClick={() => setSelectedAdminConv(null)}
                        className="md:hidden p-1.5 -mr-1 rounded-xl text-slate-300 hover:text-white hover:bg-[#2a3942] active:scale-95 transition shrink-0"
                        title="رجوع للمحادثات"
                        aria-label="رجوع للمحادثات"
                      >
                        <ChevronRight className="w-5 h-5 rtl:rotate-0" />
                      </button>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-black text-[#e9edef] truncate">
                          {getAdminConversationPeople(selectedAdminConv)}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-[#25d366] font-bold mt-0.5 truncate">
                          معاينة صامتة · لن يحصل Seen لأي طرف
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/25 font-bold shrink-0">
                      مراقبة فقط
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {isAdminLoading ? (
                      <div className="text-center text-xs text-[#8696a0] py-10">جاري تحميل الرسائل...</div>
                    ) : adminMessages.length === 0 ? (
                      <div className="text-center text-xs text-[#8696a0] py-10">لا رسائل في هذه المحادثة</div>
                    ) : (
                      displayAdminMessages.map((msg) => {
                        const firstUserId = selectedAdminConv.participants?.[0]?.userId;
                        const isSideA = firstUserId ? msg.senderId === firstUserId : true;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isSideA ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-xl px-3 py-2 shadow-sm ${
                                isSideA
                                  ? 'bg-[#202c33] border border-[#2a3942] rounded-tl-sm'
                                  : 'bg-[#005c4b] border border-[#005c4b] rounded-tr-sm'
                              }`}
                            >
                              <div
                                className={`text-[12px] font-black mb-1.5 truncate ${
                                  isSideA ? 'text-[#25d366]' : 'text-[#8ce9c5]'
                                }`}
                                title={msg.senderName}
                              >
                                {msg.senderName || 'مستخدم'}
                              </div>

                              {isTypeVoice(msg.type) && msg.attachments?.[0] && (
                                <VoiceMessagePlayer
                                  audioUrl={msg.attachments[0].fileUrl}
                                  durationSeconds={msg.attachments[0].durationSeconds || 0}
                                />
                              )}

                              {isTypeImage(msg.type) && msg.attachments?.[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={msg.attachments[0].fileUrl}
                                  alt=""
                                  className="rounded-lg max-h-56 object-cover mb-1"
                                />
                              )}

                              {isTypeVideo(msg.type) && msg.attachments?.[0] && (
                                <video
                                  src={msg.attachments[0].fileUrl}
                                  controls
                                  className="rounded-lg max-h-56 mb-1 w-full"
                                />
                              )}

                              {isTypeFile(msg.type) && msg.attachments?.[0] && (
                                <a
                                  href={msg.attachments[0].fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 p-2 rounded-lg bg-[#111b21] text-xs text-[#e9edef]"
                                >
                                  <FileText className="w-4 h-4 text-[#25d366]" />
                                  <span className="truncate flex-1">{msg.attachments[0].fileName}</span>
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {msg.text && (
                                <p className="text-[13px] text-[#e9edef] whitespace-pre-wrap leading-relaxed">
                                  {msg.text}
                                </p>
                              )}
                              <div className="text-[10px] text-[#8696a0] text-left mt-1 dir-ltr">
                                {new Date(msg.createdAt).toLocaleString('ar-EG')}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#202c33] border border-[#2a3942] grid place-items-center mb-4">
                    <ShieldAlert className="w-9 h-9 text-[#25d366]" />
                  </div>
                  <h3 className="text-base font-black text-[#e9edef]">اختر محادثة لترى مين بيكلم مين</h3>
                  <p className="text-xs text-[#8696a0] max-w-sm mt-2 font-semibold leading-relaxed">
                    قائمة اليمين تعرض محادثات المستخدمين فقط. فتح أي شات هنا لا يرسل Seen ولا يغيّر حالة القراءة.
                  </p>
                </div>
              )}
            </main>
          </div>
        )}


        {/* ========================================================================= */}
        {/* VIEW MODE 3: USER COMMUNICATION GRAPH (PROMPT ADMIN-CHAT-03)              */}
        {/* ========================================================================= */}
        {viewMode === 'graph' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-400" />
                  شبكة اتصالات ونشاط المستخدمين (User Communication Graph)
                </h2>
                <p className="text-xs text-slate-400">إحصاءات إدارية مجمعة للنشاط وجهات الاتصال وقوائم الحظر</p>
              </div>

              <div className="relative w-72">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث باسم المستخدم أو الهاتف..."
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">المستخدم</th>
                    <th className="p-3.5">المحادثات النشطة</th>
                    <th className="p-3.5">جهات اتصال فريدة</th>
                    <th className="p-3.5">جهات محظورة</th>
                    <th className="p-3.5">آخر نشاط</th>
                    <th className="p-3.5">آخر محادثة</th>
                    <th className="p-3.5 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isGraphLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        جاري جمع وتحليل بيانات الاتصال...
                      </td>
                    </tr>
                  ) : graphUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        لا توجد بيانات مستخدمين متاحة.
                      </td>
                    </tr>
                  ) : (
                    graphUsers.map((item) => (
                      <tr key={item.userId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-bold text-slate-200">
                          <div>{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{item.phoneNumber || 'بدون هاتف'}</div>
                        </td>
                        <td className="p-3.5 text-slate-300">{item.conversationCount}</td>
                        <td className="p-3.5 text-slate-300">{item.uniqueContactsCount}</td>
                        <td className="p-3.5">
                          {item.blockedContactsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 font-bold border border-red-800/40">
                              {item.blockedContactsCount}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400">
                          {item.lastActivity ? new Date(item.lastActivity).toLocaleDateString('ar-EG') : '-'}
                        </td>
                        <td className="p-3.5 text-slate-300 truncate max-w-xs">{item.lastConversationTitle || '-'}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setViewMode('monitoring');
                              setAdminFilter({ ...adminFilter, userId: item.userId });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium"
                          >
                            فحص المحادثات
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW MODE 4: ADMIN AUDIT LOGS TRAIL                                      */}
        {/* ========================================================================= */}
        {viewMode === 'audit' && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  سجل التدقيق الرقابي (Admin Audit Logs)
                </h2>
                <p className="text-xs text-slate-400">سجل شفاف يوثق كل دخول ومعاينة إدارية لمحادثات المستخدمين مع الأسباب</p>
              </div>
              <button
                onClick={loadAuditLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تحديث
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">المسؤول</th>
                    <th className="p-3.5">الإجراء</th>
                    <th className="p-3.5">معرف المحادثة</th>
                    <th className="p-3.5">السبب المسجل</th>
                    <th className="p-3.5">التوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isAuditLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">جاري تحميل سجلات التدقيق...</td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">لا توجد عمليات مسجلة حتى الآن.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-bold text-amber-300">{log.adminName}</td>
                        <td className="p-3.5 text-slate-200">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 font-mono text-[11px]">{log.conversationId || '-'}</td>
                        <td className="p-3.5 text-slate-300">{log.reason || 'معاينة روتينية'}</td>
                        <td className="p-3.5 text-slate-400">
                          {new Date(log.timestamp).toLocaleString('ar-EG')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* WebRTC Calling Active Overlay (FLUTTER-CALL-01 for Web Admin)             */}
      {/* ========================================================================= */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[75vh] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex flex-col items-center justify-between shadow-2xl p-6">
            {/* Top Bar with Call States & Duration Timer */}
            <div className="w-full flex items-center justify-between z-10 bg-slate-950/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-mono font-bold tracking-wider text-white">
                  {formatCallDuration(callDuration)}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                  {activeCall.type === CallType.Video ? 'مكالمة فيديو WebRTC' : 'مكالمة صوتية WebRTC'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  {callStatusText || (callDuration > 0 ? 'متصلة' : 'جاري التوصيل...')}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>

            {/* Video or Voice Center Screen */}
            {activeCall.type === CallType.Video ? (
              <div className="relative w-full h-full my-4 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                {/* Remote Video Stream */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local Video PIP Preview */}
                <div className="absolute bottom-4 right-4 w-40 h-28 md:w-52 md:h-36 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-2xl bg-slate-900">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoDisabled ? 'hidden' : ''}`}
                  />
                  {isVideoDisabled && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900 text-xs">
                      <VideoOff className="w-6 h-6 mb-1 text-red-400" />
                      الكاميرا معطلة
                    </div>
                  )}
                  <span className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                    أنت
                  </span>
                </div>
              </div>
            ) : (
              /* Active Voice Call Screen */
              <div className="flex flex-col items-center justify-center flex-1 my-auto">
                <div className="relative mb-6">
                  {/* Glowing Concentric Animated Pulse Rings */}
                  <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute -inset-8 rounded-full bg-emerald-500/10 animate-pulse" />
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/30 overflow-hidden">
                    {activeCall.initiatorAvatarUrl ? (
                      <img src={activeCall.initiatorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Phone className="w-14 h-14 text-slate-950 animate-bounce" />
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  {activeCall.initiatorName || 'محادثة صوتية'}
                  <BadgeCheck className="w-5 h-5 text-emerald-400" />
                </h3>
                <p className="text-sm text-emerald-400 font-mono font-medium mb-4">
                  {callStatusText || (callDuration > 0 ? `مدة المكالمة: ${formatCallDuration(callDuration)}` : 'جاري الاتصال...')}
                </p>

                {/* Animated Voice Waveform Bars */}
                <div className="flex items-center gap-1 h-8">
                  {[30, 60, 90, 45, 80, 100, 75, 40, 95, 60, 85, 30].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1.5 bg-emerald-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In-Call Controls Toolbar */}
            <div className="flex items-center gap-4 bg-slate-950/90 px-6 py-3 rounded-full border border-slate-700 shadow-2xl z-10">
              {/* Mic Toggle */}
              <button
                onClick={() => {
                  if (localStreamRef.current) {
                    const audioTrack = localStreamRef.current.getAudioTracks()[0];
                    if (audioTrack) {
                      audioTrack.enabled = !audioTrack.enabled;
                      setIsMicMuted(!audioTrack.enabled);
                    }
                  }
                }}
                className={`p-3 rounded-full transition-all ${
                  isMicMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isMicMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera On/Off for Video */}
              {activeCall.type === CallType.Video && (
                <button
                  onClick={() => {
                    if (localStreamRef.current) {
                      const videoTrack = localStreamRef.current.getVideoTracks()[0];
                      if (videoTrack) {
                        videoTrack.enabled = !videoTrack.enabled;
                        setIsVideoDisabled(!videoTrack.enabled);
                      }
                    }
                  }}
                  className={`p-3 rounded-full transition-all ${
                    isVideoDisabled ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title={isVideoDisabled ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا'}
                >
                  {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Switch Camera for Video */}
              {activeCall.type === CallType.Video && (
                <button
                  onClick={() => {
                    alert('تم تبديل الكاميرا (Front / Rear WebRTC switch)');
                  }}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                  title="تبديل الكاميرا"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              {/* Speaker Toggle */}
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-3 rounded-full transition-all ${
                  !isSpeakerOn ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isSpeakerOn ? 'مكبر الصوت قيد التشغيل' : 'مكبر الصوت مكتوم'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                onClick={handleEndCall}
                className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 transition-transform active:scale-95"
                title="إنهاء المكالمة"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Dialog */}
      {incomingCall && !activeCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center animate-bounce mb-4">
              <PhoneIncoming className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{incomingCall.initiatorName || 'مستخدم'}</h3>
            <p className="text-xs text-slate-400 mb-6">
              مكالمة {incomingCall.type === CallType.Video ? 'فيديو WebRTC' : 'صوتية WebRTC'} واردة...
            </p>
            <div className="flex items-center gap-6 w-full justify-center">
              <button
                onClick={handleAcceptIncomingCall}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
                title="رد"
              >
                <Phone className="w-6 h-6" />
              </button>
              <button
                onClick={() => {
                  chatApi.updateCallStatus(incomingCall.id, CallStatus.Rejected);
                  setIncomingCall(null);
                }}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-transform active:scale-95"
                title="رفض"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MESSAGE FORWARDING MODAL (PROMPT CHAT-15)                                 */}
      {/* ========================================================================= */}
      {forwardModalOpen && forwardingMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                إعادة توجيه الرسالة (Forward Message)
              </h3>
              <button onClick={() => setForwardModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message Preview Snippet Card */}
            <div className="my-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-bold text-cyan-400 block mb-1">
                رسالة من: {forwardingMessage.senderName}
              </span>
              <p className="text-xs text-slate-300 line-clamp-2">
                {forwardingMessage.text ||
                  (isTypeImage(forwardingMessage.type) ? 'صورة مرفقة 🖼️' :
                   isTypeVideo(forwardingMessage.type) ? 'مقطع فيديو 🎬' :
                   isTypeVoice(forwardingMessage.type) ? 'رسالة صوتية 🎙️' : 'ملف مرفق 📎')}
              </p>
              {forwardingMessage.attachments?.[0] && (
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{forwardingMessage.attachments[0].fileName}</span>
                  <span>({(forwardingMessage.attachments[0].sizeBytes / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {/* Target Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن محادثة لإعادة التوجيه إليها..."
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Conversations Selection List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 divide-y divide-slate-800/40 min-h-[160px] max-h-[220px]">
              {conversations
                .filter((c) => {
                  const title = getConversationDisplayName(c);
                  return title.toLowerCase().includes(forwardSearchQuery.toLowerCase());
                })
                .map((conv) => {
                  const isSelected = forwardTargetIds.includes(conv.id);
                  const convTitle = getConversationDisplayName(conv);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => toggleForwardTarget(conv.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-950/40 border border-cyan-500/40' : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ChatUserAvatar
                          src={getConversationAvatarUrl(conv)}
                          alt={convTitle}
                          size="sm"
                          isGroup={conv.type === ConversationType.Group}
                        />
                        <span className="text-xs font-semibold text-slate-200 truncate">{convTitle}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  );
                })}
            </div>

            {/* Optional Extra Note Input */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="إضافة تعليق اختياري مع الرسالة..."
                value={forwardExtraText}
                onChange={(e) => setForwardExtraText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-slate-800">
              <button
                onClick={() => setForwardModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmForward}
                disabled={isForwarding || forwardTargetIds.length === 0}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs text-slate-950 font-bold flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                إعادة توجيه ({forwardTargetIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CALL HISTORY MODAL (FLUTTER-CALL-01 for Web Admin)                        */}
      {/* ========================================================================= */}
      {showCallHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
                سجل المكالمات (Call History)
              </h3>
              <button onClick={() => setShowCallHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-4 divide-y divide-slate-800/40">
              {isLoadingCallHistory ? (
                <div className="p-8 text-center text-xs text-slate-500">جاري تحميل سجل المكالمات...</div>
              ) : callHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">لا توجد مكالمات سابقة مسجلة.</div>
              ) : (
                callHistory.map((call) => {
                  const isIncoming = call.initiatedByUserId !== currentUserId;
                  const isMissed = call.status === CallStatus.Missed || call.status === CallStatus.Rejected;
                  return (
                    <div key={call.id} className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                          {isMissed ? (
                            <PhoneMissed className="w-5 h-5 text-red-400" />
                          ) : isIncoming ? (
                            <PhoneIncoming className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <PhoneOutgoing className="w-5 h-5 text-cyan-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{call.initiatorName || 'مستخدم'}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{call.type === CallType.Video ? 'مكالمة فيديو' : 'مكالمة صوتية'}</span>
                            <span>•</span>
                            <span>{call.durationSeconds ? `${call.durationSeconds} ثانية` : isMissed ? 'لم يُرد عليها' : 'مكتملة'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {new Date(call.startedAt).toLocaleString('ar-EG')}
                          </span>
                        </div>
                      </div>

                      {/* Redial Button */}
                      <button
                        onClick={() => handleRedial(call.conversationId, call.type)}
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                        title="إعادة الاتصال"
                      >
                        {call.type === CallType.Video ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4-TAB ENHANCED CHAT SETTINGS MODAL (CHAT SETTINGS PROMPT)                 */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                إعدادات المحادثات والخصوصية (Chat Settings)
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Settings Tabs */}
            <div className="flex items-center gap-1 my-3 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSettingsTab('privacy')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  settingsTab === 'privacy'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الخصوصية
              </button>
              <button
                onClick={() => setSettingsTab('download')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  settingsTab === 'download'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                التنزيل التلقائي
              </button>
              <button
                onClick={() => setSettingsTab('notifications')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  settingsTab === 'notifications'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الإشعارات
              </button>
              <button
                onClick={() => setSettingsTab('backup')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  settingsTab === 'backup'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                النسخ الاحتياطي
              </button>
            </div>

            {/* Tab 1: Privacy Options */}
            {settingsTab === 'privacy' && (
              <div className="py-2 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">مؤشرات قراءة الرسائل (Read Receipts)</h4>
                    <p className="text-[11px] text-slate-400">إظهار علامتي القراءة الزرقاء ✓✓ عند قراءة الرسائل</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.readReceiptsEnabled}
                    onChange={(e) => setSettings({ ...settings, readReceiptsEnabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-white mb-2">آخر ظهور (Last Seen)</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="lastSeen"
                        value={LastSeenPrivacy.Everyone}
                        checked={settings.lastSeenPrivacy === LastSeenPrivacy.Everyone}
                        onChange={() => setSettings({ ...settings, lastSeenPrivacy: LastSeenPrivacy.Everyone })}
                      />
                      الجميع
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="lastSeen"
                        value={LastSeenPrivacy.Followers}
                        checked={settings.lastSeenPrivacy === LastSeenPrivacy.Followers}
                        onChange={() => setSettings({ ...settings, lastSeenPrivacy: LastSeenPrivacy.Followers })}
                      />
                      المتابعون فقط
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="lastSeen"
                        value={LastSeenPrivacy.Nobody}
                        checked={settings.lastSeenPrivacy === LastSeenPrivacy.Nobody}
                        onChange={() => setSettings({ ...settings, lastSeenPrivacy: LastSeenPrivacy.Nobody })}
                      />
                      لا أحد
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">حالة الاتصال والظهور (Online Status)</h4>
                    <p className="text-[11px] text-slate-400">إظهار الدائرة الخضراء "متصل الآن" للآخرين</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.onlineStatusEnabled}
                    onChange={(e) => setSettings({ ...settings, onlineStatusEnabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">مؤشر جاري الكتابة (Typing Indicator)</h4>
                    <p className="text-[11px] text-slate-400">إظهار عبارة "يكتب الآن..." أثناء الكتابة</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.typingIndicatorsEnabled}
                    onChange={(e) => setSettings({ ...settings, typingIndicatorsEnabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Media Auto Download */}
            {settingsTab === 'download' && (
              <div className="py-2 space-y-3 overflow-y-auto">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-xs font-bold text-white mb-2">نمط التنزيل الافتراضي للشبكة</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaDownload"
                        value={MediaAutoDownloadSetting.WiFi}
                        checked={settings.mediaAutoDownload === MediaAutoDownloadSetting.WiFi}
                        onChange={() => setSettings({ ...settings, mediaAutoDownload: MediaAutoDownloadSetting.WiFi })}
                      />
                      واي فاي فقط
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaDownload"
                        value={MediaAutoDownloadSetting.MobileData}
                        checked={settings.mediaAutoDownload === MediaAutoDownloadSetting.MobileData}
                        onChange={() => setSettings({ ...settings, mediaAutoDownload: MediaAutoDownloadSetting.MobileData })}
                      />
                      بيانات الهاتف
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mediaDownload"
                        value={MediaAutoDownloadSetting.Never}
                        checked={settings.mediaAutoDownload === MediaAutoDownloadSetting.Never}
                        onChange={() => setSettings({ ...settings, mediaAutoDownload: MediaAutoDownloadSetting.Never })}
                      />
                      أبداً
                    </label>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white">تخصيص وسائط التنزيل التلقائي</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={!!settings.autoDownloadPhotos}
                        onChange={(e) => setSettings({ ...settings, autoDownloadPhotos: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      الصور (Photos)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={!!settings.autoDownloadVideos}
                        onChange={(e) => setSettings({ ...settings, autoDownloadVideos: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      الفيديوهات (Videos)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={!!settings.autoDownloadAudio}
                        onChange={(e) => setSettings({ ...settings, autoDownloadAudio: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      الصوتيات (Audio)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={!!settings.autoDownloadDocuments}
                        onChange={(e) => setSettings({ ...settings, autoDownloadDocuments: e.target.checked })}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      المستندات (Documents)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Notifications & Sounds */}
            {settingsTab === 'notifications' && (
              <div className="py-2 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">معاينة الرسائل (Message Preview)</h4>
                    <p className="text-[11px] text-slate-400">إظهار نص الرسالة في نافذة الإشعار المنبثقة</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.notificationPreviewEnabled}
                    onChange={(e) => setSettings({ ...settings, notificationPreviewEnabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">أصوات التنبيه (Sound)</h4>
                    <p className="text-[11px] text-slate-400">تشغيل نغمة عند وصول رسائل جديدة ومكالمات</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">الاهتزاز (Vibration)</h4>
                    <p className="text-[11px] text-slate-400">تفعيل الاهتزاز مع التنبيهات</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!settings.vibrationEnabled}
                    onChange={(e) => setSettings({ ...settings, vibrationEnabled: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Chats Management & Backup */}
            {settingsTab === 'backup' && (
              <div className="py-2 space-y-3 overflow-y-auto">
                {/* Cloud Chat Backup Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">النسخ الاحتياطي للدردشات (Chat Backup)</h4>
                        <p className="text-[11px] text-slate-400">حفظ نسخة احتياطية مشفرة لجميع المحادثات</p>
                      </div>
                    </div>
                    <button
                      onClick={handleTriggerBackup}
                      disabled={isBackingUp}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      {isBackingUp ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {isBackingUp ? 'جاري النسخ...' : 'نسخ احتياطي الآن'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/30 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[10px] block">آخر نسخة احتياطية</span>
                      <span className="text-slate-200 font-mono text-[11px]">
                        {settings.lastBackupAt ? new Date(settings.lastBackupAt).toLocaleString('ar-EG') : 'لم يتم النسخ بعد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">حجم البيانات</span>
                      <span className="text-emerald-400 font-mono text-[11px]">
                        {settings.backupSizeBytes ? `${(settings.backupSizeBytes / 1024).toFixed(1)} KB` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counters Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">المثبتة</span>
                    <span className="text-sm font-bold text-emerald-400">{settings.pinnedChatsCount ?? 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">المؤرشفة</span>
                    <span className="text-sm font-bold text-indigo-400">{settings.archivedChatsCount ?? 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">المحظورين</span>
                    <span className="text-sm font-bold text-red-400">{settings.blockedUsersCount ?? 0}</span>
                  </div>
                </div>

                {/* Clear Chat Action */}
                {activeConversationId && (
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-red-300">مسح محتوى المحادثة الحالية</h5>
                      <p className="text-[10px] text-slate-400">حذف الرسائل محلياً مع الحفاظ على المحادثة</p>
                    </div>
                    <button
                      onClick={() => handleClearConversation(activeConversationId)}
                      className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs transition-colors"
                    >
                      مسح الرسائل
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                إغلاق
              </button>
              <button
                onClick={async () => {
                  try {
                    await chatApi.updateSettings(settings);
                    alert('تم حفظ إعدادات الدردشة والخصوصية بنجاح على الخادم.');
                    setShowSettingsModal(false);
                  } catch (err) {
                    alert('فشل حفظ الإعدادات.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs text-slate-950 font-bold"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start chat with any user */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-[#111b21] border border-[#2a3942] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2c34]">
              <div>
                <h3 className="text-sm font-black text-[#e9edef] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#25d366]" />
                  كلم مستخدم
                </h3>
                <p className="text-[11px] text-[#8696a0] font-semibold mt-0.5">
                  ابحث بالاسم أو رقم الموبايل ثم ابدأ محادثة مباشرة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-2 rounded-lg hover:bg-[#2a3942] text-[#8696a0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#1f2c34]">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-[#8696a0]" />
                <input
                  autoFocus
                  type="text"
                  value={userPickerQuery}
                  onChange={(e) => setUserPickerQuery(e.target.value)}
                  placeholder="اسم المستخدم أو رقم الموبايل..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#202c33] border-0 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#25d366]/50"
                />
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {isUserPickerLoading ? (
                <div className="p-8 text-center text-xs text-[#8696a0]">جاري البحث...</div>
              ) : userPickerResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8696a0]">
                  لا يوجد مستخدمون مطابقون
                </div>
              ) : (
                userPickerResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isStartingChat || u.id === currentUserId}
                    onClick={() => handleCreateDirectChat(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-[#202c33] border-b border-[#1f2c34]/50 disabled:opacity-40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <ChatUserAvatar src={u.avatarUrl} alt={u.name || ''} size="md" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[#e9edef] truncate flex items-center gap-1.5">
                        {u.name}
                        {u.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                        {u.isBlocked && (
                          <span className="text-[10px] text-rose-400 font-bold">محظور</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8696a0] font-semibold truncate" dir="ltr">
                        {u.phoneNumber || u.username || u.id.slice(0, 8)}
                      </div>
                    </div>
                    <MessageCircle className="w-4 h-4 text-[#25d366] shrink-0" />
                  </button>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#1f2c34] flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2a3942] text-xs font-bold text-[#e9edef]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={selectedImageModal} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
        </div>
      )}
    </AdminShell>
  );
}
