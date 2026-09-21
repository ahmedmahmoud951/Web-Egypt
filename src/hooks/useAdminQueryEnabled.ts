'use client';

import { useAuth } from '@/hooks/useAuth';

/** Gate admin data queries until auth is ready — avoids double-fetch + cancel storms. */
export function useAdminQueryEnabled() {
  const { authReady, isAuthenticated, isAdmin, isLoading } = useAuth();
  return authReady && isAuthenticated && isAdmin && !isLoading;
}
