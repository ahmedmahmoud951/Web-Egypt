'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  superAppAdminApi,
  MarketplaceAdPackageDto,
  MarketplacePromotionDto,
} from '@/api/superAppAdmin';
import { formatArabicDate } from '@/lib/utils';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MousePointerClick,
  CheckCircle2,
  X,
  Coins,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Crown,
  Flame,
  User,
  Phone,
  MessageCircle,
  Tag,
  MapPin,
  Calendar,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Smartphone,
  Check,
  ToggleLeft,
  ToggleRight,
  Radio,
  Timer,
} from 'lucide-react';

export default function AdminMarketplacePackagesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'packages' | 'promotions' | 'simulator'>('packages');
  const [editingPackage, setEditingPackage] = useState<Partial<MarketplaceAdPackageDto> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Promotions tab state
  const [searchPromo, setSearchPromo] = useState('');
  const [promoFilter, setPromoFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [selectedPromotionForDetail, setSelectedPromotionForDetail] = useState<MarketplacePromotionDto | null>(null);

  // Simulator state
  const [selectedSimPackageId, setSelectedSimPackageId] = useState<string | number>(1);

  // Fetch Packages
  const { data: packages = [], isLoading: isLoadingPackages } = useQuery({
    queryKey: ['admin', 'marketplace', 'packages'],
    queryFn: () => superAppAdminApi.getAdminAdPackages(),
  });

  // Fetch Live Promotions
  const { data: promotions = [], isLoading: isLoadingPromotions } = useQuery({
    queryKey: ['admin', 'marketplace', 'promotions'],
    queryFn: () => superAppAdminApi.getAdminPromotions(),
  });

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Create / Update Package Mutation
  const savePackageMutation = useMutation({
    mutationFn: async (data: Partial<MarketplaceAdPackageDto>) => {
      if (data.id) {
        return superAppAdminApi.updateAdminAdPackage(String(data.id), data);
      } else {
        return superAppAdminApi.createAdminAdPackage(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'packages'] });
      setIsModalOpen(false);
      setEditingPackage(null);
      showToast('تم حفظ وتحديث بيانات الباقة بنجاح!');
    },
  });

  // Toggle / Delete Package Mutation
  const togglePackageMutation = useMutation({
    mutationFn: (id: string | number) => superAppAdminApi.deleteAdminAdPackage(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'packages'] });
      showToast('تم تغيير حالة تفعيل الباقة بنجاح.');
    },
  });

  const handleOpenAdd = () => {
    setEditingPackage({
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      priceEgp: 100,
      pricePoints: 200,
      durationDays: 7,
      reachMultiplier: 5,
      badgeText: 'إعلان ممول',
      badgeColor: '#C4A35A',
      appearanceStyle: 'FacebookSponsoredFeed',
      isTopPinned: false,
      isHighlighted: true,
      isActive: true,
      displayOrder: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: MarketplaceAdPackageDto) => {
    setEditingPackage({ ...pkg });
    setIsModalOpen(true);
  };

  // Analytics Metrics
  const totalRevenueEgp = promotions.reduce((sum, p) => sum + (p.paidAmountEgp || 0), 0);
  const totalRevenuePoints = promotions.reduce(
    (sum, p) => sum + (p.pointsDeducted || p.paidPoints || 0),
    0
  );
  const totalImpressions = promotions.reduce(
    (sum, p) => sum + (p.viewsCount || p.impressionCount || 0),
    0
  );
  const totalClicks = promotions.reduce(
    (sum, p) => sum + (p.clicksCount || p.clickCount || 0),
    0
  );
  const activeCampaignsCount = promotions.filter((p) => p.isActive).length;

  // Filtered Promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      // Filter by status
      if (promoFilter === 'active' && !p.isActive) return false;
      if (promoFilter === 'expired' && p.isActive) return false;

      // Filter by search query
      if (searchPromo.trim()) {
        const q = searchPromo.trim().toLowerCase();
        const seller = (p.sellerName || '').toLowerCase();
        const phone = (p.sellerPhoneNumber || '').toLowerCase();
        const title = (p.listingTitle || '').toLowerCase();
        const pkg = (p.packageNameAr || '').toLowerCase();
        return (
          seller.includes(q) ||
          phone.includes(q) ||
          title.includes(q) ||
          pkg.includes(q)
        );
      }
      return true;
    });
  }, [promotions, promoFilter, searchPromo]);

  // Selected package for simulator
  const activeSimPackage = useMemo(() => {
    return (
      packages.find((p) => String(p.id) === String(selectedSimPackageId)) ||
      packages[0] ||
      null
    );
  }, [packages, selectedSimPackageId]);

  return (
    <AdminShell>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto" dir="rtl">
        {/* Flash Message */}
        {actionMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 text-white font-bold px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Header Breadcrumb & Title */}
        <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-[#10192B] to-amber-950/40 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Link href="/admin/marketplace" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
                <ShoppingBag className="w-3.5 h-3.5" />
                سوق مصر
              </Link>
              <span>/</span>
              <span className="text-amber-400 font-black">منظومة إعلانات الماركات (Brand Boosts)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
              منظومة إعلانات الماركات والترويج المميز
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحكم كامل في باقات الإعلانات المدفوعة، تسعير النقاط والكاش، متابعة أصحاب الحسابات المعلنين، الإعلانات المروجة، ومحاكاة ظهور الإعلانات في التطبيق والويب.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-xl shadow-amber-500/20 transition-all transform active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              إنشاء باقة إعلانات جديدة
            </button>
          </div>
        </div>

        {/* Analytics Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2 hover:border-emerald-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>إجمالي أرباح الكاش</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {totalRevenueEgp.toLocaleString()} <span className="text-sm font-normal text-slate-400">ج.م</span>
            </div>
            <p className="text-[11px] text-slate-400">مخصومة فورياً من محافظ التجار والمشتركين</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2 hover:border-amber-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>نقاط المكافآت المستهلكة</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {totalRevenuePoints.toLocaleString()} <span className="text-sm font-normal text-slate-400">نقطة</span>
            </div>
            <p className="text-[11px] text-slate-400">من أرباح الإحالات الفيروسية (استهلاك داخلي)</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2 hover:border-sky-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>إجمالي المشاهدات (Impressions)</span>
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400 font-mono">
              {totalImpressions.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">عرض في التغذية الرئيسية وصفحات البحث</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-2 hover:border-purple-500/30 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>الحملات النشطة ونسبة التفاعل</span>
              <MousePointerClick className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono flex items-center justify-between">
              <span>{activeCampaignsCount} نشطة</span>
              <span className="text-sm text-slate-400 font-normal">
                CTR: {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{totalClicks.toLocaleString()} نقرة مسجلة</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
              activeTab === 'packages'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            باقات الإعلانات المتاحة ({packages.length})
          </button>

          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
              activeTab === 'promotions'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            الحملات النشطة والمعلنون ({promotions.length})
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${
              activeTab === 'simulator'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            المحاكي المباشر لشكل الإعلان 📱
          </button>
        </div>

        {/* TAB 1: PACKAGES LIST */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingPackages ? (
              <div className="col-span-full py-16 text-center text-slate-400 font-bold">
                جاري تحميل باقات الإعلانات...
              </div>
            ) : packages.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 font-bold bg-slate-900/50 rounded-3xl border border-slate-800">
                لا توجد باقات معرّفة حالياً. انقر على &quot;إنشاء باقة إعلانات جديدة&quot; للبدء.
              </div>
            ) : (
              packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                    pkg.isActive
                      ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-950/20'
                      : 'bg-slate-900/40 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-black shadow-sm"
                        style={{
                          backgroundColor: `${pkg.badgeColor}25`,
                          color: pkg.badgeColor,
                          border: `1px solid ${pkg.badgeColor}50`,
                        }}
                      >
                        {pkg.badgeText || 'إعلان مميز'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {pkg.isTopPinned && (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Crown className="w-3 h-3" /> مثبت بالأعلى
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            pkg.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {pkg.isActive ? 'مفعّلة' : 'معطّلة'}
                        </span>
                      </div>
                    </div>

                    {/* Package Name & Desc */}
                    <div>
                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                        {pkg.nameAr}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">{pkg.nameEn}</p>
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">{pkg.descriptionAr}</p>
                    </div>

                    {/* Features & Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> المدة
                        </span>
                        <div className="font-black text-white font-mono">{pkg.durationDays} يوم</div>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-0.5">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-400" /> مضاعفة الوصول
                        </span>
                        <div className="font-black text-rose-400 font-mono">{pkg.reachMultiplier}x ضعف</div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 to-slate-950 border border-amber-500/20 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400">سعر المحفظة</div>
                        <div className="text-base font-black text-emerald-400 font-mono">
                          {pkg.priceEgp} ج.م
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] text-slate-400">سعر النقاط</div>
                        <div className="text-base font-black text-amber-400 font-mono">
                          {pkg.pricePoints} نقطة
                        </div>
                      </div>
                    </div>

                    {/* Preview Appearance Banner */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>نمط البطاقة:</span>
                      <code className="text-amber-400 font-mono">{pkg.appearanceStyle}</code>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenEdit(pkg)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> تعديل
                    </button>
                    <button
                      onClick={() => togglePackageMutation.mutate(pkg.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors flex items-center gap-1.5 ${
                        pkg.isActive
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                      title={pkg.isActive ? 'تعطيل الباقة' : 'تفعيل الباقة'}
                    >
                      {pkg.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                          <span>تعطيل</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                          <span>تفعيل</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE PROMOTIONS & ADVERTISERS */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchPromo}
                  onChange={(e) => setSearchPromo(e.target.value)}
                  placeholder="بحث باسم المعلن، هاتفه، أو السلعة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPromoFilter('all')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    promoFilter === 'all'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  الكل ({promotions.length})
                </button>
                <button
                  onClick={() => setPromoFilter('active')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    promoFilter === 'active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  النشطة الآن ({promotions.filter((p) => p.isActive).length})
                </button>
                <button
                  onClick={() => setPromoFilter('expired')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    promoFilter === 'expired'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  المنتهية ({promotions.filter((p) => !p.isActive).length})
                </button>
              </div>
            </div>

            {/* Promotions Table */}
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-white text-lg">سجل الحملات والمعلنون بالتفصيل</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    بيانات صاحب الحساب المعلن، السلعة المروجة، الوقت المتبقي، الباقة، والتفاعل الحي.
                  </p>
                </div>
              </div>

              {isLoadingPromotions ? (
                <div className="p-16 text-center text-slate-400 font-bold">جاري تحميل سجل الحملات...</div>
              ) : filteredPromotions.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-bold">
                  لا توجد حملات تطابق البحث أو الفلتر المحدد.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950/70 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">صاحب الحساب (المعلن)</th>
                        <th className="p-4">السلعة / الإعلان المروج</th>
                        <th className="p-4">الباقة المختارة</th>
                        <th className="p-4">الوقت المتبقي والانتهاء</th>
                        <th className="p-4">طريقة السداد</th>
                        <th className="p-4">المشاهدات والنقرات</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPromotions.map((promo) => (
                        <tr key={promo.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Advertiser Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-amber-400 text-xs border border-white/10">
                                {promo.sellerAvatarUrl ? (
                                  <img
                                    src={promo.sellerAvatarUrl}
                                    alt={promo.sellerName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{(promo.sellerName || 'م').charAt(0)}</span>
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <span>{promo.sellerName}</span>
                                  {promo.sellerIsVerified && (
                                    <span title="حساب موثق">
                                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                    </span>
                                  )}
                                </div>
                                {promo.sellerPhoneNumber && (
                                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-cyan-400" />
                                    <span dir="ltr">{promo.sellerPhoneNumber}</span>
                                  </div>
                                )}
                                {promo.sellerUsername && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    @{promo.sellerUsername}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Listing Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {promo.listingImageUrl && (
                                <img
                                  src={promo.listingImageUrl}
                                  alt={promo.listingTitle}
                                  className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                                />
                              )}
                              <div className="space-y-0.5 max-w-[200px]">
                                <div className="font-bold text-white truncate hover:text-amber-400 transition-colors">
                                  {promo.listingTitle || 'إعلان بدون عنوان'}
                                </div>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className="font-mono text-emerald-400 font-black">
                                    {(promo.listingPrice || 0).toLocaleString()} ج.م
                                  </span>
                                  {promo.listingCategoryName && (
                                    <span className="text-slate-400 text-[10px] truncate">
                                      • {promo.listingCategoryName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Package Info */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[11px] font-black inline-block shadow-sm"
                                style={{
                                  backgroundColor: `${promo.badgeColor || '#C4A35A'}25`,
                                  color: promo.badgeColor || '#C4A35A',
                                  border: `1px solid ${promo.badgeColor || '#C4A35A'}50`,
                                }}
                              >
                                {promo.packageNameAr || promo.badgeText || 'باقة ترويج'}
                              </span>
                              <div className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                <span>مضاعف الوصول: {promo.reachMultiplier || 5}x</span>
                              </div>
                            </div>
                          </td>

                          {/* Remaining Time & Status */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${
                                    promo.isActive
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{promo.remainingTimeFormatted || (promo.isActive ? 'نشط الآن' : 'منتهي')}</span>
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                ينتهي: {formatArabicDate(promo.endDate || promo.expiresAt || '')}
                              </div>
                            </div>
                          </td>

                          {/* Payment Method */}
                          <td className="p-4 font-mono font-bold">
                            {promo.paidUsingPoints || promo.paymentMethod === 'RewardPoints' ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5" />
                                {promo.pointsDeducted || promo.paidPoints || 0} نقطة
                              </span>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                {promo.paidAmountEgp} ج.م (محفظة)
                              </span>
                            )}
                          </td>

                          {/* Analytics */}
                          <td className="p-4">
                            <div className="space-y-0.5 font-mono text-xs">
                              <div className="text-sky-400 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{(promo.viewsCount || promo.impressionCount || 0).toLocaleString()} مشاهدة</span>
                              </div>
                              <div className="text-purple-400 flex items-center gap-1 text-[11px]">
                                <MousePointerClick className="w-3 h-3" />
                                <span>{(promo.clicksCount || promo.clickCount || 0).toLocaleString()} نقرة</span>
                                <span className="text-[10px] text-slate-400">
                                  ({promo.ctrPercentage || 0}%)
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setSelectedPromotionForDetail(promo)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-1 transition-colors mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل الكاملة</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVE FEED SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Controls */}
            <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5">
              <div className="space-y-1">
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  محاكي مظهر الإعلانات
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اختبر كيف تظهر الشارات المتوهجة، أنماط فيسبوك، والإطارات الذهبية في تطبيق الهاتف وموقع الويب للمستخدمين.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">اختر الباقة للمعاينة:</label>
                <div className="space-y-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedSimPackageId(pkg.id)}
                      className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                        String(pkg.id) === String(selectedSimPackageId)
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-lg'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-white">{pkg.nameAr}</div>
                        <div className="text-[11px] text-slate-400">{pkg.appearanceStyle}</div>
                      </div>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                        style={{
                          backgroundColor: `${pkg.badgeColor}25`,
                          color: pkg.badgeColor,
                          border: `1px solid ${pkg.badgeColor}50`,
                        }}
                      >
                        {pkg.badgeText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Mockup Preview */}
            <div className="lg:col-span-2 flex items-center justify-center p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
              <div className="w-full max-w-sm rounded-[40px] bg-slate-900 border-4 border-slate-700/80 p-4 shadow-2xl relative overflow-hidden space-y-4">
                {/* Phone Notch */}
                <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto" />

                {/* Simulated Feed Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    خلاصة سوق مصر
                  </span>
                  <span className="text-[10px]">مباشر ⚡</span>
                </div>

                {/* SIMULATED AD CARD */}
                {activeSimPackage && (
                  <div
                    className={`rounded-3xl p-4 transition-all duration-300 space-y-3 ${
                      activeSimPackage.appearanceStyle === 'GoldenGlowVip'
                        ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20'
                        : activeSimPackage.appearanceStyle === 'TopPinnedSticky'
                        ? 'bg-slate-900 border-2 border-cyan-400/80 shadow-2xl shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {/* Top Sponsored Tag */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm"
                          style={{
                            backgroundColor: `${activeSimPackage.badgeColor}25`,
                            color: activeSimPackage.badgeColor,
                            border: `1px solid ${activeSimPackage.badgeColor}60`,
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{activeSimPackage.badgeText}</span>
                        </span>
                        {activeSimPackage.appearanceStyle === 'TopPinnedSticky' && (
                          <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Crown className="w-3 h-3" /> مثبت في الصدارة
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">برعاية معلنة</span>
                    </div>

                    {/* Listing Mock Thumbnail */}
                    <div className="relative aspect-video rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 overflow-hidden flex items-center justify-center border border-white/5">
                      <ShoppingBag className="w-12 h-12 text-slate-600" />
                      <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur text-white font-mono font-bold text-xs">
                        1,450,000 ج.م
                      </div>
                    </div>

                    {/* Listing Title & Seller */}
                    <div className="space-y-1">
                      <h4 className="font-black text-white text-sm">
                        مرسيدس C200 موديل 2024 بحالة الزيرو فابريكا
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        كاملة المواصفات، صيانة توكيل منتظمة، رخصة سارية سنتين، القاهرة - التجمع الخامس.
                      </p>
                    </div>

                    {/* Seller Profile row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                          ك
                        </div>
                        <div>
                          <div className="font-bold text-white text-[11px] flex items-center gap-1">
                            <span>كيان موتورز مصر</span>
                            <ShieldCheck className="w-3 h-3 text-sky-400" />
                          </div>
                          <div className="text-[9px] text-slate-400">تاجر موثق رسمي</div>
                        </div>
                      </div>

                      {/* Mock Contact buttons */}
                      <div className="flex items-center gap-1.5">
                        <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </span>
                        <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs">
                          <Phone className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Home Indicator */}
                <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CAMPAIGN FULL DETAILS & ADVERTISER INFO */}
        {selectedPromotionForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#0E1726] border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl text-right" dir="rtl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-white">تفاصيل الحملة الترويجية وصاحب الحساب</h2>
                    <p className="text-xs text-slate-400">سجل الإعلان والبيانات المالية ومعلومات الاتصال</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPromotionForDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status & Countdown Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  selectedPromotionForDetail.isActive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      {selectedPromotionForDetail.isActive ? 'الحملة نشطة وتظهر حالياً للمستخدمين' : 'الحملة منتهية الصلاحية'}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {selectedPromotionForDetail.remainingTimeFormatted} • ينتهي في{' '}
                      {formatArabicDate(selectedPromotionForDetail.endDate || selectedPromotionForDetail.expiresAt || '')}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-white/10 border border-white/20">
                  {selectedPromotionForDetail.isActive ? 'نشطة ✓' : 'منتهية ✕'}
                </span>
              </div>

              {/* SECTION 1: ADVERTISER / ACCOUNT OWNER */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>بيانات صاحب الحساب المعلن (Account Owner)</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-amber-400 text-sm border border-white/10">
                      {selectedPromotionForDetail.sellerAvatarUrl ? (
                        <img
                          src={selectedPromotionForDetail.sellerAvatarUrl}
                          alt={selectedPromotionForDetail.sellerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(selectedPromotionForDetail.sellerName || 'م').charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-white text-sm flex items-center gap-2">
                        <span>{selectedPromotionForDetail.sellerName}</span>
                        {selectedPromotionForDetail.sellerIsVerified && (
                          <span title="حساب موثق رسمياً">
                            <ShieldCheck className="w-4 h-4 text-sky-400" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span dir="ltr">{selectedPromotionForDetail.sellerPhoneNumber || 'بدون هاتف'}</span>
                        {selectedPromotionForDetail.sellerUsername && (
                          <span>(@{selectedPromotionForDetail.sellerUsername})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedPromotionForDetail.sellerPhoneNumber && (
                      <>
                        <a
                          href={`tel:${selectedPromotionForDetail.sellerPhoneNumber}`}
                          className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-cyan-500/30"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال</span>
                        </a>
                        <a
                          href={`https://wa.me/20${selectedPromotionForDetail.sellerPhoneNumber.replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-emerald-500/30"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>
                      </>
                    )}
                    <Link
                      href={`/admin/users/${selectedPromotionForDetail.sellerUserId}`}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>الملف</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROMOTED LISTING DETAILS */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>تفاصيل السلعة والإعلان المروج</span>
                </div>

                <div className="flex items-start gap-4 pt-2">
                  {selectedPromotionForDetail.listingImageUrl && (
                    <img
                      src={selectedPromotionForDetail.listingImageUrl}
                      alt={selectedPromotionForDetail.listingTitle}
                      className="w-20 h-20 rounded-2xl object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <h4 className="font-black text-white text-base">
                      {selectedPromotionForDetail.listingTitle}
                    </h4>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {(selectedPromotionForDetail.listingPrice || 0).toLocaleString()} ج.م
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {selectedPromotionForDetail.listingCategoryName && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-400" />
                          {selectedPromotionForDetail.listingCategoryName}
                        </span>
                      )}
                      {selectedPromotionForDetail.listingLocationName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {selectedPromotionForDetail.listingLocationName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PACKAGE & PAYMENT INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-400">الباقة المشترك بها</div>
                  <div className="font-black text-white text-base flex items-center gap-2">
                    <span>{selectedPromotionForDetail.packageNameAr}</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                      style={{
                        backgroundColor: `${selectedPromotionForDetail.badgeColor || '#C4A35A'}25`,
                        color: selectedPromotionForDetail.badgeColor || '#C4A35A',
                        border: `1px solid ${selectedPromotionForDetail.badgeColor || '#C4A35A'}50`,
                      }}
                    >
                      {selectedPromotionForDetail.badgeText}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    مضاعف المشاهدات: <span className="text-rose-400 font-bold">{selectedPromotionForDetail.reachMultiplier || 5}x</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-400">المبلغ المدفوع ومصدر السداد</div>
                  <div className="font-black text-emerald-400 text-base font-mono">
                    {selectedPromotionForDetail.paidUsingPoints ? (
                      <span className="text-amber-400">
                        {selectedPromotionForDetail.pointsDeducted || selectedPromotionForDetail.paidPoints || 0} نقطة مكافآت
                      </span>
                    ) : (
                      <span>{selectedPromotionForDetail.paidAmountEgp} ج.م (محفظة نقدية)</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    من: {formatArabicDate(selectedPromotionForDetail.startDate || selectedPromotionForDetail.startsAt || '')}
                  </div>
                </div>
              </div>

              {/* SECTION 4: LIVE STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">المشاهدات (Views)</div>
                  <div className="text-lg font-black text-sky-400 font-mono mt-1">
                    {(selectedPromotionForDetail.viewsCount || selectedPromotionForDetail.impressionCount || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">النقرات (Clicks)</div>
                  <div className="text-lg font-black text-purple-400 font-mono mt-1">
                    {(selectedPromotionForDetail.clicksCount || selectedPromotionForDetail.clickCount || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400">نسبة التفاعل (CTR)</div>
                  <div className="text-lg font-black text-amber-400 font-mono mt-1">
                    {selectedPromotionForDetail.ctrPercentage || 0}%
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedPromotionForDetail(null)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT PACKAGE */}
        {isModalOpen && editingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  {editingPackage.id ? 'تعديل باقة الإعلانات' : 'إضافة باقة إعلانات جديدة'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">اسم الباقة (بالعربية)</label>
                    <input
                      type="text"
                      value={editingPackage.nameAr || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, nameAr: e.target.value })}
                      placeholder="مثلاً: انطلاقة سريعة (Turbo Boost)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">اسم الباقة (بالإنجليزية)</label>
                    <input
                      type="text"
                      value={editingPackage.nameEn || ''}
                      onChange={(e) => setEditingPackage({ ...editingPackage, nameEn: e.target.value })}
                      placeholder="e.g. Turbo Boost"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">الوصف التسويقي للباقة (بالعربية)</label>
                  <textarea
                    rows={2}
                    value={editingPackage.descriptionAr || ''}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, descriptionAr: e.target.value })
                    }
                    placeholder="اشرح ميزات هذه الباقة لصاحب الماركة والتجار..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Prices & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">السعر بالكاش (ج.م)</label>
                    <input
                      type="number"
                      value={editingPackage.priceEgp || 0}
                      onChange={(e) =>
                        setEditingPackage({ ...editingPackage, priceEgp: Number(e.target.value) })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">السعر بنقاط المكافآت</label>
                    <input
                      type="number"
                      value={editingPackage.pricePoints || 0}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          pricePoints: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">مدة الباقة (بالأيام)</label>
                    <input
                      type="number"
                      value={editingPackage.durationDays || 7}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          durationDays: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Multiplier & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">مضاعف الوصول (Reach Multiplier)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editingPackage.reachMultiplier || 2}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          reachMultiplier: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">نص الشارة (Badge Text)</label>
                    <input
                      type="text"
                      value={editingPackage.badgeText || ''}
                      onChange={(e) =>
                        setEditingPackage({ ...editingPackage, badgeText: e.target.value })
                      }
                      placeholder="إعلان ممول"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">لون الشارة (HEX)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingPackage.badgeColor || '#C4A35A'}
                        onChange={(e) =>
                          setEditingPackage({ ...editingPackage, badgeColor: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={editingPackage.badgeColor || '#C4A35A'}
                        onChange={(e) =>
                          setEditingPackage({ ...editingPackage, badgeColor: e.target.value })
                        }
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Appearance Style */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">
                    طريقة العرض في تطبيق فلاتر وموقع الويب (Style Template)
                  </label>
                  <select
                    value={editingPackage.appearanceStyle || 'FacebookSponsoredFeed'}
                    onChange={(e) =>
                      setEditingPackage({ ...editingPackage, appearanceStyle: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FacebookSponsoredFeed">
                      بطاقة مميزة مع شارة برعاية (Facebook Sponsored Card)
                    </option>
                    <option value="GoldenGlowVip">
                      إطار ذهبي متدرج مشع (Golden VIP Shimmering Card)
                    </option>
                    <option value="TopPinnedSticky">
                      تثبيت بأعلى الأقسام مع شريط لافت (Top Pinned Banner)
                    </option>
                  </select>
                </div>

                {/* Flags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={editingPackage.isTopPinned || false}
                      onChange={(e) =>
                        setEditingPackage({ ...editingPackage, isTopPinned: e.target.checked })
                      }
                      className="rounded accent-amber-500"
                    />
                    <span className="font-bold text-slate-300">تثبيت بأعلى التغذية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={editingPackage.isHighlighted || false}
                      onChange={(e) =>
                        setEditingPackage({ ...editingPackage, isHighlighted: e.target.checked })
                      }
                      className="rounded accent-amber-500"
                    />
                    <span className="font-bold text-slate-300">إضاءة وتمييز بصري</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={editingPackage.isActive ?? true}
                      onChange={(e) =>
                        setEditingPackage({ ...editingPackage, isActive: e.target.checked })
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span className="font-bold text-slate-300">متاحة للاشتراك</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => savePackageMutation.mutate(editingPackage)}
                  disabled={savePackageMutation.isPending}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  {savePackageMutation.isPending ? 'جاري الحفظ...' : 'حفظ الباقة'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
