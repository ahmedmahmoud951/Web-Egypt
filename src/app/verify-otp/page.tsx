'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { KeyRound, RotateCcw, MessageSquare, ShieldCheck } from 'lucide-react';

export default function VerifyOtpPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-400">جاري التحميل...</div>}>
      <VerifyOtpContent />
    </React.Suspense>
  );
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams?.get('phone') || '';

  const { verifyOtp, isVerifyingOtp, verifyOtpError, sendOtp, isSendingOtp } = useAuth();

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSendingOtp || !phone) return;
    try {
      await sendOtp({ phoneNumber: phone });
      setCountdown(60);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) return;

    try {
      await verifyOtp({
        phoneNumber: phone,
        otp: fullOtp,
      });
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-md mx-auto my-6 sm:my-12 space-y-4 text-right">
        {/* Universal Back Navigation */}
        <div className="flex items-center justify-start">
          <BackButton fallbackUrl="/login" label="تعديل رقم الهاتف" variant="pill" />
        </div>

        {/* Card Container */}
        <div className="glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg shadow-slate-100/60 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-sm shadow-red-500/10">
              <KeyRound className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">أدخل رمز التحقق</h1>
              <p className="text-xs text-slate-500 mt-1">
                تم إرسال رمز الأمان المكون من 6 أرقام إلى هاتفك
              </p>
            </div>

            {/* Target Phone & WhatsApp Delivery Tag */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs font-semibold text-emerald-900 w-full justify-center">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <MessageSquare className="w-4 h-4" />
                <span>مرسل عبر WhatsApp / SMS:</span>
              </div>
              <span className="font-mono font-black text-emerald-950 px-2 py-0.5 bg-emerald-100/80 rounded-lg text-sm" dir="ltr">
                {phone || '01xxxxxxxxx'}
              </span>
            </div>
          </div>

          <form action="#" method="POST" onSubmit={handleVerify} className="space-y-6">
            {/* 6 Digit Inputs */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5" dir="ltr">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black bg-slate-50/60 border-2 border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/15 transition-all duration-200 font-mono shadow-xs"
                />
              ))}
            </div>

            {verifyOtpError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-semibold text-center">
                {verifyOtpError instanceof Error
                  ? verifyOtpError.message
                  : 'رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى إعادة المحاولة.'}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isVerifyingOtp}
              disabled={otpDigits.join('').length !== 6}
              className="w-full font-black text-sm shadow-md shadow-red-500/20 py-3"
            >
              تأكيد الدخول
            </Button>
          </form>

          {/* Resend Section */}
          <div className="text-center text-xs space-y-2 pt-2 border-t border-slate-100">
            {countdown > 0 ? (
              <p className="text-slate-400">
                إعادة إرسال الرمز عبر WhatsApp خلال{' '}
                <span className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{countdown}</span> ثانية
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isSendingOtp}
                className="text-red-600 font-black hover:text-red-700 hover:underline inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة إرسال رمز التحقق الآن</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>جلسة موثقة ومحمية بواسطة تشفير JWT الثنائي</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

