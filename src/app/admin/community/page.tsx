'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
import { resolveMediaUrl, getMediaCandidateUrls } from '@/lib/media';
import {
  CommunityAlertDto,
  CarpoolRideDto,
  CarpoolRequestDto,
  CarpoolTransactionDto,
  CarpoolDriverRideHistoryDto,
  CarpoolBookingSettlementDto,
  LostAndFoundItemDto,
  BroadcastCommunityItemRequest,
} from '@/types/community';
import {
  Siren,
  Car,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  User,
  HeartHandshake,
  Volume2,
  VolumeX,
  Activity,
  X,
  Flame,
  Sparkles,
  Filter,
  Users,
  Compass,
  CheckCircle2,
  Megaphone,
  Ban,
  Lock,
  DollarSign,
  Radio,
  Send,
  Zap,
  Calendar,
  ArrowRightLeft,
  Navigation,
  CheckCheck,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  Copy,
  Check,
  ExternalLink,
  Eye,
  FileText,
  PhoneCall,
  Shield,
  AlertCircle,
  UserCheck,
  Maximize2,
  Receipt,
} from 'lucide-react';

// ============================================================================
// RESILIENT SMART MEDIA & AVATAR HELPERS
// ============================================================================

interface SafeMediaThumbnailProps {
  src?: string | null;
  alt: string;
  title: string;
  onClick?: () => void;
  className?: string;
  badgeText?: string;
}

function SafeMediaThumbnail({
  src,
  alt,
  title,
  onClick,
  className,
  badgeText,
}: SafeMediaThumbnailProps) {
  const candidates = useMemo(() => getMediaCandidateUrls(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(!src);
  }, [src]);

  const activeSrc = candidates[candidateIndex] || resolveMediaUrl(src);

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-center ${
          className || ''
        }`}
      >
        <FileText className="w-5 h-5 mb-1 text-slate-600" />
        <span className="text-[10px] text-slate-400 font-bold line-clamp-1">{title}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:border-cyan-400 transition shadow-md hover:shadow-cyan-500/20 ${
        className || ''
      }`}
    >
      <img
        src={activeSrc}
        alt={alt}
        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        onError={handleError}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition duration-200 backdrop-blur-xs">
        <Eye className="w-5 h-5 text-cyan-400 mb-1 animate-pulse" />
        <span>معاينة مكبرة</span>
      </div>
      {badgeText && (
        <span className="absolute bottom-1 right-1 left-1 bg-black/85 text-[10px] text-slate-200 font-bold text-center rounded py-0.5 px-1 truncate border border-slate-700/50">
          {badgeText}
        </span>
      )}
    </div>
  );
}

