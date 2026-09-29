'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { communityAdminApi } from '@/api/communityAdmin';
import { signalRService, SignalRConnectionStatus } from '@/lib/signalr';
import {
  CommunitySosAlertRealTimeMessage,
  CommunityCarpoolRideRealTimeMessage,
  CommunityLostAndFoundRealTimeMessage,
} from '@/types/realtime';
import {
  CommunityAlertDto,
  CarpoolRideDto,
  LostAndFoundItemDto,
} from '@/types/community';
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
  Volume2,
  VolumeX,
  Radio,
  Activity,
  ExternalLink,
  X,
  Flame,
  Sparkles,
  Filter,
  Users,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export default function AdminCommunityPage() {
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'sos' | 'carpool' | 'lost'>('sos');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-Time SignalR State
  const [connectionStatus, setConnectionStatus] = useState<SignalRConnectionStatus>('disconnected');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [realtimeCounter, setRealtimeCounter] = useState<number>(0);
  const [liveBanner, setLiveBanner] = useState<{
    id: string;
    type: 'sos' | 'carpool' | 'lost';
    title: string;
    description: string;
    time: string;
  } | null>(null);

  // Selected item for modal
  const [selectedModalItem, setSelectedModalItem] = useState<{
    type: 'sos' | 'carpool' | 'lost';
    data: CommunityAlertDto | CarpoolRideDto | LostAndFoundItemDto;
  } | null>(null);

  // Web Audio Chime generator for real-time alerts
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // AudioContext policy: browser might prevent audio before user interaction
    }
  };

  // Queries
  const {
    data: sosData,
    isLoading: sosLoading,
    refetch: refetchSos,
  } = useQuery({
    queryKey: ['admin', 'community', 'sos', statusFilter],
    queryFn: ({ signal }) =>
      communityAdminApi.getSosAlerts(1, 50, statusFilter === 'All' ? undefined : statusFilter, signal),
    enabled: adminReady && activeTab === 'sos',
  });

  const {
    data: carpoolData,
    isLoading: carpoolLoading,
    refetch: refetchCarpool,
  } = useQuery({
    queryKey: ['admin', 'community', 'carpool', statusFilter],
    queryFn: ({ signal }) =>
      communityAdminApi.getCarpoolRides(1, 50, statusFilter === 'All' ? undefined : statusFilter, signal),
    enabled: adminReady && activeTab === 'carpool',
  });

  const {
    data: lostData,
    isLoading: lostLoading,
    refetch: refetchLost,
  } = useQuery({
    queryKey: ['admin', 'community', 'lost', statusFilter],
    queryFn: ({ signal }) =>
      communityAdminApi.getLostAndFoundItems(1, 50, statusFilter === 'All' ? undefined : statusFilter, signal),
    enabled: adminReady && activeTab === 'lost',
  });

  // SignalR Subscriptions
  useEffect(() => {
    // 1. Connect to Hub
    signalRService.start();
    setConnectionStatus(signalRService.getStatus());

    const unsubscribeStatus = signalRService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // 2. Real-time SOS alerts listener
    const unsubSosCreated = signalRService.onCommunitySosAlertCreated((msg: CommunitySosAlertRealTimeMessage) => {
      playAlertSound();
      setRealtimeCounter((prev) => prev + 1);
      setLiveBanner({
        id: msg.alertId,
        type: 'sos',
        title: `🚨 استغاثة عاجلة: ${msg.title}`,
        description: `${msg.userName} أرسل استغاثة (${msg.locationName || 'نطاق جغرافي'})`,
        time: new Date().toLocaleTimeString('ar-EG'),
      });
      // Invalidate SOS queries so list updates immediately
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'sos'] });
    });

    const unsubSosResolved = signalRService.onCommunitySosAlertResolved(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'sos'] });
    });

    // 3. Real-time Carpooling listener
    const unsubCarpoolCreated = signalRService.onCommunityCarpoolRideCreated((msg: CommunityCarpoolRideRealTimeMessage) => {
      setRealtimeCounter((prev) => prev + 1);
      setLiveBanner({
        id: msg.rideId,
        type: 'carpool',
        title: `🚙 مشوار مشترك جديد: من ${msg.fromCityOrArea} إلى ${msg.toCityOrArea}`,
        description: `بواسطة السائق: ${msg.driverName} (${msg.availableSeats} مقاعد متاحة)`,
        time: new Date().toLocaleTimeString('ar-EG'),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'carpool'] });
    });

    // 4. Real-time Lost & Found listener
    const unsubLostCreated = signalRService.onCommunityLostAndFoundItemCreated((msg: CommunityLostAndFoundRealTimeMessage) => {
      setRealtimeCounter((prev) => prev + 1);
      if (msg.isSmartMatched) {
        playAlertSound();
        setLiveBanner({
          id: msg.itemId,
          type: 'lost',
          title: `🎯 مطابقة ذكية فورية! تم العثور على صاحب الأوراق`,
          description: `تم إخطار المواطن: ${msg.matchedUserName || 'المسجل بالتطبيق'} فوراً بالرقم القومي!`,
          time: new Date().toLocaleTimeString('ar-EG'),
        });
      } else {
        setLiveBanner({
          id: msg.itemId,
          type: 'lost',
          title: `🪪 بلاغ جديد: ${msg.title}`,
          description: `المكان: ${msg.locationDescription}`,
          time: new Date().toLocaleTimeString('ar-EG'),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'lost'] });
    });

    return () => {
      unsubscribeStatus();
      unsubSosCreated();
      unsubSosResolved();
      unsubCarpoolCreated();
      unsubLostCreated();
    };
  }, [queryClient, soundEnabled]);

  // Mutations
  const resolveSosMutation = useMutation({
    mutationFn: (id: string) => communityAdminApi.resolveSosAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'sos'] });
      if (selectedModalItem && selectedModalItem.data.id) {
        setSelectedModalItem((prev) =>
          prev ? { ...prev, data: { ...prev.data, status: 'Resolved' } } : null
        );
      }
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ type, id }: { type: 'sos' | 'carpool' | 'lost-and-found'; id: string }) =>
      communityAdminApi.deleteItem(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community'] });
      setSelectedModalItem(null);
    },
  });

  const handleRefresh = () => {
    if (activeTab === 'sos') refetchSos();
    if (activeTab === 'carpool') refetchCarpool();
    if (activeTab === 'lost') refetchLost();
  };

  // KPI Calculations
  const activeSosCount = useMemo(() => {
    return sosData?.items.filter((item) => item.status === 'Active').length || 0;
  }, [sosData]);

  const bloodRequestsCount = useMemo(() => {
    return (
      sosData?.items.filter((item) => item.alertType === 'BloodDonation' && item.status === 'Active').length || 0
    );
  }, [sosData]);

  const activeCarpoolSeatsCount = useMemo(() => {
    return (
      carpoolData?.items
        .filter((r) => r.status === 'Active')
        .reduce((sum, r) => sum + r.availableSeats, 0) || 0
    );
  }, [carpoolData]);

  const smartMatchesCount = useMemo(() => {
    return lostData?.items.filter((i) => i.isSmartMatched).length || 0;
  }, [lostData]);

  // Filtered Items by Search Query
  const filteredSosItems = useMemo(() => {
    if (!sosData?.items) return [];
    if (!searchQuery.trim()) return sosData.items;
    const q = searchQuery.toLowerCase();
    return sosData.items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.userName.toLowerCase().includes(q) ||
        (i.locationName && i.locationName.toLowerCase().includes(q)) ||
        (i.contactPhone && i.contactPhone.includes(q))
    );
  }, [sosData, searchQuery]);

  const filteredCarpoolItems = useMemo(() => {
    if (!carpoolData?.items) return [];
    if (!searchQuery.trim()) return carpoolData.items;
    const q = searchQuery.toLowerCase();
    return carpoolData.items.filter(
      (r) =>
        r.fromCityOrArea.toLowerCase().includes(q) ||
        r.toCityOrArea.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.carModel.toLowerCase().includes(q)
    );
  }, [carpoolData, searchQuery]);

  const filteredLostItems = useMemo(() => {
    if (!lostData?.items) return [];
    if (!searchQuery.trim()) return lostData.items;
    const q = searchQuery.toLowerCase();
    return lostData.items.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.reporterName.toLowerCase().includes(q) ||
        (l.fullNameOnItem && l.fullNameOnItem.toLowerCase().includes(q)) ||
        (l.locationDescription && l.locationDescription.toLowerCase().includes(q))
    );
  }, [lostData, searchQuery]);

  return (
    <AdminShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
        {/* TOP HERO & RADAR CONTROL PANEL */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-gray-900 to-red-950 p-6 sm:p-8 text-white shadow-xl border border-red-900/30">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>

                <span className="text-xs font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  {connectionStatus === 'connected'
                    ? 'رادار المجتمع متصل لحظياً (Live SignalR)'
                    : 'جارٍ الاتصال بالشبكة الحية...'}
                </span>

                {realtimeCounter > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 border border-red-500/40">
                    +{realtimeCounter} إشارة فورية
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <Siren className="w-8 h-8 text-red-500 animate-pulse" />
                شبكة الطوارئ والمجتمع الذكي في مصر
              </h1>
              <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
                متابعة وإشراف فوري على استغاثات «فزعة مصر»، ومشاركة المشاوير اليومية «عربية رايحة»، والمفقودات بالمطابقة التلقائية عبر الرقم القومي المصري (14 رقم).
              </p>
            </div>

            {/* Quick Actions & Sound Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-toggle-sound"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  soundEnabled
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                }`}
                title={soundEnabled ? 'كتم تنبيه الصوت' : 'تفعيل تنبيه الصوت'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>صوت التنبيه: مفعّل</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-red-400" />
                    <span>صوت التنبيه: مكتوم</span>
                  </>
                )}
              </button>

              <button
                id="btn-refresh-community"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm backdrop-blur transition-all"
              >
                <RefreshCw className="w-4 h-4 text-gray-300" />
                تحديث البيانات
              </button>
            </div>
          </div>
        </div>

        {/* LIVE INCOMING REAL-TIME ALERT TOAST BANNER */}
        {liveBanner && (
          <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg animate-bounce border border-white/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{liveBanner.title}</span>
                  <span className="text-[11px] opacity-80 font-mono bg-black/20 px-2 py-0.5 rounded-md">
                    {liveBanner.time}
                  </span>
                </div>
                <p className="text-xs text-white/90 mt-0.5">{liveBanner.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-dismiss-live-toast"
                onClick={() => setLiveBanner(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 4 DYNAMIC KPI STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Emergencies */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/80 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 bg-red-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Siren className="w-3.5 h-3.5 animate-pulse" />
                فزعة مصر
              </span>
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-200">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-gray-900 tracking-tight">{activeSosCount}</div>
              <p className="text-xs font-semibold text-gray-500 mt-1">استغاثات نشطة تحتاج تدخلاً فورياً</p>
            </div>
          </div>

          {/* Card 2: Urgent Blood Requests */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/80 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                🩸 تبرع عاجل
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-gray-900 tracking-tight">{bloodRequestsCount}</div>
              <p className="text-xs font-semibold text-gray-500 mt-1">حالات طلب فصائل دم حرجة بالمستشفيات</p>
            </div>
          </div>

          {/* Card 3: Carpool Commute Seats */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Car className="w-3.5 h-3.5" />
                عربية رايحة
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-gray-900 tracking-tight">{activeCarpoolSeatsCount}</div>
              <p className="text-xs font-semibold text-gray-500 mt-1">مقاعد مشاوير مشتركة متاحة للمواطنين</p>
            </div>
          </div>

          {/* Card 4: Smart Matching Matches */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                مطابقة ذكية
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-gray-900 tracking-tight">{smartMatchesCount}</div>
              <p className="text-xs font-semibold text-gray-500 mt-1">مفقودات تم ربطها بأصحابها بالرقم القومي</p>
            </div>
          </div>
        </div>

        {/* TABS & SEARCH BAR */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Nav Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                id="tab-btn-sos"
                onClick={() => {
                  setActiveTab('sos');
                  setStatusFilter('Active');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'sos'
                    ? 'bg-red-600 text-white shadow-md shadow-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Siren className="w-4 h-4" />
                🚨 فزعة مصر (الطوارئ)
                {sosData?.totalCount != null && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    {sosData.totalCount}
                  </span>
                )}
              </button>

              <button
                id="tab-btn-carpool"
                onClick={() => {
                  setActiveTab('carpool');
                  setStatusFilter('Active');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'carpool'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Car className="w-4 h-4" />
                🚙 عربية رايحة (المشاوير)
                {carpoolData?.totalCount != null && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    {carpoolData.totalCount}
                  </span>
                )}
              </button>

              <button
                id="tab-btn-lost"
                onClick={() => {
                  setActiveTab('lost');
                  setStatusFilter('All');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'lost'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Search className="w-4 h-4" />
                🪪 المفقودات والمعثورات
                {lostData?.totalCount != null && (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    {lostData.totalCount}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                id="input-community-search"
                type="text"
                placeholder="بحث بالاسم، المنطقة، الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl text-xs bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills per active tab */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
            <span className="font-bold text-gray-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              تصفية الحالة:
            </span>

            <div className="flex gap-1.5">
              {activeTab === 'sos' &&
                ['Active', 'Resolved', 'All'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      statusFilter === st
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'Active' ? 'نشطة حالياً' : st === 'Resolved' ? 'تم حلها' : 'الكل'}
                  </button>
                ))}

              {activeTab === 'carpool' &&
                ['Active', 'Full', 'All'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      statusFilter === st
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'Active' ? 'مقاعد متاحة' : st === 'Full' ? 'مكتملة' : 'الكل'}
                  </button>
                ))}

              {activeTab === 'lost' &&
                ['All', 'Open', 'Matched', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'All'
                      ? 'الكل'
                      : st === 'Open'
                      ? 'مفتوحة'
                      : st === 'Matched'
                      ? '🎯 مطابقة ذكية'
                      : 'مستلمة'}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* TAB 1: SOS & ROAD EMERGENCIES ("فزعة مصر") */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            {sosLoading ? (
              <div className="p-16 text-center text-gray-400 font-semibold flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                <span>جاري تحميل الاستغاثات الحية من السيرفر...</span>
              </div>
            ) : filteredSosItems.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-gray-800 text-base">لا توجد استغاثات في هذا الفلتر حالياً</h3>
                <p className="text-xs text-gray-400">أي استغاثة جديدة تصل عبر السيرفر ستظهر هنا مباشرة بالوقت الفعلي.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSosItems.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-5 rounded-3xl border bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                      alert.status === 'Active'
                        ? 'border-red-300 ring-2 ring-red-100/60 bg-gradient-to-b from-red-50/20 to-white'
                        : 'border-gray-200 opacity-90'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                            alert.alertType === 'RoadEmergency'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : alert.alertType === 'BloodDonation'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : 'bg-red-100 text-red-900 border border-red-200'
                          }`}
                        >
                          {alert.alertType === 'RoadEmergency' ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              طوارئ سيارة وعطل طريق
                            </>
                          ) : alert.alertType === 'BloodDonation' ? (
                            <>
                              🩸 تبرع عاجل بالدم ({alert.bloodType || 'فصيلة مطلوبة'})
                            </>
                          ) : (
                            <>
                              <Siren className="w-3.5 h-3.5 text-red-600" />
                              استغاثة وفزعة طارئة
                            </>
                          )}
                        </span>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                            alert.status === 'Active'
                              ? 'bg-red-600 text-white animate-pulse shadow-sm shadow-red-200'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {alert.status === 'Active' ? '🚨 نشط حالياً' : 'تم الحل'}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{alert.title}</h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                          {alert.description}
                        </p>
                      </div>

                      {/* Location & Hospital */}
                      <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-xs text-gray-600">
                        {alert.locationName && (
                          <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>الموقع: {alert.locationName}</span>
                          </div>
                        )}
                        {alert.hospitalName && (
                          <div className="flex items-center gap-1.5 font-bold text-rose-700">
                            <span>🏥 المستشفى: {alert.hospitalName}</span>
                          </div>
                        )}
                        {alert.contactPhone && (
                          <div className="flex items-center gap-1.5 font-mono text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>هاتف الطوارئ: {alert.contactPhone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(alert.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Toolbar */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-800">{alert.userName}</div>
                          <div className="text-[10px] text-gray-500">
                            {alert.responsesCount} عروض مساعدة
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedModalItem({ type: 'sos', data: alert })}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                        >
                          معاينة
                        </button>

                        {alert.status === 'Active' && (
                          <button
                            onClick={() => resolveSosMutation.mutate(alert.id)}
                            disabled={resolveSosMutation.isPending}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition"
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
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="حذف البلاغ"
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

        {/* TAB 2: CARPOOLING ("عربية رايحة") */}
        {activeTab === 'carpool' && (
          <div className="space-y-4">
            {carpoolLoading ? (
              <div className="p-16 text-center text-gray-400 font-semibold flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <span>جاري تحميل المشاوير من السيرفر...</span>
              </div>
            ) : filteredCarpoolItems.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 space-y-2">
                <Car className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-gray-800 text-base">لا توجد مشاوير مسجلة في هذا القسم</h3>
                <p className="text-xs text-gray-400">ستظهر مشاوير «عربية رايحة» بمجرد نشرها من قبل السائقين فورياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCarpoolItems.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-5 rounded-3xl border border-gray-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      {/* Car & Pricing Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900">{ride.carModel}</span>
                            {ride.carColor && (
                              <span className="text-xs text-gray-400 mr-1.5 font-medium">({ride.carColor})</span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {ride.pricePerSeat} جنيه / مقعد
                        </span>
                      </div>

                      {/* Route Banner */}
                      <div className="p-3 bg-gradient-to-r from-gray-50 to-emerald-50/30 rounded-2xl border border-gray-100 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-800 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span>من: {ride.fromCityOrArea}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-800 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <span>إلى: {ride.toCityOrArea}</span>
                        </div>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(ride.departureTime).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <span className="font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100">
                          المقاعد المتبقية: {ride.availableSeats} من {ride.totalSeats}
                        </span>

                        <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium text-gray-700">
                          {ride.genderPreference === 'FemalesOnly'
                            ? 'بنات فقط 👩'
                            : ride.genderPreference === 'MalesOnly'
                            ? 'شباب فقط 👨'
                            : 'متاح للجميع'}
                        </span>
                      </div>

                      {ride.notes && (
                        <p className="text-xs text-gray-500 italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          « {ride.notes} »
                        </p>
                      )}
                    </div>

                    {/* Driver & Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">السائق:</span>
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                          {ride.driverName}
                          {ride.driverHasNationalId && (
                            <span
                              className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold gap-0.5"
                              title="الهوية موثقة بالرقم القومي المصري"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              موثق قومياً
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedModalItem({ type: 'carpool', data: ride })}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                        >
                          معاينة
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا المشوار المشترك؟')) {
                              deleteItemMutation.mutate({ type: 'carpool', id: ride.id });
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="حذف المشوار"
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

        {/* TAB 3: LOST AND FOUND HUB ("المفقودات والمعثورات") */}
        {activeTab === 'lost' && (
          <div className="space-y-4">
            {lostLoading ? (
              <div className="p-16 text-center text-gray-400 font-semibold flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <span>جاري تحميل المفقودات والمطابقات الذكية...</span>
              </div>
            ) : filteredLostItems.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 space-y-2">
                <ShieldCheck className="w-12 h-12 text-indigo-500 mx-auto" />
                <h3 className="font-bold text-gray-800 text-base">لا توجد بلاغات مفقودات مسجلة حالياً</h3>
                <p className="text-xs text-gray-400">ستتم المطابقة التلقائية فور تسجيل أي بطاقة أو محفظة بالرقم القومي.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLostItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl border bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-all ${
                      item.isSmartMatched
                        ? 'border-emerald-300 ring-2 ring-emerald-100 bg-gradient-to-b from-emerald-50/20 to-white'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            item.itemType === 'Found'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {item.itemType === 'Found' ? '✅ تم العثور على' : '🔍 مفقود'} (
                          {item.category === 'NationalIdCard'
                            ? 'بطاقة رقم قومي'
                            : item.category === 'DrivingLicense'
                            ? 'رخصة قيادة'
                            : item.category === 'Wallet'
                            ? 'محفظة مفقودة'
                            : item.category === 'Keys'
                            ? 'مفاتيح'
                            : 'أوراق/مقتنيات'}
                          )
                        </span>

                        {item.isSmartMatched ? (
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white animate-pulse shadow-sm shadow-emerald-200 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            🎯 مطابقة ذكية فورية!
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                            {item.status === 'Open' ? 'مفتوح' : item.status === 'Resolved' ? 'تم التسليم' : item.status}
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{item.title}</h3>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Card Details */}
                      <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-xs text-gray-700">
                        {item.fullNameOnItem && (
                          <div className="font-semibold">
                            الاسم المدون على الأوراق:{' '}
                            <span className="font-bold text-blue-800">{item.fullNameOnItem}</span>
                          </div>
                        )}
                        {item.maskedNationalIdOnItem && (
                          <div className="font-mono text-xs">
                            الرقم القومي المدون:{' '}
                            <span className="font-bold tracking-wider text-gray-900">
                              {item.maskedNationalIdOnItem}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-500 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>مكان البلاغ: {item.locationDescription}</span>
                        </div>
                      </div>

                      {/* Smart Match Success Notification */}
                      {item.isSmartMatched && item.matchedUserName && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            تم التعرف الذكي على صاحب الأوراق وإخطاره عبر إشعار فوري:
                          </div>
                          <div className="text-emerald-950 font-bold pr-5">
                            المواطن: {item.matchedUserName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        مقدم البلاغ: <span className="font-bold text-gray-800">{item.reporterName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedModalItem({ type: 'lost', data: item })}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                        >
                          معاينة
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
                              deleteItemMutation.mutate({ type: 'lost-and-found', id: item.id });
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                          title="حذف البلاغ"
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

        {/* MODAL DIALOG FOR INSPECTING FULL ITEM DETAILS */}
        {selectedModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  {selectedModalItem.type === 'sos' && (
                    <Siren className="w-6 h-6 text-red-600 animate-pulse" />
                  )}
                  {selectedModalItem.type === 'carpool' && (
                    <Car className="w-6 h-6 text-emerald-600" />
                  )}
                  {selectedModalItem.type === 'lost' && (
                    <Search className="w-6 h-6 text-indigo-600" />
                  )}
                  <h3 className="font-black text-gray-900 text-lg">
                    {selectedModalItem.type === 'sos'
                      ? 'تفاصيل استغاثة «فزعة مصر»'
                      : selectedModalItem.type === 'carpool'
                      ? 'تفاصيل مشوار «عربية رايحة»'
                      : 'تفاصيل بلاغ «المفقودات والمعثورات»'}
                  </h3>
                </div>

                <button
                  id="btn-close-modal"
                  onClick={() => setSelectedModalItem(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                {/* SOS Details */}
                {selectedModalItem.type === 'sos' && (() => {
                  const sos = selectedModalItem.data as CommunityAlertDto;
                  return (
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800">
                          {sos.alertType === 'RoadEmergency'
                            ? 'طوارئ سيارة وعطل طريق'
                            : sos.alertType === 'BloodDonation'
                            ? `طلب تبرع عاجل بالدم (${sos.bloodType})`
                            : 'استغاثة عامة عاجلة'}
                        </span>
                        <h4 className="text-lg font-bold text-gray-900 mt-2">{sos.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-line">
                          {sos.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                          <span className="text-gray-400">صاحب الاستغاثة:</span>
                          <div className="font-bold text-gray-900">{sos.userName}</div>
                          {sos.contactPhone && (
                            <a
                              href={`tel:${sos.contactPhone}`}
                              className="inline-flex items-center gap-1.5 text-blue-600 font-mono font-bold mt-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {sos.contactPhone} (اتصال فوري)
                            </a>
                          )}
                        </div>

                        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                          <span className="text-gray-400">الموقع الجغرافي:</span>
                          <div className="font-bold text-gray-900">{sos.locationName || 'غير محدد'}</div>
                          {sos.latitude && sos.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 font-bold mt-1"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              عرض الإحداثيات على الخريطة
                            </a>
                          )}
                        </div>
                      </div>

                      {sos.hospitalName && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-semibold">
                          🏥 المستشفى المطلوب التبرع فيه: <span className="font-bold">{sos.hospitalName}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Carpool Details */}
                {selectedModalItem.type === 'carpool' && (() => {
                  const ride = selectedModalItem.data as CarpoolRideDto;
                  return (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2">
                        <div className="text-xs text-emerald-800 font-semibold">مسار المشوار المشترك:</div>
                        <div className="text-base font-black text-gray-900 flex items-center gap-3">
                          <span>{ride.fromCityOrArea}</span>
                          <span className="text-emerald-600">➔</span>
                          <span>{ride.toCityOrArea}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                          <span className="text-gray-400">السائق:</span>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            {ride.driverName}
                            {ride.driverHasNationalId && (
                              <span className="text-emerald-700 font-bold">(موثق بالرقم القومي)</span>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                          <span className="text-gray-400">السيارة:</span>
                          <div className="font-bold text-gray-900">
                            {ride.carModel} {ride.carColor ? `(${ride.carColor})` : ''}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                          <span className="text-gray-400">المقاعد المتاحة:</span>
                          <div className="font-bold text-gray-900">
                            {ride.availableSeats} من إجمالي {ride.totalSeats}
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-2xl space-y-1">
                          <span className="text-gray-400">سعر المقعد:</span>
                          <div className="font-bold text-emerald-700">{ride.pricePerSeat} جنيه مصري</div>
                        </div>
                      </div>

                      {ride.notes && (
                        <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-600">
                          <span className="font-bold">ملاحظات السائق: </span>
                          {ride.notes}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Lost and Found Details */}
                {selectedModalItem.type === 'lost' && (() => {
                  const lost = selectedModalItem.data as LostAndFoundItemDto;
                  return (
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800">
                          {lost.itemType === 'Found' ? 'تم العثور على أوراق/مقتنيات' : 'بلاغ فقدان'}
                        </span>
                        <h4 className="text-lg font-bold text-gray-900 mt-2">{lost.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{lost.description}</p>
                      </div>

                      <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2 text-xs">
                        {lost.fullNameOnItem && (
                          <div>
                            الاسم المدون على الأوراق: <span className="font-bold text-blue-900">{lost.fullNameOnItem}</span>
                          </div>
                        )}
                        {lost.maskedNationalIdOnItem && (
                          <div className="font-mono">
                            الرقم القومي المدون: <span className="font-bold tracking-widest">{lost.maskedNationalIdOnItem}</span>
                          </div>
                        )}
                        <div>
                          مكان البلاغ: <span className="font-semibold text-gray-800">{lost.locationDescription}</span>
                        </div>
                      </div>

                      {lost.isSmartMatched && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold space-y-1">
                          <div className="font-bold">🎉 تمت المطابقة الذكية بنجاح!</div>
                          <div>المواطن صاحب الأوراق المسجل في التطبيق: {lost.matchedUserName || 'مواطن مسجل'}</div>
                          <div className="text-[11px] text-emerald-700">تم إرسال إشعار فوري (Push + In-App) بالموعد والمكان.</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                {selectedModalItem.type === 'sos' && (selectedModalItem.data as CommunityAlertDto).status === 'Active' && (
                  <button
                    onClick={() => resolveSosMutation.mutate(selectedModalItem.data.id)}
                    disabled={resolveSosMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    تأكيد حل الاستغاثة
                  </button>
                )}

                <button
                  onClick={() => setSelectedModalItem(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
