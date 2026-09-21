'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { useFlash } from '@/components/ui/FlashProvider';
import { ConfirmButton } from '@/components/events/ConfirmButton';
import { ShareButton } from '@/components/events/ShareButton';
import { EventCommentsSection } from '@/components/events/EventCommentsSection';
import { EventMediaLightbox } from '@/components/events/EventMediaLightbox';
import { EventVideoThumbnail } from '@/components/events/EventVideoThumbnail';
import { adminApi } from '@/api/admin';
import { useEvent } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { isVideoMedia, resolveMediaUrl } from '@/lib/media';
import { AdminEventDetail } from '@/types/admin';
import { EventDto } from '@/types/event';
import { PagedResponse } from '@/types/api';
import {
  ExternalLink,
  MapPin,
  Trash2,
  EyeOff,
  RotateCcw,
  RefreshCw,
  Maximize2,
  MessageCircle,
} from 'lucide-react';

function findCachedEvent(queryClient: ReturnType<typeof useQueryClient>, id: string): EventDto | undefined {
  const lists = queryClient.getQueriesData<PagedResponse<EventDto>>({ queryKey: ['admin', 'events'] });
  for (const [, data] of lists) {
    const hit = data?.items?.find((e) => e.id === id);
    if (hit) return hit;
  }
  return queryClient.getQueryData<EventDto>(['admin', 'events', id]);
}

