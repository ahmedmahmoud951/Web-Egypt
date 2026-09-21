'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGovernorates } from '@/hooks/useLocations';
import { useCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { MapPin, Tag, Plus, Home, Cpu } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { data: governorates, isLoading: isGovLoading } = useGovernorates();
  const { data: categories, isLoading: isCatLoading } = useCategories();

  return (
    <aside className="w-64 shrink-0 hidden lg:block space-y-6">
      {/* Main Navigation */}
      <div className="glass-card bg-white/95 rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-1">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition',
            pathname === '/'
              ? 'bg-red-50 text-red-700 font-bold'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
        <Link
          href="/architecture"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition',
            pathname === '/architecture'
              ? 'bg-red-50 text-red-700 font-bold'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Cpu className="w-4 h-4 text-red-600" />
          <span>المنظومة والتقنيات</span>
        </Link>
        <Link
          href="/locations"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition',
            pathname === '/locations'
              ? 'bg-red-50 text-red-700 font-bold'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <MapPin className="w-4 h-4" />
          <span>دليل المحافظات</span>
        </Link>
        <Link
          href="/locations/suggest"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition',
            pathname === '/locations/suggest'
              ? 'bg-red-50 text-red-700 font-bold'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Plus className="w-4 h-4" />
          <span>اقترح مكانًا جديدًا</span>
        </Link>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
          <Tag className="w-4 h-4 text-red-600" />
          <span>التصنيفات</span>
        </div>
        {isCatLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-slate-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/?categoryId=${cat.id}`}
                className="text-xs px-2.5 py-1 bg-slate-50 hover:bg-red-50 hover:text-red-700 rounded-lg text-slate-600 border border-slate-100 transition"
              >
                {cat.nameAr}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Governorates List */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-3">
          <MapPin className="w-4 h-4 text-red-600" />
          <span>محافظات مصر</span>
        </div>
        {isGovLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-slate-100 rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1 pl-1">
            {governorates?.map((gov) => (
              <Link
                key={gov.id}
                href={`/locations/${gov.id}`}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <span>{gov.nameAr}</span>
                <span className="text-[10px] text-slate-400">{gov.nameEn}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
