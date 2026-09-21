'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/useComments';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeArabicTime } from '@/lib/utils';
import { useFlash } from '@/components/ui/FlashProvider';
import {
  MessageCircle,
  Send,
  LogIn,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface EventCommentsSectionProps {
  eventId: string;
  initialCount?: number;
}

export function EventCommentsSection({ eventId, initialCount = 0 }: EventCommentsSectionProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const flash = useFlash();
  const { data: comments, isLoading, error: fetchError } = useComments(eventId);
  const addCommentMutation = useAddComment(eventId);
  const deleteCommentMutation = useDeleteComment(eventId);

  const [content, setContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const commentsCount = comments ? comments.length : initialCount;
  const isAdminPath = pathname?.startsWith('/admin');
  const loginHref = isAdminPath
    ? `/admin/login?redirect=${encodeURIComponent(pathname || `/admin/events/${eventId}`)}`
    : `/login?redirect=/events/${eventId}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setErrorMessage(null);
    try {
      await addCommentMutation.mutateAsync({ content: content.trim() });
      setContent('');
      setToastMessage('تم نشر تعليقك ومشاركته مع المجتمع بنجاح!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر نشر التعليق. يرجى المحاولة لاحقاً.';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (commentId: string) => {
    const ok = await flash.confirm({
      title: 'حذف التعليق؟',
      message: 'هل أنت متأكد من حذف هذا التعليق؟',
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingCommentId(commentId);
    try {
      await deleteCommentMutation.mutateAsync(commentId);
      setToastMessage('تم حذف التعليق بنجاح.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر حذف التعليق.';
      setErrorMessage(msg);
    } finally {
      setDeletingCommentId(null);
    }
  };

  const getAvatarLetter = (name: string) => {
    return name?.trim() ? name.trim().charAt(0).toUpperCase() : '؟';
  };

  return (
    <section
      id="comments"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs space-y-6 text-right"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            التعليقات والمشاركات المجتمعية
          </h2>
          <Badge variant="default" className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700">
            {commentsCount}
          </Badge>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          مساحة لتبادل الأخبار والمستجدات الميدانية
        </span>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-2xl text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-800 border border-rose-200/80 rounded-2xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                التعليق باسم: <span className="text-red-600">{user?.name || 'مستخدم'}</span>
              </span>
              <span className={`text-[11px] ${content.length > 900 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                {content.length} / 1000 حرف
              </span>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب تعليقك أو أي تحديث ميداني عن الحدث هنا..."
              maxLength={1000}
              rows={3}
              required
              disabled={addCommentMutation.isPending}
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-y min-h-[80px]"
            />

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={addCommentMutation.isPending}
                disabled={!content.trim() || addCommentMutation.isPending}
                className="gap-2 px-5 rounded-xl font-bold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>نشر التعليق</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white border border-dashed border-slate-200 rounded-xl">
            <div className="flex items-center gap-3 text-slate-700 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <p>
                سجّل دخولك للمشاركة برأيك أو تقديم معلومات وتحديثات ميدانية عن الحدث.
              </p>
            </div>

            <Link href={loginHref}>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0 text-xs font-bold rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-2">
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {fetchError && !isLoading && (
          <div className="text-center py-6 text-xs text-rose-500 bg-rose-50/50 rounded-2xl border border-rose-100">
            تعذر جلب التعليقات حالياً. يرجى إعادة تحديث الصفحة.
          </div>
        )}

        {!isLoading && !fetchError && comments && comments.length === 0 && (
          <div className="text-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-xs border border-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              💬
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700">
                لا توجد تعليقات حتى الآن.
              </p>
              <p className="text-xs text-slate-500">
                كن أول من يشارك برأيه أو يضيف تحديثاً حول هذا الحدث!
              </p>
            </div>
          </div>
        )}

        {!isLoading && comments && comments.length > 0 && (
          <div className="space-y-3">
            {comments.map((comment) => {
              const canDelete = isAdmin || (user && user.id === comment.authorId);
              const isDeleting = deletingCommentId === comment.id;

              return (
                <div
                  key={comment.id}
                  className="p-4 sm:p-5 bg-slate-50/40 hover:bg-slate-50/80 transition-colors rounded-2xl border border-slate-100 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {getAvatarLetter(comment.authorName)}
                      </div>

                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          {comment.authorName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatRelativeArabicTime(comment.createdAt)}
                        </div>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition text-xs"
                        title="حذف التعليق"
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>

                  <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line pr-12">
                    {comment.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
