'use client';

import { devLog } from '@/lib/devLog';

const SW_PATH = '/sw-chat.js';

export type WebPushPermission = NotificationPermission | 'unsupported';

export function getNotificationPermission(): WebPushPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Ensure service worker is registered (needed for reliable system notifications). */
export async function ensureChatServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) return existing;
    return await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
  } catch (err) {
    devLog.warn('web-push', 'Service worker registration failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Ask for browser notification permission for admin chat (Web Push via OS notifications).
 * Works with SignalR while the admin panel session is open (including background tabs).
 */
export async function enableWebChatPush(): Promise<{
  permission: WebPushPermission;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { permission: 'unsupported' };
  }

  await ensureChatServiceWorker();

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    devLog.ok('web-push', 'Browser notifications enabled for admin chat');
  } else {
    devLog.warn('web-push', 'Browser notifications not granted', { permission });
  }

  return { permission };
}

/** Show an OS notification for an incoming chat message. */
export async function showChatMessageNotification(opts: {
  title: string;
  body: string;
  conversationId?: string;
  tag?: string;
  force?: boolean;
}): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!opts.force && typeof document !== 'undefined' && !document.hidden) return;

  const title = opts.title || 'رسالة جديدة';
  const body = opts.body || 'وصلك رسالة جديدة في الشات';
  const tag = opts.tag || opts.conversationId || 'tie-chat';
  const url = opts.conversationId ? `/admin/chat?c=${opts.conversationId}` : '/admin/chat';

  try {
    const reg = await ensureChatServiceWorker();
    if (reg?.showNotification) {
      await reg.showNotification(title, {
        body,
        tag,
        renotify: true,
        icon: '/favicon.ico',
        data: { url, conversationId: opts.conversationId },
      } as NotificationOptions);
      return;
    }
  } catch {
    // fall through
  }

  try {
    const n = new Notification(title, {
      body,
      tag,
      icon: '/favicon.ico',
    });
    n.onclick = () => {
      window.focus();
      window.location.href = url;
      n.close();
    };
  } catch (err) {
    devLog.warn('web-push', 'Notification show failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
