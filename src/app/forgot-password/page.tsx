'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordPhoneSchema,
  verifyResetOtpSchema,
  ForgotPasswordPhoneFormValues,
  VerifyResetOtpFormValues,
  normalizePhoneNumber,
} from '@/validators/auth';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import {
  KeyRound,
  Phone,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">جاري التحميل...</div>}>
      <ForgotPasswordContent />
    </React.Suspense>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const {
    forgotPasswordSendOtp,
    isSendingForgotOtp,
    forgotPasswordVerifyOtp,
    isVerifyingForgotOtp,
  } = useAuth();

  // Step 1: Request OTP by Phone; Step 2: Verify OTP
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [timer, setTimer] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form for Step 1 (Phone)
  const phoneForm = useForm<ForgotPasswordPhoneFormValues>({
    resolver: zodResolver(forgotPasswordPhoneSchema),
    defaultValues: { phoneNumber: '' },
  });

  // Form for Step 2 (OTP)
  const otpForm = useForm<VerifyResetOtpFormValues>({
    resolver: zodResolver(verifyResetOtpSchema),
    defaultValues: { phoneNumber: '', otp: '' },
  });

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const onSendPhone = async (values: ForgotPasswordPhoneFormValues) => {
    setApiError(null);
    setSuccessNotice(null);
    try {
      const cleaned = normalizePhoneNumber(values.phoneNumber);
      setPhone(cleaned);
      await forgotPasswordSendOtp({ phoneNumber: cleaned });
      otpForm.setValue('phoneNumber', cleaned);
      setStep(2);
      setTimer(60);
      setSuccessNotice('تم إرسال رمز التحقق بنجاح إلى رقمك عبر WhatsApp / SMS.');
    } catch (err: unknown) {
      console.error('Failed to send forgot password OTP:', err);
      const msg = err instanceof Error ? err.message : 'فشل إرسال رمز التحقق. يرجى التأكد من أن الرقم مسجل لدينا.';
      setApiError(msg);
    }
  };

  const onResendOtp = async () => {
    if (timer > 0 || !phone) return;
    setApiError(null);
    try {
      await forgotPasswordSendOtp({ phoneNumber: phone });
      setTimer(60);
      setSuccessNotice('تمت إعادة إرسال رمز التحقق بنجاح.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إعادة إرسال الرمز.';
      setApiError(msg);
    }
  };

  const onVerifyOtp = async (values: VerifyResetOtpFormValues) => {
    setApiError(null);
    try {
      const cleaned = normalizePhoneNumber(phone || values.phoneNumber);
      const result = await forgotPasswordVerifyOtp({
        phoneNumber: cleaned,
        otp: values.otp.trim(),
      });

      // Navigate to reset password page with reset token
      router.push(`/reset-password?phone=${encodeURIComponent(cleaned)}&token=${encodeURIComponent(result.resetToken)}`);
    } catch (err: unknown) {
      console.error('Failed to verify forgot password OTP:', err);
      const msg = err instanceof Error ? err.message : 'رمز التحقق غير صحيح أو انتهت صلاحيته.';
      setApiError(msg);
    }
  };

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
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md shadow-orange-500/25 ring-4 ring-amber-50">
              <KeyRound className="w-8 h-8 text-white" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                استعادة كلمة المرور
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {step === 1
                  ? 'أدخل رقم هاتفك المسجل وسنرسل لك رمز تحقق آمن'
                  : `أدخل رمز التحقق المكون من 6 أرقام المرسل إلى ${phone}`}
              </p>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className={`w-8 h-2 rounded-full transition-all duration-300 ${step === 1 ? 'bg-red-600 w-12' : 'bg-emerald-500'}`} />
              <span className={`w-8 h-2 rounded-full transition-all duration-300 ${step === 2 ? 'bg-red-600 w-12' : 'bg-slate-200'}`} />
            </div>
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Step 1: Input Phone */}
          {step === 1 && (
            <form
              action="#"
              method="POST"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                phoneForm.handleSubmit(onSendPhone)(e);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف المحمول المسجل <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center" dir="ltr">
                  <span className="absolute left-3 text-sm font-bold text-slate-400 select-none">
                    +20
                  </span>
                  <input
                    type="tel"
                    placeholder="01012345678"
                    {...phoneForm.register('phoneNumber', {
                      onChange: (e) => {
                        const normalized = normalizePhoneNumber(e.target.value);
                        if (normalized !== e.target.value && normalized.length <= 11) {
                          phoneForm.setValue('phoneNumber', normalized);
                        }
                      },
                    })}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm tracking-widest text-left font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-smooth"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  أدخل رقم الهاتف المصري المرتبط بحسابك لتلقي كود الاستعادة
                </p>
                {phoneForm.formState.errors.phoneNumber && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {phoneForm.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSendingForgotOtp}
                className="w-full font-black text-sm gap-2 mt-4 shadow-md shadow-red-500/20 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
              >
                <span>{isSendingForgotOtp ? 'جاري إرسال الرمز...' : 'إرسال رمز التحقق'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Step 2: Input OTP */}
          {step === 2 && (
            <form
              action="#"
              method="POST"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                otpForm.handleSubmit(onVerifyOtp)(e);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رمز التحقق (OTP) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center" dir="ltr">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    {...otpForm.register('otp')}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-center font-mono text-xl tracking-[0.5em] font-black focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-smooth"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                >
                  تعديل رقم الهاتف
                </button>

                <button
                  type="button"
                  onClick={onResendOtp}
                  disabled={timer > 0 || isSendingForgotOtp}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 disabled:text-slate-400"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {timer > 0 ? `إعادة الإرسال بعد (${timer}ث)` : 'إعادة إرسال الرمز'}
                  </span>
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isVerifyingForgotOtp}
                className="w-full font-black text-sm gap-2 mt-4 shadow-md shadow-red-500/20 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
              >
                <span>{isVerifyingForgotOtp ? 'جاري التحقق من الرمز...' : 'تأكيد الرمز والمتابعة'}</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* Security Assurance */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>رمز التحقق صالح لمدة 15 دقيقة فقط لحماية حسابك</span>
          </div>

          {/* Footer Navigation */}
          <div className="pt-3 text-center text-xs text-slate-500 border-t border-slate-100 flex items-center justify-center gap-1.5">
            <span>تذكرت كلمة المرور؟</span>
            <Link
              href="/login"
              className="text-red-600 hover:text-red-700 font-black underline hover:no-underline"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
