'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { suggestLocationSchema, SuggestLocationFormValues } from '@/validators/location';
import { useSuggestLocation, useGovernorates } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SuggestLocationPage() {
  const { isAuthenticated } = useAuth();
  const { data: governorates, isLoading: isGovLoading } = useGovernorates();
  const suggestMutation = useSuggestLocation();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuggestLocationFormValues>({
    resolver: zodResolver(suggestLocationSchema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      type: 'City',
      parentId: undefined,
    },
  });

  const onSubmit = async (values: SuggestLocationFormValues) => {
    try {
      await suggestMutation.mutateAsync(values);
      setIsSuccess(true);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout showSidebar={false}>
        <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full mx-auto flex items-center justify-center font-bold text-xl">
            🔒
          </div>
          <h2 className="text-lg font-bold text-slate-900">تسجيل الدخول مطلوب</h2>
          <p className="text-xs text-slate-500">
            يرجى تسجيل الدخول بحسابك أولًا لتتمكن من اقتراح موقع جديد للمراجعة.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                تسجيل الدخول الآن
              </Button>
            </Link>
            <BackButton fallbackUrl="/locations" label="العودة لدليل المحافظات" variant="ghost" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-xl mx-auto space-y-4 text-right">
        {/* Universal Back Navigation */}
        <div className="flex items-center justify-start">
          <BackButton fallbackUrl="/locations" label="العودة لدليل المحافظات" variant="pill" />
        </div>

        {/* Header */}
        <div className="glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
            <MapPin className="w-3.5 h-3.5" />
            <span>خريطة مصر المحلية</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            اقترح مكانًا جديدًا
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            إذا لم تجد قريتك، مدينتك أو منطقتك في القائمة، اقترح إضافتها لمراجعتها واعتمادها من الإدارة.
          </p>
        </div>

        {/* Success Banner */}
        {isSuccess ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">تم إرسال المكان للمراجعة.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                شكرًا لمساهمتك في توسيع خريطة المنصة. ستتم مراجعة الطلب واعتماده قريبًا.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsSuccess(false)}>
                اقترح مكانًا آخر
              </Button>
              <Link href="/">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة للرئيسية</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-5"
          >
            <div>
              <Input
                id="nameAr"
                label="اسم المكان بالعربية"
                placeholder="مثال: مدينة الشروق، قرية ميت برة..."
                {...register('nameAr')}
                error={errors.nameAr?.message}
              />
            </div>

            <div>
              <Input
                id="nameEn"
                label="اسم المكان بالإنجليزية (اختياري)"
                placeholder="Example: El Shorouk City"
                {...register('nameEn')}
                error={errors.nameEn?.message}
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1.5">
                نوع المكان
              </label>
              <select
                id="type"
                {...register('type')}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="City">مدينة</option>
                <option value="Center">مركز</option>
                <option value="Village">قرية</option>
                <option value="Area">حي / منطقة</option>
              </select>
              {errors.type && <p className="mt-1 text-xs text-rose-500">{errors.type.message}</p>}
            </div>

            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-slate-700 mb-1.5">
                المحافظة التابع لها
              </label>
              <select
                id="parentId"
                {...register('parentId', { valueAsNumber: true })}
                disabled={isGovLoading}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">اختر المحافظة...</option>
                {governorates?.map((gov) => (
                  <option key={gov.id} value={gov.id}>
                    {gov.nameAr}
                  </option>
                ))}
              </select>
              {errors.parentId && (
                <p className="mt-1 text-xs text-rose-500">{errors.parentId.message}</p>
              )}
            </div>

            {suggestMutation.error && (
              <p className="text-xs text-rose-500">
                {suggestMutation.error instanceof Error
                  ? suggestMutation.error.message
                  : 'فشل إرسال الاقتراح.'}
              </p>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={suggestMutation.isPending}
                className="px-8 font-bold"
              >
                إرسال الاقتراح للمراجعة
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
