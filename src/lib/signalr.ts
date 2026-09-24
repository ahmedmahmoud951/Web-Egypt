import * as signalR from '@microsoft/signalr';
import { storage } from './storage';
import { devLog } from './devLog';
import {
  EventCreatedMessage,
  EventUpdatedMessage,
  EventConfirmedMessage,
  EventReportedMessage,
  EventHiddenMessage,
  EventRestoredMessage,
  LocationApprovedMessage,
  ReelPublishedMessage,
  ReelHiddenMessage,
  ReelRestoredMessage,
  ReelDeletedMessage,
  ReelReactionUpdatedMessage,
  ReelCommentAddedMessage,
  StatusPublishedMessage,
  StatusDeletedMessage,
  StatusHiddenMessage,
  StatusRestoredMessage,
  NewReelReportMessage,
  NewStatusReportMessage,
  UserCreatedMessage,
  UserUpdatedMessage,
  UserDeletedMessage,
} from '@/types/realtime';

export type SignalRConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disabled';

export interface RealtimeConfig {
  enabled: boolean;
  hubUrl: string;
  hubName: string;
  supportedEvents?: string[];
}

// Base API URL for discovery — NOT a hardcoded hub URL
const useDirectApi =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_API_DIRECT === '1';

const API_BASE_URL = useDirectApi
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net')
  : typeof window !== 'undefined'
    ? ''
    : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://todayegypt.runasp.net');

/**
 * Dynamically queries the authoritative database-driven SignalR configuration from the backend.
 * Never hardcodes the WebSocket Hub URL in the client.
 */