export default function AdminEventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const flash = useFlash();
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  const cached = useMemo(() => (id ? findCachedEvent(queryClient, id) : undefined), [id, queryClient]);
  const queriesEnabled = !!id && isAuthenticated && isAdmin && !authLoading;
  const [loadAdminExtras, setLoadAdminExtras] = useState(false);

  // Public payload only on open — admin get-by-id hangs on free hosting; load on demand.
  const {
    data: publicEvent,
    isLoading: publicLoading,
    isError: publicError,
    refetch: refetchPublic,
  } = useEvent(queriesEnabled ? id : '');

  const {
    data: adminEvent,
    isFetching: adminFetching,
    isError: adminError,
    refetch: refetchAdmin,
  } = useQuery({
    queryKey: ['admin', 'events', id],
    queryFn: ({ signal }) => adminApi.getEventById(id, signal),
    enabled: queriesEnabled && loadAdminExtras,
    retry: 0,
    staleTime: 60_000,
    throwOnError: false,
  });

  const event = (adminEvent ?? publicEvent ?? cached) as AdminEventDetail | EventDto | undefined;
  const mediaSource =
    (publicEvent?.media?.length ? publicEvent : null) ||
    (adminEvent?.media?.length ? adminEvent : null) ||
    event;
  const imageUrl = mediaSource?.imageUrl || event?.imageUrl || null;
  const mediaItems = mediaSource?.media || [];
  const confirmCount = publicEvent?.confirmCount ?? event?.confirmCount ?? 0;
  const commentsCount = publicEvent?.commentsCount ?? event?.commentsCount ?? 0;

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      flash.success('تم الحذف النهائي.');
      router.push('/admin/events');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل الحذف.'),
  });

  const hideMutation = useMutation({
    mutationFn: () => adminApi.hideEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      flash.success('تم إخفاء المنشور.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشل الإخفاء.'),
  });

  const restoreMutation = useMutation({
    mutationFn: () => adminApi.restoreEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      flash.success('تمت الاستعادة.');
    },
    onError: (err) => flash.error((err as Error)?.message || 'فشلت الاستعادة.'),
  });

  const onDelete = async () => {
    const ok = await flash.confirm({
      title: 'حذف نهائي من قاعدة البيانات؟',
      message: 'لن يمكن استرجاع هذا المنشور بعد الحذف.',
      confirmLabel: 'حذف نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    await deleteMutation.mutateAsync();
  };

  const showLoading = (publicLoading || authLoading) && !event;
  const status = event?.status || '—';

  if (showLoading) {
    return (
      <AdminShell>
        <div className="max-w-4xl mx-auto admin-card p-8 text-center text-[#5A6D80] text-sm">
          جاري تحميل المنشور والصور/الفيديو...
        </div>
      </AdminShell>
    );
  }

  if (!event && publicError && !adminEvent && !cached) {
    return (
      <AdminShell>
        <div className="max-w-4xl mx-auto space-y-4">
          <FlashBanner tone="error" title="تعذر تحميل المنشور" className="admin-row justify-between">
            <span>قد يكون المنشور مخفيًا أو الخادم بطيء.</span>
            <button
              type="button"
              onClick={() => {
                refetchPublic();
                if (loadAdminExtras) refetchAdmin();
              }}
              className="btn-glow btn-glow-primary px-3 h-9 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </FlashBanner>
          <Link href="/admin/events" className="btn-glow btn-glow-ghost px-4 h-9 text-sm inline-flex">
            العودة للمنشورات
          </Link>
        </div>
      </AdminShell>
    );
  }

  if (!event) {
    return (
      <AdminShell>
        <div className="text-[#8A9AAB] text-sm">جاري التحميل...</div>
      </AdminShell>
    );
  }

  const detail = (adminEvent ?? event) as AdminEventDetail & EventDto;

  const mapsEmbed =
    detail.latitude != null && detail.longitude != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(detail.longitude) - 0.02}%2C${Number(detail.latitude) - 0.02}%2C${Number(detail.longitude) + 0.02}%2C${Number(detail.latitude) + 0.02}&layer=mapnik&marker=${detail.latitude}%2C${detail.longitude}`
      : null;

  const locationLabel =
    detail.locationPathAr ||
    detail.locationNameAr ||
    '—';

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto space-y-5 text-right">
        {adminFetching && (
          <FlashBanner tone="info" title="بيانات الإدارة">
            جاري جلب هاتف الناشر / GPS...
          </FlashBanner>
        )}

        {!adminEvent && !loadAdminExtras && (
          <FlashBanner tone="info" title="عرض سريع" className="admin-row justify-between">
            <span>تم تحميل المحتوى بدون طلب الأدمن الثقيل (يتسبب في timeout على الاستضافة).</span>
            <button
              type="button"
              onClick={() => setLoadAdminExtras(true)}
              className="btn-glow btn-glow-primary px-3 h-9 text-xs"
            >
              جلب هاتف / GPS
            </button>
          </FlashBanner>
        )}

        {loadAdminExtras && adminError && !adminEvent && (
          <FlashBanner tone="warn" title="تعذر جلب بيانات الأدمن" className="admin-row justify-between">
            <span>الخادم لم يستجب خلال المهلة — المحتوى والتعليقات ما زالت متاحة.</span>
            <button
              type="button"
              onClick={() => refetchAdmin()}
              className="btn-glow btn-glow-ghost px-3 h-9 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة
            </button>
          </FlashBanner>
        )}

        <div className="admin-row items-start justify-between">
          <div className="admin-col">
            <h1 className="text-2xl font-black text-[#0F1B2D]">{event.title}</h1>
            <p className="text-sm text-[#5A6D80] mt-1">الحالة: {status}</p>
          </div>
          <div className="admin-row gap-2 flex-wrap">
            {status === 'Published' && (
              <button
                type="button"
                onClick={() => hideMutation.mutate()}
                className="btn-glow btn-glow-gold px-3 h-9 text-xs"
              >
                <EyeOff className="w-3.5 h-3.5" />
                إخفاء
              </button>
            )}
            {status === 'Hidden' && (
              <button
                type="button"
                onClick={() => restoreMutation.mutate()}
                className="btn-glow btn-glow-primary px-3 h-9 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                استعادة
              </button>
            )}
            <button type="button" onClick={onDelete} className="btn-glow btn-glow-danger px-3 h-9 text-xs">
              <Trash2 className="w-3.5 h-3.5" />
              حذف نهائي
            </button>
          </div>
        </div>

        <div className="admin-card p-5 space-y-3">
          <h2 className="font-black text-[#0F1B2D]">الناشر</h2>
          <div className="text-sm space-y-1">
            <div>
              الاسم:{' '}
              <Link href={`/admin/users/${event.userId}`} className="text-[#1F6B7A] font-bold hover:underline">
                {event.userName || 'مستخدم'}
              </Link>
            </div>
            {'userPhoneNumber' in detail && detail.userPhoneNumber && (
              <div dir="ltr" className="text-left font-mono text-[#5A6D80]">
                {detail.userPhoneNumber}
              </div>
            )}
          </div>
        </div>

        <div className="admin-card p-5 space-y-3">
          <h2 className="font-black text-[#0F1B2D] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1F6B7A]" />
            موقع النشر بالظبط
          </h2>
          <p className="text-sm text-[#0F1B2D] font-semibold">{locationLabel}</p>
          {detail.latitude != null && detail.longitude != null ? (
            <div className="space-y-3">
              <div className="text-xs text-[#5A6D80] font-mono" dir="ltr">
                {detail.latitude}, {detail.longitude}
                {detail.locationAccuracyMeters != null &&
                  ` (±${Math.round(detail.locationAccuracyMeters)}m)`}
              </div>
              {mapsEmbed && (
                <iframe
                  title="map"
                  src={mapsEmbed}
                  className="w-full h-64 rounded-xl border border-[rgba(15,27,45,0.1)]"
                />
              )}
              {'mapsUrl' in detail && detail.mapsUrl && (
                <a
                  href={detail.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-glow btn-glow-ghost px-3 h-9 text-sm inline-flex"
                >
                  فتح في خرائط جوجل
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <FlashBanner tone="warn" title="بدون GPS">
              لم يُرسل GPS من التطبيق لهذا المنشور — يظهر المسار الإداري فقط.
            </FlashBanner>
          )}
        </div>

        {/* Content + media + like/share */}
        <div className="admin-card overflow-visible">
          <div className="p-5 space-y-3">
            <h2 className="font-black text-[#0F1B2D]">المحتوى</h2>
            <p className="text-sm text-[#3D4F63] whitespace-pre-wrap leading-relaxed">{event.description}</p>
          </div>

          {mediaItems.length > 0 ? (
            <div className="border-t border-[rgba(15,27,45,0.06)]">
              {mediaItems.map((item) => {
                const url = resolveMediaUrl(item.url);
                const isVid = isVideoMedia(url, item.type);
                return (
                  <div key={item.id} className="relative bg-[#0F1B2D]/[0.03] group/media border-b border-[rgba(15,27,45,0.06)] last:border-0">
                    {isVid ? (
                      <EventVideoThumbnail
                        src={url}
                        title={event.title}
                        onOpen={() => setLightboxMedia({ url, isVideo: true })}
                      />
                    ) : (
                      <button
                        type="button"
                        className="w-full cursor-pointer relative text-right"
                        onClick={() => setLightboxMedia({ url, isVideo: false })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={event.title} className="w-full max-h-[540px] object-contain" />
                        <span className="absolute bottom-3 left-3 bg-[#0F1B2D]/85 text-white px-2.5 py-1 rounded-xl text-[11px] font-medium inline-flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5" />
                          عرض كامل مع التعليقات
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : imageUrl ? (
            (() => {
              const url = resolveMediaUrl(imageUrl);
              const isVid = isVideoMedia(url);
              return (
                <div className="relative bg-[#0F1B2D]/[0.03] border-t border-[rgba(15,27,45,0.06)] group/media">
                  {isVid ? (
                    <EventVideoThumbnail
                      src={url}
                      title={event.title}
                      onOpen={() => setLightboxMedia({ url, isVideo: true })}
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full cursor-pointer relative text-right"
                      onClick={() => setLightboxMedia({ url, isVideo: false })}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={event.title} className="w-full max-h-[540px] object-contain" />
                      <span className="absolute bottom-3 left-3 bg-[#0F1B2D]/85 text-white px-2.5 py-1 rounded-xl text-[11px] font-medium inline-flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5" />
                        عرض كامل مع التعليقات
                      </span>
                    </button>
                  )}
                </div>
              );
            })()
          ) : (
            <p className="px-5 pb-4 text-sm text-[#8A9AAB]">لا توجد صورة أو فيديو مرفق</p>
          )}

          <div className="px-5 py-3 admin-row justify-between text-xs text-[#5A6D80] border-t border-[rgba(15,27,45,0.06)]">
            <span>تأكيدات: {confirmCount}</span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              تعليقات: {commentsCount}
            </span>
            <span>بلاغات: {event.reportCount ?? 0}</span>
          </div>

          <div className="mx-4 mb-4 grid grid-cols-3 gap-1 border-t border-[rgba(15,27,45,0.06)] pt-2">
            <div className="flex justify-center">
              <ConfirmButton eventId={id} initialCount={confirmCount} />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200"
                onClick={() => {
                  const first = mediaItems[0];
                  if (first) {
                    const url = resolveMediaUrl(first.url);
                    setLightboxMedia({ url, isVideo: isVideoMedia(url, first.type) });
                    return;
                  }
                  if (imageUrl) {
                    const url = resolveMediaUrl(imageUrl);
                    setLightboxMedia({ url, isVideo: isVideoMedia(url) });
                    return;
                  }
                  document.getElementById('admin-event-comments')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                تعليق
              </button>
            </div>
            <div className="flex justify-center items-center">
              <ShareButton
                title={event.title}
                text={event.description}
                url={typeof window !== 'undefined' ? `${window.location.origin}/events/${id}` : ''}
              />
            </div>
          </div>
        </div>

        {/* Comments */}
        <div id="admin-event-comments" className="admin-card p-4 overflow-visible">
          <EventCommentsSection eventId={id} initialCount={commentsCount} />
        </div>

        {lightboxMedia && (
          <EventMediaLightbox
            isOpen
            onClose={() => setLightboxMedia(null)}
            mediaUrl={lightboxMedia.url}
            isVideo={lightboxMedia.isVideo}
            event={{
              id,
              title: event.title,
              description: event.description,
              imageUrl: lightboxMedia.url,
              confirmCount,
              commentsCount,
              createdAt: event.createdAt,
              locationId: event.locationId,
              locationNameAr: locationLabel,
              categoryNameAr: event.categoryNameAr || '',
              authorName: event.userName || 'مستخدم',
            }}
          />
        )}
      </div>
    </AdminShell>
  );
}
