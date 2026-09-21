'use client';

import { useEffect, useState } from 'react';
import { signalRService, SignalRConnectionStatus } from '@/lib/signalr';
import { Radio } from 'lucide-react';

const labels: Record<SignalRConnectionStatus, string> = {
  connected: 'بث لحظي متصل',
  connecting: 'جاري الاتصال...',
  reconnecting: 'إعادة الاتصال...',
  disconnected: 'غير متصل',
  disabled: 'البث متوقف',
};

export function LiveStatusBadge() {
  const [status, setStatus] = useState<SignalRConnectionStatus>(signalRService.getStatus());

  useEffect(() => signalRService.onStatusChange(setStatus), []);

  return (
    <span className="admin-live-pill" data-state={status} title="حالة اتصال SignalR Hub">
      <span className="admin-live-dot" />
      <Radio className="w-3 h-3" />
      {labels[status]}
    </span>
  );
}