function SafeAvatar({
  src,
  name,
  size = 36,
  onClick,
}: {
  src?: string | null;
  name: string;
  size?: number;
  onClick?: () => void;
}) {
  const candidates = useMemo(() => getMediaCandidateUrls(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(!src);
  }, [src]);

  const activeSrc = candidates[candidateIndex] || resolveMediaUrl(src);

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const initial = (name || 'م').trim().charAt(0);

  if (!src || hasError) {
    return (
      <div
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs font-black text-white shadow-xs"
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full overflow-hidden border border-slate-600 relative group ${
        onClick ? 'cursor-pointer hover:border-cyan-400' : ''
      }`}
    >
      <img
        src={activeSrc}
        alt={name}
        className="w-full h-full object-cover"
        onError={handleError}
      />
      {onClick && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <Eye className="w-3.5 h-3.5 text-cyan-300" />
        </div>
      )}
    </div>
  );
}

function EgyptianLicensePlateBadge({ plateNumber }: { plateNumber?: string | null }) {
  if (!plateNumber) return null;
  return (
    <div className="shrink-0 flex flex-col items-center justify-center px-3 py-1 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg shadow-md font-mono text-center">
      <div className="text-[9px] font-black text-blue-400 tracking-widest border-b border-slate-700 w-full pb-0.5">
        EGY • مـصـر
      </div>
      <div className="text-xs md:text-sm font-black text-amber-300 tracking-wider pt-0.5">
        {plateNumber}
      </div>
    </div>
  );
}

export default function AdminCommunityPage() {
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'sos' | 'carpool' | 'lost'>('carpool');
  const [carpoolSubTab, setCarpoolSubTab] = useState<'rides' | 'requests' | 'transactions'>('rides');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Lightbox Studio
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    title: string;
    zoom: number;
    rotation: number;
  } | null>(null);

  // Driver Rides & Passengers History Modal
  const [driverRidesModal, setDriverRidesModal] = useState<{
    userId: string;
    driverName: string;
  } | null>(null);

  // Copy Feedback
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPhone(text);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

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

  const {
    data: driverRidesData,
    isLoading: driverRidesLoading,
    refetch: refetchDriverRides,
  } = useQuery({
    queryKey: ['admin', 'driver-rides', driverRidesModal?.userId],
    queryFn: ({ signal }) =>
      communityAdminApi.getDriverRidesHistory(driverRidesModal!.userId, 1, 50, signal),
    enabled: adminReady && !!driverRidesModal?.userId,
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
      alert(`تم إطلاق التنبيه الشامل والإعلان العاجل بنجاح 🚀!\nيصل هذا البث إلى حوالي ${data.targetRecipientsEstimate} مستخدم في مصر.`);
      setBroadcastModalItem(null);
    },
  });

  // Automated Community Sweeper Mutation
  const sweepMutation = useMutation({
    mutationFn: () => communityAdminApi.sweepExpiredItems(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'community'] });
      alert(`✨ ${res.message || 'تم تنظيف وأرشفة المشاوير المنتهية ونقلها للمكتملة بنجاح!'}`);
    },
    onError: () => {
      alert('حدث خطأ أثناء تنظيف وأرشفة المشاوير.');
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
        (r.driverPhoneNumber && r.driverPhoneNumber.includes(q)) ||
        r.carModel.toLowerCase().includes(q) ||
        (r.carPlateNumber && r.carPlateNumber.toLowerCase().includes(q)) ||
        (r.bookings &&
          r.bookings.some(
            (b) =>
              b.passengerName?.toLowerCase().includes(q) ||
              (b.passengerPhoneNumber && b.passengerPhoneNumber.includes(q))
          ))
    );
  }, [carpoolData, searchQuery]);

  const filteredTransactions = useMemo(() => {
    if (!carpoolTransactionsData?.items) return [];
    if (!searchQuery.trim()) return carpoolTransactionsData.items;
    const q = searchQuery.toLowerCase();
    return carpoolTransactionsData.items.filter(
      (tx) =>
        tx.fromCityOrArea.toLowerCase().includes(q) ||
        tx.toCityOrArea.toLowerCase().includes(q) ||
        tx.carModel.toLowerCase().includes(q) ||
        (tx.carPlateNumber && tx.carPlateNumber.toLowerCase().includes(q)) ||
        (tx.driverName && tx.driverName.toLowerCase().includes(q)) ||
        (tx.driverPhoneNumber && tx.driverPhoneNumber.includes(q)) ||
        (tx.counterpartName && tx.counterpartName.toLowerCase().includes(q)) ||
        (tx.counterpartPhone && tx.counterpartPhone.includes(q)) ||
        (tx.bookings &&
          tx.bookings.some(
            (b) =>
              b.passengerName?.toLowerCase().includes(q) ||
              (b.passengerPhoneNumber && b.passengerPhoneNumber.includes(q))
          ))
    );
  }, [carpoolTransactionsData, searchQuery]);

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

  // Helper function to check if a departure time is in the past
  const isPastDeparture = (timeStr: string) => {
    try {
      const depDate = new Date(timeStr);
      return depDate.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 pb-12 font-sans" dir="rtl">
        {/* =========================================================================
            1. CYBERPUNK RADAR COMMAND CENTER HEADER
           ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] border-2 border-slate-700/80 shadow-2xl p-6 md:p-8">
          {/* Animated Background Radar Glowing Rings */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 w-80 h-80 rounded-full border border-emerald-500/10 pointer-events-none" />
          <div className="absolute top-1/2 right-12 -translate-y-1/2 w-56 h-56 rounded-full border border-emerald-500/20 pointer-events-none" />
          <div className="absolute top-1/2 right-12 -translate-y-1/2 w-32 h-32 rounded-full border border-red-500/25 pointer-events-none animate-ping" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/95 border border-slate-700 text-xs font-black shadow-inner">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span className="text-slate-200">
                    رادار الرصد الحي: {connectionStatus === 'connected' ? 'متصل ومراقب لحظياً (Live SignalR)' : 'جاري الاتصال...'}
                  </span>
                  {realtimeCounter > 0 && (
                    <span className="bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40 text-[11px] font-bold">
                      +{realtimeCounter} أحداث فورية
                    </span>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الذكاء المجتمعي والأرشفة الآلية مفعلة</span>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-lg shadow-red-950">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
                <span>غرفة عمليات المجتمع والرصد الشامل في مصر</span>
              </h1>

              <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed font-normal">
                مركز القيادة والرصد المدني الفوري في كافة المحافظات: إدارة وتصنيف رحلات <strong className="text-emerald-400 font-bold">«عربية رايحة»</strong> وفصل المشاوير المنتهية والمكتملة، إغاثة طوارئ <strong className="text-rose-400 font-bold">«فزعة مصر»</strong>، والرصد الذكي للمفقودات بالأرقام القومية.
              </p>
            </div>

            {/* Quick Actions & Control Tools */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Auto-Sweep Expired Rides Button */}
              <button
                id="btn-sweep-community"
                onClick={() => sweepMutation.mutate()}
                disabled={sweepMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/60 shadow-lg shadow-emerald-950/60 transition active:scale-95"
                title="فحص وأرشفة المشاوير والطلبات القديمة ونقلها تلقائياً إلى خانة المنتهية والمكتملة"
              >
                {sweepMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-300" />
                )}
                <span>أرشفة وتنظيف المنتهي</span>
              </button>

              {/* Sound Alert Toggle */}
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
                    <span>صوت الرادار: مفعّل</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400" />
                    <span>صوت الرادار: صامت</span>
                  </>
                )}
              </button>

              {/* Manual Refresh */}
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
            2. REAL-TIME TOAST ALERT BANNER
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
            3. FOUR HIGH-CONTRAST KPI STAT CARDS (Dark Obsidian & Neon Contrast)
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
                <span>🚗 مشاوير — مشاركة الرحلات والسفر</span>
                {carpoolData?.totalCount != null && (
                  <span className="text-xs bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold text-white border border-white/20">
                    {carpoolData.totalCount}
                  </span>
                )}
              </button>

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
                className="w-full pl-3 pr-10 py-2.5 rounded-2xl text-xs md:text-sm bg-slate-950 border border-slate-700 text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
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
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 font-bold ml-2">الأقسام:</span>
              <button
                onClick={() => setCarpoolSubTab('rides')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                  carpoolSubTab === 'rides'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>مشاوير السائقين المعلنة</span>
              </button>
              <button
                onClick={() => setCarpoolSubTab('requests')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                  carpoolSubTab === 'requests'
                    ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-950'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>طلبات الركاب (مشاوير مطلوبة)</span>
              </button>
              <button
                onClick={() => setCarpoolSubTab('transactions')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                  carpoolSubTab === 'transactions'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>سجل الرحلات والمعاملات المكتملة</span>
              </button>
              <Link
                href="/admin/drivers"
                className="px-4 py-2 rounded-xl text-xs font-bold transition border border-amber-500/40 bg-amber-950/60 hover:bg-amber-950 text-amber-300 hover:text-white flex items-center gap-1.5 shadow-md shadow-amber-950/30 mr-auto"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>اعتماد وفحص السائقين والسيارات 🛡️</span>
              </Link>
            </div>
          )}

          {/* Filter Status Pills */}
          {activeTab !== 'carpool' || carpoolSubTab === 'rides' ? (
            <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  تصنيف الحالة:
                </span>
                {activeTab === 'carpool' && carpoolSubTab === 'rides' && (
                  <span className="text-[11px] text-slate-400">
                    (يتم أرشفة المشاوير التي فات موعدها تلقائياً إلى خانة المنتهية)
                  </span>
                )}
              </div>

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
                  [
                    { key: 'Active', label: '🟢 النشطة والجارية' },
                    { key: 'Completed', label: '✅ المنتهية والمكتملة' },
                    { key: 'Departed', label: '🏎️ انطلقت على الطريق' },
                    { key: 'Full', label: '👥 ممتلئة بالكامل' },
                    { key: 'Cancelled', label: '❌ ملغية' },
                    { key: 'All', label: '🌐 كافة السجلات' },
                  ].map((filterItem) => (
                    <button
                      key={filterItem.key}
                      onClick={() => setStatusFilter(filterItem.key)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold transition border ${
                        statusFilter === filterItem.key
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {filterItem.label}
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
            5. TAB 1: CARPOOLING ("عربية رايحة") - HERO TAB
           ========================================================================= */}
        {activeTab === 'carpool' && (
          <div className="space-y-4">
            {/* View 1: Rides */}
            {carpoolSubTab === 'rides' && (
              <>
                {carpoolLoading ? (
                  <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <span>جاري تحميل وفحص المشاوير من السيرفر...</span>
                  </div>
                ) : filteredCarpoolItems.length === 0 ? (
                  <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                      <Car className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-white text-lg">
                        {statusFilter === 'Active'
                          ? 'لا توجد مشاوير نشطة قادمة حالياً'
                          : statusFilter === 'Completed'
                          ? 'لا توجد مشاوير مؤرشفة في خانة المكتملة'
                          : 'لا توجد مشاوير مسجلة في هذا التصنيف'}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        {statusFilter === 'Active'
                          ? 'كافة المشاوير القديمة تم أرشفها ونقلها بنجاح إلى خانة «المنتهية والمكتملة» لحفظ دقة ونظافة البيانات.'
                          : 'يمكنك اختيار «كافة السجلات» أو التبديل لحالات أخرى للاطلاع على التاريخ الكامل للمشاوير.'}
                      </p>
                    </div>
                    {statusFilter === 'Active' && (
                      <button
                        onClick={() => setStatusFilter('Completed')}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/40 inline-flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        عرض المشاوير المنتهية والمكتملة ({carpoolData?.totalCount || 0})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredCarpoolItems.map((ride) => {
                      const isExpired = ride.status === 'Completed' || isPastDeparture(ride.departureTime);

                      return (
                        <div
                          key={ride.id}
                          className={`relative overflow-hidden p-6 rounded-3xl bg-[#0F172A] border-2 shadow-xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${
                            isExpired
                              ? 'border-slate-800/90 bg-gradient-to-br from-[#0F172A] to-[#131B2E]'
                              : 'border-emerald-500/40 hover:border-emerald-400 ring-1 ring-emerald-500/20 shadow-emerald-950/20'
                          }`}
                        >
                          {/* Holographic Header Strip */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              {/* Car Model & Color */}
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-3 rounded-2xl border ${
                                    isExpired
                                      ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                  }`}
                                >
                                  <Car className="w-6 h-6" />
                                </div>
                                <div>
                                  <div className="text-base font-black text-white flex items-center gap-2">
                                    <span>{ride.carModel}</span>
                                    {ride.carColor && (
                                      <span className="text-xs text-slate-400 font-medium">({ride.carColor})</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 font-semibold mt-0.5">
                                    نوع الرحلة: {ride.isRecurringDaily ? 'مشوار يومي متكرر 🔄' : 'مشوار لمرة واحدة'}
                                  </div>
                                </div>
                              </div>

                              {/* Realistic Egyptian License Plate Badge */}
                              {ride.carPlateNumber && (
                                <div className="shrink-0 flex flex-col items-center justify-center px-3 py-1 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg shadow-md font-mono text-center">
                                  <div className="text-[9px] font-black text-blue-400 tracking-widest border-b border-slate-700 w-full pb-0.5">
                                    EGY • مـصـر
                                  </div>
                                  <div className="text-xs md:text-sm font-black text-amber-300 tracking-wider pt-0.5">
                                    {ride.carPlateNumber}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Status and Completion Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              {isExpired ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-600 text-xs font-black shadow-inner">
                                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                                  <span>رحلة مكتملة ومنتهية</span>
                                </div>
                              ) : ride.status === 'Departed' ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-500/50 text-xs font-black animate-pulse">
                                  <Navigation className="w-4 h-4 text-amber-400" />
                                  <span>على الطريق الآن (انطلقت)</span>
                                </div>
                              ) : ride.status === 'Full' ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-500/50 text-xs font-black">
                                  <Users className="w-4 h-4 text-purple-400" />
                                  <span>ممتلئة بالكامل</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-xs font-black shadow-md shadow-emerald-950">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                  <span>نشطة ومتاحة للحجز</span>
                                </div>
                              )}

                              {/* Price per seat */}
                              <div className="px-3.5 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-xs md:text-sm font-black shadow-sm">
                                💰 {ride.pricePerSeat} ج.م / مقعد
                              </div>
                            </div>

                            {/* Highway Route Visualizer */}
                            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-3">
                              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                  نقطة الانطلاق:
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                  نقطة الوصول:
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-sm font-black text-white">
                                <span className="text-blue-300 truncate max-w-[45%]">{ride.fromCityOrArea}</span>
                                <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                  <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                </div>
                                <span className="text-emerald-300 truncate max-w-[45%] text-left">{ride.toCityOrArea}</span>
                              </div>
                            </div>

                            {/* Trip Metadata Chips */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              {/* Date & Time */}
                              <span
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold ${
                                  isExpired
                                    ? 'bg-slate-900 text-slate-400 border-slate-800'
                                    : 'bg-slate-800/90 text-slate-200 border-slate-700'
                                }`}
                              >
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                <span>{new Date(ride.departureTime).toLocaleDateString('ar-EG')}</span>
                                <Clock className="w-3.5 h-3.5 text-amber-400 mr-1" />
                                <span>
                                  {new Date(ride.departureTime).toLocaleTimeString('ar-EG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </span>

                              {/* Seats Info */}
                              <span
                                className={`px-3 py-1.5 rounded-xl border font-black ${
                                  ride.availableSeats === 0 || isExpired
                                    ? 'bg-slate-900 text-slate-400 border-slate-800'
                                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                }`}
                              >
                                {isExpired
                                  ? `تم حجز المقاعد (${ride.totalSeats} مقاعد)`
                                  : `المقاعد المتبقية: ${ride.availableSeats} من ${ride.totalSeats}`}
                              </span>

                              {/* Gender Preference */}
                              <span className="bg-slate-800/80 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
                                {ride.genderPreference === 'FemalesOnly'
                                  ? 'سيدات فقط 👩'
                                  : ride.genderPreference === 'MalesOnly'
                                  ? 'شباب فقط 👨'
                                  : 'متاح للجميع 👥'}
                              </span>

                              {/* Passenger Bookings Count */}
                              {ride.bookings && ride.bookings.length > 0 && (
                                <span className="bg-blue-950/80 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-500/40 font-bold">
                                  {ride.bookings.length} حجوزات ركاب
                                </span>
                              )}
                            </div>

                            {/* Embedded Passenger Bookings Ledger */}
                            <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-black text-slate-300 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-400" />
                                  ركاب هذا المشوار ({ride.bookings?.length || 0} راكب):
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  إجمالي المقاعد المحجوزة: {ride.totalSeats - ride.availableSeats} من {ride.totalSeats}
                                </span>
                              </div>

                              {ride.bookings && ride.bookings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {ride.bookings.map((booking) => (
                                    <div
                                      key={booking.id}
                                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2.5 text-xs hover:border-slate-700 transition"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <SafeAvatar
                                          src={booking.passengerAvatarUrl}
                                          name={booking.passengerName}
                                          size={32}
                                          onClick={
                                            booking.passengerAvatarUrl
                                              ? () =>
                                                  setLightboxData({
                                                    url: booking.passengerAvatarUrl!,
                                                    title: `بروفايل الراكب: ${booking.passengerName}`,
                                                    zoom: 1,
                                                    rotation: 0,
                                                  })
                                              : undefined
                                          }
                                        />
                                        <div className="min-w-0">
                                          <div className="font-black text-white flex items-center gap-1 truncate">
                                            <span className="truncate">{booking.passengerName}</span>
                                            {booking.passengerHasNationalId && (
                                              <span title="موثق بالرقم القومي">
                                                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                              </span>
                                            )}
                                          </div>
                                          {booking.passengerPhoneNumber ? (
                                            <div className="flex items-center gap-1 mt-0.5">
                                              <a
                                                href={`tel:${booking.passengerPhoneNumber}`}
                                                className="text-[11px] text-cyan-400 font-mono font-bold hover:underline"
                                              >
                                                📞 {booking.passengerPhoneNumber}
                                              </a>
                                              <button
                                                type="button"
                                                onClick={() => copyToClipboard(booking.passengerPhoneNumber!)}
                                                className="text-slate-500 hover:text-slate-300 p-0.5"
                                                title="نسخ رقم الهاتف"
                                              >
                                                {copiedPhone === booking.passengerPhoneNumber ? (
                                                  <Check className="w-3 h-3 text-emerald-400" />
                                                ) : (
                                                  <Copy className="w-3 h-3" />
                                                )}
                                              </button>
                                            </div>
                                          ) : (
                                            <span className="text-[10px] text-slate-500">بدون هاتف</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-left shrink-0 space-y-0.5">
                                        <span className="inline-block px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-black">
                                          {booking.seatsCount} مقعد
                                        </span>
                                        <div className="text-[10px] text-emerald-400 font-bold">
                                          {booking.seatsCount * ride.pricePerSeat} ج.م
                                        </div>
                                        {booking.pickupNote && (
                                          <div className="text-[9px] text-slate-400 truncate max-w-[80px]" title={booking.pickupNote}>
                                            {booking.pickupNote}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-900/60 rounded-xl text-center text-slate-400 text-xs border border-dashed border-slate-800">
                                  لا توجد حجوزات ركاب حتى الآن — المقاعد متاحة للحجز ({ride.availableSeats} مقعد متاح)
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Driver Info & Card Actions */}
                          <div className="flex flex-wrap items-center justify-between pt-4 mt-4 border-t border-slate-800/80 gap-3">
                            <div className="flex items-center gap-2.5">
                              <SafeAvatar
                                src={ride.driverAvatarUrl}
                                name={ride.driverName}
                                size={36}
                                onClick={
                                  ride.driverAvatarUrl
                                    ? () =>
                                        setLightboxData({
                                          url: ride.driverAvatarUrl!,
                                          title: `بروفايل السائق: ${ride.driverName}`,
                                          zoom: 1,
                                          rotation: 0,
                                        })
                                    : undefined
                                }
                              />
                              <div>
                                <div className="text-xs font-black text-white flex items-center gap-1.5">
                                  <span>{ride.driverName}</span>
                                  {ride.driverHasNationalId && (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px]"
                                      title="سائق موثق بالرقم القومي"
                                    >
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      موثق
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                                  {ride.driverPhoneNumber ? (
                                    <div className="flex items-center gap-1">
                                      <a
                                        href={`tel:${ride.driverPhoneNumber}`}
                                        className="text-cyan-400 font-bold hover:underline"
                                      >
                                        📞 {ride.driverPhoneNumber}
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(ride.driverPhoneNumber!)}
                                        className="text-slate-500 hover:text-slate-300 p-0.5"
                                        title="نسخ رقم الهاتف"
                                      >
                                        {copiedPhone === ride.driverPhoneNumber ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span>مشوار #{ride.id.substring(0, 8)}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Open Driver Rides History Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDriverRidesModal({
                                    userId: ride.driverUserId,
                                    driverName: ride.driverName,
                                  })
                                }
                                className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm transition"
                                title="عرض كافة رحلات السائق وكل الركاب الذين حجزوا معه"
                              >
                                <Car className="w-3.5 h-3.5 text-amber-400" />
                                <span>سجل رحلات وركاب السائق 🚗</span>
                              </button>

                              {/* Broadcast as Flash Urgent Ad Button */}
                              {!isExpired && (
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
                                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95"
                                  title="ترقية إلى إعلان عاجل للمشوار"
                                >
                                  <Megaphone className="w-3.5 h-3.5" />
                                  <span>إعلان 📢</span>
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedModalItem({ type: 'carpool', data: ride })}
                                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl border border-slate-700 transition"
                              >
                                التفاصيل
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
                                title="حظر أو إلغاء المشوار"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                    <span>جاري تحميل طلبات الركاب وفحصها...</span>
                  </div>
                ) : !carpoolRequestsData?.items?.length ? (
                  <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                    <Users className="w-12 h-12 text-teal-400 mx-auto" />
                    <h3 className="font-black text-white text-lg">لا توجد طلبات ركاب معلقة حالياً</h3>
                    <p className="text-xs text-slate-400">
                      تمت أرشفة وتحديث أي طلبات قديمة انقضى موعدها تلقائياً.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {carpoolRequestsData.items.map((req) => {
                      const isReqExpired = req.status === 'Completed' || isPastDeparture(req.preferredDepartureTime);

                      return (
                        <div
                          key={req.id}
                          className={`p-6 rounded-3xl bg-[#0F172A] border-2 shadow-xl space-y-4 transition ${
                            isReqExpired
                              ? 'border-slate-800 opacity-90'
                              : 'border-teal-500/40 hover:border-teal-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-black px-3 py-1 rounded-xl border ${
                                isReqExpired
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-teal-950 text-teal-300 border border-teal-500/50'
                              }`}
                            >
                              {isReqExpired ? '✅ طلب مكتمل / منتهي' : `مطلوب ${req.seatsNeeded} مقعد`}
                            </span>
                            <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              {new Date(req.preferredDepartureTime).toLocaleString('ar-EG')}
                            </span>
                          </div>

                          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-sm font-black text-white">
                            <div>من: <span className="text-blue-400">{req.fromCityOrArea}</span></div>
                            <div>إلى: <span className="text-emerald-400">{req.toCityOrArea}</span></div>
                          </div>

                          {req.notes && (
                            <div className="text-xs text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                              ملاحظات الراكب: {req.notes}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                            <div className="flex items-center gap-2">
                              <SafeAvatar
                                src={req.passengerAvatarUrl}
                                name={req.passengerName}
                                size={28}
                                onClick={
                                  req.passengerAvatarUrl
                                    ? () =>
                                        setLightboxData({
                                          url: req.passengerAvatarUrl!,
                                          title: `صورة الراكب: ${req.passengerName}`,
                                          zoom: 1,
                                          rotation: 0,
                                        })
                                    : undefined
                                }
                              />
                              <span className="font-bold text-white">{req.passengerName}</span>
                              {req.passengerHasNationalId && (
                                <span title="موثق بالرقم القومي"><ShieldCheck className="w-4 h-4 text-emerald-400" /></span>
                              )}
                            </div>
                            {req.passengerPhoneNumber && (
                              <div className="flex items-center gap-1.5">
                                <a href={`tel:${req.passengerPhoneNumber}`} className="text-cyan-400 font-mono font-bold hover:underline">
                                  📞 {req.passengerPhoneNumber}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(req.passengerPhoneNumber!)}
                                  className="text-slate-500 hover:text-slate-300 p-0.5"
                                  title="نسخ رقم الهاتف"
                                >
                                  {copiedPhone === req.passengerPhoneNumber ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* View 3: Comprehensive Ride & Passenger Ledger (سجل المعاملات والركاب الشامل) */}
            {carpoolSubTab === 'transactions' && (
              <div className="space-y-4">
                {carpoolTransactionsLoading ? (
                  <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3 bg-[#0F172A] rounded-3xl border border-slate-800">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    <span>جاري تحميل وفحص سجل المعاملات والرحلات المكتملة...</span>
                  </div>
                ) : !filteredTransactions.length ? (
                  <div className="p-16 text-center bg-[#0F172A] rounded-3xl border border-slate-800 text-slate-300 space-y-3">
                    <DollarSign className="w-12 h-12 text-blue-400 mx-auto" />
                    <h3 className="font-black text-white text-lg">
                      {searchQuery.trim() ? 'لا توجد نتائج مطابقة لبحثك في سجل المعاملات' : 'لا توجد رحلات منتهية في سجل المعاملات بعد'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      كافة المعاملات المالية والحجوزات المكتملة بين السائقين والركاب تظهر هنا فور انتهاء المشوار مع السجل المحاسبي الشامل.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredTransactions.map((tx) => {
                      const driverDisplayName = tx.driverName || (tx.role === 'Driver' ? 'السائق المعلن' : tx.counterpartName);
                      const driverPhone = tx.driverPhoneNumber || (tx.role === 'Passenger' ? tx.counterpartPhone : null);
                      const driverAvatar = tx.driverAvatarUrl || (tx.role === 'Passenger' ? tx.counterpartAvatarUrl : null);

                      return (
                        <div
                          key={tx.transactionId}
                          className="p-6 md:p-7 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#111A2E] to-[#0D1526] border-2 border-slate-800 hover:border-blue-500/50 shadow-2xl space-y-6 transition duration-300"
                        >
                          {/* Transaction Top Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="px-3.5 py-1.5 rounded-xl bg-blue-950/90 text-blue-300 border border-blue-500/50 text-xs font-black shadow-inner flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-blue-400" />
                                <span>معاملة مشوار #{tx.transactionId.substring(0, 8)}</span>
                              </span>

                              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-bold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                <span>موعد الانطلاق: {new Date(tx.departureTime).toLocaleDateString('ar-EG')} - {new Date(tx.departureTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>

                              {tx.completedAt && (
                                <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>تم الوصول: {new Date(tx.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="px-4 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-sm md:text-base font-black shadow-md shadow-emerald-950/40">
                                💰 {tx.totalAmount} {tx.currency}
                              </span>

                              <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-black">
                                {tx.status === 'Completed' ? '✅ مكتملة ومحاسبة' : tx.status}
                              </span>
                            </div>
                          </div>

                          {/* Highway Route Visualizer & Car Plate Strip */}
                          <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <span className="text-[11px] font-bold text-slate-400 block">خط سير المشوار:</span>
                              <div className="flex items-center gap-3 text-sm md:text-base font-black text-white">
                                <span className="text-blue-300 truncate">{tx.fromCityOrArea}</span>
                                <div className="flex items-center gap-1 text-slate-500 shrink-0">
                                  <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-emerald-300 truncate">{tx.toCityOrArea}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="text-xs font-black text-white">{tx.carModel}</div>
                                {tx.carColor && <div className="text-[11px] text-slate-400">اللون: {tx.carColor}</div>}
                              </div>

                              <EgyptianLicensePlateBadge plateNumber={tx.carPlateNumber} />
                            </div>
                          </div>

                          {/* Two-Column Deep Ledger: Driver Profile on Right, Client/Passengers on Left */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Column 1: Driver Profile Card (5 cols) */}
                            <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-950/95 border border-slate-800 space-y-4 flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                                    <Car className="w-4 h-4" />
                                    سائق المشوار (بيانات السائق)
                                  </span>

                                  {tx.isDriverVerified && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      سائق موثق
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  <SafeAvatar
                                    src={driverAvatar}
                                    name={driverDisplayName}
                                    size={46}
                                    onClick={
                                      driverAvatar
                                        ? () =>
                                            setLightboxData({
                                              url: driverAvatar,
                                              title: `صورة بروفايل السائق: ${driverDisplayName}`,
                                              zoom: 1,
                                              rotation: 0,
                                            })
                                        : undefined
                                    }
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-black text-white truncate">{driverDisplayName}</div>
                                    {driverPhone ? (
                                      <div className="flex items-center gap-1.5 mt-1">
                                        <a
                                          href={`tel:${driverPhone}`}
                                          className="text-xs text-cyan-400 font-mono font-bold hover:underline"
                                        >
                                          📞 {driverPhone}
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(driverPhone)}
                                          className="text-slate-500 hover:text-slate-300 p-0.5"
                                          title="نسخ رقم هاتف السائق"
                                        >
                                          {copiedPhone === driverPhone ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-slate-500">رقم الهاتف غير متاح</span>
                                    )}
                                  </div>
                                </div>

                                {tx.driverUserId && (
                                  <div className="text-[10px] text-slate-500 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                                    معرّف السائق: {tx.driverUserId}
                                  </div>
                                )}
                              </div>

                              {tx.driverUserId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDriverRidesModal({
                                      userId: tx.driverUserId!,
                                      driverName: driverDisplayName,
                                    })
                                  }
                                  className="w-full py-2 px-3 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-xs font-black text-amber-300 flex items-center justify-center gap-2 transition shadow-sm"
                                >
                                  <Car className="w-3.5 h-3.5 text-amber-400" />
                                  <span>سجل كافة رحلات وركاب السائق 🚗</span>
                                </button>
                              )}
                            </div>

                            {/* Column 2: Client & Passengers Ledger (7 cols) */}
                            <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-950/95 border border-slate-800 space-y-3.5">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                                <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                                  <Users className="w-4 h-4" />
                                  بيانات العميل والركاب (الذين ركبوا مع السائق في هذا المشوار):
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold">
                                  سعر المقعد: {tx.pricePerSeat} {tx.currency} • المقاعد المحجوزة: {tx.seatsCount}
                                </span>
                              </div>

                              {tx.bookings && tx.bookings.length > 0 ? (
                                <div className="space-y-3">
                                  {tx.bookings.map((booking, bIndex) => {
                                    const bookingFare = (booking.seatsCount || 1) * tx.pricePerSeat;
                                    return (
                                      <div
                                        key={booking.id || bIndex}
                                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <SafeAvatar
                                            src={booking.passengerAvatarUrl}
                                            name={booking.passengerName}
                                            size={42}
                                            onClick={
                                              booking.passengerAvatarUrl
                                                ? () =>
                                                    setLightboxData({
                                                      url: booking.passengerAvatarUrl!,
                                                      title: `صورة بروفايل العميل: ${booking.passengerName}`,
                                                      zoom: 1,
                                                      rotation: 0,
                                                    })
                                                : undefined
                                            }
                                          />
                                          <div className="min-w-0 space-y-0.5">
                                            <div className="text-xs font-black text-white flex items-center gap-1.5">
                                              <span>{booking.passengerName}</span>
                                              {booking.passengerHasNationalId ? (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                                                  <ShieldCheck className="w-3 h-3" />
                                                  موثق بالرقم القومي
                                                </span>
                                              ) : (
                                                <span className="text-[10px] text-slate-500">حساب عادي</span>
                                              )}
                                            </div>

                                            {booking.passengerPhoneNumber && (
                                              <div className="flex items-center gap-1.5">
                                                <a
                                                  href={`tel:${booking.passengerPhoneNumber}`}
                                                  className="text-xs text-cyan-400 font-mono font-bold hover:underline"
                                                >
                                                  📞 {booking.passengerPhoneNumber}
                                                </a>
                                                <button
                                                  type="button"
                                                  onClick={() => copyToClipboard(booking.passengerPhoneNumber!)}
                                                  className="text-slate-500 hover:text-slate-300 p-0.5"
                                                  title="نسخ رقم هاتف الراكب"
                                                >
                                                  {copiedPhone === booking.passengerPhoneNumber ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                  ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                  )}
                                                </button>
                                              </div>
                                            )}

                                            <div className="text-[10px] text-slate-400">
                                              ركب في موعد: <strong className="text-slate-200">{new Date(tx.departureTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</strong> مع السائق <strong className="text-amber-300">{driverDisplayName}</strong>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 space-y-1">
                                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-500/40 text-xs font-black">
                                            {booking.seatsCount} مقعد
                                          </span>

                                          <div className="text-sm font-black text-emerald-400">
                                            بكام: {bookingFare} {tx.currency}
                                          </div>

                                          {booking.pickupNote && (
                                            <div className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                                              🔑 {booking.pickupNote}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Fallback if single booking record represented by counterpart */
                                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <SafeAvatar
                                      src={tx.counterpartAvatarUrl}
                                      name={tx.counterpartName}
                                      size={40}
                                      onClick={
                                        tx.counterpartAvatarUrl
                                          ? () =>
                                              setLightboxData({
                                                url: tx.counterpartAvatarUrl!,
                                                title: `صورة العميل: ${tx.counterpartName}`,
                                                zoom: 1,
                                                rotation: 0,
                                              })
                                          : undefined
                                      }
                                    />
                                    <div>
                                      <div className="text-xs font-black text-white">{tx.counterpartName}</div>
                                      {tx.counterpartPhone && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <a href={`tel:${tx.counterpartPhone}`} className="text-xs text-cyan-400 font-mono font-bold hover:underline">
                                            📞 {tx.counterpartPhone}
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(tx.counterpartPhone!)}
                                            className="text-slate-500 hover:text-slate-300 p-0.5"
                                            title="نسخ رقم الهاتف"
                                          >
                                            {copiedPhone === tx.counterpartPhone ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      )}
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        ركب في موعد: {new Date(tx.departureTime).toLocaleString('ar-EG')} مع السائق {driverDisplayName}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-left shrink-0 space-y-1">
                                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-500/40 text-xs font-black">
                                      {tx.seatsCount} مقعد
                                    </span>
                                    <div className="text-sm font-black text-emerald-400">
                                      بكام: {tx.totalAmount} {tx.currency}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            6. TAB 2: SOS & ROAD EMERGENCIES ("فزعة مصر")
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        <SafeAvatar
                          src={alert.userAvatarUrl}
                          name={alert.userName}
                          size={32}
                          onClick={
                            alert.userAvatarUrl
                              ? () =>
                                  setLightboxData({
                                    url: alert.userAvatarUrl!,
                                    title: `صورة صاحب الاستغاثة: ${alert.userName}`,
                                    zoom: 1,
                                    rotation: 0,
                                  })
                              : undefined
                          }
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{alert.userName}</span>
                            {alert.isUserVerified && (
                              <span title="مواطن موثق">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                          </div>
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
            7. TAB 3: LOST & FOUND WITH SMART MATCHING
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                              <CheckCheck className="w-3 h-3 text-teal-300" />
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

                      {/* Item Attached Photo / Document Preview */}
                      {(item.mediaUrl || item.mediaFileId) && (
                        <div className="flex items-center gap-3 p-3 bg-slate-950/90 rounded-2xl border border-slate-800">
                          <SafeMediaThumbnail
                            src={item.mediaUrl || item.mediaFileId}
                            alt={item.title}
                            title={item.title}
                            onClick={() =>
                              setLightboxData({
                                url: item.mediaUrl || item.mediaFileId!,
                                title: `مرفق مفقودات: ${item.title}`,
                                zoom: 1,
                                rotation: 0,
                              })
                            }
                            className="w-20 h-20 shrink-0"
                            badgeText="صورة المرفق 📷"
                          />
                          <div className="space-y-1 text-xs">
                            <span className="font-black text-cyan-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              مرفق صورة حية للوثيقة / المقتنيات
                            </span>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              انقر على الصورة لمعاينتها وتكبيرها في ستوديو الفحص عالي الدقة.
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxData({
                                  url: item.mediaUrl || item.mediaFileId!,
                                  title: `مرفق مفقودات: ${item.title}`,
                                  zoom: 1,
                                  rotation: 0,
                                })
                              }
                              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline pt-0.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              تكبير وفحص الصورة الآن
                            </button>
                          </div>
                        </div>
                      )}

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
                  const isExpired = ride.status === 'Completed' || isPastDeparture(ride.departureTime);

                  return (
                    <div className="space-y-4">
                      {isExpired && (
                        <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>هذه الرحلة مصنفة كـ «منتهية ومكتملة» لأن موعد انطلاقها انقضى.</span>
                        </div>
                      )}

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

                      {/* Passenger Bookings in Modal */}
                      {ride.bookings && ride.bookings.length > 0 && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                          <span className="text-xs font-black text-blue-400 block">
                            قائمة ركاب هذا المشوار ({ride.bookings.length} راكب):
                          </span>
                          <div className="space-y-2">
                            {ride.bookings.map((b) => (
                              <div
                                key={b.id}
                                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <SafeAvatar src={b.passengerAvatarUrl} name={b.passengerName} size={32} />
                                  <div>
                                    <div className="font-bold text-white">{b.passengerName}</div>
                                    {b.passengerPhoneNumber && (
                                      <a href={`tel:${b.passengerPhoneNumber}`} className="text-cyan-400 font-mono font-bold hover:underline">
                                        📞 {b.passengerPhoneNumber}
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="text-left font-black text-emerald-400">
                                  {b.seatsCount} مقاعد ({b.seatsCount * ride.pricePerSeat} ج.م)
                                </div>
                              </div>
                            ))}
                          </div>
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

                      {/* Attached Document Photo Preview in Modal */}
                      {(lost.mediaUrl || lost.mediaFileId) && (
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs font-black text-cyan-400">
                            <span>صورة المستند / المقتنى المرفقة مع البلاغ:</span>
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxData({
                                  url: lost.mediaUrl || lost.mediaFileId!,
                                  title: `مستند: ${lost.title}`,
                                  zoom: 1,
                                  rotation: 0,
                                })
                              }
                              className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              فتح في ستوديو الفحص
                            </button>
                          </div>
                          <div className="max-h-64 rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center p-2">
                            <img
                              src={resolveMediaUrl(lost.mediaUrl || lost.mediaFileId)}
                              alt={lost.title}
                              className="max-h-60 w-auto object-contain rounded-lg cursor-pointer hover:scale-102 transition"
                              onClick={() =>
                                setLightboxData({
                                  url: lost.mediaUrl || lost.mediaFileId!,
                                  title: `مستند: ${lost.title}`,
                                  zoom: 1,
                                  rotation: 0,
                                })
                              }
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const candidates = getMediaCandidateUrls(lost.mediaUrl || lost.mediaFileId);
                                if (candidates.length > 1 && target.src !== candidates[1]) {
                                  target.src = candidates[1];
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}

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

        {/* =========================================================================
            11. DRIVER RIDES & PASSENGERS HISTORY MODAL
           ========================================================================= */}
        {driverRidesModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div
              className="bg-[#0F172A] rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border-2 border-amber-500/60 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 text-right"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">
                      سجل كافة رحلات وركاب السائق: {driverRidesModal.driverName}
                    </h3>
                    <span className="text-xs text-slate-400">
                      استعراض شامل لجميع المشاوير المنفذة، الركاب، المبالغ المحصلة، وأرقام هواتفهم
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDriverRidesModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              {driverRidesLoading ? (
                <div className="p-16 text-center text-slate-300 font-bold flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                  <span>جاري جلب سجل رحلات السائق من قاعدة البيانات...</span>
                </div>
              ) : !driverRidesData?.items?.length ? (
                <div className="p-12 text-center bg-slate-950/80 rounded-2xl border border-slate-800 text-slate-300 space-y-3">
                  <Car className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="font-black text-white text-base">لا توجد رحلات منتهية لهذا السائق حتى الآن</h4>
                  <p className="text-xs text-slate-400">
                    فور إتمام السائق لأي مشوار مع ركابه، ستظهر تفاصيل الرحلة بالكامل في هذا السجل.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>إجمالي المشاوير المنفذة: <strong className="text-amber-300">{driverRidesData.totalCount} مشوار</strong></span>
                  </div>

                  <div className="space-y-4">
                    {driverRidesData.items.map((ride) => (
                      <div
                        key={ride.rideId}
                        className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 hover:border-slate-700 transition"
                      >
                        {/* Trip Route & Date */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-black text-white flex items-center gap-2">
                              <span className="text-blue-300">{ride.fromCityOrArea}</span>
                              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">{ride.toCityOrArea}</span>
                            </div>

                            <EgyptianLicensePlateBadge plateNumber={ride.carPlateNumber} />
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                              {new Date(ride.departureTime).toLocaleDateString('ar-EG')} - {new Date(ride.departureTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-black">
                              💰 {ride.totalGrossRevenue} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Ride Stats Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">السيارة:</span>
                            <span className="font-bold text-white">{ride.carModel}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">سعر المقعد:</span>
                            <span className="font-bold text-emerald-400">{ride.pricePerSeat} ج.م</span>
                          </div>
                          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">المقاعد المحجوزة:</span>
                            <span className="font-bold text-blue-300">{ride.bookedSeatsCount} من {ride.totalSeats}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                            <span className="text-slate-400 text-[10px] block">صافي أرباح السائق:</span>
                            <span className="font-bold text-amber-300">{ride.totalNetEarnings} ج.م</span>
                          </div>
                        </div>

                        {/* Passengers List */}
                        <div className="space-y-2">
                          <span className="text-[11px] font-black text-slate-400 block">
                            الركاب الذين شاركوا في هذا المشوار ({ride.passengers?.length || 0} راكب):
                          </span>

                          {ride.passengers && ride.passengers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {ride.passengers.map((passenger: CarpoolBookingSettlementDto) => (
                                <div
                                  key={passenger.bookingId}
                                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <SafeAvatar
                                      src={passenger.passengerAvatarUrl}
                                      name={passenger.passengerName}
                                      size={34}
                                      onClick={
                                        passenger.passengerAvatarUrl
                                          ? () =>
                                              setLightboxData({
                                                url: passenger.passengerAvatarUrl!,
                                                title: `راكب: ${passenger.passengerName}`,
                                                zoom: 1,
                                                rotation: 0,
                                              })
                                          : undefined
                                      }
                                    />
                                    <div className="min-w-0">
                                      <div className="font-black text-white truncate">{passenger.passengerName}</div>
                                      {passenger.passengerPhone ? (
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <a
                                            href={`tel:${passenger.passengerPhone}`}
                                            className="text-[11px] text-cyan-400 font-mono font-bold hover:underline"
                                          >
                                            📞 {passenger.passengerPhone}
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(passenger.passengerPhone!)}
                                            className="text-slate-500 hover:text-slate-300 p-0.5"
                                          >
                                            {copiedPhone === passenger.passengerPhone ? (
                                              <Check className="w-3 h-3 text-emerald-400" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-slate-500">بدون هاتف</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-left shrink-0 space-y-0.5">
                                    <span className="inline-block px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-black">
                                      {passenger.seatsCount} مقعد
                                    </span>
                                    <div className="text-emerald-400 font-black text-xs">
                                      {passenger.totalAmount} ج.م
                                    </div>
                                    {passenger.pickupOtp && (
                                      <div className="text-[9px] font-mono text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded">
                                        🔑 {passenger.pickupOtp}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-900/40 rounded-xl text-center text-slate-500 text-xs">
                              لا يوجد ركاب مسجلين لهذا المشوار
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDriverRidesModal(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            12. INTERACTIVE LIGHTBOX STUDIO FOR IMAGES & DOCUMENTS
           ========================================================================= */}
        {lightboxData && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
            onClick={() => setLightboxData(null)}
          >
            <div
              className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Studio Header Toolbar */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{lightboxData.title}</h3>
                    <span className="text-[11px] text-slate-400">ستوديو المعاينة والفحص البصري للمستندات والصور</span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev ? { ...prev, zoom: Math.min(prev.zoom + 0.25, 3) } : null
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="تكبير"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev ? { ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) } : null
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="تصغير"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev ? { ...prev, zoom: 1, rotation: 0 } : null
                      )
                    }
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 transition"
                    title="إعادة ضبط الحجم"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="تدوير مع عقارب الساعة"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev ? { ...prev, rotation: (prev.rotation - 90 + 360) % 360 } : null
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="تدوير عكس عقارب الساعة"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <a
                    href={resolveMediaUrl(lightboxData.url)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="تحميل الصورة بجودتها الكاملة"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <a
                    href={resolveMediaUrl(lightboxData.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white transition"
                    title="فتح في تبويب مستقل"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxData(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition mr-2"
                    title="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image Stage */}
              <div className="flex-1 bg-slate-950/80 overflow-auto flex items-center justify-center p-4 min-h-[350px] max-h-[70vh]">
                <img
                  src={resolveMediaUrl(lightboxData.url)}
                  alt={lightboxData.title}
                  style={{
                    transform: `scale(${lightboxData.zoom}) rotate(${lightboxData.rotation}deg)`,
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const candidates = getMediaCandidateUrls(lightboxData.url);
                    if (candidates.length > 1 && target.src !== candidates[1]) {
                      target.src = candidates[1];
                    }
                  }}
                />
              </div>

              {/* Status Bar */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>الزووم: {Math.round(lightboxData.zoom * 100)}% • التدوير: {lightboxData.rotation}°</span>
                <span className="text-cyan-400 font-mono truncate max-w-md">
                  {resolveMediaUrl(lightboxData.url)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
