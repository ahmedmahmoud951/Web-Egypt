'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EventSummaryDto } from '@/types/event';
import { Badge } from '@/components/ui/Badge';
import { ConfirmButton } from './ConfirmButton';
import { ShareButton } from './ShareButton';
import { EventMediaLightbox } from './EventMediaLightbox';
import { EventActionsMenu } from './EventActionsMenu';
import { EventVideoThumbnail } from './EventVideoThumbnail';
import { formatRelativeArabicTime } from '@/lib/utils';
import { isVideoMedia, resolveMediaUrl } from '@/lib/media';
import { MapPin, MessageCircle, Maximize2 } from 'lucide-react';

function getInitials(name?: string) {
  if (!name?.trim()) return 'م';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

function avatarTone(seed: string) {
  const tones = [
    'from-sky-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-sky-600',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  return tones[hash % tones.length];
}

export function EventCard({ event }: { event: EventSummaryDto }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHiddenLocally, setIsHiddenLocally] = useState(false);

  const authorName = event.userName || 'مستخدم';
  const mediaUrl = resolveMediaUrl(event.imageUrl);
  const isVideo = isVideoMedia(event.imageUrl, event.primaryMediaType);

  if (isHiddenLocally) {
    return (
      <article className="bg-white rounded-2xl border border-slate-100 px-4 py-3 text-sm text-slate-500 text-right shadow-xs animate-in fade-in duration-200">
        تم إخفاء المنشور من موجزك.
      </article>
    );
  }

  return (
    <>
      <article className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-shadow duration-300 overflow-hidden text-right group">
        {/* Facebook-style header */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarTone(event.userId || authorName)} text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm`}
              aria-hidden
            >
              {getInitials(authorName)}
            </div>
            <div className="min-w-0 text-right">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[15px] text-slate-900 truncate">{authorName}</span>
                <Badge variant="red" className="font-semibold text-[10px] px-2 py-0.5">
                  {event.categoryNameAr}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mt-0.5">
                <span>{formatRelativeArabicTime(event.createdAt)}</span>
                <span className="text-slate-300">·</span>
                <Link
                  href={`/locations/${event.locationId}`}
                  className="inline-flex items-center gap-0.5 hover:underline"
                >
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span>{event.locationNameAr}</span>
                </Link>
              </div>
            </div>
          </div>

          <EventActionsMenu
            eventId={event.id}
            eventTitle={event.title}
            ownerUserId={event.userId}
            onHidden={() => setIsHiddenLocally(true)}
            variant="card"
          />
        </div>

        {/* Body */}
        <div className="px-4 pb-3">
          <Link href={`/events/${event.id}`}>
            <h2 className="text-[15px] sm:text-base font-bold text-slate-900 mb-1.5 group-hover:text-[#1877F2] transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h2>
          </Link>
          <p className="text-slate-600 text-[13px] sm:text-sm leading-relaxed line-clamp-3 whitespace-pre-line">
            {event.description}
          </p>
        </div>

        {/* Full-bleed media — Facebook-style: video shows poster frame + play badge */}
        {mediaUrl && (
          <div
            onClick={() => !isVideo && setIsLightboxOpen(true)}
            className="relative cursor-pointer bg-slate-950/[0.03] border-y border-slate-100 group/media"
            title="انقر لفتح العرض الكامل"
          >
            {isVideo ? (
              <EventVideoThumbnail
                src={mediaUrl}
                title={event.title}
                onOpen={() => setIsLightboxOpen(true)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={event.title}
                className="w-full max-h-[540px] object-contain transition-transform duration-300 group-hover/media:scale-[1.01]"
                loading="lazy"
              />
            )}
            {!isVideo && (
              <div className="absolute bottom-3 left-3 bg-slate-900/75 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 pointer-events-none">
                <Maximize2 className="w-3.5 h-3.5" />
                <span>عرض كامل مع التعليقات</span>
              </div>
            )}
          </div>
        )}

        {/* Stats strip */}
        <div className="px-4 pt-2.5 flex items-center justify-between text-[12px] text-slate-500">
          <span className="font-medium">{event.confirmCount} تأكيد</span>
          <Link href={`/events/${event.id}`} className="hover:underline">
            {event.commentsCount ?? 0} تعليق
          </Link>
        </div>

        {/* Facebook-style action bar */}
        <div className="mx-3 my-2 grid grid-cols-3 gap-1 border-t border-slate-100 pt-1.5">
          <div className="flex justify-center">
            <ConfirmButton eventId={event.id} initialCount={event.confirmCount} />
          </div>
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <MessageCircle className="w-4 h-4" />
            تعليق
          </Link>
          <div className="flex justify-center items-center">
            <ShareButton
              title={event.title}
              text={event.description}
              url={`/events/${event.id}`}
            />
          </div>
        </div>
      </article>

      {mediaUrl && (
        <EventMediaLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          mediaUrl={mediaUrl}
          isVideo={isVideo}
          event={{
            id: event.id,
            title: event.title,
            description: event.description,
            imageUrl: mediaUrl,
            confirmCount: event.confirmCount,
            commentsCount: event.commentsCount ?? 0,
            createdAt: event.createdAt,
            locationId: event.locationId,
            locationNameAr: event.locationNameAr,
            categoryNameAr: event.categoryNameAr,
            authorName,
          }}
        />
      )}
    </>
  );
}
