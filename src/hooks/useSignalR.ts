'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signalRService } from '@/lib/signalr';
import { EVENTS_QUERY_KEYS } from './useEvents';
import { LOCATIONS_QUERY_KEYS } from './useLocations';
import { EventDto } from '@/types/event';
import { PagedResponse } from '@/types/api';
import { EventSummaryDto } from '@/types/event';
import { devLog } from '@/lib/devLog';

/**
 * Live refresh: invalidates queries AND immediately forces a refetch on all active observers.
 * This guarantees that components currently mounted on-screen (statuses, reels, events, reports, dashboard)
 * update instantly in real time without the user having to leave and re-enter the page.
 */
function liveRefresh(
  queryClient: ReturnType<typeof useQueryClient>,
  keys: readonly (readonly unknown[])[],
  reason: string,
  delayMs = 200
) {
  const timerKey = `__sr_${keys.map((k) => (Array.isArray(k) ? k.join('.') : String(k))).join('|')}`;
  const w = window as unknown as Record<string, ReturnType<typeof setTimeout> | undefined>;
  if (w[timerKey]) clearTimeout(w[timerKey]);
  w[timerKey] = setTimeout(() => {
    w[timerKey] = undefined;
    devLog.step('realtime', `Live refresh ← ${reason}`, { keys: keys.map((k) => (Array.isArray(k) ? k.join('/') : String(k))) });
    for (const queryKey of keys) {
      queryClient.invalidateQueries({ queryKey: [...queryKey] });
      queryClient.refetchQueries({ queryKey: [...queryKey], type: 'active' });
    }
  }, delayMs);
}

