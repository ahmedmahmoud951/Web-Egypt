'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { formatRelativeArabicTime, formatArabicDate } from '@/lib/utils';
import {
  Store,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  Phone,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Search,
  ShieldCheck,
  Eye,
  Calendar,
  X,
  AlertTriangle,
  Ban,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  Navigation,
  Share2,
} from 'lucide-react';

interface ShopProductDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  images: string[];
  category?: string;
  isAvailable: boolean;
  status: string;
}

interface ShopDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  coverUrl?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  websiteUrl?: string;
  address?: string;
  governorate?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  isVerified: boolean;
  productsCount: number;
  totalOrdersCount: number;
  ownerId: string;
  ownerName?: string;
  ownerPhoneNumber?: string;
  createdAt: string;
}

interface ShopOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

interface ShopOrderDto {
  id: string;
  shopId: string;
  shopName: string;
  customerName: string;
  customerPhoneNumber: string;
  alternativePhoneNumber?: string;
  deliveryAddress: string;
  governorate?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  customerNotes?: string;
  totalAmount: number;
  status: string;
  itemsCount: number;
  items: ShopOrderItemDto[];
  createdAt: string;
}

export default function AdminShopsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'shops' | 'orders'>('shops');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Moderation modal state
  const [selectedShop, setSelectedShop] = useState<ShopDto | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationStatus, setModerationStatus] = useState<'Active' | 'Suspended'>('Suspended');

  // Fetch Shops
  const {
    data: shopsData,
    isLoading: isLoadingShops,
    refetch: refetchShops,
  } = useQuery({
    queryKey: ['admin-shops', statusFilter, search, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/shops', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search || undefined,
          page,
          pageSize: 20,
        },
      });
      return res.data?.data as ShopDto[] || [];
    },
  });

  // Fetch Orders
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['admin-shop-orders', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/shops/orders', {
        params: {
          page,
          pageSize: 30,
        },
      });
      return res.data?.data as ShopOrderDto[] || [];
    },
    enabled: activeTab === 'orders',
  });

  // Moderate shop mutation
  const moderateMutation = useMutation({
    mutationFn: async ({
      shopId,
      status,
      reason,
      isVerified,
    }: {
      shopId: string;
      status: string;
      reason?: string;
      isVerified?: boolean;
    }) => {
      await apiClient.put(`/admin/shops/${shopId}/moderate`, {
        status,
        moderationReason: reason,
        isVerified,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
      setSelectedShop(null);
      setModerationReason('');
    },
  });

  const shops = shopsData || [];
  const orders = ordersData || [];

  return (
    <AdminShell>
      <div className="space-y-6 pb-12 font-sans" dir="rtl">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                <Store className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                إدارة المتاجر والمعارض والطلبات (Shops & Orders)
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              رقابة كاملة على معارض ومتاجر التجار، فحص المنتجات، ومتابعة طلبات الشراء اللحظية وموقع العميل الجغرافي الدقيق.
            </p>
          </div>

          {/* Quick Safety Notice */}
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-emerald-400 text-xs">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-300">نظام الرقابة الآلية مفعل (AI Shield)</p>
              <p className="text-emerald-400/80">فحص فوري ضد الأسلحة، المخدرات، المحتويات الممنوعة والاحتيال.</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('shops')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'shops'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>المتاجر والمعارض ({shops.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>سجل الطلبات والمشتريات ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: SHOPS */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث باسم المتجر أو الرابط أو المالك..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {['all', 'Active', 'Suspended'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {status === 'all' ? 'الكل' : status === 'Active' ? 'نشط' : 'موقوف / محظور'}
                  </button>
                ))}

                <button
                  onClick={() => refetchShops()}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors mr-auto sm:mr-0"
                  title="تحديث"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Shops Table / Grid */}
            {isLoadingShops ? (
              <div className="text-center py-16 text-slate-400">جاري تحميل بيانات المتاجر...</div>
            ) : shops.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <Store className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">لا توجد متاجر مطابقة للشروط الحالية</p>
                <p className="text-slate-500 text-xs mt-1">يمكن للتجار إنشاء متاجرهم مباشرة من التطبيق والويب.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {/* Shop Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {shop.logoUrl ? (
                            <img
                              src={shop.logoUrl}
                              alt={shop.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
                              {shop.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-white text-base leading-snug">{shop.name}</h3>
                              {shop.isVerified && (
                                <span title="متجر موثق">
                                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-indigo-400 font-mono">@{shop.slug}</span>
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                            shop.status === 'Active'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {shop.status === 'Active' ? 'نشط ومتاح' : 'موقوف'}
                        </span>
                      </div>

                      {/* Description */}
                      {shop.description && (
                        <p className="text-slate-400 text-xs mt-3 line-clamp-2 leading-relaxed">
                          {shop.description}
                        </p>
                      )}

                      {/* Shop Details */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                        {shop.ownerName && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">المالك:</span>
                            <span className="text-slate-300 font-medium">
                              {shop.ownerName} ({shop.ownerPhoneNumber || '-'})
                            </span>
                          </div>
                        )}
                        {shop.governorate && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">الموقع:</span>
                            <span className="text-slate-300">
                              {shop.governorate} {shop.city ? `- ${shop.city}` : ''}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">المنتجات:</span>
                          <span className="text-indigo-300 font-semibold">{shop.productsCount} منتج</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">إجمالي الطلبات:</span>
                          <span className="text-emerald-300 font-semibold">{shop.totalOrdersCount} طلب</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <a
                          href={`/shops/${shop.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>معاينة الرابط</span>
                        </a>
                        {shop.websiteUrl && (
                          <a
                            href={shop.websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                            <span>الموقع الخارجي</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedShop(shop);
                            setModerationStatus(shop.status === 'Active' ? 'Suspended' : 'Active');
                          }}
                          className={`text-xs ${
                            shop.status === 'Active'
                              ? 'text-rose-400 hover:bg-rose-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {shop.status === 'Active' ? 'حظر / إيقاف' : 'إعادة تفعيل'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-bold text-sm">أحدث طلبات الشراء عبر التطبيق والريلز</h3>
              </div>
              <button
                onClick={() => refetchOrders()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="تحديث الطلبات"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {isLoadingOrders ? (
              <div className="text-center py-16 text-slate-400">جاري تحميل سجل الطلبات...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium">لم يتم تسجيل طلبات شراء حتى الآن</p>
                <p className="text-slate-500 text-xs mt-1">ستظهر هنا تفاصيل الطلبات فور قيام العملاء بالشراء.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Customer & Shop info */}
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-base">{order.customerName}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                            متجر: {order.shopName}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : order.status === 'Cancelled'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {order.status === 'Pending'
                              ? 'قيد الانتظار'
                              : order.status === 'Confirmed'
                              ? 'تم التأكيد'
                              : order.status === 'Shipped'
                              ? 'جاري الشحن'
                              : order.status === 'Delivered'
                              ? 'تم التوصيل'
                              : order.status}
                          </span>
                        </div>

                        {/* Contact & Address */}
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {order.customerPhoneNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {order.deliveryAddress}
                          </span>
                          {order.latitude && order.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-sky-400 hover:underline font-mono"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>الموقع الدقيق على الخريطة (GPS Pin)</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Total & Date */}
                      <div className="flex items-center gap-6 self-end lg:self-auto">
                        <div className="text-left">
                          <span className="text-xs text-slate-500 block">إجمالي الطلب</span>
                          <span className="text-lg font-bold text-emerald-400">
                            {order.totalAmount.toLocaleString('en-US')} ج.م
                          </span>
                        </div>
                        <div className="text-left text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5 inline ml-1" />
                          {formatRelativeArabicTime(order.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Order Items Breakdown */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <span className="text-xs font-semibold text-slate-400 block mb-2">
                          المنتجات المطلوبة ({order.items.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs"
                            >
                              <Package className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-white font-medium">{item.productName}</span>
                              <span className="text-slate-500">x{item.quantity}</span>
                              <span className="text-emerald-400 font-semibold font-mono">
                                ({item.totalPrice.toLocaleString('en-US')} ج.م)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODERATION DIALOG */}
        {selectedShop && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white text-base">إجراء رقابي على المتجر</h3>
                </div>
                <button
                  onClick={() => setSelectedShop(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-sm text-slate-300">
                  أنت على وشك تعديل حالة متجر: <strong className="text-white">{selectedShop.name}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-1">الرابط: @{selectedShop.slug}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">الحالة الجديدة:</label>
                  <select
                    value={moderationStatus}
                    onChange={(e) => setModerationStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Active">نشط ومتاح للعامة</option>
                    <option value="Suspended">حظر / إيقاف فوري (مخالف للسياسات)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">سبب الإجراء (اختياري):</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب سبب الحظر أو الملاحظة للمراجعة..."
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button variant="ghost" size="sm" onClick={() => setSelectedShop(null)}>
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={moderateMutation.isPending}
                  onClick={() =>
                    moderateMutation.mutate({
                      shopId: selectedShop.id,
                      status: moderationStatus,
                      reason: moderationReason,
                    })
                  }
                  className={moderationStatus === 'Suspended' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                >
                  حفظ التعديل
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
