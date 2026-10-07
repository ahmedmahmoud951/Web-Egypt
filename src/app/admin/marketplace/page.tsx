'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { superAppAdminApi, MarketplaceListingItem, MarketplaceCategoryItem } from '@/api/superAppAdmin';
import { locationsApi } from '@/api/locations';
import { Button } from '@/components/ui/Button';
import { formatRelativeArabicTime, formatArabicDate } from '@/lib/utils';
import {
  ShoppingBag,
  Tag,
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Eye,
  Calendar,
  X,
  Trash2,
  ArrowUpDown,
  Car,
  Home,
  Smartphone,
  Briefcase,
  Wrench,
  Shirt,
  Armchair,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Check,
  Star,
} from 'lucide-react';

// Category icon & color mapping helper
function getCategoryDesign(nameAr: string, slug?: string) {
  const text = (nameAr + ' ' + (slug || '')).toLowerCase();

  if (text.includes('سيار') || text.includes('مركب') || text.includes('car')) {
    return {
      icon: Car,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
    };
  }
  if (text.includes('عقار') || text.includes('شقق') || text.includes('أراض') || text.includes('real')) {
    return {
      icon: Home,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
    };
  }
  if (text.includes('إلكترون') || text.includes('موبايل') || text.includes('هواتف') || text.includes('tech') || text.includes('electr')) {
    return {
      icon: Smartphone,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
      glow: 'shadow-sky-500/20',
    };
  }
  if (text.includes('وظائف') || text.includes('عمل') || text.includes('مهن') || text.includes('job')) {
    return {
      icon: Briefcase,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20',
    };
  }
  if (text.includes('خدم') || text.includes('صيان') || text.includes('حرف') || text.includes('servic')) {
    return {
      icon: Wrench,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
    };
  }
  if (text.includes('ملابس') || text.includes('أزياء') || text.includes('موضة') || text.includes('fash') || text.includes('cloth')) {
    return {
      icon: Shirt,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30',
      glow: 'shadow-pink-500/20',
    };
  }
  if (text.includes('أثاث') || text.includes('ديكور') || text.includes('منزل') || text.includes('furnit')) {
    return {
      icon: Armchair,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      glow: 'shadow-violet-500/20',
    };
  }

  return {
    icon: Tag,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
  };
}

