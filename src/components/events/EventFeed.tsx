'use client';

import React, { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { EventCard } from './EventCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { EventFilterQuery } from '@/types/event';
import { Flame, Clock, ThumbsUp, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function EventFeed({ initialQuery = {} }: { initialQuery?: EventFilterQuery }) {
  const [sort, setSort] = useState<'recent' | 'confirmed' | 'active'>('recent');
  const [page, setPage] = useState(1);

  const query: EventFilterQuery = {
    ...initialQuery,
    sort,
    page,
    pageSize: 15,
  };

  const { data, isLoading, error, refetch, isFetching } = useEvents(query);

  const tabs: { label: string; value: 'recent' | 'confirmed' | 'active'; icon: React.ReactNode }[] = [
    { label: 'الأحدث', value: 'recent', icon: <Clock className="w-4 h-4" /> },
    { label: 'الأكثر تأكيدًا', value: 'confirmed', icon: <ThumbsUp className="w-4 h-4" /> },
    { label: 'الأكثر تفاعلًا', value: 'active', icon: <Flame className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs & Sorting */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-1.5 border border-slate-100 shadow-xs">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSort(tab.value);
                setPage(1);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition select-none',
                sort === tab.value
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {isFetching && !isLoading && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 pl-2">
            <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
            <span>تحديث...</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">تعذر تحميل الأحداث</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {error instanceof Error ? error.message : 'حدث خطأ أثناء جلب البيانات من الخادم.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.items.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold">
            🇪🇬
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">لا توجد أحداث حالية</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              كن أول من يشارك حدثًا أو خبرًا موثقًا في منطقتك.
            </p>
          </div>
          <Link href="/events/new">
            <Button variant="primary" size="sm">
              أضف أول حدث الآن
            </Button>
          </Link>
        </div>
      )}

      {/* Event List */}
      {!isLoading && !error && data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}

          {/* Pagination Controls */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                الصفحة السابقة
              </Button>
              <span className="text-xs font-semibold text-slate-600 px-2">
                صفحة {data.page} من {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                الصفحة التالية
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
