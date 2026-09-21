'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { storage } from '@/lib/storage';
import { devLog } from '@/lib/devLog';
import { ChatMessageDto, ConversationDto, MessageReactionDto, CallDto } from '@/types/chat';

const useDirectApi =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_API_DIRECT === '1';

const API_BASE_URL = useDirectApi
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net')
  : typeof window !== 'undefined'
    ? ''
    : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net');

export interface ChatHubCallbacks {
  onMessageSent?: (message: ChatMessageDto) => void;
  onMessageDelivered?: (conversationId: string, messageId: string, userId: string, deliveredAt: string) => void;
  onMessageRead?: (conversationId: string, messageId: string, userId: string, readAt: string) => void;
  onMessageEdited?: (message: ChatMessageDto) => void;
  onMessageDeleted?: (conversationId: string, messageId: string, deletedByUserId: string) => void;
  onReactionAdded?: (conversationId: string, reaction: MessageReactionDto) => void;
  onReactionRemoved?: (conversationId: string, messageId: string, userId: string) => void;
  onTypingStarted?: (conversationId: string, userId: string, userName: string) => void;
  onTypingStopped?: (conversationId: string, userId: string) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string, lastSeenAt: string) => void;
  onConversationUpdated?: (conversation: ConversationDto) => void;
  onCallIncoming?: (call: CallDto) => void;
  onCallAccepted?: (call: CallDto) => void;
  onCallRejected?: (call: CallDto) => void;
  onCallEnded?: (call: CallDto) => void;
  onWebRtcOfferReceived?: (callId: string, senderUserId: string, sdp: string) => void;
  onWebRtcAnswerReceived?: (callId: string, senderUserId: string, sdp: string) => void;
  onWebRtcIceCandidateReceived?: (callId: string, senderUserId: string, candidate: string, sdpMid?: string, sdpMLineIndex?: number) => void;
  onCallStateChanged?: (callId: string, status: number) => void;
}