export default function AdminMarketplacePage() {
  const queryClient = useQueryClient();

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'featured' | 'verified'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'views'>('newest');
  const [previewListing, setPreviewListing] = useState<MarketplaceListingItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['admin', 'marketplace', 'categories'],
    queryFn: () => superAppAdminApi.getCategories(),
    staleTime: 300_000,
  });

  const { data: governorates = [] } = useQuery({
    queryKey: ['locations', 'governorates'],
    queryFn: () => locationsApi.getGovernorates(),
    staleTime: 600_000,
  });

  const {
    data: rawListings = [],
    isLoading: isLoadingListings,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'marketplace', 'listings', selectedLocationId, selectedCategoryId],
    queryFn: () =>
      superAppAdminApi.getListings({
        locationId: selectedLocationId || undefined,
        categoryId: selectedCategoryId || undefined,
        pageSize: 100,
      }),
    staleTime: 60_000,
  });

  // Mutations (Promote / Delete)
  const promoteMutation = useMutation({
    mutationFn: (listingId: string) => superAppAdminApi.promoteListing(listingId, 7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'listings'] });
      showMessage('تم تمييز الإعلان بنجاح لمدة 7 أيام ⭐');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (listingId: string) => superAppAdminApi.deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'listings'] });
      setDeleteConfirmId(null);
      if (previewListing) setPreviewListing(null);
      showMessage('تم حذف الإعلان من السوق نهائياً.');
    },
  });

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Client-side filtering & sorting
  const filteredListings = useMemo(() => {
    let result = [...rawListings];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.sellerName?.toLowerCase().includes(q) ||
          item.locationName?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q)
      );
    }

    if (filterMode === 'featured') {
      result = result.filter((item) => item.isFeatured);
    } else if (filterMode === 'verified') {
      result = result.filter((item) => item.sellerIsVerified);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price_asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price_desc') {
        return b.price - a.price;
      }
      if (sortBy === 'views') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      return 0;
    });

    return result;
  }, [rawListings, search, filterMode, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = rawListings.length;
    const featured = rawListings.filter((i) => i.isFeatured).length;
    const verifiedSellers = rawListings.filter((i) => i.sellerIsVerified).length;
    const totalViews = rawListings.reduce((sum, i) => sum + (i.viewsCount || 0), 0);
    return { total, featured, verifiedSellers, totalViews };
  }, [rawListings]);

  return (
    <AdminShell>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto" dir="rtl">
        {/* Flash Message Banner */}
        {actionMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 text-white font-bold px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 1. HERO HEADER WITH ELEGANT GRADIENT */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#101726] via-[#0E1522] to-[#0A0E17] border border-white/10 p-6 md:p-10 shadow-2xl">
          {/* Ambient decorative lights */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>النسخة الاحترافية · SuperApp Marketplace</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
                  <ShoppingBag className="w-7 h-7" />
                </span>
                <span>سوق مصر والخدمات المحلية</span>
              </h1>
              <p className="text-sm md:text-base text-gray-300 max-w-2xl leading-relaxed">
                المنصة المركزية المتكاملة لإدارة إعلانات البيع والشراء والسيارات والعقارات والوظائف والخدمات بكافة محافظات جمهورية مصر العربية، مع أنظمة التوثيق والترويج الفوري.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/admin/marketplace/packages"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl px-5 py-2.5 text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>باقات إعلانات الماركات ⭐</span>
              </Link>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-2xl px-5 py-2.5 transition"
              >
                <RotateCcw className={`w-4 h-4 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isFetching ? 'جاري التحديث...' : 'تحديث البيانات'}</span>
              </Button>
            </div>
          </div>

          {/* 4 LIVE KPI METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-amber-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">إجمالي المعروض</span>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-white">{stats.total.toLocaleString()}</div>
              <span className="text-[11px] text-gray-400">إعلان نشط في السوق</span>
            </div>

            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-amber-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">الإعلانات المميزة</span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-400">{stats.featured.toLocaleString()}</div>
              <span className="text-[11px] text-gray-400">إعلان ممول ذو ظهور مضاعف</span>
            </div>

            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-amber-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">بائعون موثقون</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400">{stats.verifiedSellers.toLocaleString()}</div>
              <span className="text-[11px] text-gray-400">بائع موثق برقم الهوية</span>
            </div>

            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-amber-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">إجمالي المشاهدات</span>
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-purple-300">{stats.totalViews.toLocaleString()}</div>
              <span className="text-[11px] text-gray-400">تفاعل واهتمام من المشترين</span>
            </div>
          </div>
        </div>

        {/* 2. CATEGORIES HORIZONTAL NAVIGATION PILLS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>تصفح حسب القسم الرئيسي</span>
            </h2>
            {selectedCategoryId !== null && (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>عرض كل الأقسام</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* "All" Category Pill */}
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all duration-300 ${
                selectedCategoryId === null
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                  : 'bg-[#121824] border border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>جميع الأقسام</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  selectedCategoryId === null ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-gray-400'
                }`}
              >
                {rawListings.length}
              </span>
            </button>

            {/* Dynamic Categories from DB */}
            {categories.map((cat) => {
              const design = getCategoryDesign(cat.nameAr, cat.slug);
              const Icon = design.icon;
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                  className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.02]'
                      : 'bg-[#121824] border border-white/10 text-gray-300 hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`p-1 rounded-lg ${isSelected ? 'bg-black/10' : design.bg}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-slate-950' : design.color}`} />
                  </div>
                  <span>{cat.nameAr}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {cat.listingsCount ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DOCK CONTROLS (SEARCH, GOVERNORATE FILTER, MODES, SORT) */}
        <div className="bg-[#121824]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الوصف، اسم البائع، أو الكلمة المفتاحية..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-11 py-2.5 bg-black/30 border border-white/10 focus:border-amber-400/60 rounded-xl text-white text-xs md:text-sm placeholder-gray-500 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Governorate Dropdown */}
            <div className="relative">
              <select
                value={selectedLocationId || ''}
                onChange={(e) => setSelectedLocationId(e.target.value ? Number(e.target.value) : null)}
                className="appearance-none bg-black/30 border border-white/10 focus:border-amber-400/60 text-gray-200 text-xs rounded-xl px-3.5 py-2.5 pr-8 outline-none font-semibold cursor-pointer transition"
              >
                <option value="">جميع المحافظات 🇪🇬</option>
                {governorates.map((gov) => (
                  <option key={gov.id} value={gov.id} className="bg-slate-900 text-white">
                    {gov.nameAr}
                  </option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 text-rose-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Filter Modes: All / Featured / Verified */}
            <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterMode === 'all' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterMode('featured')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  filterMode === 'featured' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>المميزة</span>
              </button>
              <button
                onClick={() => setFilterMode('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  filterMode === 'verified' ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-emerald-400'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>الموثقون</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-black/30 border border-white/10 focus:border-amber-400/60 text-gray-200 text-xs rounded-xl px-3.5 py-2.5 pr-8 outline-none font-semibold cursor-pointer transition"
              >
                <option value="newest" className="bg-slate-900 text-white">
                  الأحدث نشرًا 🕒
                </option>
                <option value="price_asc" className="bg-slate-900 text-white">
                  السعر: من الأقل للأعلى 📈
                </option>
                <option value="price_desc" className="bg-slate-900 text-white">
                  السعر: من الأعلى للأقل 📉
                </option>
                <option value="views" className="bg-slate-900 text-white">
                  الأكثر مشاهدة 🔥
                </option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <div>
            تم العثور على <span className="font-bold text-white">{filteredListings.length}</span> إعلان متاح
            {search && (
              <span>
                {' '}
                مطابق لكلمة البحث: &quot;<span className="text-amber-400 font-semibold">{search}</span>&quot;
              </span>
            )}
          </div>
          {(selectedCategoryId || selectedLocationId || filterMode !== 'all' || search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategoryId(null);
                setSelectedLocationId(null);
                setFilterMode('all');
              }}
              className="text-amber-400 hover:underline font-semibold"
            >
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>

        {/* 4. LISTINGS GRID (LUXURIOUS CARDS) */}
        {isLoadingListings ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-base font-bold text-white">جاري جلب إعلانات سوق مصر...</div>
            <div className="text-xs text-gray-400 mt-1">يتم استرجاع الإعلانات الموثقة والأسعار الحية مباشرة</div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="p-16 text-center bg-[#101724] border border-white/10 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">لا توجد إعلانات مطابقة للاختيارات الحالية</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              جرّب تغيير قسم التصفح أو اختيار محافظة أخرى أو مسح كلمة البحث لرؤية كافة إعلانات السوق المتاحة.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setSelectedCategoryId(null);
                setSelectedLocationId(null);
                setFilterMode('all');
              }}
              className="mt-2 text-xs border-white/15"
            >
              عرض كافة إعلانات السوق
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => {
              const categoryDesign = getCategoryDesign(item.categoryName);
              const CatIcon = categoryDesign.icon;
              const hasImages = item.images && item.images.length > 0;
              const displayImage = hasImages ? item.images[0] : null;

              return (
                <div
                  key={item.id}
                  className="group bg-gradient-to-b from-[#131B28] to-[#0D121B] border border-white/10 hover:border-amber-400/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header with Badges */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-900/80">
                      {displayImage ? (
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                          style={{ backgroundImage: `url(${displayImage})` }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-white/[0.02]">
                          <ShoppingBag className="w-12 h-12 opacity-30 mb-2" />
                          <span className="text-xs text-gray-500">لا توجد صورة مرفقة</span>
                        </div>
                      )}

                      {/* Dark Gradient Overlay on Image Bottom for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131B28] via-transparent to-black/30 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                        {/* Featured Badge */}
                        {item.isFeatured ? (
                          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black px-3 py-1 rounded-full text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                            <span>إعلان مميز</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        {/* Condition Badge */}
                        {item.condition && (
                          <div className="bg-black/70 backdrop-blur-md text-white border border-white/20 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow">
                            {item.condition}
                          </div>
                        )}
                      </div>

                      {/* Bottom Floating Location Pill */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-gray-200 border border-white/15 px-3 py-1 rounded-full text-xs font-semibold shadow">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{item.locationName || 'مصر'}</span>
                      </div>

                      {/* Multiple Images Indicator */}
                      {item.images && item.images.length > 1 && (
                        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
                          {item.images.length} صور 📷
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3.5">
                      {/* Category & Time */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`p-1 rounded-md ${categoryDesign.bg} ${categoryDesign.color} border ${categoryDesign.border}`}
                          >
                            <CatIcon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-bold text-gray-300">{item.categoryName}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatRelativeArabicTime(item.createdAt)}</span>
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setPreviewListing(item)}
                        className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer"
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {item.description || 'لا يوجد وصف تفصيلي إضافي.'}
                      </p>

                      {/* Price Tag (Heroic Gradient) */}
                      <div className="pt-2 flex items-baseline justify-between border-t border-white/5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black bg-gradient-to-l from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                            {item.price > 0 ? item.price.toLocaleString() : 'السعر عند التواصل'}
                          </span>
                          {item.price > 0 && (
                            <span className="text-xs font-bold text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              {item.currency || 'ج.م'}
                            </span>
                          )}
                        </div>

                        {/* Views counter */}
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{item.viewsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Seller Info & Actions */}
                  <div className="px-5 py-3.5 bg-black/40 border-t border-white/10 space-y-3">
                    {/* Seller Trust Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/30 to-blue-500/30 border border-white/20 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                          {item.sellerAvatar ? (
                            <img src={item.sellerAvatar} alt={item.sellerName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{item.sellerName ? item.sellerName.charAt(0) : 'ب'}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-200 flex items-center gap-1">
                            <span>{item.sellerName || 'بائع معتمد'}</span>
                            {item.sellerIsVerified && (
                              <span
                                className="inline-flex items-center text-sky-400 bg-sky-500/10 rounded-full p-0.5"
                                title="بائع موثق برقم الهوية"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 fill-sky-500 text-black" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {item.sellerIsVerified ? 'بائع موثق بالهوية 🛡️' : 'عضو في مجتمع مصر'}
                          </span>
                        </div>
                      </div>

                      {/* Quick View Button */}
                      <button
                        onClick={() => {
                          setPreviewListing(item);
                          setCurrentImageIndex(0);
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تفاصيل</span>
                      </button>
                    </div>

                    {/* Action Triggers: Phone / WhatsApp / Admin Options */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      {item.contactPhone ? (
                        <a
                          href={`tel:${item.contactPhone}`}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          <span>اتصال</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.02] text-gray-600 text-xs font-semibold border border-white/5 cursor-not-allowed"
                        >
                          <Phone className="w-3.5 h-3.5 opacity-40" />
                          <span>غير محدد</span>
                        </button>
                      )}

                      {item.contactWhatsApp ? (
                        <a
                          href={`https://wa.me/${item.contactWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `مرحباً، أستفسر عن إعلانك المعروض في سوق مصر: ${item.title}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition shadow-sm hover:shadow-emerald-500/20"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-black" />
                          <span>واتساب</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.02] text-gray-600 text-xs font-semibold border border-white/5 cursor-not-allowed"
                        >
                          <MessageCircle className="w-3.5 h-3.5 opacity-40" />
                          <span>لا يوجد واتساب</span>
                        </button>
                      )}
                    </div>

                    {/* Admin Specific Controls: Promote / Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <button
                        onClick={() => promoteMutation.mutate(item.id)}
                        disabled={promoteMutation.isPending || item.isFeatured}
                        className={`flex items-center gap-1 font-semibold transition ${
                          item.isFeatured
                            ? 'text-amber-400 cursor-default'
                            : 'text-gray-400 hover:text-amber-400 hover:underline'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{item.isFeatured ? 'مميز بالفعل ⭐' : 'ترقية لإعلان مميز'}</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="text-rose-400/80 hover:text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف الإعلان</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. QUICK VIEW DETAILS MODAL */}
        {previewListing && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div
              className="bg-[#101724] border border-white/15 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-8"
              dir="rtl"
            >
              {/* Close Button */}
              <button
                onClick={() => setPreviewListing(null)}
                className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center border border-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Image Carousel */}
              <div className="relative h-72 md:h-96 w-full bg-black flex items-center justify-center overflow-hidden">
                {previewListing.images && previewListing.images.length > 0 ? (
                  <img
                    src={previewListing.images[currentImageIndex] || previewListing.images[0]}
                    alt={previewListing.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-500 flex flex-col items-center">
                    <ShoppingBag className="w-16 h-16 opacity-30 mb-2" />
                    <span>لا توجد صور لهذا الإعلان</span>
                  </div>
                )}

                {/* Multiple Images Navigation Controls */}
                {previewListing.images && previewListing.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === 0 ? previewListing.images.length - 1 : prev - 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center border border-white/20 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === previewListing.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center border border-white/20 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10">
                      {previewListing.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            idx === currentImageIndex ? 'bg-amber-400 w-6' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Content Details */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                        {previewListing.categoryName}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {previewListing.locationName}
                      </span>
                      {previewListing.condition && (
                        <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">
                          الحالة: {previewListing.condition}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-white pt-2">{previewListing.title}</h2>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="text-xs text-gray-400">السعر المطلوب</div>
                    <div className="text-3xl font-black text-emerald-400">
                      {previewListing.price > 0 ? previewListing.price.toLocaleString() : 'عند التواصل'}
                      {previewListing.price > 0 && <span className="text-sm font-bold text-gray-400 mr-1.5">ج.م</span>}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-300">تفاصيل ووصف الإعلان</h4>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-2xl border border-white/5">
                    {previewListing.description || 'لم يقم البائع بإضافة وصف إضافي.'}
                  </p>
                </div>

                {/* Seller & Contact Block */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-lg">
                      {previewListing.sellerName ? previewListing.sellerName.charAt(0) : 'ب'}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>{previewListing.sellerName}</span>
                        {previewListing.sellerIsVerified && (
                          <span title="بائع موثق برقم الهوية الوطنية">
                            <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400 text-black" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        تاريخ النشر: {formatArabicDate(previewListing.createdAt)} · {previewListing.viewsCount || 0} مشاهدة
                      </div>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto">
                    {previewListing.contactPhone && (
                      <a
                        href={`tel:${previewListing.contactPhone}`}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                      >
                        <Phone className="w-4 h-4 text-blue-400" />
                        <span>اتصال ({previewListing.contactPhone})</span>
                      </a>
                    )}
                    {previewListing.contactWhatsApp && (
                      <a
                        href={`https://wa.me/${previewListing.contactWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `مرحباً، أستفسر عن إعلانك المعروض في سوق مصر: ${previewListing.title}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>محادثة واتساب</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Modal Admin Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      promoteMutation.mutate(previewListing.id);
                    }}
                    disabled={previewListing.isFeatured}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{previewListing.isFeatured ? 'الإعلان مميز حالياً ⭐' : 'ترقية إلى إعلان مميز'}</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(previewListing.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الإعلان المخالف</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. DELETE CONFIRMATION DIALOG */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-[#141C2B] border border-rose-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 shadow-2xl text-center" dir="rtl">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">هل أنت متأكد من حذف هذا الإعلان؟</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                سيتم حذف الإعلان نهائياً من قاعدة بيانات سوق مصر ولن يتمكن أي مستخدم أو زائر من الوصول إليه مجدداً.
              </p>
              <div className="flex items-center justify-center gap-3 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-xs border-white/15 px-5"
                >
                  إلغاء التراجع
                </Button>
                <Button
                  variant="danger"
                  onClick={() => deleteMutation.mutate(deleteConfirmId)}
                  isLoading={deleteMutation.isPending}
                  className="text-xs px-5 bg-rose-500 hover:bg-rose-600 text-white font-bold"
                >
                  نعم، احذف الإعلان
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