export async function fetchRealtimeConfig(): Promise<RealtimeConfig | null> {
  try {
    devLog.step('realtime', 'Fetching /api/config/realtime');
    const response = await fetch(`${API_BASE_URL}/api/config/realtime`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      devLog.warn('realtime', `Config endpoint status ${response.status}`);
      return null;
    }

    const payload = await response.json();
    const config = payload.data || payload;
    devLog.ok('realtime', 'Got realtime config', {
      enabled: config?.enabled,
      hubName: config?.hubName,
      hubUrl: config?.hubUrl,
    });
    return config;
  } catch (error) {
    devLog.warn('realtime', 'Failed to retrieve realtime configuration', error);
    return null;
  }
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private currentStatus: SignalRConnectionStatus = 'disconnected';
  private statusListeners: Set<(status: SignalRConnectionStatus) => void> = new Set();

  // Registry of callbacks to ensure re-binding after dynamic connection initialization
  private eventHandlers: Map<string, Set<Function>> = new Map();

  public getStatus(): SignalRConnectionStatus {
    return this.currentStatus;
  }

  public onStatusChange(callback: (status: SignalRConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.statusListeners.delete(callback);
  }

  private setStatus(status: SignalRConnectionStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  /**
   * Initializes and starts the dynamic SignalR connection if enabled in SQL Server.
   * Degrades gracefully if disabled or if connection configuration is unreachable.
   */
  public async start(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isConnecting || this.currentStatus === 'connected') return;

    this.isConnecting = true;
    this.setStatus('connecting');
    devLog.step('realtime', 'Connecting to SignalR hub…');

    try {
      const config = await fetchRealtimeConfig();

      if (!config || !config.enabled || !config.hubUrl) {
        devLog.warn('realtime', 'Real-time disabled — REST mode only');
        this.setStatus('disabled');
        return;
      }

      const targetHubUrl = config.hubUrl;

      if (!this.connection) {
        const customLogger: signalR.ILogger = {
          log(logLevel: signalR.LogLevel, message: string) {
            if (
              message.includes('Server timeout elapsed') ||
              message.includes('Connection disconnected with error') ||
              message.includes('Failed to complete negotiation') ||
              message.includes('Error from HTTP request')
            ) {
              return;
            }
            if (logLevel >= signalR.LogLevel.Error) {
              devLog.warn('realtime', message);
            }
          },
        };

        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(targetHubUrl, {
            accessTokenFactory: () => storage.getToken() || '',
            skipNegotiation: false,
            transport:
              signalR.HttpTransportType.WebSockets |
              signalR.HttpTransportType.ServerSentEvents |
              signalR.HttpTransportType.LongPolling,
          })
          .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
          .configureLogging(customLogger)
          .build();

        this.connection.serverTimeoutInMilliseconds = 120000;
        this.connection.keepAliveIntervalInMilliseconds = 20000;

        this.connection.onreconnecting(() => {
          devLog.warn('realtime', 'Connection lost — reconnecting…');
          this.setStatus('reconnecting');
        });

        this.connection.onreconnected(() => {
          devLog.ok('realtime', 'Connection re-established');
          this.setStatus('connected');
        });

        this.connection.onclose(() => {
          devLog.warn('realtime', 'Connection closed');
          this.setStatus('disconnected');
        });

        this.bindRegisteredHandlers();
      }

      if (this.connection.state === signalR.HubConnectionState.Disconnected) {
        await this.connection.start();
        this.setStatus('connected');
        devLog.ok('realtime', `Connected to ${config.hubName}`, { hubUrl: targetHubUrl });
      }
    } catch (err) {
      devLog.error('realtime', 'Connection failed — continuing in REST mode', err);
      this.setStatus('disconnected');
      try {
        await this.connection?.stop();
      } catch {
        // ignore
      }
      this.connection = null;
    } finally {
      this.isConnecting = false;
    }
  }

  public async stop(): Promise<void> {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop();
      this.setStatus('disconnected');
    }
  }

  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  private registerHandler(eventName: string, callback: Function): () => void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)!.add(callback);

    if (this.connection) {
      this.connection.on(eventName, callback as (...args: any[]) => void);
    }

    return () => {
      this.eventHandlers.get(eventName)?.delete(callback);
      if (this.connection) {
        this.connection.off(eventName, callback as (...args: any[]) => void);
      }
    };
  }

  private bindRegisteredHandlers() {
    if (!this.connection) return;
    this.eventHandlers.forEach((callbacks, eventName) => {
      callbacks.forEach((callback) => {
        this.connection!.off(eventName, callback as (...args: any[]) => void);
        this.connection!.on(eventName, callback as (...args: any[]) => void);
      });
    });
  }

  public onEventCreated(callback: (msg: EventCreatedMessage) => void): () => void {
    return this.registerHandler('EventCreated', callback);
  }

  public onEventUpdated(callback: (msg: EventUpdatedMessage) => void): () => void {
    return this.registerHandler('EventUpdated', callback);
  }

  public onEventConfirmed(callback: (msg: EventConfirmedMessage) => void): () => void {
    return this.registerHandler('EventConfirmed', callback);
  }

  public onEventReported(callback: (msg: EventReportedMessage) => void): () => void {
    return this.registerHandler('EventReported', callback);
  }

  public onEventHidden(callback: (msg: EventHiddenMessage) => void): () => void {
    return this.registerHandler('EventHidden', callback);
  }

  public onEventRestored(callback: (msg: EventRestoredMessage) => void): () => void {
    return this.registerHandler('EventRestored', callback);
  }

  public onLocationApproved(callback: (msg: LocationApprovedMessage) => void): () => void {
    return this.registerHandler('LocationApproved', callback);
  }

  public onVerificationEvent(callback: (msg: VerificationEventMessage) => void): () => void {
    return this.registerHandler('VerificationEvent', callback);
  }

  // Social - Reels Events
  public onReelPublished(callback: (msg: ReelPublishedMessage) => void): () => void {
    return this.registerHandler('ReelPublished', callback);
  }

  public onReelHidden(callback: (msg: ReelHiddenMessage) => void): () => void {
    return this.registerHandler('ReelHidden', callback);
  }

  public onReelRestored(callback: (msg: ReelRestoredMessage) => void): () => void {
    return this.registerHandler('ReelRestored', callback);
  }

  public onReelDeleted(callback: (msg: ReelDeletedMessage) => void): () => void {
    return this.registerHandler('ReelDeleted', callback);
  }

  public onReelReactionUpdated(callback: (msg: ReelReactionUpdatedMessage) => void): () => void {
    return this.registerHandler('ReelReactionUpdated', callback);
  }

  public onReelCommentAdded(callback: (msg: ReelCommentAddedMessage) => void): () => void {
    return this.registerHandler('ReelCommentAdded', callback);
  }

  // Social - Status Events
  public onStatusPublished(callback: (msg: StatusPublishedMessage) => void): () => void {
    return this.registerHandler('StatusPublished', callback);
  }

  public onStatusDeleted(callback: (msg: StatusDeletedMessage) => void): () => void {
    return this.registerHandler('StatusDeleted', callback);
  }

  public onStatusHidden(callback: (msg: StatusHiddenMessage) => void): () => void {
    return this.registerHandler('StatusHidden', callback);
  }

  public onStatusRestored(callback: (msg: StatusRestoredMessage) => void): () => void {
    return this.registerHandler('StatusRestored', callback);
  }

  // Social - Admin Events
  public onNewReelReport(callback: (msg: NewReelReportMessage) => void): () => void {
    return this.registerHandler('NewReelReport', callback);
  }

  public onNewStatusReport(callback: (msg: NewStatusReportMessage) => void): () => void {
    return this.registerHandler('NewStatusReport', callback);
  }

  // User Management Events
  public onUserCreated(callback: (msg: UserCreatedMessage) => void): () => void {
    return this.registerHandler('UserCreated', callback);
  }

  public onUserUpdated(callback: (msg: UserUpdatedMessage) => void): () => void {
    return this.registerHandler('UserUpdated', callback);
  }

  public onUserDeleted(callback: (msg: UserDeletedMessage) => void): () => void {
    return this.registerHandler('UserDeleted', callback);
  }

  public async joinLocationGroup(locationId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinLocationGroup', locationId);
    }
  }

  public async joinEventGroup(eventId: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinEventGroup', eventId);
    }
  }

  public async joinReelGroup(reelId: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('JoinReelGroup', reelId);
    }
  }

  public async leaveReelGroup(reelId: string): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke('LeaveReelGroup', reelId);
    }
  }
}

export interface VerificationEventMessage {
  verificationId?: string;
  requestId?: string;
  userId: string;
  type: string;
  status: string;
  notes?: string;
  timestamp?: string;
}

export const signalRService = new SignalRService();
