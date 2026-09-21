'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { storage } from '@/lib/storage';
import { devLog } from '@/lib/devLog';
import {
  AuthResponseDto,
  ForgotPasswordRequest,
  LoginWithPasswordRequest,
  RegisterRequest,
  ResetPasswordRequest,
  ResetTokenResponseDto,
  SendOtpRequest,
  UserDto,
  VerifyOtpRequest,
  VerifyResetOtpRequest,
} from '@/types/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const AUTH_QUERY_KEY = ['auth', 'me'];

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const t = storage.getToken();
    setToken(t);
    setAuthReady(true);
    devLog.step('auth', 'Hydrated token from localStorage', { hasToken: !!t });
  }, []);

  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
    error: userError,
    isError: isUserError,
  } = useQuery<UserDto>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      devLog.step('auth', 'Fetching /auth/me');
      const me = await authApi.me();
      devLog.ok('auth', 'Got /auth/me', {
        id: me.id,
        name: me.name,
        role: me.role,
        isSuperAdmin: me.isSuperAdmin,
        isBlocked: me.isBlocked,
      });
      return me;
    },
    enabled: authReady && !!token,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!authReady || !token || !isUserError) return;
    const msg = ((userError as Error)?.message || '').toLowerCase();
    // Only drop session on real auth failures — not proxy/network blips
    const isAuthFailure =
      msg.includes('unauthorized') ||
      msg.includes('تسجيل الدخول') ||
      msg.includes('401') ||
      msg.includes('محظور') ||
      msg.includes('إيقاف');
    if (!isAuthFailure) {
      devLog.warn('auth', '/auth/me failed (keeping token)', {
        message: (userError as Error)?.message,
      });
      return;
    }
    devLog.warn('auth', 'Invalid token — clearing session', {
      message: (userError as Error)?.message,
    });
    storage.clearToken();
    setToken(null);
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
  }, [authReady, token, isUserError, userError, queryClient]);

  const handleAuthSuccess = (data: AuthResponseDto) => {
    storage.setToken(data.token);
    setToken(data.token);
    queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    devLog.ok('auth', 'Login/register success', {
      name: data.user.name,
      role: data.user.role,
      isSuperAdmin: data.user.isSuperAdmin,
      isNewUser: data.isNewUser,
    });
  };

  const sendOtpMutation = useMutation({
    mutationFn: (data: SendOtpRequest) => authApi.sendOtp(data),
  });

  const sendRegistrationOtpMutation = useMutation({
    mutationFn: (data: SendOtpRequest) => authApi.sendRegistrationOtp(data),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: VerifyOtpRequest) => authApi.verifyOtp(data),
    onSuccess: handleAuthSuccess,
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: handleAuthSuccess,
  });

  const loginWithPasswordMutation = useMutation({
    mutationFn: async (data: LoginWithPasswordRequest) => {
      devLog.step('auth', 'Login with password', { username: data.username });
      return authApi.loginWithPassword(data);
    },
    onSuccess: handleAuthSuccess,
    onError: (err: Error) => {
      devLog.error('auth', 'Login failed', err.message);
    },
  });

  const forgotPasswordSendOtpMutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPasswordSendOtp(data),
  });

  const forgotPasswordVerifyOtpMutation = useMutation({
    mutationFn: (data: VerifyResetOtpRequest) => authApi.forgotPasswordVerifyOtp(data),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
  });

  const logout = useCallback(() => {
    devLog.step('auth', 'Logout');
    storage.clearToken();
    setToken(null);
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
    router.replace('/admin/login');
  }, [queryClient, router]);

  const isLoading =
    !authReady || (!!token && (isUserLoading || (isUserFetching && !user)));

  const isAuthenticated = authReady && !!token && !!user;
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    if (!authReady || isLoading) return;
    devLog.info('auth', 'Auth state', {
      isAuthenticated,
      isAdmin,
      isSuperAdmin: !!user?.isSuperAdmin,
      userName: user?.name ?? null,
    });
    // intentionally omit noisy fields that change often
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoading, isAuthenticated, isAdmin, user?.id]);

  return {
    user: user ?? null,
    isAuthenticated,
    isAdmin,
    isSuperAdmin: !!user?.isSuperAdmin,
    isLoading,
    authReady,
    userError,
    sendOtp: sendOtpMutation.mutateAsync,
    isSendingOtp: sendOtpMutation.isPending,
    sendOtpError: sendOtpMutation.error,
    sendRegistrationOtp: sendRegistrationOtpMutation.mutateAsync,
    isSendingRegistrationOtp: sendRegistrationOtpMutation.isPending,
    verifyOtp: verifyOtpMutation.mutateAsync,
    isVerifyingOtp: verifyOtpMutation.isPending,
    verifyOtpError: verifyOtpMutation.error,
    registerUser: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    loginWithPassword: loginWithPasswordMutation.mutateAsync,
    isLoggingIn: loginWithPasswordMutation.isPending,
    loginError: loginWithPasswordMutation.error,
    forgotPasswordSendOtp: forgotPasswordSendOtpMutation.mutateAsync,
    isSendingForgotOtp: forgotPasswordSendOtpMutation.isPending,
    forgotPasswordVerifyOtp: forgotPasswordVerifyOtpMutation.mutateAsync,
    isVerifyingForgotOtp: forgotPasswordVerifyOtpMutation.isPending,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
    logout,
  };
}
