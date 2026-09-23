'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BackButton } from '@/components/ui/BackButton';
import { formatArabicDate } from '@/lib/utils';
import { User, Phone, Calendar, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoading, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated && !isLoading) {
    return (
      <AppLayout showSidebar={false}>
        <div className="max-w-md mx-auto my-12 bg-white dark:bg-[#162232] p-8 rounded-3xl border border-slate-200 dark:border-slate-700/60 text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full mx-auto flex items-center justify-center font-bold text-xl">
            🔒
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">يرجى تسجيل الدخول</h2>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
            للوصول إلى ملفك الشخصي وإدارة حسابك، يرجى تسجيل الدخول أولًا.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                تسجيل الدخول
              </Button>
            </Link>
            <BackButton fallbackUrl="/" label="العودة للرئيسية" variant="ghost" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-2xl mx-auto space-y-4 text-right">
        {/* Universal Back Navigation */}
        <div className="flex items-center justify-start">
          <BackButton fallbackUrl="/" label="العودة للرئيسية" variant="pill" />
        </div>

        {/* Profile Card */}
        <div className="glass-card bg-white/95 dark:bg-[#162232] rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-700/60 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-2xl border border-red-100 dark:border-red-900/40 shadow-sm">
                <User className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-28" />
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {user?.name || 'مستخدم المنصة'}
                    </h1>
                    <span className="text-xs text-slate-600 dark:text-[#94A3B8] font-mono font-medium" dir="ltr">
                      {user?.phoneNumber}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F1724] border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <Phone className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block">رقم الهاتف</span>
                <span className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9] font-mono" dir="ltr">
                  {user?.phoneNumber}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F1724] border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block">نوع الحساب والصلاحية</span>
                <span className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                  {user?.role === 'Admin' ? 'مسؤول النظام (Admin)' : 'مستخدم موثق'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F1724] border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3 sm:col-span-2">
              <Calendar className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block">تاريخ الانضمام</span>
                <span className="text-sm font-bold text-slate-900 dark:text-[#F1F5F9]">
                  {user?.createdAt ? formatArabicDate(user.createdAt) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Note on Stats */}
        <div className="bg-slate-100/90 dark:bg-[#111A26] rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-[#CBD5E1] space-y-1">
          <span className="font-bold block text-slate-900 dark:text-[#F8FAFC]">ملاحظة بشأن إحصائيات الحساب:</span>
          <p>
            يتم عرض بيانات الحساب الرسمية المسترجعة من خادم المنصة. لا يتم استخدام بيانات وهمية أو احتساب إحصائيات جزئية غير معتمدة من الـ API.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
