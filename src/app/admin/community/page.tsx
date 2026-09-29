'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { communityAdminApi } from '@/api/communityAdmin';
import {
  Siren,
  Car,
  Search,
  CheckCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  User,
  HeartHandshake,
  FileText,
  BadgeAlert,
} from 'lucide-react';

export default function AdminCommunityPage() {
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'sos' | 'carpool' | 'lost'>('sos');
  const [statusFilter, setStatusFilter] = useState<string>('Active');

  // Queries
  const {
    data: sosData,
    isLoading: sosLoading,
    refetch: refetchSos,
  } = useQuery({
    queryKey: ['admin', 'community', 'sos', statusFilter],
    queryFn: ({ signal }) =>
      communityAdminApi.getSosAlerts(1, 30, statusFilter === 'All' ? undefined : statusFilter, signal),
    enabled: adminReady && activeTab === 'sos',
  });

  const {
    data: carpoolData,
    isLoading: carpoolLoading,
    refetch: refetchCarpool,
  } = useQuery({
    queryKey: ['admin', 'community', 'carpool', statusFilter],
    queryFn: ({ signal }) =>
      communityAdminApi.getCarpoolRides(1, 30, statusFilter === 'All' ? undefined : statusFilter, signal),
    enabled: adminReady && activeTab === 'carpool',
  });

  const {
    data: lostData,
    isLoading: lostLoading,
    refetch: refetchLost,
  } = useQuery({
    queryKey: ['admin', 'community', 'lost', statusFilter],
    queryFn: ({ signal }) =>
      communityAdminApi.getLostAndFoundItems(1, 30, statusFilter === 'All' ? undefined : statusFilter, signal),
    enabled: adminReady && activeTab === 'lost',
  });

  // Mutations
  const resolveSosMutation = useMutation({
    mutationFn: (id: string) => communityAdminApi.resolveSosAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'sos'] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'sos' | 'carpool' | 'lost-and-found'; id: string }) =>
      communityAdminApi.deleteItem(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community'] });
    },
  });

  const handleRefresh = () => {
    if (activeTab === 'sos') refetchSos();
    if (activeTab === 'carpool') refetchCarpool();
    if (activeTab === 'lost') refetchLost();
  };

  return (
    <AdminShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <Siren className="w-7 h-7 text-red-600 animate-pulse" />
              شبكة المجتمع والطوارئ والمفقودات
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              متابعة وإشراف فوري على استغاثات «فزعة مصر»، ومشاركة المشاوير «عربية رايحة»، والمفقودات بالمطابقة الذكية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
              تحديث
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={() => {
              setActiveTab('sos');
              setStatusFilter('Active');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'sos'
                ? 'bg-red-600 text-white shadow-md shadow-red-200'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Siren className="w-4 h-4" />
            🚨 فزعة مصر (طوارئ واستغاثات)
            {sosData?.totalCount != null && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{sosData.totalCount}</span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('carpool');
              setStatusFilter('Active');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'carpool'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Car className="w-4 h-4" />
            🚙 عربية رايحة (مشاوير مشتركة)
            {carpoolData?.totalCount != null && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{carpoolData.totalCount}</span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('lost');
              setStatusFilter('All');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'lost'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
            🪪 المفقودات والمعثورات (المطابقة الذكية)
            {lostData?.totalCount != null && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{lostData.totalCount}</span>
            )}
          </button>
        </div>

        {/* Tab 1: SOS ALERTS */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">طلبات الاستغاثة المسجلة في مصر:</span>
              <div className="flex gap-2">
                {['Active', 'Resolved', 'All'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === st
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'Active' ? 'نشطة حالياً' : st === 'Resolved' ? 'تم حلها' : 'الكل'}
                  </button>
                ))}
              </div>
            </div>

            {sosLoading ? (
              <div className="p-12 text-center text-gray-500 font-semibold">جاري تحميل الاستغاثات...</div>
            ) : sosData?.items.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-gray-500">
                لا توجد استغاثات مطابقة في هذا النطاق حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sosData?.items.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
                      alert.status === 'Active' ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            alert.alertType === 'RoadEmergency'
                              ? 'bg-amber-100 text-amber-800'
                              : alert.alertType === 'BloodDonation'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {alert.alertType === 'RoadEmergency'
                            ? 'طوارئ سيارة وطريق'
                            : alert.alertType === 'BloodDonation'
                            ? `تبرع عاجل بالدم (${alert.bloodType || 'فصيلة مطلوبة'})`
                            : 'استغاثة ومساعدة عاجلة'}
                        </span>

                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            alert.status === 'Active' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {alert.status === 'Active' ? '🚨 نشط' : 'تم الحل'}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-base">{alert.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{alert.description}</p>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
                        {alert.locationName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {alert.locationName}
                          </span>
                        )}
                        {alert.hospitalName && (
                          <span className="flex items-center gap-1 text-rose-600 font-semibold">
                            🏥 {alert.hospitalName}
                          </span>
                        )}
                        {alert.contactPhone && (
                          <span className="flex items-center gap-1 font-mono text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {alert.contactPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(alert.createdAt).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">صاحب البلاغ:</span>
                        <span className="text-xs font-bold text-gray-800">{alert.userName}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {alert.responsesCount} عروض مساعدة
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {alert.status === 'Active' && (
                          <button
                            onClick={() => resolveSosMutation.mutate(alert.id)}
                            disabled={resolveSosMutation.isPending}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition"
                          >
                            تأكيد الحل
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
                              deleteItemMutation.mutate({ type: 'sos', id: alert.id });
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف مخالفة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: CARPOOLING */}
        {activeTab === 'carpool' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">مشاوير اليوم المشتركة «عربية رايحة»:</span>
              <div className="flex gap-2">
                {['Active', 'Full', 'All'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === st
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'Active' ? 'متاحة' : st === 'Full' ? 'مكتملة' : 'الكل'}
                  </button>
                ))}
              </div>
            </div>

            {carpoolLoading ? (
              <div className="p-12 text-center text-gray-500 font-semibold">جاري تحميل المشاوير...</div>
            ) : carpoolData?.items.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-gray-500">
                لا توجد مشاوير مسجلة في هذا القسم حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carpoolData?.items.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-gray-800">{ride.carModel}</span>
                          {ride.carColor && <span className="text-xs text-gray-400">({ride.carColor})</span>}
                        </div>

                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {ride.pricePerSeat} جنيه / مقعد
                        </span>
                      </div>

                      {/* Route */}
                      <div className="p-3 bg-gray-50 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          من: {ride.fromCityOrArea}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-800 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          إلى: {ride.toCityOrArea}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          الانطلاق: {new Date(ride.departureTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-semibold text-gray-700">
                          المقاعد المتبقية: {ride.availableSeats} من {ride.totalSeats}
                        </span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {ride.genderPreference === 'FemalesOnly'
                            ? 'بنات فقط 👩'
                            : ride.genderPreference === 'MalesOnly'
                            ? 'شباب فقط 👨'
                            : 'متاح للجميع'}
                        </span>
                      </div>

                      {ride.notes && <p className="text-xs text-gray-600 italic">« {ride.notes} »</p>}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">السائق:</span>
                        <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                          {ride.driverName}
                          {ride.driverHasNationalId && (
                            <span title="موثق بالرقم القومي">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </span>
                          )}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من إلغاء أو حذف هذا المشوار؟')) {
                            deleteItemMutation.mutate({ type: 'carpool', id: ride.id });
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="حذف المشوار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: LOST AND FOUND */}
        {activeTab === 'lost' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">
                بلاغات المفقودات والمعثورات والمطابقة الذكية بالرقم القومي:
              </span>
              <div className="flex gap-2">
                {['All', 'Open', 'Matched', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      statusFilter === st
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'All' ? 'الكل' : st === 'Open' ? 'مفتوح' : st === 'Matched' ? '🎯 تم المطابقة' : 'مستلم'}
                  </button>
                ))}
              </div>
            </div>

            {lostLoading ? (
              <div className="p-12 text-center text-gray-500 font-semibold">جاري تحميل البلاغات...</div>
            ) : lostData?.items.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-gray-500">
                لا توجد مفقودات أو معثورات مسجلة حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lostData?.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all ${
                      item.isSmartMatched
                        ? 'border-emerald-300 ring-2 ring-emerald-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            item.itemType === 'Found'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.itemType === 'Found' ? '✅ تم العثور على' : '🔍 مفقود'} (
                          {item.category === 'NationalIdCard'
                            ? 'بطاقة رقم قومي'
                            : item.category === 'DrivingLicense'
                            ? 'رخصة قيادة'
                            : item.category === 'Wallet'
                            ? 'محفظة'
                            : item.category === 'Keys'
                            ? 'مفاتيح'
                            : 'أوراق/مقتنيات'}
                          )
                        </span>

                        {item.isSmartMatched && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white animate-pulse">
                            🎯 مطابقة ذكية فورية!
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>

                      <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-xs">
                        {item.fullNameOnItem && (
                          <div className="text-gray-800 font-semibold">
                            الاسم المدون على الأوراق: <span className="font-bold text-blue-700">{item.fullNameOnItem}</span>
                          </div>
                        )}
                        {item.maskedNationalIdOnItem && (
                          <div className="text-gray-800 font-mono">
                            الرقم القومي: <span className="font-bold text-gray-900">{item.maskedNationalIdOnItem}</span>
                          </div>
                        )}
                        <div className="text-gray-600 flex items-center gap-1 pt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          المكان: {item.locationDescription}
                        </div>
                      </div>

                      {item.isSmartMatched && item.matchedUserName && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
                          🎉 تم إخطار صاحب الحساب المسجل في التطبيق: <span className="font-bold">{item.matchedUserName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        مقدم البلاغ: <span className="font-bold text-gray-800">{item.reporterName}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
                            deleteItemMutation.mutate({ type: 'lost-and-found', id: item.id });
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="حذف البلاغ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
