'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { communityAdminApi } from '@/api/communityAdmin';
import { useFlash } from '@/components/ui/FlashProvider';
import { signalRService, SignalRConnectionStatus } from '@/lib/signalr';
import { resolveMediaUrl, getMediaCandidateUrls } from '@/lib/media';
import {
  DriverRegistrationDto,
  CarpoolDriverRideHistoryDto,
  CarpoolBookingSettlementDto,
} from '@/types/community';
import {
  Car,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
  Clock,
  Phone,
  Search,
  RefreshCw,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Check,
  X,
  Eye,
  Volume2,
  VolumeX,
  Filter,
  Sparkles,
  FileCheck,
  BadgeAlert,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Copy,
  Download,
  Maximize2,
  Navigation,
  MessageCircle,
  Hash,
  Award,
  ChevronDown,
} from 'lucide-react';

// ============================================================================
// EGYPTIAN NATIONAL ID DECODER (14 DIGITS)
// ============================================================================
function decodeEgyptianNationalId(nid: string) {
  if (!nid || nid.length !== 14 || !/^\d{14}$/.test(nid)) {
    return { valid: false, text: 'رقم غير مكتمل' };
  }

  const century = nid[0] === '2' ? '19' : nid[0] === '3' ? '20' : null;
  if (!century) return { valid: false, text: 'قرن غير صالح' };

  const year = century + nid.substring(1, 3);
  const month = nid.substring(3, 5);
  const day = nid.substring(5, 7);
  const govCode = nid.substring(7, 9);
  const genderDigit = parseInt(nid[12], 10);
  const gender = genderDigit % 2 !== 0 ? 'ذكر' : 'أنثى';

  const governorates: Record<string, string> = {
    '01': 'القاهرة',
    '02': 'الإسكندرية',
    '03': 'بورسعيد',
    '04': 'السويس',
    '11': 'دمياط',
    '12': 'الدقهلية',
    '13': 'الشرقية',
    '14': 'القليوبية',
    '15': 'كفر الشيخ',
    '16': 'الغربية',
    '17': 'المنوفية',
    '18': 'البحيرة',
    '19': 'الإسماعيلية',
    '21': 'الجيزة',
    '22': 'بني سويف',
    '23': 'الفيوم',
    '24': 'المنيا',
    '25': 'أسيوط',
    '26': 'سوهاج',
    '27': 'قنا',
    '28': 'أسوان',
    '29': 'الأقصر',
    '31': 'البحر الأحمر',
    '32': 'الوادي الجديد',
    '33': 'مطروح',
    '34': 'شمال سيناء',
    '35': 'جنوب سيناء',
    '88': 'خارج الجمهورية',
  };

  const govName = governorates[govCode] || 'محافظة مصرية';
  return {
    valid: true,
    birthDate: `${day}/${month}/${year}`,
    governorate: govName,
    gender,
    summary: `${govName} • مواليد ${day}/${month}/${year} (${gender})`,
  };
}

// ============================================================================
// RESILIENT SMART IMAGE COMPONENT
// ============================================================================
interface SafeImageProps {
  src: string;
  alt: string;
  title: string;
  onClick?: () => void;
  className?: string;
}

