'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, CreateEventFormValues } from '@/validators/event';
import { useCreateEvent } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import { useGovernorates, useLocationChildren } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import { uploadMediaDirectToB2, logUploadToDevServer } from '@/lib/mediaUpload';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { Upload, X, MapPin, Plus, Sparkles, AlertCircle, Film, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: governorates, isLoading: isGovLoading } = useGovernorates();

  const [selectedGovId, setSelectedGovId] = useState<number | undefined>(undefined);
  const { data: childrenLocations } = useLocationChildren(selectedGovId);

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'Image' | 'Video' | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);

  const createEventMutation = useCreateEvent();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: 0,
      locationId: 0,
      imageUrl: null,
      mediaIds: [],
    },
  });

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setMediaError('نوع الملف غير مدعوم. يرجى اختيار صورة أو فيديو.');
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      setMediaError('حجم الصورة يجب ألا يتجاوز 10 ميجابايت.');
      return;
    }

    if (isVideo && file.size > 500 * 1024 * 1024) {
      setMediaError('حجم الفيديو يجب ألا يتجاوز 500 ميجابايت.');
      return;
    }

    setMediaError(null);
    setUploadingMedia(true);
    setUploadProgress(0);

    try {
      const result = await uploadMediaDirectToB2(
        file,
        'Event',
        'draft-new-event',
        (percent) => setUploadProgress(percent)
      );

      setMediaPreview(result.url);
      setMediaType(result.mediaType as 'Image' | 'Video');
      setValue('imageUrl', result.url);

      if (result.mediaId) {
        setUploadedMediaId(result.mediaId);
        setValue('mediaIds', [result.mediaId]);
      }
    } catch (err: unknown) {
      setMediaError(err instanceof Error ? err.message : 'فشل رفع الملف إلى سحابة التخزين.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = () => {
    setValue('imageUrl', null);
    setValue('mediaIds', []);
    setMediaPreview(null);
    setMediaType(null);
    setUploadedMediaId(null);
    setMediaError(null);
    setUploadProgress(0);
  };

  const onSubmit = async (values: CreateEventFormValues) => {
    try {
      const payload = {
        ...values,
        mediaIds: uploadedMediaId ? [uploadedMediaId] : values.mediaIds,
      };

      await logUploadToDevServer(
        'info',
        `📝 [EVENT SUBMIT] Submitting Event Form with payload:\n` +
        `   • Title: "${payload.title}"\n` +
        `   • ImageUrl: ${payload.imageUrl || 'null'}\n` +
        `   • MediaIds: [${(payload.mediaIds || []).join(', ')}]`
      );

      const newEvent = await createEventMutation.mutateAsync(payload);

      await logUploadToDevServer(
        'success',
        `🎉 [EVENT CREATED] Event successfully saved in database!\n` +
        `   • Event ID: ${newEvent.id}\n` +
        `   • Stored ImageUrl: ${newEvent.imageUrl || 'none'}`
      );

      router.push(`/events/${newEvent.id}`);
    } catch (err) {
      await logUploadToDevServer('error', '❌ Failed to create event', err);
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
            يرجى تسجيل الدخول برقم هاتفك أولًا لتتمكن من نشر وتوثيق حدث جديد.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="block">
              <Button variant="primary" className="w-full">
                تسجيل الدخول الآن
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
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Universal Back Navigation */}
        <div className="flex items-center justify-start">
          <BackButton fallbackUrl="/" label="العودة للأحداث" variant="pill" />
        </div>

        {/* Page Header */}
        <div className="glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-right space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>توثيق ونشر فوري</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            أضف حدثًا أو خبرًا محليًا
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            شارك ما يحدث في منطقتك بكل شفافية ليتمكن أهالي محافظتك من الاطلاع عليه وتأكيده فورياً.
          </p>
        </div>

        {/* Create Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6 text-right"
        >
          {/* Title */}
          <div>
            <Input
              id="title"
              label="عنوان الحدث"
              placeholder="اكتب عنوانًا موجزًا ومحددًا للحدث..."
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              تفاصيل ووصف الحدث
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="اشرح ما حدث بدقة، الوقت، والمعالم القريبة..."
              {...register('description')}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1.5">
              التصنيف
            </label>
            <select
              id="categoryId"
              {...register('categoryId', { valueAsNumber: true })}
              disabled={isCatLoading}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="0">اختر التصنيف المناسب...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr} ({c.nameEn})
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-500">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Location Cascading Selection */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>موقع الحدث</span>
              </span>
              <Link
                href="/locations/suggest"
                className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>اقترح مكانًا جديدًا</span>
              </Link>
            </div>

            {/* Step 1: Governorate */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                المحافظة
              </label>
              <select
                disabled={isGovLoading}
                value={selectedGovId ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setSelectedGovId(val);
                  if (val) {
                    setValue('locationId', val);
                  }
                }}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">اختر المحافظة...</option>
                {governorates?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: City / Center (if available) */}
            {selectedGovId && childrenLocations && childrenLocations.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  المدينة أو المركز (اختياري لتحديد أدق)
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setValue('locationId', Number(e.target.value));
                    } else if (selectedGovId) {
                      setValue('locationId', selectedGovId);
                    }
                  }}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="">المحافظة بالكامل</option>
                  {childrenLocations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {errors.locationId && (
              <p className="text-xs text-rose-500">{errors.locationId.message}</p>
            )}

            <p className="text-[11px] text-slate-400">
              مش لاقي المكان؟{' '}
              <Link href="/locations/suggest" className="text-red-600 font-bold hover:underline">
                [+ اقترح مكان جديد للمراجعة]
              </Link>
            </p>
          </div>

          {/* Media Upload (Images & Videos via Backblaze B2 Direct Pre-Signed Upload) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                وسائط توثيقية: صورة أو فيديو (اختياري)
              </label>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                Backblaze B2 Cloud Storage ⚡
              </span>
            </div>

            {mediaPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[200px] max-h-80">
                {mediaType === 'Video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    playsInline
                    className="w-full max-h-80 rounded-2xl object-contain bg-black"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreview}
                    alt="معاينة الوسائط"
                    className="w-full h-full object-cover max-h-80"
                  />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-3 left-3 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition shadow-md z-10"
                  title="حذف الوسائط"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : uploadingMedia ? (
              <div className="p-6 border-2 border-dashed border-red-200 bg-red-50/40 rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-sm">
                  <Upload className="w-5 h-5 animate-bounce" />
                  <span>جاري رفع الوسائط مباشرة إلى السحابة...</span>
                </div>
                <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-red-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  تم رفع {uploadProgress}% مباشرة إلى Backblaze B2
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition text-center group">
                <div className="flex items-center justify-center gap-3 mb-2 text-slate-400 group-hover:text-red-600 transition">
                  <ImageIcon className="w-6 h-6" />
                  <Film className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-red-700 transition">
                  انقر لاختيار صورة أو مقطع فيديو من جهازك
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  صور (JPG, PNG, WebP حتى 10MB) أو فيديو (MP4, WebM, QuickTime حتى 500MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleMediaChange}
                  disabled={uploadingMedia}
                  className="hidden"
                />
              </label>
            )}
            {mediaError && <p className="mt-1 text-xs text-rose-500 font-medium">{mediaError}</p>}
          </div>

          {createEventMutation.error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {createEventMutation.error instanceof Error
                  ? createEventMutation.error.message
                  : 'فشل نشر الحدث.'}
              </span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={createEventMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createEventMutation.isPending}
              className="px-8 font-bold"
            >
              نشر الحدث الآن
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
