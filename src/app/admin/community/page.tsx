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
  CarpoolRequestDto,
  CarpoolTransactionDto,
  LostAndFoundItemDto,
  BroadcastCommunityItemRequest,
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
  Volume2,
  VolumeX,
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
  Megaphone,
  Ban,
  Lock,
  Eye,
  Check,
  DollarSign,
  Radio,
  Send,
  Navigation,
} from 'lucide-react';

export default function AdminCommunityPage() {
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'sos' | 'carpool' | 'lost'>('sos');
  const [carpoolSubTab, setCarpoolSubTab] = useState<'rides' | 'requests' | 'transactions'>('rides');
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

  // Selected item for Inspection Modal
  const [selectedModalItem, setSelectedModalItem] = useState<{
    type: 'sos' | 'carpool' | 'lost';
    data: CommunityAlertDto | CarpoolRideDto | LostAndFoundItemDto;
  } | null>(null);

  // Urgent Broadcast Modal State
  const [broadcastModalItem, setBroadcastModalItem] = useState<{
    itemType: 'sos' | 'carpool' | 'lost-and-found';
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPush, setBroadcastPush] = useState(true);
  const [broadcastFlash, setBroadcastFlash] = useState(true);
  const [broadcastDuration, setBroadcastDuration] = useState(24);

  // Ban / Block Modal State
  const [banModalItem, setBanModalItem] = useState<{
    itemType: 'sos' | 'carpool' | 'lost-and-found';
    id: string;
    title: string;
    authorName: string;
  } | null>(null);
  const [banReason, setBanReason] = useState('محتوى زائف أو غير لائق');

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
    enabled: adminReady && activeTab === 'carpool' && carpoolSubTab === 'rides',
  });

  const {
    data: carpoolRequestsData,
    isLoading: carpoolRequestsLoading,
    refetch: refetchCarpoolRequests,
  } = useQuery({
    queryKey: ['admin', 'community', 'carpool-requests'],
    queryFn: ({ signal }) => communityAdminApi.getCarpoolRequests(1, 50, undefined, signal),
    enabled: adminReady && activeTab === 'carpool' && carpoolSubTab === 'requests',
  });

  const {
    data: carpoolTransactionsData,
    isLoading: carpoolTransactionsLoading,
    refetch: refetchCarpoolTransactions,
  } = useQuery({
    queryKey: ['admin', 'community', 'carpool-transactions'],
    queryFn: ({ signal }) => communityAdminApi.getCarpoolTransactions(1, 50, signal),
    enabled: adminReady && activeTab === 'carpool' && carpoolSubTab === 'transactions',
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

  const banItemMutation = useMutation({
    mutationFn: ({
      itemType,
      id,
      reason,
    }: {
      itemType: 'sos' | 'carpool' | 'lost-and-found';
      id: string;
      reason: string;
    }) => communityAdminApi.banItem(itemType, id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community'] });
      setBanModalItem(null);
      setSelectedModalItem(null);
      alert('تم حظر وإلغاء المنشور فوراً بنجاح ✅');
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: ({
      itemType,
      id,
      req,
    }: {
      itemType: 'sos' | 'carpool' | 'lost-and-found';
      id: string;
      req: BroadcastCommunityItemRequest;
    }) => communityAdminApi.broadcastItemAsAd(itemType, id, req),
    onSuccess: (data) => {
      alert(`تم إطلاق التنبيه الشامل والإعلان العاجل بنجاح 🚀!\nيصل هذا البث إلى حوالي ${data.targetRecipientsEstimate} مستخدم.`);
      setBroadcastModalItem(null);
    },
  });

  const handleRefresh = () => {
    if (activeTab === 'sos') refetchSos();
    if (activeTab === 'carpool') {
      if (carpoolSubTab === 'rides') refetchCarpool();
      if (carpoolSubTab === 'requests') refetchCarpoolRequests();
      if (carpoolSubTab === 'transactions') refetchCarpoolTransactions();
    }
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
        r.carModel.toLowerCase().includes(q) ||
        (r.carPlateNumber && r.carPlateNumber.toLowerCase().includes(q))
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
        (l.locationAddress && l.locationAddress.toLowerCase().includes(q))
    );
  }, [lostData, searchQuery]);

  return (
    <AdminShell>
      <div className="space-y-6 pb-12 font-sans" dir="rtl">
        {/* =========================================================================
            1. CYBERPUNK HEADER (Dark Slate, Glassmorphism, Neon Accents)
           ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border-2 border-slate-700/80 shadow-2xl p-6 md:p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-black shadow-inner">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span className="text-slate-300">
                  حالة الرادار اللحظي: {connectionStatus === 'connected' ? 'متصل وحي (Live)' : 'جاري الاتصال...'}
                </span>
                {realtimeCounter > 0 && (
                  <span className="bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40 text-[11px]">
                    +{realtimeCounter} أحداث جديدة
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Radio className="w-8 h-8 text-red-500 animate-pulse" />
                <span>غرفة عمليات المجتمع والرصد الشامل في مصر</span>
              </h1>

              <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed font-normal">
                الرصد الفوري والتدخل الإداري الشامل: حظر المحتوى المخالف، بث الاستغاثات والمفقودات كـ <strong className="text-amber-400 font-bold">«إعلانات عاجلة»</strong> لجميع المستخدمين، ومتابعة رحلات ومعاملات <strong className="text-emerald-400 font-bold">«عربية رايحة»</strong>.
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
              <span className="text-xs font-black text-rose-300 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-500/50 flex items-center gap-1.5 shadow-sm">
                🩸 تبرع بالدم
              </span>
              <div className="w-11 h-11 rounded-2xl bg-rose-600/30 border border-rose-500/50 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950">
                <HeartHandshake className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-4xl font-black text-rose-400 tracking-tight">{bloodRequestsCount}</div>
              <p className="text-xs font-bold text-slate-300 mt-1">حالات حرجة تطلب فصائل دم نادرة</p>
            </div>
          </div>

          {/* Card 3: Available Carpool Seats */}
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
              <p className="text-xs font-bold text-slate-300 mt-1">مقعد متاح للتنقل المشترك حالياً</p>
            </div>
          </div>

          {/* Card 4: Smart Lost & Found Matches */}
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
              <p className="text-xs font-bold text-slate-300 mt-1">بطاقة وهوية تم التعرف على صاحبها</p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. TABS & SEARCH / FILTER TOOLBAR
           ========================================================================= */}
        <div className="bg-[#0F172A] rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Main Tabs */}
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
                <span>🚙 عربية رايحة (مشاوير ومعاملات)</span>
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
                placeholder="بحث بالاسم، المنطقة، نمرة العربية، الهاتف..."
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

          {/* Sub-Tabs for Carpool */}
          {activeTab === 'carpool' && (
            <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 font-bold ml-2">طريقة العرض:</span>
              <button
                onClick={() => setCarpoolSubTab('rides')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                  carpoolSubTab === 'rides'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                🚙 المشاوير المعلنة
              </button>
              <button
                onClick={() => setCarpoolSubTab('requests')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                  carpoolSubTab === 'requests'
                    ? 'bg-teal-600 text-white border-teal-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                🙋‍♂️ طلبات الركاب (المشاوير المطلوبة)
              </button>
              <button
                onClick={() => setCarpoolSubTab('transactions')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition border ${
                  carpoolSubTab === 'transactions'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                📜 سجل المعاملات والرحلات المنتهية (Uber-style)
              </button>
            </div>
          )}

          {/* Filter Status Pills */}
          {activeTab !== 'carpool' || carpoolSubTab === 'rides' ? (
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
                  carpoolSubTab === 'rides' &&
                  ['Active', 'Full', 'Departed', 'Completed', 'All'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition border ${
                        statusFilter === st
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {st === 'Active'
                        ? '🚙 مقاعد متاحة'
                        : st === 'Full'
                        ? 'مكتملة'
                        : st === 'Departed'
                        ? 'انطلقت'
                        : st === 'Completed'
                        ? 'منتهية'
                        : 'الكل'}
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
                        : 'تم الاستلام'}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* =========================================================================
            5. TAB 1: SOS & ROAD EMERGENCIES
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

                      {/* Location & Contact Box */}
                      <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        {alert.locationName && (
                          <div className="flex items-center justify-between font-bold text-slate-200">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                              <span>الموقع: {alert.locationName}</span>
                            </div>
                            {alert.latitude && alert.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold text-[11px]"
                              >
                                <Compass className="w-3 h-3" />
                                الخريطة
                              </a>
                            )}
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

                    {/* Bottom Toolbar & Action Controls */}
                    <div className="flex flex-wrap items-center justify-between pt-4 mt-4 border-t border-slate-800/80 gap-3">
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
                        {/* Broadcast as Urgent Flash Ad Button */}
                        <button
                          onClick={() => {
                            setBroadcastModalItem({
                              itemType: 'sos',
                              id: alert.id,
                              title: alert.title,
                              description: alert.description,
                            });
                            setBroadcastTitle(`🚨 تنبيه طوارئ عاجل: ${alert.title}`);
                            setBroadcastMessage(
                              `${alert.description}\nالموقع: ${alert.locationName || 'محيطك الجغرافي'} - يرجى المساعدة لمن يستطيع!`
                            );
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-md border border-amber-300 flex items-center gap-1.5 transition active:scale-95"
                          title="ترقية إلى إعلان عاجل وشامل لجميع المستخدمين"
                        >
                          <Megaphone className="w-3.5 h-3.5 animate-bounce" />
                          <span>إعلان عاجل 📢</span>
                        </button>

                        <button
                          onClick={() => setSelectedModalItem({ type: 'sos', data: alert })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 transition"
                        >
                          معاينة
                        </button>

                        {alert.status === 'Active' && (
                          <button
                            onClick={() => resolveSosMutation.mutate(alert.id)}
                            disabled={resolveSosMutation.isPending}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-950 border border-emerald-400 transition"
                          >
                            تأكيد الحل
                          </button>
                        )}

                        {/* Ban Post Button */}
                        <button
                          onClick={() =>
                            setBanModalItem({
                              itemType: 'sos',
                              id: alert.id,
                              title: alert.title,
                              authorName: alert.userName,
                            })
                          }
                          className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-xl border border-rose-500/30 transition"
                          title="حظر البلاغ فوراً"
                        >
                          <Ban className="w-4 h-4" />
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
            6. TAB 2: CARPOOLING ("عربية رايحة")
           ========================================================================= */}
        {activeTab === 'carpool' && (
          <div className="space-y-4">
            {/* View 1: Rides */}
            {carpoolSubTab === 'rides' && (
              <>
                {carpoolLoading ? (
                  <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <span>جاري تحميل المشاوير من السيرفر...</span>
                  </div>
                ) : filteredCarpoolItems.length === 0 ? (
                  <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                    <Car className="w-12 h-12 text-emerald-400 mx-auto" />
                    <h3 className="font-black text-white text-lg">لا توجد مشاوير مسجلة في هذا القسم</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCarpoolItems.map((ride) => (
                      <div
                        key={ride.id}
                        className="p-6 rounded-3xl bg-[#0F172A] border-2 border-slate-800 hover:border-emerald-500/50 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01]"
                      >
                        <div className="space-y-3.5">
                          {/* Car Header & Plate & Price */}
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

                            <div className="flex items-center gap-2">
                              {/* Car Plate Number Metallic Badge */}
                              {ride.carPlateNumber && (
                                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 border border-amber-500/50 shadow-sm tracking-wider">
                                  {ride.carPlateNumber}
                                </span>
                              )}

                              <span className="text-xs md:text-sm font-black px-3 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-sm">
                                {ride.pricePerSeat} ج.م / مقعد
                              </span>
                            </div>
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
                                ? 'سيدات فقط 👩'
                                : ride.genderPreference === 'MalesOnly'
                                ? 'شباب فقط 👨'
                                : 'متاح للجميع'}
                            </span>

                            <span className="bg-slate-800/80 text-cyan-300 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
                              الحالة: {ride.status}
                            </span>
                          </div>
                        </div>

                        {/* Driver & Footer */}
                        <div className="flex flex-wrap items-center justify-between pt-4 mt-4 border-t border-slate-800/80 gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                              {ride.driverName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                {ride.driverName}
                                {ride.driverHasNationalId && (
                                  <span title="موثق بالرقم القومي"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /></span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setBroadcastModalItem({
                                  itemType: 'carpool',
                                  id: ride.id,
                                  title: `مشوار من ${ride.fromCityOrArea} إلى ${ride.toCityOrArea}`,
                                  description: `سائق: ${ride.driverName} - المقاعد: ${ride.availableSeats}`,
                                });
                                setBroadcastTitle(`🚙 إعلان مشوار عاجل: ${ride.fromCityOrArea} ➔ ${ride.toCityOrArea}`);
                                setBroadcastMessage(
                                  `نشر السائق ${ride.driverName} مشواراً بسعر ${ride.pricePerSeat} ج.م في موعد ${new Date(
                                    ride.departureTime
                                  ).toLocaleTimeString('ar-EG')}. احجز مقعدك الآن!`
                                );
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition"
                              title="ترقية إلى إعلان عاجل للمشوار"
                            >
                              <Megaphone className="w-3.5 h-3.5" />
                              <span>إعلان 📢</span>
                            </button>

                            <button
                              onClick={() => setSelectedModalItem({ type: 'carpool', data: ride })}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 transition"
                            >
                              معاينة
                            </button>

                            <button
                              onClick={() =>
                                setBanModalItem({
                                  itemType: 'carpool',
                                  id: ride.id,
                                  title: `مشوار ${ride.fromCityOrArea} إلى ${ride.toCityOrArea}`,
                                  authorName: ride.driverName,
                                })
                              }
                              className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-xl border border-rose-500/30 transition"
                              title="حظر المشوار"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* View 2: Passenger Ride Requests */}
            {carpoolSubTab === 'requests' && (
              <div className="space-y-4">
                {carpoolRequestsLoading ? (
                  <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
                    <span>جاري تحميل طلبات الركاب...</span>
                  </div>
                ) : !carpoolRequestsData?.items?.length ? (
                  <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                    <Users className="w-12 h-12 text-teal-400 mx-auto" />
                    <h3 className="font-black text-white text-lg">لا توجد طلبات ركاب معلنة حالياً</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {carpoolRequestsData.items.map((req) => (
                      <div
                        key={req.id}
                        className="p-6 rounded-3xl bg-[#0F172A] border-2 border-slate-800 hover:border-teal-500/50 shadow-xl space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black px-3 py-1 rounded-xl bg-teal-950 text-teal-300 border border-teal-500/50">
                            مطلوب {req.seatsNeeded} مقعد
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {new Date(req.preferredDepartureTime).toLocaleString('ar-EG')}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-sm font-black text-white">
                          <div>من: <span className="text-blue-400">{req.fromCityOrArea}</span></div>
                          <div>إلى: <span className="text-emerald-400">{req.toCityOrArea}</span></div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{req.passengerName}</span>
                            {req.passengerHasNationalId && (
                              <span title="موثق بالرقم القومي"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
                            )}
                          </div>
                          {req.passengerPhoneNumber && (
                            <a href={`tel:${req.passengerPhoneNumber}`} className="text-cyan-400 font-mono font-bold hover:underline">
                              📞 {req.passengerPhoneNumber}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View 3: Ride Transactions (Uber Style) */}
            {carpoolSubTab === 'transactions' && (
              <div className="space-y-4">
                {carpoolTransactionsLoading ? (
                  <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <span>جاري تحميل سجل المعاملات...</span>
                  </div>
                ) : !carpoolTransactionsData?.items?.length ? (
                  <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                    <DollarSign className="w-12 h-12 text-blue-400 mx-auto" />
                    <h3 className="font-black text-white text-lg">لا توجد رحلات منتهية في سجل المعاملات بعد</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {carpoolTransactionsData.items.map((tx) => (
                      <div
                        key={tx.transactionId}
                        className="p-6 rounded-3xl bg-[#0F172A] border-2 border-slate-800 hover:border-blue-500/50 shadow-xl space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-3 py-1 rounded-xl bg-blue-950 text-blue-300 border border-blue-500/50">
                              {tx.role === 'Driver' ? 'سائق' : 'راكب'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(tx.departureTime).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <span className="text-base font-black text-emerald-400">
                            {tx.totalAmount} {tx.currency}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">المسار:</span>
                            <span className="font-bold text-white">{tx.fromCityOrArea} ➔ {tx.toCityOrArea}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">السيارة والنمرة:</span>
                            <span className="font-bold text-amber-300">{tx.carModel} {tx.carPlateNumber ? `[${tx.carPlateNumber}]` : ''}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">الطرف الآخر:</span>
                            <span className="font-bold text-cyan-300">{tx.counterpartName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            7. TAB 3: LOST & FOUND WITH PRIVACY BADGES & MAP COORDINATES
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
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLostItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-6 rounded-3xl bg-[#0F172A] border-2 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] ${
                      item.isPrivateToMatchedUser
                        ? 'border-emerald-500/70 shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                        : item.isSmartMatched
                        ? 'border-indigo-500/70 shadow-indigo-950/50'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Privacy Alert Badge if smart-matched & hidden from public */}
                      {item.isPrivateToMatchedUser && (
                        <div className="p-2.5 bg-emerald-950/90 border border-emerald-500/60 rounded-2xl flex items-center gap-2 text-xs font-black text-emerald-300 shadow-md">
                          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>منشور خاص لصاحب الهوية حصرياً - محجوب عن التغذية العامة ومحمي بالكامل 🔒</span>
                        </div>
                      )}

                      {/* Header Badges */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black px-3.5 py-1 rounded-full border shadow-sm ${
                            item.itemType === 'Found'
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                              : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
                          }`}
                        >
                          {item.itemType === 'Found' ? '✅ تم العثور على' : '🔍 مفقود'} ({item.category})
                        </span>

                        <div className="flex items-center gap-2">
                          {item.isReceived && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-900 text-teal-200 border border-teal-500/50 flex items-center gap-1">
                              <Check className="w-3 h-3 text-teal-300" />
                              تم الاستلام
                            </span>
                          )}

                          {item.isSmartMatched ? (
                            <span className="text-xs font-black px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white animate-pulse shadow-md border border-emerald-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              🎯 مطابقة فورية!
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h3 className="font-black text-white text-lg leading-snug">{item.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Details Box with Address & Map */}
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
                        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>المكان: {item.locationAddress || item.locationDescription}</span>
                          </div>
                          {item.latitude && item.longitude && (
                            <a
                              href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 font-bold text-[11px]"
                            >
                              <Compass className="w-3 h-3" />
                              الخريطة
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Smart Match Banner */}
                      {item.isSmartMatched && item.matchedUserName && (
                        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 font-bold space-y-1.5 shadow-md">
                          <div className="flex items-center gap-2 font-black text-emerald-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            المواطن صاحب الأوراق المسجل في التطبيق:
                          </div>
                          <div className="text-white font-black text-sm pr-6">
                            {item.matchedUserName}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-4 mt-4 border-t border-slate-800/80 gap-3">
                      <div className="text-xs text-slate-400">
                        مقدم البلاغ: <span className="font-black text-white">{item.reporterName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Broadcast as Urgent Flash Ad Button */}
                        <button
                          onClick={() => {
                            setBroadcastModalItem({
                              itemType: 'lost-and-found',
                              id: item.id,
                              title: item.title,
                              description: item.description,
                            });
                            setBroadcastTitle(`📢 بلاغ مفقودات عاجل: ${item.title}`);
                            setBroadcastMessage(
                              `${item.description}\nالمكان: ${item.locationAddress || item.locationDescription || 'مصر'} - ساعدنا في العثور عليه لمن شاهده!`
                            );
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-md border border-indigo-300 flex items-center gap-1.5 transition active:scale-95"
                          title="ترقية إلى إعلان عاجل وشامل لجميع المستخدمين"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>إعلان عاجل 📢</span>
                        </button>

                        <button
                          onClick={() => setSelectedModalItem({ type: 'lost', data: item })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 transition"
                        >
                          معاينة
                        </button>

                        <button
                          onClick={() =>
                            setBanModalItem({
                              itemType: 'lost-and-found',
                              id: item.id,
                              title: item.title,
                              authorName: item.reporterName,
                            })
                          }
                          className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded-xl border border-rose-500/30 transition"
                          title="حظر الإعلان فوراً"
                        >
                          <Ban className="w-4 h-4" />
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
            8. URGENT BROADCAST & FLASH AD MODAL
           ========================================================================= */}
        {broadcastModalItem && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0F172A] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border-2 border-amber-500/60 animate-in fade-in zoom-in-95 text-right" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 text-amber-400 font-black text-lg">
                  <Megaphone className="w-6 h-6 animate-pulse" />
                  <span>ترقية المنشور إلى إعلان عاجل وشامل (Broadcast)</span>
                </div>
                <button
                  onClick={() => setBroadcastModalItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-xs text-amber-200 leading-relaxed">
                📢 <strong>ماذا تعني هذه الترقية؟</strong> سيقوم السيرفر فورياً بإرسال إشعار Push شامل لجميع المستخدمين في مصر مع إظهار المنشور كـ Flash Modal فور فتح التطبيق، لتوسيعه ونشره بسرعة قصوى في حالات الطوارئ والمفقودات الحرجة!
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">عنوان الإعلان العاجل:</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">نص وتفاصيل الإعلان:</label>
                  <textarea
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white leading-relaxed focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastPush}
                      onChange={(e) => setBroadcastPush(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="font-bold text-slate-200">إشعار Push لجميع الهواتف</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastFlash}
                      onChange={(e) => setBroadcastFlash(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="font-bold text-slate-200">نافذة منبثقة أول ما يفتحوا</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">مدة بقاء الإعلان العاجل:</label>
                  <select
                    value={broadcastDuration}
                    onChange={(e) => setBroadcastDuration(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value={6}>6 ساعات</option>
                    <option value={12}>12 ساعة</option>
                    <option value={24}>24 ساعة (يوم كامل)</option>
                    <option value={48}>48 ساعة</option>
                    <option value={168}>أسبوع كامل</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setBroadcastModalItem(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={() =>
                    broadcastMutation.mutate({
                      itemType: broadcastModalItem.itemType,
                      id: broadcastModalItem.id,
                      req: {
                        customTitle: broadcastTitle,
                        customMessage: broadcastMessage,
                        sendPushNotification: broadcastPush,
                        showAsFlashPopup: broadcastFlash,
                        durationHours: broadcastDuration,
                      },
                    })
                  }
                  disabled={broadcastMutation.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-rose-600 to-amber-500 hover:from-amber-600 hover:to-rose-700 text-white text-xs font-black rounded-xl shadow-lg border border-amber-300 flex items-center gap-2"
                >
                  {broadcastMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>إطلاق التنبيه الشامل الآن 🚀</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            9. BAN / BLOCK MODAL
           ========================================================================= */}
        {banModalItem && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0F172A] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border-2 border-rose-500/60 animate-in fade-in zoom-in-95 text-right" dir="rtl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5 text-rose-400 font-black text-lg">
                  <Ban className="w-6 h-6 text-rose-500" />
                  <span>حظر وإلغاء المنشور</span>
                </div>
                <button
                  onClick={() => setBanModalItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-3">
                <p>
                  أنت على وشك حظر وإخفاء المنشور:{' '}
                  <strong className="text-white">«{banModalItem.title}»</strong> للناشر{' '}
                  <strong className="text-amber-400">{banModalItem.authorName}</strong>.
                </p>

                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">سبب الحظر:</label>
                  <select
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold focus:border-rose-500 focus:outline-none"
                  >
                    <option value="محتوى زائف أو غير لائق">محتوى زائف أو غير لائق</option>
                    <option value="سبام أو إعلانات مضللة">سبام أو إعلانات مضللة</option>
                    <option value="انتحال شخصية أو تلاعب">انتحال شخصية أو تلاعب</option>
                    <option value="مخالفة شروط وسياسة المجتمع">مخالفة شروط وسياسة المجتمع</option>
                    <option value="إلغاء إداري عاجل">إلغاء إداري عاجل</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setBanModalItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={() =>
                    banItemMutation.mutate({
                      itemType: banModalItem.itemType,
                      id: banModalItem.id,
                      reason: banReason,
                    })
                  }
                  disabled={banItemMutation.isPending}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg border border-rose-400 flex items-center gap-1.5"
                >
                  {banItemMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  <span>تأكيد الحظر والإخفاء ⛔</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            10. INSPECTION MODAL DIALOG
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
                    <ShieldCheck className="w-7 h-7 text-indigo-500" />
                  )}
                  <h3 className="text-xl font-black text-white">تفاصيل الرصد والمراجعة</h3>
                </div>

                <button
                  id="btn-close-modal"
                  onClick={() => setSelectedModalItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                          {sos.alertType}
                        </span>
                        <h4 className="text-xl font-black text-white mt-2.5">{sos.title}</h4>
                        <p className="text-sm text-slate-300 mt-2 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                          {sos.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
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
                          <span className="text-slate-400">السيارة والنمرة:</span>
                          <div className="font-black text-white text-sm">
                            {ride.carModel} {ride.carPlateNumber ? `[${ride.carPlateNumber}]` : ''}
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
                          مكان البلاغ: <span className="font-bold text-white">{lost.locationAddress || lost.locationDescription}</span>
                        </div>
                      </div>

                      {lost.isSmartMatched && (
                        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs sm:text-sm text-emerald-200 font-bold space-y-1.5 shadow-md">
                          <div className="font-black text-emerald-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            تمت المطابقة الذكية بنجاح!
                          </div>
                          <div>المواطن صاحب الأوراق المسجل في التطبيق: <strong className="text-white">{lost.matchedUserName || 'مواطن مسجل'}</strong></div>
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