function SafeDocumentThumbnail({ src, alt, title, onClick, className }: SafeImageProps) {
  const candidates = useMemo(() => getMediaCandidateUrls(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
  }, [src]);

  const activeSrc = candidates[candidateIndex] || resolveMediaUrl(src);

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative aspect-4/3 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:border-cyan-400 transition shadow-md hover:shadow-cyan-500/10 ${className || ''}`}
    >
      {!hasError ? (
        <img
          src={activeSrc}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          onError={handleError}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-gradient-to-br from-slate-900 to-slate-950 text-slate-400 text-center">
          <FileCheck className="w-6 h-6 text-cyan-400 mb-1 opacity-70" />
          <span className="text-[10px] font-bold text-slate-300 line-clamp-1">{title}</span>
          <span className="text-[9px] text-cyan-400/80 mt-0.5">انقر للمعاينة</span>
        </div>
      )}

      {/* Hover Inspection Overlay */}
      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition duration-200 backdrop-blur-xs">
        <Eye className="w-5 h-5 text-cyan-400 mb-1 animate-pulse" />
        <span>فحص مكبر</span>
      </div>

      {/* Document Label Strip */}
      <span className="absolute bottom-1 right-1 left-1 bg-black/85 text-[10px] text-slate-200 font-bold text-center rounded py-0.5 px-1 truncate border border-slate-700/50">
        {title}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AdminDriversVerificationPage() {
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();
  const flash = useFlash();

  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<SignalRConnectionStatus>('disconnected');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lightbox Modal State
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    title: string;
    rotation: number;
    zoom: number;
  } | null>(null);

  // Driver Trips & Passengers History Modal
  const [selectedDriverForRides, setSelectedDriverForRides] = useState<DriverRegistrationDto | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<DriverRegistrationDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Live Toast Banner
  const [liveToast, setLiveToast] = useState<{
    id: string;
    title: string;
    description: string;
    type: 'new' | 'approved' | 'rejected';
  } | null>(null);

  // Synthesized Web Audio Chime
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio policy
    }
  };

  // SignalR Real-Time Listeners
  useEffect(() => {
    signalRService.start();

    setConnectionStatus(signalRService.getStatus());
    const unsubStatus = signalRService.onStatusChange((st) => setConnectionStatus(st));

    const unsubNew = signalRService.onDriverRegistrationSubmitted((msg) => {
      playAlertSound();
      setLiveToast({
        id: msg.registrationId,
        title: 'طلب تسجيل سائق جديد 🚗',
        description: `قدّم ${msg.driverName || 'سائق'} بياناته ورخصته للمراجعة (${msg.carModel} - ${msg.carPlateNumber})`,
        type: 'new',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'drivers'] });
    });

    const unsubApprove = signalRService.onDriverRegistrationApproved((msg) => {
      playAlertSound();
      setLiveToast({
        id: msg.registrationId,
        title: 'تم اعتماد سائق بنجاح ✅',
        description: `تمت الموافقة على السائق ${msg.driverName || ''} بنجاح، وأصبح الآن نشطاً ومكتملاً في المنظومة.`,
        type: 'approved',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'drivers'] });
    });

    const unsubReject = signalRService.onDriverRegistrationRejected((msg) => {
      setLiveToast({
        id: msg.registrationId,
        title: 'تم رفض طلب تسجيل ❌',
        description: `تم رفض السائق ${msg.driverName || ''} (السبب: ${msg.rejectionReason || 'غير محدد'})`,
        type: 'rejected',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'drivers'] });
    });

    return () => {
      unsubStatus();
      unsubNew();
      unsubApprove();
      unsubReject();
    };
  }, [queryClient, soundEnabled]);

  // Query All Drivers (unified collection so top counters & all tabs update instantly in real-time)
  const {
    data: allDrivers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<DriverRegistrationDto[]>({
    queryKey: ['admin', 'drivers', 'all'],
    queryFn: ({ signal }) => communityAdminApi.getDriverRegistrations('All', signal),
    enabled: adminReady,
    staleTime: 5_000,
    refetchInterval: 15_000,
  });

  const drivers = allDrivers;

  // Query Driver Rides History (for selected driver)
  const {
    data: driverRidesData,
    isLoading: isLoadingDriverRides,
    refetch: refetchDriverRides,
  } = useQuery({
    queryKey: ['admin', 'driver-rides', selectedDriverForRides?.userId],
    queryFn: ({ signal }) =>
      communityAdminApi.getDriverRidesHistory(selectedDriverForRides!.userId, 1, 50, signal),
    enabled: adminReady && !!selectedDriverForRides,
    staleTime: 10_000,
  });

  // Optimistic Real-Time Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => communityAdminApi.approveDriver(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'drivers'] });
      const previous = queryClient.getQueryData<DriverRegistrationDto[]>(['admin', 'drivers', 'all']);
      if (previous) {
        queryClient.setQueryData<DriverRegistrationDto[]>(
          ['admin', 'drivers', 'all'],
          previous.map((d) =>
            d.id === id
              ? { ...d, status: 'Approved', reviewedAt: new Date().toISOString() }
              : d
          )
        );
      }
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'drivers', 'all'], context.previous);
      }
      flash.error((err as Error)?.message || 'فشل اعتماد السائق.');
    },
    onSuccess: (_, id) => {
      const driver = allDrivers.find((d) => d.id === id);
      const name = driver?.driverName || 'السائق';
      playAlertSound();
      flash.success(`تم اعتماد ${name} بنجاح! السائق الآن نشط ومكتمل ويمكنه نشر الرحلات 🚗🎉`);
      setLiveToast({
        id,
        title: 'تم اعتماد وتفعيل السائق بنجاح 🚗🎉',
        description: `أصبح ${name} الآن سائقاً نشطاً ومكتملاً في المنظومة ومتاحاً لنشر الرحلات.`,
        type: 'approved',
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'drivers', 'all'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      communityAdminApi.rejectDriver(id, reason),
    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'drivers'] });
      const previous = queryClient.getQueryData<DriverRegistrationDto[]>(['admin', 'drivers', 'all']);
      if (previous) {
        queryClient.setQueryData<DriverRegistrationDto[]>(
          ['admin', 'drivers', 'all'],
          previous.map((d) =>
            d.id === id
              ? { ...d, status: 'Rejected', rejectionReason: reason, reviewedAt: new Date().toISOString() }
              : d
          )
        );
      }
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin', 'drivers', 'all'], context.previous);
      }
      flash.error((err as Error)?.message || 'فشل رفض الطلب.');
    },
    onSuccess: () => {
      setRejectingItem(null);
      setRejectionReason('');
      flash.success('تم حفظ قرار الرفض وسبب الرفض بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] });
      queryClient.refetchQueries({ queryKey: ['admin', 'drivers', 'all'] });
    },
  });

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Quick Rejection Presets
  const rejectionPresets = [
    'صورة رخصة القيادة غير واضحة أو مقطوعة',
    'رخصة القيادة منتهية الصلاحية',
    'بيانات السيارة لا تتطابق مع رخصة التسيير',
    'الرقم القومي غير مطابق لبيانات الحساب',
    'صورة السيارة غير واضحة أو لا تظهر اللوحة المعدنية',
    'الرجاء إعادة الرفع بجودة عالية وبإضاءة جيدة',
  ];

  // Filtering & Stats Calculations
  const stats = useMemo(() => {
    const total = drivers.length;
    const pending = drivers.filter((d) => d.status === 'Pending').length;
    const approved = drivers.filter((d) => d.status === 'Approved').length;
    const rejected = drivers.filter((d) => d.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    let result = drivers;
    if (statusFilter !== 'All') {
      result = result.filter((d) => d.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (d) =>
          (d.driverName && d.driverName.toLowerCase().includes(q)) ||
          (d.driverPhoneNumber && d.driverPhoneNumber.includes(q)) ||
          (d.nationalId && d.nationalId.includes(q)) ||
          (d.drivingLicenseNumber && d.drivingLicenseNumber.toLowerCase().includes(q)) ||
          (d.carPlateNumber && d.carPlateNumber.toLowerCase().includes(q)) ||
          (d.carModel && d.carModel.toLowerCase().includes(q))
      );
    }
    return result;
  }, [drivers, statusFilter, searchQuery]);

  return (
    <AdminShell>
      <div className="space-y-6 pb-12 font-sans" dir="rtl">
        {/* ==================================================================== */}
        {/* LIVE REAL-TIME TOAST BANNER */}
        {/* ==================================================================== */}
        {liveToast && (
          <div
            className={`flex items-center justify-between p-4 rounded-2xl border shadow-xl animate-fadeIn ${
              liveToast.type === 'new'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                : liveToast.type === 'approved'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 animate-spin text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-black">{liveToast.title}</h4>
                <p className="text-xs opacity-90">{liveToast.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {liveToast.type === 'approved' && statusFilter !== 'Approved' && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('Approved');
                    setLiveToast(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>الانتقال للمعتمدين النشطين ({stats.approved})</span>
                </button>
              )}
              {liveToast.type === 'new' && statusFilter !== 'Pending' && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('Pending');
                    setLiveToast(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <span>مراجعة الطلب الجديد</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setLiveToast(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TOP COMMAND BAR: STATS & CONTROLS */}
        {/* ==================================================================== */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white">مشاوير — اعتماد السائقين والسيارات</h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      connectionStatus === 'connected'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-950/80 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                      }`}
                    />
                    {connectionStatus === 'connected' ? 'بث لحظي مباشر' : 'تحديث دوري'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  توثيق أصحاب المركبات لضمان أمان وسلامة ركاب المجتمع المصري
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                  soundEnabled
                    ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={soundEnabled ? 'كتم تنبيه الصوت' : 'تفعيل تنبيه الصوت'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'الصوت مفعل' : 'صامت'}</span>
              </button>

              <button
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-cyan-400' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {/* METRIC CHIPS RIBBON */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
            <div
              onClick={() => setStatusFilter('All')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                statusFilter === 'All'
                  ? 'bg-cyan-950/50 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">إجمالي الطلبات</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            </div>

            <div
              onClick={() => setStatusFilter('Pending')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                statusFilter === 'Pending'
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">بانتظار المراجعة</span>
                <Hourglass className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
              <div className="text-2xl font-black text-amber-300 mt-1">{stats.pending}</div>
            </div>

            <div
              onClick={() => setStatusFilter('Approved')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                statusFilter === 'Approved'
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">معتمد وموثق</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-300 mt-1">{stats.approved}</div>
            </div>

            <div
              onClick={() => setStatusFilter('Rejected')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                statusFilter === 'Rejected'
                  ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">مرفوض</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-300 mt-1">{stats.rejected}</div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SEARCH & FILTER CONTROLS */}
        {/* ==================================================================== */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، الهاتف، الرقم القومي، اللوحة، أو نوع السيارة..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  statusFilter === st
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {st === 'All'
                  ? 'جميع الحالات'
                  : st === 'Pending'
                  ? 'قيد الانتظار'
                  : st === 'Approved'
                  ? 'المعتمدة'
                  : 'المرفوضة'}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* DRIVERS CARDS GRID */}
        {/* ==================================================================== */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-cyan-400">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-300">جاري تحميل طلبات السائقين والمستندات...</span>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-16 text-center text-slate-400">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">لا توجد طلبات سائقين مطابقة</h3>
            <p className="text-xs text-slate-500">
              {searchQuery
                ? 'جرب البحث بكلمات أخرى أو مسح الفلتر'
                : 'لم يتم العثور على طلبات تسجيل في هذه الفئة حالياً'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredDrivers.map((driver) => {
              const nidInfo = decodeEgyptianNationalId(driver.nationalId);
              const isApproved = driver.status === 'Approved';
              const isRejected = driver.status === 'Rejected';
              const isPending = driver.status === 'Pending';

              return (
                <div
                  key={driver.id}
                  className={`bg-slate-900/90 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl ${
                    isPending
                      ? 'border-amber-500/40 hover:border-amber-500/70 shadow-amber-500/5'
                      : isApproved
                      ? 'border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/5'
                      : 'border-rose-500/30 hover:border-rose-500/60 shadow-rose-500/5'
                  }`}
                >
                  <div className="p-6 space-y-5">
                    {/* Top Driver Header Strip */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          {driver.driverAvatarUrl ? (
                            <img
                              src={resolveMediaUrl(driver.driverAvatarUrl)}
                              alt={driver.driverName || 'سائق'}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://placehold.co/100x100/1e293b/38bdf8?text=سائق';
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-900 to-slate-800 border-2 border-slate-700 flex items-center justify-center text-cyan-300 text-lg font-black shadow-md">
                              {(driver.driverName || 'س')[0]}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                              isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">{driver.driverName || 'سائق جديد'}</h3>
                            {isApproved && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                          </div>

                          {/* Phone & Direct Call/WhatsApp Links */}
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-slate-300 font-mono font-bold tracking-wider">
                              {driver.driverPhoneNumber || 'بدون رقم'}
                            </span>
                            {driver.driverPhoneNumber && (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${driver.driverPhoneNumber}`}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                                  title="اتصال هاتفي"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/20${driver.driverPhoneNumber.replace(/^0+/, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                                  title="مراسلة واتساب"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleCopy(driver.driverPhoneNumber!, driver.id + '-phone')}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                  title="نسخ الرقم"
                                >
                                  {copiedId === driver.id + '-phone' ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            معتمد وموثق
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-950/90 text-rose-300 border border-rose-500/40 shadow-sm">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            مرفوض
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-950/90 text-amber-300 border border-amber-500/40 shadow-sm">
                            <Hourglass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            قيد المراجعة
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Egyptian License Plate & Vehicle Specs */}
                    <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <Car className="w-4 h-4 text-cyan-400" />
                          <span>
                            {driver.carModel} • موديل {driver.carYear || 'غير محدد'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>اللون:</span>
                          <span className="font-bold text-slate-200">{driver.carColor || 'غير محدد'}</span>
                          <span className="text-slate-600">•</span>
                          <span>تاريخ التقديم:</span>
                          <span className="text-slate-300">
                            {new Date(driver.submittedAt).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* 3D Realistic Egyptian Metal License Plate */}
                      <div className="bg-white text-slate-950 border-2 border-black rounded-lg overflow-hidden flex flex-col min-w-[120px] shadow-xl">
                        <div className="bg-[#0284C7] text-white text-[9px] font-black text-center py-0.5 tracking-widest border-b border-black">
                          مصر • EGYPT
                        </div>
                        <div className="text-sm font-black text-center py-1 px-2 tracking-widest whitespace-nowrap font-mono">
                          {driver.carPlateNumber || '---'}
                        </div>
                      </div>
                    </div>

                    {/* National ID & License Decoded Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-slate-400 font-bold">الرقم القومي المصري</span>
                          <button
                            onClick={() => handleCopy(driver.nationalId, driver.id + '-nid')}
                            className="text-slate-500 hover:text-white"
                          >
                            {copiedId === driver.id + '-nid' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-cyan-300 font-mono font-black tracking-wider text-sm">
                          {driver.nationalId}
                        </div>
                        {nidInfo.valid && (
                          <div className="text-[10px] text-slate-400 mt-1 bg-slate-900/90 rounded px-2 py-0.5 inline-block">
                            {nidInfo.summary}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                        <span className="block text-[11px] text-slate-400 font-bold mb-1">رقم رخصة القيادة</span>
                        <div className="text-cyan-300 font-mono font-black tracking-wider text-sm">
                          {driver.drivingLicenseNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">تراخيص الإدارة العامة للمرور</div>
                      </div>
                    </div>

                    {/* Document Thumbnails Grid (4 Documents) */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2.5">
                        <span className="flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-cyan-400" />
                          المستندات والتراخيص المرفوعة
                        </span>
                        <span className="text-[11px] text-cyan-400 font-medium">انقر على أي صورة لفحصها مكبرة</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* 1. License Front */}
                        <SafeDocumentThumbnail
                          src={driver.drivingLicenseFrontUrl}
                          alt="وجه رخصة القيادة"
                          title="وجه رخصة القيادة"
                          onClick={() =>
                            setLightboxData({
                              url: driver.drivingLicenseFrontUrl,
                              title: `وجه رخصة القيادة — ${driver.driverName || 'سائق'}`,
                              rotation: 0,
                              zoom: 1,
                            })
                          }
                        />

                        {/* 2. License Back */}
                        <SafeDocumentThumbnail
                          src={driver.drivingLicenseBackUrl}
                          alt="ظهر رخصة القيادة"
                          title="ظهر رخصة القيادة"
                          onClick={() =>
                            setLightboxData({
                              url: driver.drivingLicenseBackUrl,
                              title: `ظهر رخصة القيادة — ${driver.driverName || 'سائق'}`,
                              rotation: 0,
                              zoom: 1,
                            })
                          }
                        />

                        {/* 3. Car Photo */}
                        <SafeDocumentThumbnail
                          src={driver.carPhotoUrl}
                          alt="صورة السيارة"
                          title="صورة السيارة الحقيقية"
                          onClick={() =>
                            setLightboxData({
                              url: driver.carPhotoUrl,
                              title: `صورة السيارة (${driver.carModel}) — ${driver.driverName || 'سائق'}`,
                              rotation: 0,
                              zoom: 1,
                            })
                          }
                        />

                        {/* 4. Car Registration License */}
                        <SafeDocumentThumbnail
                          src={driver.carLicenseUrl}
                          alt="رخصة السيارة"
                          title="رخصة تسيير السيارة"
                          onClick={() =>
                            setLightboxData({
                              url: driver.carLicenseUrl,
                              title: `رخصة تسيير السيارة (${driver.carPlateNumber}) — ${driver.driverName || 'سائق'}`,
                              rotation: 0,
                              zoom: 1,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Rejection Note Alert (if rejected) */}
                    {isRejected && driver.rejectionReason && (
                      <div className="bg-rose-950/50 border border-rose-500/40 rounded-2xl p-3.5 text-xs text-rose-200 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-rose-300 font-bold mb-0.5">سبب الرفض المسجل للإدارة:</strong>
                          <span>{driver.rejectionReason}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION BAR */}
                  <div className="bg-slate-950/80 p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    {/* Driver Trips & Passengers History Button */}
                    <button
                      onClick={() => setSelectedDriverForRides(driver)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition shadow-sm"
                    >
                      <Car className="w-4 h-4 text-cyan-400" />
                      <span>سجل رحلات وركاب السائق 🚗</span>
                    </button>

                    {/* Decision Buttons */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(driver.id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>اعتماد وتفعيل السائق</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectingItem(driver);
                              setRejectionReason('');
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold border border-slate-700 hover:border-rose-500/40 transition"
                          >
                            <X className="w-4 h-4" />
                            <span>رفض مع ذكر السبب</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            مفعل لنشر الرحلات
                          </span>
                          <button
                            onClick={() => {
                              setRejectingItem(driver);
                              setRejectionReason('إلغاء الاعتماد لمخالفة الشروط');
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-950/50 rounded-lg transition"
                          >
                            إلغاء الاعتماد
                          </button>
                        </div>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => approveMutation.mutate(driver.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 rounded-xl text-xs font-bold border border-slate-700 hover:border-emerald-500/40 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>إعادة الاعتماد الآن</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================================================================== */}
        {/* DRIVER TRIPS & PASSENGERS MODAL (سجل رحلات وركاب السائق) */}
        {/* ==================================================================== */}
        {selectedDriverForRides && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      سجل رحلات وركاب السائق: {selectedDriverForRides.driverName || 'السائق'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      هاتف: {selectedDriverForRides.driverPhoneNumber} • مركبة:{' '}
                      {selectedDriverForRides.carModel} ({selectedDriverForRides.carPlateNumber})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDriverForRides(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4">
                {isLoadingDriverRides ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-cyan-400">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-300 font-bold">جاري جلب سجل الرحلات والركاب...</span>
                  </div>
                ) : !driverRidesData || driverRidesData.items.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Navigation className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white">لا توجد رحلات مسجلة لهذا السائق</h4>
                    <p className="text-xs text-slate-500 mt-1">لم يقم هذا السائق بنشر أي مشاوير بعد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {driverRidesData.items.map((ride) => (
                      <div
                        key={ride.rideId}
                        className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4"
                      >
                        {/* Route & Times */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-black text-white">
                              <MapPin className="w-4 h-4 text-cyan-400" />
                              <span>{ride.fromCityOrArea}</span>
                              <span className="text-cyan-400 font-mono">⟵</span>
                              <span>{ride.toCityOrArea}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {new Date(ride.departureTime).toLocaleString('ar-EG', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-left">
                              <span className="block text-[10px] text-slate-400 font-bold">سعر المقعد</span>
                              <strong className="text-sm font-black text-emerald-400">
                                {ride.pricePerSeat} ج.م
                              </strong>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                ride.status === 'Completed'
                                  ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300'
                                  : 'bg-cyan-950/70 border-cyan-500/30 text-cyan-300'
                              }`}
                            >
                              {ride.status === 'Completed' ? 'مكتملة' : ride.status}
                            </span>
                          </div>
                        </div>

                        {/* Passengers List in This Ride */}
                        <div>
                          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-cyan-400" />
                              الركاب المسجلون في هذا المشوار ({ride.passengers?.length || 0})
                            </span>
                            <span className="text-[11px] text-emerald-400 font-mono">
                              إجمالي المحصل: {ride.totalGrossRevenue || 0} ج.م
                            </span>
                          </div>

                          {!ride.passengers || ride.passengers.length === 0 ? (
                            <div className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded-xl text-center">
                              لم يحجز أي ركاب في هذا المشوار
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {ride.passengers.map((p: CarpoolBookingSettlementDto) => (
                                <div
                                  key={p.bookingId}
                                  className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-cyan-300">
                                      {(p.passengerName || 'ر')[0]}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-white">{p.passengerName}</div>
                                      <div className="text-[11px] text-slate-400 font-mono">
                                        {p.passengerPhone || 'بدون هاتف'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-left space-y-0.5">
                                    <div className="text-xs font-black text-emerald-400">
                                      {p.totalAmount} ج.م ({p.seatsCount} مقعد)
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      حالة الركوب: {p.status}
                                    </div>
                                    {p.pickupOtp && (
                                      <div className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded text-center">
                                        كود الصعود: {p.pickupOtp}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* LIGHTBOX STUDIO MODAL (IMAGE ZOOM & ROTATION INSPECTION) */}
        {/* ==================================================================== */}
        {lightboxData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fadeIn">
            <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
              {/* Studio Toolbar */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-white font-bold">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-black">{lightboxData.title}</span>
                </div>

                {/* Floating Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setLightboxData((prev) => (prev ? { ...prev, zoom: Math.min(prev.zoom + 0.25, 3) } : null))
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                    title="تكبير (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setLightboxData((prev) => (prev ? { ...prev, zoom: Math.max(prev.zoom - 0.25, 0.75) } : null))
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                    title="تصغير (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setLightboxData((prev) =>
                        prev ? { ...prev, rotation: (prev.rotation - 90 + 360) % 360 } : null
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                    title="تدوير لليسار 90°"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setLightboxData((prev) => (prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null))
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
                    title="تدوير لليمين 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <a
                    href={resolveMediaUrl(lightboxData.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                    title="فتح الرابط المباشر في علامة تبويب جديدة"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => setLightboxData(null)}
                    className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition mr-2"
                    title="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Viewport Canvas */}
              <div className="flex-1 bg-slate-950/90 flex items-center justify-center p-6 overflow-auto">
                <img
                  src={resolveMediaUrl(lightboxData.url)}
                  alt={lightboxData.title}
                  style={{
                    transform: `scale(${lightboxData.zoom}) rotate(${lightboxData.rotation}deg)`,
                    transition: 'transform 0.2s ease-in-out',
                  }}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
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
                <span>
                  الزووم: {Math.round(lightboxData.zoom * 100)}% • التدوير: {lightboxData.rotation}°
                </span>
                <span className="text-cyan-400 font-mono truncate max-w-md">
                  {resolveMediaUrl(lightboxData.url)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* REJECT DRIVER MODAL */}
        {/* ==================================================================== */}
        {rejectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5 text-rose-400 font-bold">
                  <XCircle className="w-5 h-5" />
                  <span>رفض طلب تسجيل السائق</span>
                </div>
                <button
                  onClick={() => setRejectingItem(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                أدخل سبب الرفض ليتم إرساله في إشعار فوري للسائق{' '}
                <strong className="text-white">{rejectingItem.driverName || 'المتقدم'}</strong>:
              </p>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-bold block">أسباب شائعة بنقرة واحدة:</label>
                <div className="flex flex-wrap gap-1.5">
                  {rejectionPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                        rejectionReason === preset
                          ? 'bg-rose-950 border-rose-500 text-rose-200'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="أو اكتب سبب الرفض المخصص هنا..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!rejectionReason.trim() || rejectMutation.isPending}
                  onClick={() =>
                    rejectMutation.mutate({
                      id: rejectingItem.id,
                      reason: rejectionReason.trim(),
                    })
                  }
                  className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'جاري الرفض...' : 'تأكيد الرفض وإشعار السائق'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
