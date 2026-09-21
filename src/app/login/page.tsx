'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginWithPasswordSchema,
  phoneSchema,
  LoginWithPasswordFormValues,
  PhoneFormValues,
  normalizePhoneNumber,
} from '@/validators/auth';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import {
  Phone,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">جاري التحميل...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}

function LoginContent() {
  const router = useRouter();

  // Mode: 'password' (default) or 'otp' (quick login)
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { loginWithPassword, isLoggingIn, sendOtp, isSendingOtp } = useAuth();

  // Password Login Form
  const passwordForm = useForm<LoginWithPasswordFormValues>({
    resolver: zodResolver(loginWithPasswordSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // OTP Login Form
  const otpPhoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  const onPasswordSubmit = async (values: LoginWithPasswordFormValues) => {
    setApiError(null);
    try {
      await loginWithPassword({
        username: values.username.trim(),
        password: values.password,
      });
      router.push('/');
    } catch (err: unknown) {
      console.error('Password login failed:', err);
      const msg = err instanceof Error ? err.message : 'اسم المستخدم أو كلمة المرور غير صحيحة.';
      setApiError(msg);
    }
  };

  const onOtpPhoneSubmit = async (values: PhoneFormValues) => {
    setApiError(null);
    try {
      const cleaned = normalizePhoneNumber(values.phoneNumber);
      await sendOtp({ phoneNumber: cleaned });
      router.push(`/verify-otp?phone=${encodeURIComponent(cleaned)}`);
    } catch (err: unknown) {
      console.error('Failed to send OTP:', err);
      const msg = err instanceof Error ? err.message : 'فشل إرسال رمز التحقق. يرجى المحاولة بعد قليل.';
      setApiError(msg);
    }
  };

  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-md mx-auto my-6 sm:my-12 space-y-4 text-right">
        {/* Universal Back Button */}
        <div className="flex items-center justify-start">
          <BackButton fallbackUrl="/" label="العودة للرئيسية" variant="pill" />
        </div>

        {/* Login Glass Card */}
        <div className="glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-100/60 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-md shadow-red-500/25 ring-4 ring-red-50">
              🇪🇬
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                تسجيل الدخول
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                منصة توثيق ومتابعة أحداث محافظات مصر لحظة بلحظة
              </p>
            </div>

            {/* Login Mode Toggle Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-bold w-full">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('password');
                  setApiError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === 'password'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>اسم المستخدم وكلمة المرور</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('otp');
                  setApiError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === 'otp'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>كود التحقق (WhatsApp)</span>
              </button>
            </div>
          </div>

          {/* API Error Notification */}
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-bold text-right flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* MODE 1: Username & Password Login */}
          {loginMode === 'password' && (
            <form
              action="#"
              method="POST"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                passwordForm.handleSubmit(onPasswordSubmit)(e);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم المستخدم أو البريد الإلكتروني <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="username أو البريد أو الهاتف"
                    {...passwordForm.register('username')}
                    className="w-full pl-3 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm text-left font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-smooth"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                {passwordForm.formState.errors.username && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {passwordForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    كلمة المرور <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    placeholder="••••••••"
                    {...passwordForm.register('password')}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm text-left focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-smooth"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoggingIn}
                className="w-full font-black text-sm gap-2 mt-2 shadow-md shadow-red-500/15 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
              >
                <span>{isLoggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* MODE 2: Phone OTP Fast Login */}
          {loginMode === 'otp' && (
            <form
              action="#"
              method="POST"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                otpPhoneForm.handleSubmit(onOtpPhoneSubmit)(e);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف المحمول (مصر) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center" dir="ltr">
                  <span className="absolute left-3 text-sm font-bold text-slate-400 select-none">
                    +20
                  </span>
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="01012345678"
                    {...otpPhoneForm.register('phoneNumber', {
                      onChange: (e) => {
                        const normalized = normalizePhoneNumber(e.target.value);
                        if (normalized !== e.target.value && normalized.length <= 11) {
                          otpPhoneForm.setValue('phoneNumber', normalized);
                        }
                      },
                    })}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm tracking-widest text-left font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-xs transition-smooth"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-right">
                  يقبل جميع الشبكات المصرية: فودافون، أورنج، اتصالات، وي
                </p>
                {otpPhoneForm.formState.errors.phoneNumber && (
                  <p className="mt-1.5 text-xs text-rose-500 text-right font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{otpPhoneForm.formState.errors.phoneNumber.message}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSendingOtp}
                className="w-full font-black text-sm gap-2 mt-2 shadow-md shadow-emerald-500/15 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <span>{isSendingOtp ? 'جاري إرسال الرمز...' : 'إرسال رمز التحقق (OTP)'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Register Prompt Link */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block">ليس لديك حساب بعد؟</span>
              <span className="text-slate-500 text-[11px]">سجل حسابك المجاني في دقيقة واحدة</span>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب</span>
            </Link>
          </div>

          {/* Security Assurance */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>تسجيل آمن ومشفر بأحدث معايير الأمان العالمية</span>
          </div>

          <div className="pt-3 text-center text-xs text-slate-400 border-t border-slate-100">
            بتسجيل الدخول، فإنك توافق على{' '}
            <Link href="/terms" className="text-slate-700 hover:text-red-600 font-semibold underline">
              شروط الاستخدام
            </Link>{' '}
            و{' '}
            <Link href="/privacy" className="text-slate-700 hover:text-red-600 font-semibold underline">
              سياسة الخصوصية
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
