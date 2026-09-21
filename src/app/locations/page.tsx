'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGovernorates } from '@/hooks/useLocations';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { MapPin, Plus, ArrowLeft, Compass } from 'lucide-react';
import Link from 'next/link';

export default function LocationsDirectoryPage() {
  const { data: governorates, isLoading } = useGovernorates();

  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-5xl mx-auto space-y-6 text-right">
        {/* Navigation & Actions Top Bar */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/" label="العودة للرئيسية" variant="pill" />
          <Link href="/locations/suggest">
            <Button variant="outline" size="sm" className="gap-1.5 font-bold text-red-600 border-red-200 hover:bg-red-50">
              <Plus className="w-4 h-4" />
              <span>اقترح مكانًا جديدًا</span>
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100 mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>التقسيم الإداري لجمهورية مصر العربية</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-red-600" />
              <span>محافظات مصر (27 محافظة)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              تصفح الأحداث الموثقة والمراكز والقرى في جميع محافظات الجمهورية لحظة بلحظة.
            </p>
          </div>
        </div>

        {/* Governorates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {governorates?.map((gov) => (
              <Link
                key={gov.id}
                href={`/locations/${gov.id}`}
                className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-red-200 hover:shadow-md transition group flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-red-600 transition-colors">
                    {gov.nameAr}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{gov.nameEn}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-red-50 text-slate-400 group-hover:text-red-600 flex items-center justify-center transition">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
