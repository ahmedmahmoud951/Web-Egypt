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
 * Soft refresh: only active observers, debounced.
 * Avoids stacking 7+ full admin refetches on every hub ping (kills free hosting).
 */
function softInvalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  keys: readonly (readonly unknown[])[],
  reason: string,
  delayMs = 1200
) {
  const timerKey = `__sr_${keys.map((k) => k.join('.')).join('|')}`;
  const w = window as unknown as Record<string, ReturnType<typeof setTimeout> | undefined>;
  if (w[timerKey]) clearTimeout(w[timerKey]);
  w[timerKey] = setTimeout(() => {
    w[timerKey] = undefined;
    devLog.step('realtime', `Soft invalidate ← ${reason}`, { keys: keys.map((k) => k.join('/')) });
    for (const queryKey of keys) {
      queryClient.invalidateQueries({ queryKey: [...queryKey], refetchType: 'active' });
    }
  }, delayMs);
}

export function useSignalRSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect quickly after initial render; connect immediately if already active
    const delay = signalRService.getStatus() === 'connected' ? 0 : 1000;
    const startTimer = window.setTimeout(() => {
      devLog.step('realtime', 'Starting SignalR subscriptions');
      signalRService.start();
    }, delay);

    const unsubCreated = signalRService.onEventCreated((msg) => {
      devLog.info('realtime', 'EventCreated', msg);
      softInvalidate(queryClient, [['admin', 'events'], ['admin', 'dashboard'], EVENTS_QUERY_KEYS.all], 'EventCreated');
    });

    const unsubUpdated = signalRService.onEventUpdated((msg) => {
      devLog.info('realtime', 'EventUpdated', msg);
      softInvalidate(queryClient, [['admin', 'events'], EVENTS_QUERY_KEYS.all], 'EventUpdated');
      if (msg?.eventId) {
        softInvalidate(queryClient, [['admin', 'events', msg.eventId]], 'EventUpdated.detail', 400);
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
      softInvalidate(
        queryClient,
        [['admin', 'reports'], ['admin', 'complaints'], ['admin', 'dashboard']],
        'EventReported'
      );
    });

    const unsubHidden = signalRService.onEventHidden((message) => {
      devLog.info('realtime', 'EventHidden', message);
      queryClient.removeQueries({ queryKey: EVENTS_QUERY_KEYS.detail(message.eventId) });
      queryClient.removeQueries({ queryKey: ['admin', 'events', message.eventId] });
      softInvalidate(
        queryClient,
        [['admin', 'events'], ['admin', 'hidden'], ['admin', 'dashboard'], EVENTS_QUERY_KEYS.all],
        'EventHidden'
      );
    });

    const unsubRestored = signalRService.onEventRestored((msg) => {
      devLog.info('realtime', 'EventRestored', msg);
      softInvalidate(
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
      softInvalidate(queryClient, [['admin', 'locations'], ['admin', 'dashboard']], 'LocationApproved');
    });

    const unsubVerification = signalRService.onVerificationEvent((msg) => {
      devLog.info('realtime', 'VerificationEvent', msg);
      // Prefix key covers dashboard / requests / active / types / plans observers.
      softInvalidate(queryClient, [
        ['admin', 'verification'],
        ['verification', 'me'],
        ['verification', 'plans'],
      ], 'VerificationEvent', 100);
    });

    // Social - Reels Subscriptions
    const unsubReelPublished = signalRService.onReelPublished((msg) => {
      devLog.info('realtime', 'ReelPublished', msg);
      softInvalidate(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard']], 'ReelPublished');
    });

    const unsubReelHidden = signalRService.onReelHidden((msg) => {
      devLog.info('realtime', 'ReelHidden', msg);
      softInvalidate(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard']], 'ReelHidden');
    });

    const unsubReelRestored = signalRService.onReelRestored((msg) => {
      devLog.info('realtime', 'ReelRestored', msg);
      softInvalidate(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard']], 'ReelRestored');
    });

    const unsubReelDeleted = signalRService.onReelDeleted((msg) => {
      devLog.info('realtime', 'ReelDeleted', msg);
      softInvalidate(queryClient, [['admin', 'reels'], ['reels'], ['admin', 'dashboard']], 'ReelDeleted');
    });

    const unsubReelReaction = signalRService.onReelReactionUpdated((msg) => {
      devLog.info('realtime', 'ReelReactionUpdated', msg);
      softInvalidate(queryClient, [['admin', 'reels'], ['reels']], 'ReelReactionUpdated', 600);
    });

    const unsubReelComment = signalRService.onReelCommentAdded((msg) => {
      devLog.info('realtime', 'ReelCommentAdded', msg);
      softInvalidate(queryClient, [['admin', 'reels'], ['reels']], 'ReelCommentAdded', 600);
    });

    // Social - Statuses Subscriptions
    const unsubStatusPublished = signalRService.onStatusPublished((msg) => {
      devLog.info('realtime', 'StatusPublished', msg);
      softInvalidate(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard']], 'StatusPublished');
    });

    const unsubStatusDeleted = signalRService.onStatusDeleted((msg) => {
      devLog.info('realtime', 'StatusDeleted', msg);
      softInvalidate(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard']], 'StatusDeleted');
    });

    const unsubStatusHidden = signalRService.onStatusHidden((msg) => {
      devLog.info('realtime', 'StatusHidden', msg);
      softInvalidate(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard']], 'StatusHidden');
    });

    const unsubStatusRestored = signalRService.onStatusRestored((msg) => {
      devLog.info('realtime', 'StatusRestored', msg);
      softInvalidate(queryClient, [['admin', 'statuses'], ['statuses'], ['admin', 'dashboard']], 'StatusRestored');
    });

    // Social - Moderation Reports Subscriptions
    const unsubNewReelReport = signalRService.onNewReelReport((msg) => {
      devLog.info('realtime', 'NewReelReport', msg);
      softInvalidate(queryClient, [['admin', 'reports'], ['admin', 'reels'], ['admin', 'dashboard']], 'NewReelReport');
    });

    const unsubNewStatusReport = signalRService.onNewStatusReport((msg) => {
      devLog.info('realtime', 'NewStatusReport', msg);
      softInvalidate(queryClient, [['admin', 'reports'], ['admin', 'statuses'], ['admin', 'dashboard']], 'NewStatusReport');
    });

    let hasConnectedOnce = signalRService.getStatus() === 'connected';
    const unsubStatus = signalRService.onStatusChange((status) => {
      if (status === 'connected') {
        const wasReconnect = hasConnectedOnce;
        hasConnectedOnce = true;
        devLog.ok('realtime', `Hub status: ${status}`);
        // Catch anything missed while the hub was down / negotiating.
        if (wasReconnect) {
          softInvalidate(queryClient, [['admin', 'verification'], ['admin', 'reels'], ['admin', 'statuses']], 'HubReconnected', 200);
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
      unsubStatus();
    };
  }, [queryClient]);
}
