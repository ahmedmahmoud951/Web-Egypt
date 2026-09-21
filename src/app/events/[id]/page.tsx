'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useEvent } from '@/hooks/useEvents';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { ConfirmButton } from '@/components/events/ConfirmButton';
import { ShareButton } from '@/components/events/ShareButton';
import { EventCommentsSection } from '@/components/events/EventCommentsSection';
import { EventMediaLightbox } from '@/components/events/EventMediaLightbox';
import { EventActionsMenu } from '@/components/events/EventActionsMenu';
import { EventVideoThumbnail } from '@/components/events/EventVideoThumbnail';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatArabicDate, formatRelativeArabicTime } from '@/lib/utils';
import { isVideoMedia, resolveMediaUrl } from '@/lib/media';
import { BackButton } from '@/components/ui/BackButton';
import { MapPin, Clock, User, ShieldCheck, Maximize2 } from 'lucide-react';
import Link from 'next/link';

function getInitials(name?: string) {
  if (!name?.trim()) return 'م';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: event, isLoading, error } = useEvent(id);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  const authorName = event?.userName || event?.user?.name || 'مستخدم مسجل';
  const categoryName = event?.categoryNameAr || event?.category?.nameAr || 'عام';
  const locationName = event?.locationNameAr || event?.location?.nameAr || 'مصر';

  return (
    <AppLayout showSidebar={true}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/" label="العودة لجميع الأحداث" variant="pill" />
        </div>

        {isLoading && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {(error || (!isLoading && !event)) && (
          <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold">
              ℹ️
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">هذا الحدث غير متاح حاليًا.</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                قد يكون الحدث قد تم نقله أو حجبه بواسطة إدارة المجتمع لمخالفته المعايير.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block text-xs font-bold text-red-600 hover:text-red-700 underline pt-2"
            >
              تصفح الأحداث النشطة
            </Link>
          </div>
        )}

        {!isLoading && event && (
          <article className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden text-right">
            {/* Facebook-style post header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                  {getInitials(authorName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[15px] text-slate-900">{authorName}</span>
                    <Badge variant="red" className="text-[10px] font-bold px-2 py-0.5">
                      {categoryName}
                    </Badge>
                    {event.confirmCount >= 5 && (
                      <Badge variant="emerald" className="gap-1 text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>موثق</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeArabicTime(event.createdAt)}</span>
                    <span className="text-slate-300">·</span>
                    <span>{formatArabicDate(event.createdAt)}</span>
                  </div>
                </div>
              </div>

              <EventActionsMenu
                eventId={event.id}
                eventTitle={event.title}
                ownerUserId={event.userId}
                variant="detail"
              />
            </div>

            <div className="px-5 pb-4 space-y-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {event.title}
              </h1>
              <div className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>

            {event.media && event.media.length > 0 ? (
              <div className="space-y-0 border-y border-slate-100">
                {event.media.map((item) => {
                  const url = resolveMediaUrl(item.url);
                  const isVid = isVideoMedia(url, item.type);

                  return (
                    <div
                      key={item.id}
                      className="relative bg-slate-950/[0.03] group/media"
                    >
                      {isVid ? (
                        <EventVideoThumbnail
                          src={url}
                          title={event.title}
                          onOpen={() => setLightboxMedia({ url, isVideo: true })}
                        />
                      ) : (
                        <div
                          onClick={() => setLightboxMedia({ url, isVideo: false })}
                          className="cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={event.title}
                            className="w-full max-h-[540px] object-contain"
                          />
                          <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 pointer-events-none">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>عرض كامل مع التعليقات</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : event.imageUrl ? (
              (() => {
                const url = resolveMediaUrl(event.imageUrl);
                const isVid = isVideoMedia(event.imageUrl);
                return (
                  <div className="relative bg-slate-950/[0.03] border-y border-slate-100 group/media">
                    {isVid ? (
                      <EventVideoThumbnail
                        src={url}
                        title={event.title}
                        onOpen={() => setLightboxMedia({ url, isVideo: true })}
                      />
                    ) : (
                      <div
                        onClick={() => setLightboxMedia({ url, isVideo: false })}
                        className="cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={event.title}
                          className="w-full max-h-[540px] object-contain"
                        />
                        <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 pointer-events-none">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>عرض كامل مع التعليقات</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : null}

            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <MapPin className="w-4 h-4 text-red-600" />
                <div>
                  <span className="text-slate-400 block text-[10px]">الموقع</span>
                  <Link
                    href={`/locations/${event.locationId}`}
                    className="font-bold text-slate-800 hover:text-red-600 transition"
                  >
                    {locationName}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">الناشر</span>
                  <span className="font-bold text-slate-800">{authorName}</span>
                </div>
              </div>
            </div>

            {event.lastConfirmedAt && (
              <div className="px-5 pb-2 text-[11px] text-slate-400">
                آخر تأكيد من المواطنين: {formatRelativeArabicTime(event.lastConfirmedAt)}
              </div>
            )}

            <div className="mx-4 mb-4 grid grid-cols-2 gap-1 border-t border-slate-100 pt-2">
              <div className="flex justify-center">
                <ConfirmButton eventId={event.id} initialCount={event.confirmCount} />
              </div>
              <div className="flex justify-center items-center">
                <ShareButton
                  title={event.title}
                  text={event.description}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                />
              </div>
            </div>
          </article>
        )}

        {!isLoading && event && (
          <EventCommentsSection eventId={event.id} initialCount={event.commentsCount} />
        )}

        {event && lightboxMedia && (
          <EventMediaLightbox
            isOpen={lightboxMedia !== null}
            onClose={() => setLightboxMedia(null)}
            mediaUrl={lightboxMedia.url}
            isVideo={lightboxMedia.isVideo}
            event={{
              id: event.id,
              title: event.title,
              description: event.description,
              imageUrl: lightboxMedia.url,
              confirmCount: event.confirmCount,
              commentsCount: event.commentsCount ?? 0,
              createdAt: event.createdAt,
              locationId: event.locationId,
              locationNameAr: locationName,
              categoryNameAr: categoryName,
              authorName,
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