export function useSignalRSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect quickly after initial render; connect immediately if already active
    const delay = signalRService.getStatus() === 'connected' ? 0 : 500;
    const startTimer = window.setTimeout(() => {
      devLog.step('realtime', 'Starting SignalR subscriptions');
      signalRService.start();
    }, delay);

    const unsubCreated = signalRService.onEventCreated((msg) => {
      devLog.info('realtime', 'EventCreated', msg);
      liveRefresh(queryClient, [['admin', 'events'], ['admin', 'dashboard'], EVENTS_QUERY_KEYS.all], 'EventCreated');
    });

    const unsubUpdated = signalRService.onEventUpdated((msg) => {
      devLog.info('realtime', 'EventUpdated', msg);
      liveRefresh(queryClient, [['admin', 'events'], ['admin', 'dashboard'], EVENTS_QUERY_KEYS.all], 'EventUpdated');
      if (msg?.eventId) {
        liveRefresh(queryClient, [['admin', 'events', msg.eventId]], 'EventUpdated.detail', 100);
      }
    });

    const unsubConfirmed = signalRService.onEventConfirmed((message) => {
      devLog.info('realtime', 'EventConfirmed', message);
      // Patch caches in-place — no HTTP refetch for confirm counts.
      queryClient.setQueryData<EventDto>(EVENTS_QUERY_KEYS.detail(message.eventId), (old) => {
        if (!old) return old;
        return {
          ...old,
          confirmCount: message.confirmCount,
          lastConfirmedAt: message.lastConfirmedAt ?? old.lastConfirmedAt,
        };
      });
      queryClient.setQueryData(['admin', 'events', message.eventId], (old: EventDto | undefined) => {
        if (!old) return old;
        return {
          ...old,
          confirmCount: message.confirmCount,
          lastConfirmedAt: message.lastConfirmedAt ?? old.lastConfirmedAt,
        };
      });
      queryClient.setQueriesData<PagedResponse<EventDto>>({ queryKey: ['admin', 'events'] }, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((e) =>
            e.id === message.eventId
              ? {
                  ...e,
                  confirmCount: message.confirmCount,
                  lastConfirmedAt: message.lastConfirmedAt ?? e.lastConfirmedAt,
                }
              : e
          ),
        };
      });
      queryClient.setQueriesData<PagedResponse<EventSummaryDto>>({ queryKey: EVENTS_QUERY_KEYS.all }, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((e) =>
            e.id === message.eventId ? { ...e, confirmCount: message.confirmCount } : e
          ),
        };
      });
    });

    const unsubReported = signalRService.onEventReported((msg) => {
      devLog.info('realtime', 'EventReported', msg);
      liveRefresh(
        queryClient,
        [['admin', 'reports'], ['admin', 'complaints'], ['admin', 'dashboard'], ['admin', 'events']],
        'EventReported'
      );
    });

    const unsubHidden = signalRService.onEventHidden((message) => {
      devLog.info('realtime', 'EventHidden', message);
      queryClient.removeQueries({ queryKey: EVENTS_QUERY_KEYS.detail(message.eventId) });
      queryClient.removeQueries({ queryKey: ['admin', 'events', message.eventId] });
      liveRefresh(
        queryClient,
        [['admin', 'events'], ['admin', 'hidden'], ['admin', 'dashboard'], EVENTS_QUERY_KEYS.all],
        'EventHidden'
      );
    });

    const unsubRestored = signalRService.onEventRestored((msg) => {
      devLog.info('realtime', 'EventRestored', msg);
      liveRefresh(
        queryClient,
        [['admin', 'events'], ['admin', 'hidden'], ['admin', 'dashboard'], EVENTS_QUERY_KEYS.all],
        'EventRestored'
      );
    });

    const unsubLocation = signalRService.onLocationApproved((msg) => {
      devLog.info('realtime', 'LocationApproved', msg);
      queryClient.invalidateQueries({
        queryKey: LOCATIONS_QUERY_KEYS.governorates,
        refetchType: 'active',
      });
      liveRefresh(queryClient, [['admin', 'locations'], ['admin', 'dashboard']], 'LocationApproved');
    });

    const unsubVerification = signalRService.onVerificationEvent((msg) => {
      devLog.info('realtime', 'VerificationEvent', msg);
      // Prefix key covers dashboard / requests / active / types / plans observers.
      liveRefresh(queryClient, [
        ['admin', 'verification'],
        ['admin', 'users'],
        ['verification', 'me'],
        ['verification', 'plans'],
      ], 'VerificationEvent', 100);
    });

    // Social - Reels Subscriptions
    const unsubReelPublished = signalRService.onReelPublished((msg) => {
      devLog.info('realtime', 'ReelPublished', msg);
      liveRefresh(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard'], ['admin', 'users']], 'ReelPublished');
    });

    const unsubReelHidden = signalRService.onReelHidden((msg) => {
      devLog.info('realtime', 'ReelHidden', msg);
      liveRefresh(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard']], 'ReelHidden');
    });

    const unsubReelRestored = signalRService.onReelRestored((msg) => {
      devLog.info('realtime', 'ReelRestored', msg);
      liveRefresh(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard']], 'ReelRestored');
    });

    const unsubReelDeleted = signalRService.onReelDeleted((msg) => {
      devLog.info('realtime', 'ReelDeleted', msg);
      liveRefresh(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard'], ['admin', 'users']], 'ReelDeleted');
    });

    const unsubReelReaction = signalRService.onReelReactionUpdated((msg) => {
      devLog.info('realtime', 'ReelReactionUpdated', msg);
      liveRefresh(queryClient, [['admin', 'reels'], ['reels']], 'ReelReactionUpdated', 100);
    });

    const unsubReelComment = signalRService.onReelCommentAdded((msg) => {
      devLog.info('realtime', 'ReelCommentAdded', msg);
      liveRefresh(queryClient, [['admin', 'reels'], ['reels']], 'ReelCommentAdded', 100);
    });

    // Social - Statuses Subscriptions
    const unsubStatusPublished = signalRService.onStatusPublished((msg) => {
      devLog.info('realtime', 'StatusPublished', msg);
      liveRefresh(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard'], ['admin', 'users']], 'StatusPublished');
    });

    const unsubStatusDeleted = signalRService.onStatusDeleted((msg) => {
      devLog.info('realtime', 'StatusDeleted', msg);
      liveRefresh(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard'], ['admin', 'users']], 'StatusDeleted');
    });

    const unsubStatusHidden = signalRService.onStatusHidden((msg) => {
      devLog.info('realtime', 'StatusHidden', msg);
      liveRefresh(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard']], 'StatusHidden');
    });

    const unsubStatusRestored = signalRService.onStatusRestored((msg) => {
      devLog.info('realtime', 'StatusRestored', msg);
      liveRefresh(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard']], 'StatusRestored');
    });

    // Social - Moderation Reports Subscriptions
    const unsubNewReelReport = signalRService.onNewReelReport((msg) => {
      devLog.info('realtime', 'NewReelReport', msg);
      liveRefresh(queryClient, [['admin', 'reports'], ['admin', 'reels'], ['admin', 'dashboard']], 'NewReelReport');
    });

    const unsubNewStatusReport = signalRService.onNewStatusReport((msg) => {
      devLog.info('realtime', 'NewStatusReport', msg);
      liveRefresh(queryClient, [['admin', 'reports'], ['admin', 'statuses'], ['admin', 'dashboard']], 'NewStatusReport');
    });

    // Social - User Lifecycle Subscriptions
    const unsubUserCreated = signalRService.onUserCreated((msg) => {
      devLog.info('realtime', 'UserCreated', msg);
      liveRefresh(
        queryClient,
        [['admin', 'users'], ['admin', 'staff'], ['admin', 'dashboard']],
        'UserCreated',
        50
      );
    });

    const unsubUserUpdated = signalRService.onUserUpdated((msg) => {
      devLog.info('realtime', 'UserUpdated', msg);
      liveRefresh(
        queryClient,
        [['admin', 'users'], ['admin', 'staff'], ['admin', 'dashboard'], ['admin', 'users', msg?.userId]],
        'UserUpdated',
        50
      );
    });

    const unsubUserDeleted = signalRService.onUserDeleted((msg) => {
      devLog.info('realtime', 'UserDeleted', msg);
      liveRefresh(
        queryClient,
        [['admin', 'users'], ['admin', 'staff'], ['admin', 'dashboard']],
        'UserDeleted',
        50
      );
    });

    let hasConnectedOnce = signalRService.getStatus() === 'connected';
    const unsubStatus = signalRService.onStatusChange((status) => {
      if (status === 'connected') {
        const wasReconnect = hasConnectedOnce;
        hasConnectedOnce = true;
        devLog.ok('realtime', `Hub status: ${status}`);
        // Catch anything missed while the hub was down / negotiating.
        if (wasReconnect) {
          liveRefresh(queryClient, [
            ['admin', 'users'],
            ['admin', 'staff'],
            ['admin', 'verification'],
            ['admin', 'reels'],
            ['admin', 'statuses'],
            ['admin', 'events'],
            ['admin', 'reports'],
            ['admin', 'dashboard'],
          ], 'HubReconnected', 100);
        }
      } else if (status === 'reconnecting') {
        devLog.warn('realtime', 'Hub status: reconnecting…');
      } else if (status === 'disconnected') {
        // Only log warning if it lost an already-established connection
        if (hasConnectedOnce) {
          devLog.warn('realtime', 'Hub status: disconnected (lost connection)');
        }
      } else if (status === 'disabled') {
        devLog.info('realtime', 'Hub status: disabled');
      } else {
        devLog.step('realtime', `Hub status: ${status}`);
      }
    });

    return () => {
      window.clearTimeout(startTimer);
      unsubCreated();
      unsubUpdated();
      unsubConfirmed();
      unsubReported();
      unsubHidden();
      unsubRestored();
      unsubLocation();
      unsubVerification();
      unsubReelPublished();
      unsubReelHidden();
      unsubReelRestored();
      unsubReelDeleted();
      unsubReelReaction();
      unsubReelComment();
      unsubStatusPublished();
      unsubStatusDeleted();
      unsubStatusHidden();
      unsubStatusRestored();
      unsubNewReelReport();
      unsubNewStatusReport();
      unsubUserCreated();
      unsubUserUpdated();
      unsubUserDeleted();
      unsubStatus();
    };
  }, [queryClient]);
}
