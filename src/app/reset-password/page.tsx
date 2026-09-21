'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordFormValues } from '@/validators/auth';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">جاري التحميل...</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams?.get('phone') || '';
  const resetToken = searchParams?.get('token') || '';

  const { resetPassword, isResettingPassword } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('newPassword');

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) || /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(passwordValue || '');

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!phone || !resetToken) {
      setApiError('رابط إعادة التعيين غير صالح أو تنقصه بيانات. يرجى إعادة المحاولة من صفحة نسيت كلمة المرور.');
      return;
    }

    setApiError(null);
    try {
      await resetPassword({
        phoneNumber: phone,
        resetToken: resetToken,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      console.error('Password reset failed:', err);
      const msg = err instanceof Error ? err.message : 'فشل تغيير كلمة المرور. قد يكون رمز الاستعادة انتهت صلاحيته.';
      setApiError(msg);
    }
  };

  if (!phone || !resetToken) {
    return (
      <AppLayout showSidebar={false}>
        <div className="max-w-md mx-auto my-12 text-center space-y-4">
          <div className="glass-card bg-white/95 rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">رابط إعادة التعيين غير صالح</h1>
            <p className="text-sm text-slate-500">
              لم يتم العثور على رمز الاستعادة أو رقم الهاتف المطلوبين لإكمال العملية.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-colors"
            >
              طلب رمز استعادة جديد
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-md mx-auto my-6 sm:my-12 space-y-4 text-right">
        {/* Universal Back Button */}
        <div className="flex items-center justify-start">
          <BackButton fallbackUrl="/login" label="العودة لتسجيل الدخول" variant="pill" />
        </div>

        {/* Card */}
        <div className="glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-100/60 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-emerald-500/25 ring-4 ring-emerald-50">
              <Lock className="w-8 h-8 text-white" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                إنشاء كلمة مرور جديدة
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                لحسابك المرتبط بالرقم <span className="font-mono font-bold text-slate-700" dir="ltr">{phone}</span>
              </p>
            </div>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-900">
                  تم تغيير كلمة المرور بنجاح!
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول إلى حسابك.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/login')}
                className="w-full font-black text-sm py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                الانتقال إلى تسجيل الدخول
              </Button>
            </div>
          ) : (
            <form
              action="#"
              method="POST"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-4"
            >
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الجديدة <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    placeholder="••••••••"
                    {...register('newPassword')}
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-smooth"
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
                {errors.newPassword && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تأكيد كلمة المرور الجديدة <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    dir="ltr"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-smooth"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Strength Indicator */}
              {passwordValue && (
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>قوة كلمة المرور:</span>
                    <span
                      className={
                        strength <= 2
                          ? 'text-rose-500'
                          : strength <= 3
                          ? 'text-amber-500'
                          : 'text-emerald-600 font-bold'
                      }
                    >
                      {strength <= 2 ? 'ضعيفة' : strength <= 3 ? 'متوسطة' : 'قوية وممتازة'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex gap-0.5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength >= 1 ? (strength <= 2 ? 'bg-rose-500' : strength <= 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'
                      } w-1/4`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength >= 2 ? (strength <= 2 ? 'bg-rose-500' : strength <= 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'
                      } w-1/4`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength >= 3 ? (strength <= 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-transparent'
                      } w-1/4`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength >= 4 ? 'bg-emerald-500' : 'bg-transparent'
                      } w-1/4`}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {apiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isResettingPassword}
                className="w-full font-black text-sm gap-2 mt-4 shadow-md shadow-emerald-600/20 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <span>{isResettingPassword ? 'جاري حفظ كلمة المرور...' : 'حفظ كلمة المرور الجديدة'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Security Assurance */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>يتم تشفير كلمة المرور فوراً باستخدام PBKDF2 و 100 ألف تكرار</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