export function useChatHub(callbacks: ChatHubCallbacks = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const callbacksRef = useRef<ChatHubCallbacks>(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const token = storage.getToken();
    if (!token) return;

    const hubUrl = `${API_BASE_URL}/hubs/chat`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => storage.getToken() ?? '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('MessageSent', (message: ChatMessageDto) => {
      callbacksRef.current.onMessageSent?.(message);
    });

    connection.on('MessageDelivered', (conversationId: string, messageId: string, userId: string, deliveredAt: string) => {
      callbacksRef.current.onMessageDelivered?.(conversationId, messageId, userId, deliveredAt);
    });

    connection.on('MessageRead', (conversationId: string, messageId: string, userId: string, readAt: string) => {
      callbacksRef.current.onMessageRead?.(conversationId, messageId, userId, readAt);
    });

    connection.on('MessageEdited', (message: ChatMessageDto) => {
      callbacksRef.current.onMessageEdited?.(message);
    });

    connection.on('MessageDeleted', (conversationId: string, messageId: string, deletedByUserId: string) => {
      callbacksRef.current.onMessageDeleted?.(conversationId, messageId, deletedByUserId);
    });

    connection.on('MessageReactionAdded', (conversationId: string, reaction: MessageReactionDto) => {
      callbacksRef.current.onReactionAdded?.(conversationId, reaction);
    });

    connection.on('MessageReactionRemoved', (conversationId: string, messageId: string, userId: string) => {
      callbacksRef.current.onReactionRemoved?.(conversationId, messageId, userId);
    });

    connection.on('TypingStarted', (conversationId: string, userId: string, userName: string) => {
      callbacksRef.current.onTypingStarted?.(conversationId, userId, userName);
    });

    connection.on('TypingStopped', (conversationId: string, userId: string) => {
      callbacksRef.current.onTypingStopped?.(conversationId, userId);
    });

    connection.on('UserOnline', (userId: string) => {
      callbacksRef.current.onUserOnline?.(userId);
    });

    connection.on('UserOffline', (userId: string, lastSeenAt: string) => {
      callbacksRef.current.onUserOffline?.(userId, lastSeenAt);
    });

    connection.on('ConversationUpdated', (conversation: ConversationDto) => {
      callbacksRef.current.onConversationUpdated?.(conversation);
    });

    connection.on('CallIncoming', (call: CallDto) => {
      callbacksRef.current.onCallIncoming?.(call);
    });

    connection.on('CallAccepted', (call: CallDto) => {
      callbacksRef.current.onCallAccepted?.(call);
    });

    connection.on('CallRejected', (call: CallDto) => {
      callbacksRef.current.onCallRejected?.(call);
    });

    connection.on('CallEnded', (call: CallDto) => {
      callbacksRef.current.onCallEnded?.(call);
    });

    connection.on('WebRtcOfferReceived', (callId: string, senderUserId: string, sdp: string) => {
      callbacksRef.current.onWebRtcOfferReceived?.(callId, senderUserId, sdp);
    });

    connection.on('WebRtcAnswerReceived', (callId: string, senderUserId: string, sdp: string) => {
      callbacksRef.current.onWebRtcAnswerReceived?.(callId, senderUserId, sdp);
    });

    connection.on('WebRtcIceCandidateReceived', (callId: string, senderUserId: string, candidate: string, sdpMid?: string, sdpMLineIndex?: number) => {
      callbacksRef.current.onWebRtcIceCandidateReceived?.(callId, senderUserId, candidate, sdpMid, sdpMLineIndex);
    });

    connection.on('CallStateChanged', (callId: string, status: number) => {
      callbacksRef.current.onCallStateChanged?.(callId, status);
    });

    connection.onreconnecting(() => {
      setConnectionState('reconnecting');
      setIsConnected(false);
      devLog.warn('chat-hub', 'SignalR ChatHub reconnecting...');
    });

    connection.onreconnected(() => {
      setConnectionState('connected');
      setIsConnected(true);
      devLog.ok('chat-hub', 'SignalR ChatHub reconnected.');
    });

    connection.onclose(() => {
      setConnectionState('disconnected');
      setIsConnected(false);
      devLog.info('chat-hub', 'SignalR ChatHub disconnected.');
    });

    setConnectionState('connecting');
    connection
      .start()
      .then(() => {
        setIsConnected(true);
        setConnectionState('connected');
        devLog.ok('chat-hub', 'SignalR ChatHub connected.');
      })
      .catch((err) => {
        setIsConnected(false);
        setConnectionState('disconnected');
        devLog.error('chat-hub', 'SignalR ChatHub connection failed', err);
      });

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, []);

  const joinConversation = useCallback(async (conversationId: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('JoinConversation', conversationId);
        devLog.step('chat-hub', `Joined conversation: ${conversationId}`);
      } catch (err) {
        devLog.error('chat-hub', `Failed to join conversation ${conversationId}`, err);
      }
    }
  }, []);

  const leaveConversation = useCallback(async (conversationId: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('LeaveConversation', conversationId);
        devLog.step('chat-hub', `Left conversation: ${conversationId}`);
      } catch (err) {
        devLog.error('chat-hub', `Failed to leave conversation ${conversationId}`, err);
      }
    }
  }, []);

  const startTyping = useCallback(async (conversationId: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('TypingStarted', conversationId);
      } catch (err) {
        // silent fail
      }
    }
  }, []);

  const stopTyping = useCallback(async (conversationId: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('TypingStopped', conversationId);
      } catch (err) {
        // silent fail
      }
    }
  }, []);

  const joinCall = useCallback(async (callId: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('JoinCall', callId);
      } catch (err) {}
    }
  }, []);

  const leaveCall = useCallback(async (callId: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('LeaveCall', callId);
      } catch (err) {}
    }
  }, []);

  const sendOffer = useCallback(async (callId: string, targetUserId: string, sdp: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('SendOffer', callId, targetUserId, sdp);
      } catch (err) {}
    }
  }, []);

  const sendAnswer = useCallback(async (callId: string, targetUserId: string, sdp: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('SendAnswer', callId, targetUserId, sdp);
      } catch (err) {}
    }
  }, []);

  const sendIceCandidate = useCallback(async (callId: string, targetUserId: string, candidate: string, sdpMid?: string, sdpMLineIndex?: number) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      try {
        await connectionRef.current.invoke('SendIceCandidate', callId, targetUserId, candidate, sdpMid, sdpMLineIndex);
      } catch (err) {}
    }
  }, []);

  return {
    isConnected,
    connectionState,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    joinCall,
    leaveCall,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
}
