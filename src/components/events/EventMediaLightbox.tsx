'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useComments';
import { ConfirmButton } from './ConfirmButton';
import { ShareButton } from './ShareButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRelativeArabicTime } from '@/lib/utils';
import { useFlash } from '@/components/ui/FlashProvider';
import {
  X,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Trash2,
  ExternalLink,
  LogIn,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FacebookVideoPlayer } from './FacebookVideoPlayer';
import { CommentAuthorLabel } from '@/components/ui/AdminVerifiedBadge';

export interface LightboxEventData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  confirmCount: number;
  commentsCount: number;
  createdAt: string;
  locationId?: number;
  locationNameAr?: string;
  categoryNameAr?: string;
  authorName?: string;
}

interface EventMediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  isVideo?: boolean;
  event: LightboxEventData;
}

export function EventMediaLightbox({
  isOpen,
  onClose,
  mediaUrl,
  isVideo = false,
  event,
}: EventMediaLightboxProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const flash = useFlash();
  const { data: comments, isLoading: isCommentsLoading } = useComments(event.id);
  const addCommentMutation = useAddComment(event.id);
  const deleteCommentMutation = useDeleteComment(event.id);

  const [mounted, setMounted] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isAdminContext = pathname?.startsWith('/admin');
  const loginHref = isAdminContext
    ? `/admin/login?redirect=${encodeURIComponent(pathname || `/admin/events/${event.id}`)}`
    : `/login?redirect=/events/${event.id}`;
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${event.id}`
      : `/events/${event.id}`;

  useEffect(() => setMounted(true), []);

  // Close on Escape key press & prevent body scrolling when open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus comment box shortly after open (Facebook-style)
    const t = window.setTimeout(() => commentInputRef.current?.focus(), 180);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const totalComments = comments ? comments.length : event.commentsCount;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setErrorMessage(null);
    try {
      await addCommentMutation.mutateAsync({ content: newComment.trim() });
      setNewComment('');
      setSuccessMessage('تمت إضافة تعليقك بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'فشل نشر التعليق.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const ok = await flash.confirm({
      title: 'حذف التعليق؟',
      message: 'هل أنت متأكد من حذف هذا التعليق؟',
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingId(commentId);
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'تعذر حذف التعليق.');
    } finally {
      setDeletingId(null);
    }
  };

  const getAvatarLetter = (name?: string) => {
    return name?.trim() ? name.trim().charAt(0).toUpperCase() : '؟';
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="عرض المنشور"
    >
      {/* 1. Media Stage (Cinema View - Left/Center on Desktop) */}
      <div className="relative flex-1 bg-black flex items-center justify-center p-3 sm:p-6 min-h-[45vh] md:min-h-full overflow-hidden select-none">
        {/* Floating Top Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-red-600 text-white transition-all shadow-lg backdrop-blur-sm group"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-slate-900/70 hover:bg-slate-800 text-white/80 hover:text-white transition-all text-xs flex items-center gap-1.5 px-3 backdrop-blur-sm"
            title="فتح الرابط المباشر في نافذة جديدة"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>عرض المصدر</span>
          </a>
        </div>

        {/* Media Itself - 100% Uncropped with object-contain */}
        <div
          className="w-full h-full flex items-center justify-center max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <FacebookVideoPlayer src={mediaUrl} autoPlay />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={event.title}
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl transition-all duration-300"
            />
          )}
        </div>
      </div>

      {/* 2. Facebook-Style Details & Comments Sidebar (Right side on desktop) */}
      <div className="w-full md:w-[420px] lg:w-[460px] bg-white h-[55vh] md:h-full flex flex-col border-t md:border-t-0 md:border-r border-slate-200 text-right shadow-2xl z-10 shrink-0">
        {/* Sidebar Header: Author & Meta */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            {/* Publisher Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
              {getAvatarLetter(event.authorName)}
            </div>

            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span>{event.authorName || 'مواطن مسجل'}</span>
                {event.categoryNameAr && (
                  <Badge variant="red" className="text-[10px] px-2 py-0.5">
                    {event.categoryNameAr}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <Clock className="w-3 h-3" />
                <span>{formatRelativeArabicTime(event.createdAt)}</span>
                {event.locationNameAr && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {event.locationNameAr}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Close button inside sidebar on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Center: Content, Actions & Comments Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-right divide-y divide-slate-100">
          {/* Post Content */}
          <div className="space-y-2.5 pb-2">
            <Link
              href={`/events/${event.id}`}
              className="text-base sm:text-lg font-black text-slate-900 hover:text-red-600 transition-colors block leading-snug"
            >
              {event.title}
            </Link>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Engagement Stats & Actions Bar (Facebook-Style) */}
          <div className="pt-3 space-y-3">
            {/* Counts row */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{event.confirmCount} تأكيد ميداني</span>
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>{totalComments} مشاركة وتعليق</span>
              </span>
            </div>

            {/* Interactive Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              {/* Confirm / Like */}
              <ConfirmButton eventId={event.id} initialCount={event.confirmCount} />

              {/* Comment trigger */}
              <button
                type="button"
                onClick={() => commentInputRef.current?.focus()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
              >
                <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>أضف تعليق</span>
              </button>

              {/* Share Button */}
              <ShareButton title={event.title} text={event.description} url={shareUrl} />
            </div>
          </div>

          {/* Comments Stream Section */}
          <div className="pt-4 space-y-3">
            <h3 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 mb-2">
              <MessageCircle className="w-4 h-4 text-red-600" />
              <span>التعليقات والمستجدات ({totalComments})</span>
            </h3>

            {/* Alerts */}
            {successMessage && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-xl flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 text-xs rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Loading */}
            {isCommentsLoading && (
              <div className="space-y-3 py-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-1.5 bg-slate-50 p-2.5 rounded-xl">
                      <div className="h-3 bg-slate-200 rounded w-24" />
                      <div className="h-2.5 bg-slate-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty comments */}
            {!isCommentsLoading && (!comments || comments.length === 0) && (
              <div className="text-center py-6 px-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-1">
                <p className="font-bold text-slate-600">لا توجد تعليقات بعد.</p>
                <p>كن أول من يشارك برأيه أو يضيف تفاصيل حول هذا الحدث!</p>
              </div>
            )}

            {/* Comments List */}
            {!isCommentsLoading && comments && comments.length > 0 && (
              <div className="space-y-2.5">
                {comments.map((c) => {
                  const canDelete = isAdmin || (user && user.id === c.authorId);
                  const isDel = deletingId === c.id;
                  const isAdminAuthor = Boolean(c.isAdminAuthor || c.hasAdminVerifiedBadge);
                  const displayName = isAdminAuthor ? 'Admin' : c.authorName;

                  return (
                    <div
                      key={c.id}
                      className={`p-3 transition rounded-2xl border space-y-1.5 ${
                        isAdminAuthor
                          ? 'bg-[rgba(31,107,122,0.07)] border-[rgba(31,107,122,0.22)]'
                          : 'bg-slate-50/70 hover:bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                              isAdminAuthor
                                ? 'bg-gradient-to-tr from-[#1F6B7A] to-[#C4A35A]'
                                : 'bg-red-600'
                            }`}
                          >
                            {getAvatarLetter(displayName)}
                          </div>
                          <div>
                            <CommentAuthorLabel
                              name={c.authorName}
                              isAdminAuthor={c.isAdminAuthor}
                              hasAdminVerifiedBadge={c.hasAdminVerifiedBadge}
                              className="text-xs"
                            />
                            <span className="text-[10px] text-slate-400 block">
                              {formatRelativeArabicTime(c.createdAt)}
                            </span>
                          </div>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            disabled={isDel}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                            title="حذف التعليق"
                          >
                            <Trash2 className={`w-3.5 h-3.5 ${isDel ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                      </div>

                      <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line pr-9">
                        {c.content}
                      </p>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Comment Input Form */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white shrink-0">
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                rows={1}
                maxLength={1000}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition resize-none min-h-[38px] max-h-24"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(e);
                  }
                }}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!newComment.trim() || addCommentMutation.isPending}
                isLoading={addCommentMutation.isPending}
                className="px-3.5 h-[38px] rounded-xl font-bold shrink-0"
                title="إرسال (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 text-[11px]">سجل دخولك للتعليق</span>
              <Link href={loginHref}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[11px] py-1 px-2.5 font-bold border-red-200 text-red-600"
                >
                  <LogIn className="w-3 h-3 mr-1" />
                  <span>دخول</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
