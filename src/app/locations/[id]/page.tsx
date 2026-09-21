'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useLocation, useLocationChildren } from '@/hooks/useLocations';
import { AppLayout } from '@/components/layout/AppLayout';
import { LocationBreadcrumb } from '@/components/locations/LocationBreadcrumb';
import { EventFeed } from '@/components/events/EventFeed';
import { Skeleton } from '@/components/ui/Skeleton';
import { MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';

export default function LocationDetailPage() {
  const params = useParams();
  const locationId = Number(params?.id);

  const { data: location, isLoading: isLocLoading } = useLocation(locationId);
  const { data: children, isLoading: isChildLoading } = useLocationChildren(locationId);
  const { data: parentLoc } = useLocation(location?.parentId ?? undefined);

  return (
    <AppLayout showSidebar={true}>
      <div className="space-y-5 text-right">
        {/* Universal Back Navigation & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackButton
            fallbackUrl={parentLoc ? `/locations/${parentLoc.id}` : '/locations'}
            label={parentLoc ? `العودة إلى ${parentLoc.nameAr}` : 'العودة للمحافظات'}
            variant="pill"
          />
          <LocationBreadcrumb currentLocation={location} parentLocation={parentLoc} />
        </div>

        {/* Location Header */}
        {isLocLoading ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        ) : location ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-red-600" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {location.nameAr}
                </h1>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                  {location.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {location.nameEn} — تابع الأحداث والوقائع الموثقة الجارية في هذا النطاق
              </p>
            </div>

            <Link href={`/events/new`}>
              <Button variant="primary" size="sm" className="gap-1.5 font-bold">
                <Plus className="w-4 h-4" />
                <span>أضف حدثًا هنا</span>
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Sub-locations pills if available */}
        {!isChildLoading && children && children.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-700 block">المناطق والمراكز التابعة:</span>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/locations/${child.id}`}
                  className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-xl border border-slate-100 font-medium transition"
                >
                  {child.nameAr}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Location Specific Feed: sent directly to API query */}
        <EventFeed initialQuery={{ locationId }} />
      </div>
    </AppLayout>
  );
}
