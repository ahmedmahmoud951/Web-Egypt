'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, CreateEventFormValues } from '@/validators/event';
import { useEvent, useUpdateEvent } from '@/hooks/useEvents';
import { useCategories } from '@/hooks/useCategories';
import { useGovernorates, useLocationChildren } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import { uploadMediaDirectToB2 } from '@/lib/mediaUpload';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { Upload, X, MapPin, Plus, AlertCircle, Film, Image as ImageIcon, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: governorates, isLoading: isGovLoading } = useGovernorates();

  const [selectedGovId, setSelectedGovId] = useState<number | undefined>(undefined);
  const { data: childrenLocations } = useLocationChildren(selectedGovId);

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'Image' | 'Video' | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const updateMutation = useUpdateEvent(eventId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
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

  useEffect(() => {
    if (!event || hydrated) return;

    reset({
      title: event.title,
      description: event.description,
      categoryId: event.categoryId,
      locationId: event.locationId,
      imageUrl: event.imageUrl,
      mediaIds: event.media?.map((m) => m.id) ?? [],
    });

    setSelectedGovId(event.locationId);
    if (event.imageUrl) {
      setMediaPreview(event.imageUrl);
      const isVid =
        /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(event.imageUrl) || event.imageUrl.includes('/videos/');
      setMediaType(isVid ? 'Video' : 'Image');
    }
    setHydrated(true);
  }, [event, hydrated, reset]);

  const isOwner = !!user && !!event && user.id === event.userId;

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
      const result = await uploadMediaDirectToB2(file, 'Event', eventId, (percent) =>
        setUploadProgress(percent)
      );
      setMediaPreview(result.url);
      setMediaType(result.mediaType as 'Image' | 'Video');
      setValue('imageUrl', result.url);
      if (result.mediaId) {
        setUploadedMediaId(result.mediaId);
        setValue('mediaIds', [result.mediaId]);
      }
    } catch (err: unknown) {
      setMediaError(err instanceof Error ? err.message : 'فشل رفع الملف.');
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
  };

  const onSubmit = async (values: CreateEventFormValues) => {
    try {
      const updated = await updateMutation.mutateAsync({
        ...values,
        mediaIds: uploadedMediaId ? [uploadedMediaId] : values.mediaIds,
      });
      router.push(`/events/${updated.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || eventLoading) {
    return (
      <AppLayout showSidebar={false}>
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout showSidebar={false}>
        <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">تسجيل الدخول مطلوب</h2>
          <p className="text-xs text-slate-500">يجب تسجيل الدخول لتعديل منشوراتك.</p>
          <Link href="/login">
            <Button variant="primary" className="w-full">
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (eventError || !event) {
    return (
      <AppLayout showSidebar={false}>
        <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">الحدث غير متاح</h2>
          <BackButton fallbackUrl="/" label="العودة" variant="pill" />
        </div>
      </AppLayout>
    );
  }

  if (!isOwner) {
    return (
      <AppLayout showSidebar={false}>
        <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">غير مصرح</h2>
          <p className="text-xs text-slate-500">يمكنك تعديل الأحداث التي نشرتها فقط.</p>
          <BackButton fallbackUrl={`/events/${eventId}`} label="العودة للحدث" variant="pill" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-2xl mx-auto space-y-4">
        <BackButton fallbackUrl={`/events/${eventId}`} label="العودة للحدث" variant="pill" />

        <div className="bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-right space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold border border-sky-100">
            <Pencil className="w-3.5 h-3.5" />
            <span>تعديل المنشور</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">عدّل تفاصيل حدثك</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            يمكنك تحديث العنوان والوصف والموقع والوسائط، ثم حفظ التغييرات.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6 text-right"
        >
          <Input
            id="title"
            label="عنوان الحدث"
            placeholder="اكتب عنوانًا موجزًا..."
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              تفاصيل ووصف الحدث
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-500">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700 mb-1.5">
              التصنيف
            </label>
            <select
              id="categoryId"
              {...register('categoryId', { valueAsNumber: true })}
              disabled={isCatLoading}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="0">اختر التصنيف...</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-500">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                موقع الحدث
              </span>
              <Link
                href="/locations/suggest"
                className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                اقترح مكانًا
              </Link>
            </div>

            <select
              disabled={isGovLoading}
              value={selectedGovId ?? ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setSelectedGovId(val);
                if (val) setValue('locationId', val);
              }}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="">اختر المحافظة...</option>
              {governorates?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr}
                </option>
              ))}
            </select>

            {selectedGovId && childrenLocations && childrenLocations.length > 0 && (
              <select
                defaultValue={event.locationId}
                onChange={(e) => {
                  if (e.target.value) setValue('locationId', Number(e.target.value));
                  else if (selectedGovId) setValue('locationId', selectedGovId);
                }}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              >
                <option value="">المحافظة بالكامل</option>
                {childrenLocations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr}
                  </option>
                ))}
              </select>
            )}

            {errors.locationId && (
              <p className="text-xs text-rose-500">{errors.locationId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">صورة أو فيديو (اختياري)</label>
            {mediaPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[180px] max-h-80">
                {mediaType === 'Video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    playsInline
                    className="w-full max-h-80 object-contain bg-black"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPreview} alt="معاينة" className="w-full max-h-80 object-contain" />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-3 left-3 p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : uploadingMedia ? (
              <div className="p-6 border-2 border-dashed border-sky-200 bg-sky-50/40 rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-sky-700 font-bold text-sm">
                  <Upload className="w-5 h-5 animate-bounce" />
                  جاري الرفع... {uploadProgress}%
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition text-center group">
                <div className="flex items-center gap-3 mb-2 text-slate-400 group-hover:text-sky-600">
                  <ImageIcon className="w-6 h-6" />
                  <Film className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-700">اختر صورة أو فيديو جديد</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </label>
            )}
            {mediaError && <p className="text-xs text-rose-500 font-medium">{mediaError}</p>}
          </div>

          {updateMutation.error && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : 'فشل حفظ التعديلات.'}
              </span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/events/${eventId}`)}
              disabled={updateMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
              className="px-8 font-bold"
            >
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
