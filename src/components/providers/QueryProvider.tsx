'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useSignalRSubscriptions } from '@/hooks/useSignalR';
import { FlashProvider } from '@/components/ui/FlashProvider';

function SignalRListener() {
  useSignalRSubscriptions();
  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <FlashProvider>
        <SignalRListener />
        {children}
      </FlashProvider>
    </QueryClientProvider>
  );
}
