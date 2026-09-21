'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginWithPasswordSchema,
  LoginWithPasswordFormValues,
} from '@/validators/auth';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { EgyptFlagMark } from '@/components/brand/EgyptFlagMark';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { devLog } from '@/lib/devLog';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen admin-canvas flex flex-col items-center justify-center gap-3 text-[#2A6B78] font-bold">
          <BrandLogo size={72} priority />
          جاري التحميل...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = searchParams.get('denied') === '1';
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { loginWithPassword, isLoggingIn, isAuthenticated, isAdmin, isLoading, logout } = useAuth();

  const form = useForm<LoginWithPasswordFormValues>({
    resolver: zodResolver(loginWithPasswordSchema),
    defaultValues: { username: '', password: '' },
  });

  React.useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && isAdmin) {
      devLog.ok('login', 'Already admin — redirect /admin');
      router.replace('/admin');
      return;
    }
    if (isAuthenticated && !isAdmin) {
      devLog.warn('login', 'Authenticated but not admin — logout');
      logout();
    }
  }, [isLoading, isAuthenticated, isAdmin, router, logout]);

  const onSubmit = async (values: LoginWithPasswordFormValues) => {
    setApiError(null);
    devLog.step('login', 'Submit login form', { username: values.username.trim() });
    try {
      const result = await loginWithPassword({
        username: values.username.trim(),
        password: values.password,
      });
      if (result.user.role !== 'Admin') {
        logout();
        setApiError('هذه اللوحة مخصصة للمسؤولين فقط. استخدم تطبيق الموبايل للمستخدمين.');
        devLog.warn('login', 'Rejected non-admin user', { role: result.user.role });
        return;
      }
      devLog.ok('login', 'Admin login OK → /admin');
      router.push('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول.';
      setApiError(msg);
      devLog.error('login', 'Login error', msg);
    }
  };

  return (
    <div className="min-h-screen admin-canvas flex items-center justify-center p-4 relative" dir="rtl">
      <div className="admin-flag-stripe absolute top-0 inset-x-0 z-10" />

      <div className="w-full max-w-[420px] admin-card rounded-3xl p-8 md:p-9 space-y-6 relative z-10">
        {/* Official logo — hero */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size={112} priority className="rounded-[1.35rem]" />
          </div>
          <div className="flex justify-center">
            <EgyptFlagMark className="w-16 h-10" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-black text-[#152238] tracking-tight leading-tight">
              النهارده في مصر
            </h1>
            <p className="text-sm font-bold text-[#2A6B78] mt-1.5">مركز تحكم الأدمن</p>
            <p className="text-[13px] text-[#5B6B7C] leading-relaxed mt-2 max-w-sm mx-auto">
              دخول المسؤولين فقط. تسجيل المستخدمين العاديين يتم عبر تطبيق الموبايل.
            </p>
          </div>
        </div>

        {(denied || apiError) && (
          <FlashBanner tone="error" title="تعذر الدخول">
            {apiError || 'ليس لديك صلاحية أدمن للدخول إلى هذه اللوحة.'}
          </FlashBanner>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1A2433] mb-1.5">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2A6B78]" />
              <input
                {...form.register('username')}
                className="admin-input pr-10 pl-3 py-2.5"
                placeholder="username"
                dir="ltr"
                autoComplete="username"
              />
            </div>
            {form.formState.errors.username && (
              <p className="text-xs text-[#A11D2E] mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1A2433] mb-1.5">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2A6B78]" />
              <input
                {...form.register('password')}
                type={showPassword ? 'text' : 'password'}
                className="admin-input pr-10 pl-10 py-2.5"
                placeholder="••••••••"
                dir="ltr"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6B7C]"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-xs text-[#A11D2E] mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="btn-glow btn-glow-primary w-full h-11 text-sm"
          >
            {isLoggingIn ? 'جاري الدخول...' : 'دخول لوحة التحكم'}
          </button>
        </form>
      </div>
    </div>
  );
}
