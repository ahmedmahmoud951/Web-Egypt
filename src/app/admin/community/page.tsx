'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Shield,
  Layers,
  ArrowUpRight,
  Route,
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

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // AudioContext policy
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
    signalRService.start();
    setConnectionStatus(signalRService.getStatus());

    const unsubscribeStatus = signalRService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

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
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'sos'] });
    });

    const unsubSosResolved = signalRService.onCommunitySosAlertResolved(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'sos'] });
    });

    const unsubCarpoolCreated = signalRService.onCommunityCarpoolRideCreated((msg: CommunityCarpoolRideRealTimeMessage) => {
      setRealtimeCounter((prev) => prev + 1);
      setLiveBanner({
        id: msg.rideId,
        type: 'carpool',
        title: `🚙 مشوار مشترك جديد: من ${msg.fromCityOrArea} إلى ${msg.toCityOrArea}`,
        description: `السائق: ${msg.driverName} (${msg.availableSeats} مقاعد متاحة)`,
        time: new Date().toLocaleTimeString('ar-EG'),
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'community', 'carpool'] });
    });

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

  // Search Filtering
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-right" dir="rtl">
        {/* =========================================================================
            1. CYBER COMMAND RADAR HERO (High-Contrast Dark Aesthetic)
           ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] border border-red-500/30 p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${
                      connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                      connectionStatus === 'connected' ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-amber-500'
                    }`}
                  />
                </span>

                <span className="text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full bg-slate-900/90 text-emerald-300 border border-emerald-500/30 shadow-sm flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  {connectionStatus === 'connected'
                    ? 'رادار الطوارئ وبث SignalR متصل لحظياً'
                    : 'جارٍ الاتصال بالسيرفر اللحظي...'}
                </span>

                {realtimeCounter > 0 && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                    +{realtimeCounter} إشارة جديدة للتو
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3.5">
                <div className="p-2 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-500 shadow-lg shadow-red-950">
                  <Siren className="w-8 h-8 animate-pulse" />
                </div>
                <span>غرفة عمليات الطوارئ وشبكة المجتمع الذكي في مصر</span>
              </h1>

              <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed font-normal">
                الرصد الفوري والتدخل العاجل لاستغاثات <strong className="text-red-400 font-bold">«فزعة مصر»</strong> (حوادث الطرق وتبرع الدم النادر)، وإدارة مشاوير <strong className="text-emerald-400 font-bold">«عربية رايحة»</strong>، ومطابقة <strong className="text-indigo-400 font-bold">«المفقودات والمعثورات»</strong> الذكية بالرقم القومي المصري 14 رقم.
              </p>
            </div>

            {/* Quick Actions & Sound Controls */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                id="btn-toggle-sound"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all border shadow-lg ${
                  soundEnabled
                    ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-300 hover:bg-slate-800'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900'
                }`}
                title={soundEnabled ? 'كتم صفارة التنبيه' : 'تفعيل صفارة التنبيه'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>صوت الاستغاثة: مفعّل</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>صوت الاستغاثة: صامت</span>
                  </>
                )}
              </button>

              <button
                id="btn-refresh-community"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-black bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                تحديث يدوي
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. REAL-TIME TOAST ALERT BANNER (High-Contrast Glowing Banner)
           ========================================================================= */}
        {liveBanner && (
          <div className="relative overflow-hidden p-4 md:p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-2xl border-2 border-white/40 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-black/30 rounded-2xl backdrop-blur-md border border-white/20">
                <Flame className="w-7 h-7 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-sm md:text-base tracking-wide">{liveBanner.title}</span>
                  <span className="text-xs font-mono font-bold bg-black/30 px-2.5 py-0.5 rounded-md border border-white/20">
                    {liveBanner.time}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-white/95 mt-1 font-semibold">{liveBanner.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-dismiss-live-toast"
                onClick={() => setLiveBanner(null)}
                className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-white border border-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. FOUR HIGH-CONTRAST KPI STAT CARDS (Dark Theme & Neon Contrast)
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Emergencies */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-900 border-2 border-red-500/40 shadow-xl hover:border-red-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-300 bg-red-950/90 px-3 py-1 rounded-full border border-red-500/50 flex items-center gap-1.5 shadow-sm">
                <Siren className="w-3.5 h-3.5 animate-pulse text-red-400" />
                فزعة مصر
              </span>
              <div className="w-11 h-11 rounded-2xl bg-red-600/30 border border-red-500/50 text-red-400 flex items-center justify-center shadow-lg shadow-red-950">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-black text-rose-400 tracking-tight">{activeSosCount}</div>
              <p className="text-xs font-bold text-slate-300 mt-1">استغاثات نشطة جارية تحتاج تدخلاً</p>
            </div>
          </div>

          {/* Card 2: Urgent Blood Requests */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-500/40 shadow-xl hover:border-rose-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-200 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
                🩸 تبرع عاجل بالدم
              </span>
              <div className="w-11 h-11 rounded-2xl bg-rose-600/30 border border-rose-500/50 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950">
                <HeartHandshake className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-black text-rose-300 tracking-tight">{bloodRequestsCount}</div>
              <p className="text-xs font-bold text-slate-300 mt-1">طلبات فصائل دم حرجة بالمستشفيات</p>
            </div>
          </div>

          {/* Card 3: Carpool Commute Seats */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500/40 shadow-xl hover:border-emerald-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/50 flex items-center gap-1.5 shadow-sm">
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                عربية رايحة
              </span>
              <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-black text-emerald-400 tracking-tight">{activeCarpoolSeatsCount}</div>
              <p className="text-xs font-bold text-slate-300 mt-1">مقاعد مشاوير مشتركة متاحة للمواطنين</p>
            </div>
          </div>

          {/* Card 4: Smart Matching Matches */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500/40 shadow-xl hover:border-indigo-500 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 bg-indigo-950/90 px-3 py-1 rounded-full border border-indigo-500/50 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                مطابقة ذكية
              </span>
              <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-black text-indigo-400 tracking-tight">{smartMatchesCount}</div>
              <p className="text-xs font-bold text-slate-300 mt-1">مفقودات رُبطت بأصحابها بالرقم القومي</p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. TABS & SEARCH / FILTER TOOLBAR (High-Contrast Dark Panel)
           ========================================================================= */}
        <div className="bg-[#0F172A] rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2.5">
              <button
                id="tab-btn-sos"
                onClick={() => {
                  setActiveTab('sos');
                  setStatusFilter('Active');
                }}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-sm transition-all border ${
                  activeTab === 'sos'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white border-red-400 shadow-lg shadow-red-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
              >
                <Siren className="w-4 h-4 text-white" />
                <span>🚨 فزعة مصر (طوارئ واستغاثات)</span>
                {sosData?.totalCount != null && (
                  <span className="text-xs bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold text-white border border-white/20">
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
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-sm transition-all border ${
                  activeTab === 'carpool'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
              >
                <Car className="w-4 h-4 text-white" />
                <span>🚙 عربية رايحة (مشاوير مشتركة)</span>
                {carpoolData?.totalCount != null && (
                  <span className="text-xs bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold text-white border border-white/20">
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
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-black text-sm transition-all border ${
                  activeTab === 'lost'
                    ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                }`}
              >
                <Search className="w-4 h-4 text-white" />
                <span>🪪 المفقودات والمعثورات (مطابقة ذكية)</span>
                {lostData?.totalCount != null && (
                  <span className="text-xs bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold text-white border border-white/20">
                    {lostData.totalCount}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                id="input-community-search"
                type="text"
                placeholder="بحث بالاسم، المنطقة، الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-2xl text-xs md:text-sm bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-3 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Status Pills */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-3 gap-3 text-xs">
            <span className="font-bold text-slate-400 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              تصفية الحالة في هذا القسم:
            </span>

            <div className="flex flex-wrap gap-2">
              {activeTab === 'sos' &&
                ['Active', 'Resolved', 'All'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition border ${
                      statusFilter === st
                        ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-950'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {st === 'Active' ? '🚨 نشطة حالياً' : st === 'Resolved' ? '✅ تم حلها' : 'الكل'}
                  </button>
                ))}

              {activeTab === 'carpool' &&
                ['Active', 'Full', 'All'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition border ${
                      statusFilter === st
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {st === 'Active' ? '🚙 مقاعد متاحة' : st === 'Full' ? 'مكتملة' : 'الكل'}
                  </button>
                ))}

              {activeTab === 'lost' &&
                ['All', 'Open', 'Matched', 'Resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition border ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-950'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {st === 'All'
                      ? 'الكل'
                      : st === 'Open'
                      ? 'مفتوحة'
                      : st === 'Matched'
                      ? '🎯 مطابقة ذكية فورية'
                      : 'مستلمة'}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            5. TAB 1: SOS & ROAD EMERGENCIES (High-Contrast Dark Cards)
           ========================================================================= */}
        {activeTab === 'sos' && (
          <div className="space-y-4">
            {sosLoading ? (
              <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                <span>جاري تحميل الاستغاثات الحية عبر السيرفر...</span>
              </div>
            ) : filteredSosItems.length === 0 ? (
              <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="font-black text-white text-lg">لا توجد استغاثات مطابقة في هذا النطاق</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  أي استغاثة يطلقها مواطن في محيطك الجغرافي ستصلك فوراً هنا مع رادار الصوت والتنبيه الحي.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSosItems.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-6 rounded-3xl bg-[#0F172A] border-2 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] ${
                      alert.status === 'Active'
                        ? 'border-red-500/60 shadow-red-950/40 ring-1 ring-red-500/20'
                        : 'border-slate-800 opacity-90'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm ${
                            alert.alertType === 'RoadEmergency'
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                              : alert.alertType === 'BloodDonation'
                              ? 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                              : 'bg-red-950/90 text-red-300 border border-red-500/50'
                          }`}
                        >
                          {alert.alertType === 'RoadEmergency' ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              طوارئ سيارة وعطل طريق
                            </>
                          ) : alert.alertType === 'BloodDonation' ? (
                            <>
                              🩸 تبرع عاجل بالدم ({alert.bloodType || 'فصيلة مطلوبة'})
                            </>
                          ) : (
                            <>
                              <Siren className="w-3.5 h-3.5 text-red-400" />
                              استغاثة وفزعة طارئة
                            </>
                          )}
                        </span>

                        <span
                          className={`text-xs font-black px-3 py-1 rounded-xl border ${
                            alert.status === 'Active'
                              ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-md shadow-red-950'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {alert.status === 'Active' ? '🚨 نشط حالياً' : '✅ تم الحل'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-black text-white text-lg leading-snug">{alert.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                          {alert.description}
                        </p>
                      </div>

                      {/* Location & Hospital Box */}
                      <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        {alert.locationName && (
                          <div className="flex items-center gap-2 font-bold text-slate-200">
                            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                            <span>الموقع: {alert.locationName}</span>
                          </div>
                        )}
                        {alert.hospitalName && (
                          <div className="flex items-center gap-2 font-bold text-rose-300">
                            <span>🏥 المستشفى: {alert.hospitalName}</span>
                          </div>
                        )}
                        {alert.contactPhone && (
                          <div className="flex items-center gap-2 font-mono text-cyan-300 font-bold">
                            <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                            <a href={`tel:${alert.contactPhone}`} className="hover:underline">
                              هاتف الطوارئ: {alert.contactPhone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(alert.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Toolbar */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                          <User className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{alert.userName}</div>
                          <div className="text-[11px] text-slate-400">
                            {alert.responsesCount} عروض مساعدة
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedModalItem({ type: 'sos', data: alert })}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 transition"
                        >
                          معاينة
                        </button>

                        {alert.status === 'Active' && (
                          <button
                            onClick={() => resolveSosMutation.mutate(alert.id)}
                            disabled={resolveSosMutation.isPending}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-950 border border-emerald-400 transition"
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
                          className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-xl border border-rose-500/20 transition"
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

        {/* =========================================================================
            6. TAB 2: CARPOOLING ("عربية رايحة" - High-Contrast Dark Cards)
           ========================================================================= */}
        {activeTab === 'carpool' && (
          <div className="space-y-4">
            {carpoolLoading ? (
              <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <span>جاري تحميل المشاوير من السيرفر...</span>
              </div>
            ) : filteredCarpoolItems.length === 0 ? (
              <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                <Car className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="font-black text-white text-lg">لا توجد مشاوير مسجلة في هذا القسم</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  ستظهر مشاوير «عربية رايحة» بمجرد نشرها من قبل السائقين فورياً عبر التطبيق.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCarpoolItems.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-6 rounded-3xl bg-[#0F172A] border-2 border-slate-800 hover:border-emerald-500/50 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-3.5">
                      {/* Car Header & Price */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-black text-white">{ride.carModel}</span>
                            {ride.carColor && (
                              <span className="text-xs text-slate-400 mr-2 font-medium">({ride.carColor})</span>
                            )}
                          </div>
                        </div>

                        <span className="text-xs md:text-sm font-black px-3.5 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-sm">
                          {ride.pricePerSeat} جنيه / مقعد
                        </span>
                      </div>

                      {/* Route Timeline Banner */}
                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-slate-100">
                          <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 shrink-0" />
                          <span>من: {ride.fromCityOrArea}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-slate-100">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
                          <span>إلى: {ride.toCityOrArea}</span>
                        </div>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1.5 bg-slate-800/80 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {new Date(ride.departureTime).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <span className="font-black bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/40">
                          المقاعد المتبقية: {ride.availableSeats} من {ride.totalSeats}
                        </span>

                        <span className="bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
                          {ride.genderPreference === 'FemalesOnly'
                            ? 'بنات فقط 👩'
                            : ride.genderPreference === 'MalesOnly'
                            ? 'شباب فقط 👨'
                            : 'متاح للجميع'}
                        </span>
                      </div>

                      {ride.notes && (
                        <p className="text-xs text-slate-300 italic bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                          « {ride.notes} »
                        </p>
                      )}
                    </div>

                    {/* Driver & Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">السائق:</span>
                        <span className="text-xs font-black text-white flex items-center gap-2">
                          {ride.driverName}
                          {ride.driverHasNationalId && (
                            <span
                              className="inline-flex items-center text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/50 font-black gap-1"
                              title="الهوية موثقة بالرقم القومي المصري"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              موثق بالرقم القومي
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedModalItem({ type: 'carpool', data: ride })}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 transition"
                        >
                          معاينة
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا المشوار المشترك؟')) {
                              deleteItemMutation.mutate({ type: 'carpool', id: ride.id });
                            }
                          }}
                          className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-xl border border-rose-500/20 transition"
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

        {/* =========================================================================
            7. TAB 3: LOST AND FOUND HUB (Smart Match - High-Contrast Dark Cards)
           ========================================================================= */}
        {activeTab === 'lost' && (
          <div className="space-y-4">
            {lostLoading ? (
              <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <span>جاري تحميل المفقودات والمطابقات الذكية...</span>
              </div>
            ) : filteredLostItems.length === 0 ? (
              <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                <ShieldCheck className="w-12 h-12 text-indigo-400 mx-auto" />
                <h3 className="font-black text-white text-lg">لا توجد بلاغات مفقودات مسجلة حالياً</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  تتم المطابقة التلقائية فور تسجيل أي بطاقة رقم قومي أو رخصة أو مقتنيات عبر النظام.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLostItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-6 rounded-3xl bg-[#0F172A] border-2 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] ${
                      item.isSmartMatched
                        ? 'border-indigo-500/70 shadow-indigo-950/50 ring-1 ring-indigo-500/30'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Header Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black px-3.5 py-1 rounded-full border shadow-sm ${
                            item.itemType === 'Found'
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                              : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
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
                          <span className="text-xs font-black px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse shadow-md shadow-emerald-950 border border-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            🎯 مطابقة ذكية فورية!
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            {item.status === 'Open' ? 'مفتوح' : item.status === 'Resolved' ? 'تم التسليم' : item.status}
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h3 className="font-black text-white text-lg leading-snug">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Details Box */}
                      <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        {item.fullNameOnItem && (
                          <div className="font-bold text-slate-200">
                            الاسم المدون على الأوراق:{' '}
                            <span className="font-black text-cyan-400">{item.fullNameOnItem}</span>
                          </div>
                        )}
                        {item.maskedNationalIdOnItem && (
                          <div className="font-mono text-xs text-slate-300">
                            الرقم القومي المدون:{' '}
                            <span className="font-bold tracking-widest text-amber-300 bg-black/50 px-2 py-0.5 rounded border border-slate-800">
                              {item.maskedNationalIdOnItem}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800/80">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>مكان البلاغ: {item.locationDescription}</span>
                        </div>
                      </div>

                      {/* Smart Match Banner */}
                      {item.isSmartMatched && item.matchedUserName && (
                        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 font-bold space-y-1.5 shadow-md">
                          <div className="flex items-center gap-2 font-black text-emerald-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            تم التعرف التلقائي على صاحب الأوراق وإخطاره عبر إشعار فوري:
                          </div>
                          <div className="text-white font-black text-sm pr-6">
                            المواطن المسجل: {item.matchedUserName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                      <div className="text-xs text-slate-400">
                        مقدم البلاغ: <span className="font-black text-white">{item.reporterName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedModalItem({ type: 'lost', data: item })}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 transition"
                        >
                          معاينة
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا البلاغ؟')) {
                              deleteItemMutation.mutate({ type: 'lost-and-found', id: item.id });
                            }
                          }}
                          className="p-2 text-rose-400 hover:bg-rose-950/60 rounded-xl border border-rose-500/20 transition"
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

        {/* =========================================================================
            8. INSPECTION MODAL DIALOG (High-Contrast Cyber Slate Modal)
           ========================================================================= */}
        {selectedModalItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
              className="bg-[#0F172A] rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border-2 border-slate-700 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  {selectedModalItem.type === 'sos' && (
                    <Siren className="w-7 h-7 text-red-500 animate-pulse" />
                  )}
                  {selectedModalItem.type === 'carpool' && (
                    <Car className="w-7 h-7 text-emerald-500" />
                  )}
                  {selectedModalItem.type === 'lost' && (
                    <Search className="w-7 h-7 text-indigo-500" />
                  )}
                  <h3 className="font-black text-white text-xl">
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
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
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
                        <span className="text-xs font-black px-3.5 py-1 rounded-full bg-red-950 text-red-300 border border-red-500/50">
                          {sos.alertType === 'RoadEmergency'
                            ? 'طوارئ سيارة وعطل طريق'
                            : sos.alertType === 'BloodDonation'
                            ? `طلب تبرع عاجل بالدم (${sos.bloodType})`
                            : 'استغاثة عامة عاجلة'}
                        </span>
                        <h4 className="text-xl font-black text-white mt-2.5">{sos.title}</h4>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          {sos.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                          <span className="text-slate-400">صاحب الاستغاثة:</span>
                          <div className="font-black text-white text-sm">{sos.userName}</div>
                          {sos.contactPhone && (
                            <a
                              href={`tel:${sos.contactPhone}`}
                              className="inline-flex items-center gap-2 text-cyan-400 font-mono font-black mt-1 hover:underline"
                            >
                              <Phone className="w-4 h-4" />
                              {sos.contactPhone} (اتصال فوري)
                            </a>
                          )}
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                          <span className="text-slate-400">الموقع الجغرافي:</span>
                          <div className="font-black text-white text-sm">{sos.locationName || 'غير محدد'}</div>
                          {sos.latitude && sos.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${sos.latitude},${sos.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-400 font-black mt-1 hover:underline"
                            >
                              <Compass className="w-4 h-4" />
                              عرض الإحداثيات على الخريطة
                            </a>
                          )}
                        </div>
                      </div>

                      {sos.hospitalName && (
                        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs sm:text-sm text-rose-200 font-bold">
                          🏥 المستشفى المطلوب التبرع فيه: <span className="font-black text-white">{sos.hospitalName}</span>
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
                      <div className="p-5 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-2">
                        <div className="text-xs text-emerald-400 font-black">مسار المشوار المشترك:</div>
                        <div className="text-lg font-black text-white flex items-center gap-3">
                          <span>{ride.fromCityOrArea}</span>
                          <span className="text-emerald-400">➔</span>
                          <span>{ride.toCityOrArea}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                          <span className="text-slate-400">السائق:</span>
                          <div className="font-black text-white text-sm flex items-center gap-2">
                            {ride.driverName}
                            {ride.driverHasNationalId && (
                              <span className="text-emerald-400 font-bold">(موثق بالرقم القومي)</span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                          <span className="text-slate-400">السيارة:</span>
                          <div className="font-black text-white text-sm">
                            {ride.carModel} {ride.carColor ? `(${ride.carColor})` : ''}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                          <span className="text-slate-400">المقاعد المتاحة:</span>
                          <div className="font-black text-white text-sm">
                            {ride.availableSeats} من إجمالي {ride.totalSeats}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                          <span className="text-slate-400">سعر المقعد:</span>
                          <div className="font-black text-emerald-400 text-sm">{ride.pricePerSeat} جنيه مصري</div>
                        </div>
                      </div>

                      {ride.notes && (
                        <div className="p-4 bg-slate-950 rounded-2xl text-xs text-slate-300 border border-slate-800">
                          <span className="font-black text-white">ملاحظات السائق: </span>
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
                        <span className="text-xs font-black px-3.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/50">
                          {lost.itemType === 'Found' ? 'تم العثور على أوراق/مقتنيات' : 'بلاغ فقدان'}
                        </span>
                        <h4 className="text-xl font-black text-white mt-2.5">{lost.title}</h4>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          {lost.description}
                        </p>
                      </div>

                      <div className="p-5 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-2.5 text-xs sm:text-sm">
                        {lost.fullNameOnItem && (
                          <div className="text-slate-300">
                            الاسم المدون على الأوراق: <span className="font-black text-cyan-400">{lost.fullNameOnItem}</span>
                          </div>
                        )}
                        {lost.maskedNationalIdOnItem && (
                          <div className="font-mono text-slate-300">
                            الرقم القومي المدون: <span className="font-black tracking-widest text-amber-300">{lost.maskedNationalIdOnItem}</span>
                          </div>
                        )}
                        <div className="text-slate-400">
                          مكان البلاغ: <span className="font-bold text-white">{lost.locationDescription}</span>
                        </div>
                      </div>

                      {lost.isSmartMatched && (
                        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs sm:text-sm text-emerald-200 font-bold space-y-1.5 shadow-md">
                          <div className="font-black text-emerald-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            تمت المطابقة الذكية بنجاح!
                          </div>
                          <div>المواطن صاحب الأوراق المسجل في التطبيق: <strong className="text-white">{lost.matchedUserName || 'مواطن مسجل'}</strong></div>
                          <div className="text-xs text-emerald-400">تم إرسال إشعار فوري (Push + In-App) بالموعد والمكان.</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                {selectedModalItem.type === 'sos' && (selectedModalItem.data as CommunityAlertDto).status === 'Active' && (
                  <button
                    onClick={() => resolveSosMutation.mutate(selectedModalItem.data.id)}
                    disabled={resolveSosMutation.isPending}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black rounded-xl shadow-md shadow-emerald-950 border border-emerald-400 transition"
                  >
                    تأكيد حل الاستغاثة
                  </button>
                )}

                <button
                  onClick={() => setSelectedModalItem(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-black rounded-xl border border-slate-700 transition"
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
