'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { advertisingAdminApi } from '@/api/advertisingAdmin';
import { VideoAdvertisingTab } from '@/components/admin/VideoAdvertisingTab';
import {
  AdvertisingDashboardStats,
  AdvertisingCampaignSummary,
  AdvertisingCampaignDetails,
  AdvertisingPaymentSummary,
  AdvertisingPlan,
  PaymentReceivingAccount,
} from '@/types/advertising';
import { signalRService } from '@/lib/signalr';
import {
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  MousePointerClick,
  Video,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  CreditCard,
  SlidersHorizontal,
  ChevronLeft,
  X,
  FileCheck,
  PauseCircle,
  PlayCircle,
  Ban,
  Landmark,
  Smartphone,
  Zap,
  Copy,
  ZoomIn,
  LayoutGrid,
  List,
  Crown,
  ArrowUpRight,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Radio,
  Receipt,
  CheckCheck,
  Trash2,
  Edit3,
  AlertTriangle,
  XOctagon,
  Timer,
  Flame,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Layers,
  Globe,
  Check,
  FileText,
  Download,
  CheckCircle,
  Heart,
  Film,
  PieChart,
  Activity,
} from 'lucide-react';

type TabType = 'dashboard' | 'campaigns' | 'payments' | 'plans' | 'accounts' | 'videoAds';

export default function AdvertisingAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'videoAds' ||
        tabParam === 'campaigns' ||
        tabParam === 'payments' ||
        tabParam === 'plans' ||
        tabParam === 'accounts' ||
        tabParam === 'dashboard'
      ) {
        setActiveTab(tabParam as TabType);
      }
    }
  }, []);

  // Dashboard Stats
  const [stats, setStats] = useState<AdvertisingDashboardStats | null>(null);

  // Campaigns
  const [campaigns, setCampaigns] = useState<AdvertisingCampaignSummary[]>([]);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<AdvertisingCampaignDetails | null>(null);
  const [loadingCampaignDetails, setLoadingCampaignDetails] = useState(false);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<string | null>(null);
  const [rejectionType, setRejectionType] = useState<'campaign' | 'payment'>('campaign');
  const [rejectionReason, setRejectionReason] = useState('');

  // Payments
  const [payments, setPayments] = useState<AdvertisingPaymentSummary[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');

  // Interactive Receipt & Media Lightbox
  const [lightboxPayment, setLightboxPayment] = useState<AdvertisingPaymentSummary | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);

  // View Modes & Filter Search States
  const [campaignsViewMode, setCampaignsViewMode] = useState<'cards' | 'table'>('cards');
  const [paymentsViewMode, setPaymentsViewMode] = useState<'cards' | 'table'>('cards');
  const [campaignSearch, setCampaignSearch] = useState<string>('');
  const [paymentSearch, setPaymentSearch] = useState<string>('');

  // Plans
  const [plans, setPlans] = useState<AdvertisingPlan[]>([]);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<AdvertisingPlan>>({
    name: '',
    description: '',
    price: 500,
    currency: 'EGP',
    durationDays: 7,
    allowedAdTypes: 'Feed,Story,Reels',
    isActive: true,
    displayOrder: 1,
  });

  // Receiving Accounts
  const [accounts, setAccounts] = useState<PaymentReceivingAccount[]>([]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Partial<PaymentReceivingAccount>>({
    name: '',
    accountType: 'InstaPay',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    iban: '',
    instaPayIdentifier: '',
    instructions: '',
    currency: 'EGP',
    isActive: true,
    isDefault: false,
    displayOrder: 1,
  });

  // Edit Campaign Modal
  const [editCampaignModalOpen, setEditCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<{
    id: string;
    title: string;
    description: string;
    destinationUrl: string;
    ctaType: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null>(null);

  // Cancel Campaign Modal
  const [cancelCampaignModalOpen, setCancelCampaignModalOpen] = useState(false);
  const [cancelingCampaignId, setCancelingCampaignId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Message banner
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // One-click copy helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyText = (text?: string, fieldName: string = '') => {
    if (!text) return;
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showFeedback(`تم النسخ إلى الحافظة بنجاح${fieldName ? `: ${fieldName}` : ''}`);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Load Data based on active tab
  const loadTabContent = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const data = await advertisingAdminApi.getDashboardStats();
        setStats(data);
      } else if (activeTab === 'campaigns') {
        const data = await advertisingAdminApi.getCampaigns(campaignStatusFilter || undefined);
        setCampaigns(data);
      } else if (activeTab === 'payments') {
        const data = await advertisingAdminApi.getPayments(paymentStatusFilter || undefined);
        setPayments(data);
      } else if (activeTab === 'plans') {
        const data = await advertisingAdminApi.getPlans();
        setPlans(data);
      } else if (activeTab === 'accounts') {
        const data = await advertisingAdminApi.getReceivingAccounts();
        setAccounts(data);
      }
    } catch (err: any) {
      console.error(err);
      showFeedback(err?.message || 'تعذر تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, campaignStatusFilter, paymentStatusFilter]);

  useEffect(() => {
    loadTabContent();
  }, [loadTabContent, refreshKey]);

  // Keep ref to selectedCampaign for real-time background sync inside open modal
  const selectedCampaignRef = React.useRef(selectedCampaign);
  useEffect(() => {
    selectedCampaignRef.current = selectedCampaign;
  }, [selectedCampaign]);

  // Real-Time SignalR Broadcast Subscription
  useEffect(() => {
    signalRService.start().then(() => {
      setIsRealtimeConnected(signalRService.getStatus() === 'connected');
    });

    const unsubStatus = signalRService.onStatusChange((s) => {
      setIsRealtimeConnected(s === 'connected');
    });

    const unsubCampaign = signalRService.onAdvertisingCampaignUpdated(async (msg) => {
      if (msg.status === 'PendingReview') {
        showFeedback(`⚡ طلب إعلان جديد: تم استلام حملة "${msg.title}" بانتظار المراجعة والاعتماد`, 'success');
      } else {
        showFeedback(`⚡ تحديث لحظي: تم تحديث الحملة "${msg.title}" (${msg.status})`, 'success');
      }
      setRefreshKey((k) => k + 1);

      // If this campaign is currently open in the details drawer, reload its details live!
      if (selectedCampaignRef.current?.id === msg.campaignId) {
        try {
          const updated = await advertisingAdminApi.getCampaignDetails(msg.campaignId);
          setSelectedCampaign(updated);
        } catch {
          // ignore
        }
      }
    });

    const unsubPayment = signalRService.onAdvertisingPaymentUpdated(async (msg) => {
      showFeedback(`⚡ تحديث دفع لحظي: عملية دفع ${msg.amount} ${msg.currency} (${msg.status})`, 'success');
      setRefreshKey((k) => k + 1);

      if (selectedCampaignRef.current?.id === msg.campaignId) {
        try {
          const updated = await advertisingAdminApi.getCampaignDetails(msg.campaignId);
          setSelectedCampaign(updated);
        } catch {
          // ignore
        }
      }
    });

    return () => {
      unsubStatus();
      unsubCampaign();
      unsubPayment();
    };
  }, []);

  // Keyboard Shortcuts (Esc to close Lightbox and Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImageUrl) {
          closeLightbox();
        } else if (rejectModalOpen) {
          setRejectModalOpen(false);
        } else if (selectedCampaign) {
          setSelectedCampaign(null);
        } else if (planModalOpen) {
          setPlanModalOpen(false);
        } else if (accountModalOpen) {
          setAccountModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImageUrl, rejectModalOpen, selectedCampaign, planModalOpen, accountModalOpen]);

  // Lightbox Handlers
  const openReceiptLightbox = (p: AdvertisingPaymentSummary) => {
    if (!p.proofMediaUrl) return;
    setLightboxPayment(p);
    setLightboxImageUrl(p.proofMediaUrl);
    setLightboxTitle(`إيصال تحويل: ${p.transactionReference || p.id.substring(0, 8)}`);
    setZoomLevel(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  const openMediaLightbox = (url: string, title: string = 'معاينة الوسائط') => {
    setLightboxPayment(null);
    setLightboxImageUrl(url);
    setLightboxTitle(title);
    setZoomLevel(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  const closeLightbox = () => {
    setLightboxPayment(null);
    setLightboxImageUrl(null);
    setZoomLevel(1);
    setRotation(0);
    setIsFullscreen(false);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(Number((z + 0.3).toFixed(2)), 4.0));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(Number((z - 0.3).toFixed(2)), 0.4));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  // Campaign Actions
  const handleViewCampaign = async (id: string) => {
    setLoadingCampaignDetails(true);
    try {
      const details = await advertisingAdminApi.getCampaignDetails(id);
      setSelectedCampaign(details);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل تحميل تفاصيل الحملة', 'error');
    } finally {
      setLoadingCampaignDetails(false);
    }
  };

  const handleApproveCampaign = async (id: string) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذه الحملة الإعلانية؟')) return;
    try {
      await advertisingAdminApi.approveCampaign(id);
      showFeedback('تمت الموافقة على الحملة بنجاح');
      if (selectedCampaign?.id === id) {
        const updated = await advertisingAdminApi.getCampaignDetails(id);
        setSelectedCampaign(updated);
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'فشلت الموافقة على الحملة', 'error');
    }
  };

  const openRejectModal = (id: string, type: 'campaign' | 'payment') => {
    setRejectionTargetId(id);
    setRejectionType(type);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmRejection = async () => {
    if (!rejectionTargetId || !rejectionReason.trim()) {
      showFeedback('يرجى ذكر سبب الرفض بالتفصيل', 'error');
      return;
    }
    try {
      if (rejectionType === 'campaign') {
        await advertisingAdminApi.rejectCampaign(rejectionTargetId, rejectionReason);
        showFeedback('تم رفض الحملة وإبلاغ المعلن بالسبب');
        if (selectedCampaign?.id === rejectionTargetId) {
          const updated = await advertisingAdminApi.getCampaignDetails(rejectionTargetId);
          setSelectedCampaign(updated);
        }
      } else {
        await advertisingAdminApi.rejectPayment(rejectionTargetId, rejectionReason);
        showFeedback('تم رفض عملية الدفع / إيصال التحويل');
        if (selectedCampaign) {
          const updated = await advertisingAdminApi.getCampaignDetails(selectedCampaign.id);
          setSelectedCampaign(updated);
        }
      }
      setRejectModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'حدث خطأ أثناء الرفض', 'error');
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await advertisingAdminApi.pauseCampaign(id);
      showFeedback('تم إيقاف الحملة مؤقتاً');
      if (selectedCampaign?.id === id) {
        const updated = await advertisingAdminApi.getCampaignDetails(id);
        setSelectedCampaign(updated);
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'تعذر إيقاف الحملة', 'error');
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await advertisingAdminApi.resumeCampaign(id);
      showFeedback('تم استئناف الحملة بنجاح');
      if (selectedCampaign?.id === id) {
        const updated = await advertisingAdminApi.getCampaignDetails(id);
        setSelectedCampaign(updated);
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'تعذر استئناف الحملة', 'error');
    }
  };

  const openCancelCampaignModal = (id: string) => {
    setCancelingCampaignId(id);
    setCancelReason('');
    setCancelCampaignModalOpen(true);
  };

  const handleConfirmCancelCampaign = async () => {
    if (!cancelingCampaignId) return;
    try {
      await advertisingAdminApi.cancelCampaign(cancelingCampaignId, cancelReason.trim() || undefined);
      showFeedback('تم إلغاء الحملة الإعلانية بنجاح');
      if (selectedCampaign?.id === cancelingCampaignId) {
        setSelectedCampaign(null);
      }
      setCancelCampaignModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'تعذر إلغاء الحملة', 'error');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('تحذير: هل أنت متأكد من حذف هذه الحملة الإعلانية نهائياً مع كافة الوسائط والإحصائيات وسجلات التتبع المرتبطة بها؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    try {
      await advertisingAdminApi.deleteCampaign(id);
      showFeedback('تم حذف الحملة الإعلانية نهائياً');
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'تعذر حذف الحملة', 'error');
    }
  };

  const openEditCampaignModal = async (camp: AdvertisingCampaignSummary | AdvertisingCampaignDetails) => {
    try {
      let details: AdvertisingCampaignDetails;
      if ('description' in camp && camp.description !== undefined) {
        details = camp as AdvertisingCampaignDetails;
      } else {
        details = await advertisingAdminApi.getCampaignDetails(camp.id);
      }
      setEditingCampaign({
        id: details.id,
        title: details.title || '',
        description: details.description || '',
        destinationUrl: details.destinationUrl || '',
        ctaType: details.ctaType || 'LearnMore',
        startDate: details.startDate ? details.startDate.substring(0, 16) : '',
        endDate: details.endDate ? details.endDate.substring(0, 16) : '',
        status: details.status || 'Active',
      });
      setEditCampaignModalOpen(true);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل جلب بيانات الحملة للتعديل', 'error');
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    try {
      const payload: any = {
        title: editingCampaign.title.trim(),
        description: editingCampaign.description.trim() || undefined,
        destinationUrl: editingCampaign.destinationUrl.trim() || undefined,
        ctaType: editingCampaign.ctaType,
        status: editingCampaign.status,
      };
      if (editingCampaign.startDate) payload.startDate = new Date(editingCampaign.startDate).toISOString();
      if (editingCampaign.endDate) payload.endDate = new Date(editingCampaign.endDate).toISOString();

      const updated = await advertisingAdminApi.updateCampaign(editingCampaign.id, payload);
      showFeedback('تم تحديث بيانات الحملة الإعلانية بنجاح');
      if (selectedCampaign?.id === editingCampaign.id) {
        setSelectedCampaign(updated);
      }
      setEditCampaignModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل تحديث الحملة', 'error');
    }
  };

  // Payment Actions
  const handleConfirmPayment = async (id: string) => {
    if (!confirm('تأكيد استلام المبلغ؟ سيتم تسجيل قيد مالي وتحديث حالة الحملة.')) return;
    try {
      await advertisingAdminApi.confirmPayment(id, 'تم التأكيد يدوياً بواسطة الإدارة');
      showFeedback('تم تأكيد الدفع بنجاح وتسجيل المعاملة في دفتر الأستاذ');
      if (selectedCampaign) {
        const updated = await advertisingAdminApi.getCampaignDetails(selectedCampaign.id);
        setSelectedCampaign(updated);
      }
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل تأكيد الدفع', 'error');
    }
  };

  // Plans Actions
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await advertisingAdminApi.savePlan(editingPlan);
      showFeedback('تم حفظ الباقة بنجاح');
      setPlanModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل حفظ الباقة', 'error');
    }
  };

  const handleTogglePlan = async (id: string) => {
    try {
      await advertisingAdminApi.togglePlanStatus(id);
      showFeedback('تم تحديث حالة الباقة');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل تحديث حالة الباقة', 'error');
    }
  };

  // Accounts Actions
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await advertisingAdminApi.saveReceivingAccount(editingAccount);
      showFeedback('تم حفظ حساب التحويل بنجاح');
      setAccountModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل حفظ الحساب', 'error');
    }
  };

  const handleToggleAccount = async (id: string) => {
    try {
      await advertisingAdminApi.toggleReceivingAccountStatus(id);
      showFeedback('تم تبديل حالة الحساب');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      showFeedback(err?.message || 'فشل تبديل حالة الحساب', 'error');
    }
  };

  const filteredCampaigns = useMemo(() => {
    let list = campaigns;
    if (campaignStatusFilter) {
      list = list.filter((c) => c.status === campaignStatusFilter);
    }
    if (campaignSearch.trim()) {
      const q = campaignSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.advertiserName?.toLowerCase().includes(q) ||
          c.planName?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [campaigns, campaignStatusFilter, campaignSearch]);

  const filteredPayments = useMemo(() => {
    let list = payments;
    if (paymentStatusFilter) {
      list = list.filter((p) => p.status === paymentStatusFilter);
    }
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.campaignTitle?.toLowerCase().includes(q) ||
          p.advertiserName?.toLowerCase().includes(q) ||
          p.transactionReference?.toLowerCase().includes(q) ||
          p.paymentMethod?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, paymentStatusFilter, paymentSearch]);

  return (
    <AdminShell>
      <div className="p-4 md:p-8 space-y-7 max-w-7xl mx-auto">
        {/* ================= COMMAND HEADER ================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/25 p-6 md:p-8 shadow-2xl shadow-black/60">
          {/* Background Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3.5 flex-wrap">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40">
                  <Megaphone className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                      منصة إدارة الإعلانات والرعايات
                    </h1>
                    <span className="px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 border border-amber-500/30 shadow-inner">
                      Advertising Hub Pro
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    منظومة متكاملة لإدارة الحملات الترويجية، مراجعة المحتوى والوسائط، وفحص إيصالات التحويل البنكي وإنستاباي لحظياً
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Live Pulse */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Real-time SignalR Pulse */}
              <div
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold border backdrop-blur-md transition-all shadow-sm ${
                  isRealtimeConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
                title={isRealtimeConnected ? 'متصل بقناة SignalR لتحديث الإعلانات والمدفوعات لحظياً' : 'جاري الاتصال...'}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {isRealtimeConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRealtimeConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'}`}></span>
                </span>
                <span>{isRealtimeConnected ? 'بث حي متصل (SignalR)' : 'جاري الاتصال...'}</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm backdrop-blur-md"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                <span>تحديث</span>
              </button>

              {/* Contextual Quick Actions */}
              {activeTab === 'plans' && (
                <button
                  onClick={() => {
                    setEditingPlan({
                      name: '',
                      description: '',
                      price: 500,
                      currency: 'EGP',
                      durationDays: 7,
                      allowedAdTypes: 'Feed,Story,Reels',
                      isActive: true,
                      displayOrder: 1,
                    });
                    setPlanModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>إضافة باقة جديدة</span>
                </button>
              )}

              {activeTab === 'accounts' && (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setEditingAccount({
                        name: '',
                        accountType: 'InstaPay',
                        bankName: '',
                        accountHolderName: '',
                        accountNumber: '',
                        iban: '',
                        instaPayIdentifier: '',
                        instructions: 'يرجى كتابة رقم المرجع في خانة الملاحظات أثناء التحويل عبر تطبيق إنستاباي',
                        currency: 'EGP',
                        isActive: true,
                        isDefault: false,
                        displayOrder: 1,
                      });
                      setAccountModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-purple-500/20 hover:scale-[1.02]"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>إضافة إنستاباي</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingAccount({
                        name: '',
                        accountType: 'BankAccount',
                        bankName: '',
                        accountHolderName: '',
                        accountNumber: '',
                        iban: '',
                        instaPayIdentifier: '',
                        instructions: 'يرجى إرسال التحويل البنكي ثم رفع صورة إشعار التحويل للمطابقة',
                        currency: 'EGP',
                        isActive: true,
                        isDefault: false,
                        displayOrder: 2,
                      });
                      setAccountModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs md:text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02]"
                  >
                    <Landmark className="w-4 h-4 text-cyan-200" />
                    <span>إضافة حساب بنكي</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= FEEDBACK MESSAGE TOAST ================= */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl text-sm font-bold flex items-center justify-between gap-3 border shadow-xl animate-in fade-in slide-in-from-top-3 duration-300 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200 shadow-emerald-500/10'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-200 shadow-rose-500/10'
            }`}
          >
            <div className="flex items-center gap-3">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ================= NAVIGATION TABS BAR ================= */}
        <div className="flex overflow-x-auto gap-2 p-2 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 text-xs md:text-sm font-bold shadow-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>لوحة القيادة والمؤشرات</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'campaigns'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>الحملات الإعلانية</span>
            {stats && (stats.pendingReviewCampaigns ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-500/40">
                {stats.pendingReviewCampaigns}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>المدفوعات والإيصالات</span>
            {stats && (stats.pendingPaymentsCount ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-md animate-pulse">
                {stats.pendingPaymentsCount} إيصال
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>باقات الإعلانات</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>حسابات الاستقبال (البنوك / إنستاباي)</span>
          </button>

          <button
            onClick={() => setActiveTab('videoAds')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'videoAds'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>إعلانات الفيديو (In-Stream)</span>
          </button>
        </div>

        {/* ================= TAB: VIDEO ADS ================= */}
        {activeTab === 'videoAds' && <VideoAdvertisingTab />}

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-7 animate-in fade-in duration-300">
            {stats ? (
              <>
                {/* 4 HERO 3D KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  {/* Card 1: Total Campaigns */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 p-5 md:p-6 shadow-xl hover:border-amber-500/40 transition-all group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400">إجمالي الحملات الترويجية</span>
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Megaphone className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      {stats.totalCampaigns ?? 0}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{stats.pendingReviewCampaigns ?? 0} بانتظار المراجعة</span>
                    </div>
                  </div>

                  {/* Card 2: Active Campaigns */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-950/90 border border-emerald-500/30 p-5 md:p-6 shadow-xl hover:border-emerald-500/50 transition-all group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-emerald-300">الحملات النشطة والمعروضة</span>
                      <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                      {stats.activeCampaigns ?? 0}
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{stats.completedCampaigns ?? 0} حملة اكتملت بالكامل</span>
                    </div>
                  </div>

                  {/* Card 3: Total Revenue */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-slate-950/90 border border-amber-500/30 p-5 md:p-6 shadow-xl hover:border-amber-500/50 transition-all group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-amber-300">إجمالي الإيرادات المؤكدة</span>
                      <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight flex items-baseline gap-1.5">
                      <span>{(stats.totalRevenue ?? 0).toLocaleString()}</span>
                      <span className="text-xs font-bold text-amber-300/80">ج.م</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{stats.confirmedPaymentsCount ?? 0} معاملة دفع ناجحة</span>
                    </div>
                  </div>

                  {/* Card 4: Pending Payments */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-slate-950/90 border border-cyan-500/30 p-5 md:p-6 shadow-xl hover:border-cyan-500/50 transition-all group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-cyan-300">إيصالات بانتظار التدقيق</span>
                      <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                        <Receipt className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-cyan-400 tracking-tight">
                      {stats.pendingPaymentsCount ?? 0}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-cyan-300/90">
                      <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>تتطلب فحص إشعار إنستاباي / البنك</span>
                    </div>
                  </div>
                </div>

                {/* DELIVERY & ENGAGEMENT METRICS HUB */}
                <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900/80 border border-white/10 p-6 md:p-7 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-black text-white">
                          مركز مؤشرات الانتشار والتفاعل الرقمي
                        </h3>
                        <p className="text-xs text-slate-400">
                          بيانات تفاعلية لحظية لقياس وصول إعلانات مصر (Impressions, CTR, Engagement)
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400">
                      Live Telemetry
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Impressions */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-blue-500/20 text-center hover:border-blue-500/40 transition-all shadow-md group">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-black text-white tracking-tight">
                        {(stats.totalImpressions ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold mt-1">مرات الظهور (Impressions)</div>
                    </div>

                    {/* Clicks */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 text-center hover:border-emerald-500/40 transition-all shadow-md group">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <MousePointerClick className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-black text-white tracking-tight">
                        {(stats.totalClicks ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold mt-1">النقرات الفعالة (Clicks)</div>
                    </div>

                    {/* Likes */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 text-center hover:border-rose-500/40 transition-all shadow-md group">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-black text-rose-300 tracking-tight">
                        {(stats.totalLikes ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold mt-1">إعجابات وتفاعل الجمهور</div>
                    </div>

                    {/* Video Views */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/20 text-center hover:border-amber-500/40 transition-all shadow-md group">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-black text-white tracking-tight">
                        {((stats.totalVideoViews ?? stats.totalVideoStarts) ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold mt-1">مشاهدات الفيديو والريلز</div>
                    </div>

                    {/* Completed Campaigns */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/20 text-center hover:border-purple-500/40 transition-all shadow-md group col-span-2 sm:col-span-1">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-black text-white tracking-tight">
                        {((stats.totalVideoCompletes ?? stats.completedCampaigns) ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-bold mt-1">الحملات المنتهية بنجاح</div>
                    </div>
                  </div>
                </div>

                {/* QUICK COMMAND SHORTCUTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => {
                      setActiveTab('campaigns');
                      setCampaignStatusFilter('PendingReview');
                    }}
                    className="group p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-all shadow-xl flex items-center justify-between hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                        <Megaphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-white text-base">تدقيق ومراجعة الحملات المعلقة</div>
                        <div className="text-xs text-slate-400 mt-1">
                          لديك <span className="font-bold text-amber-300">{stats.pendingReviewCampaigns}</span> حملة تحتاج موافقة الإدارة لاعتماد البث
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="w-6 h-6 text-amber-400 group-hover:-translate-x-1.5 transition-transform" />
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('payments');
                      setPaymentStatusFilter('PaymentSubmitted');
                    }}
                    className="group p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all shadow-xl flex items-center justify-between hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-white text-base">مطابقة إيصالات الدفع والتحصيل</div>
                        <div className="text-xs text-slate-400 mt-1">
                          لديك <span className="font-bold text-emerald-300">{stats.pendingPaymentsCount}</span> إيصال بحاجة للمطابقة وتأكيد الرصيد
                        </div>
                      </div>
                    </div>
                    <ChevronLeft className="w-6 h-6 text-emerald-400 group-hover:-translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-sm font-bold">جاري تحميل إحصائيات الإعلانات المباشرة...</span>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: CAMPAIGNS ================= */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter and Search Bar */}
            <div className="p-4 md:p-5 rounded-3xl bg-slate-950/80 border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={campaignSearch}
                    onChange={(e) => setCampaignSearch(e.target.value)}
                    placeholder="ابحث بعنوان الحملة، اسم المعلن، المعرف، أو نوع الإعلان..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  {campaignSearch && (
                    <button
                      onClick={() => setCampaignSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => setCampaignsViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      campaignsViewMode === 'cards'
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>كروت 3D</span>
                  </button>
                  <button
                    onClick={() => setCampaignsViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      campaignsViewMode === 'table'
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>جدول مفصل</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-white/5">
                {[
                  { id: '', label: 'كافة الحملات' },
                  { id: 'PendingReview', label: 'بانتظار المراجعة' },
                  { id: 'Active', label: 'نشطة حالياً' },
                  { id: 'Scheduled', label: 'مجدولة' },
                  { id: 'Completed', label: 'مكتملة' },
                  { id: 'Rejected', label: 'مرفوضة' },
                  { id: 'Cancelled', label: 'ملغاة' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setCampaignStatusFilter(pill.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      campaignStatusFilter === pill.id
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
                <span className="text-[11px] text-slate-500 font-semibold mr-auto">
                  العدد المعروض: {filteredCampaigns.length}
                </span>
              </div>
            </div>

            {/* VIEW MODE: 3D LUXURY CARDS */}
            {campaignsViewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCampaigns.length === 0 ? (
                  <div className="col-span-full py-16 text-center rounded-3xl bg-slate-950/60 border border-white/10 text-slate-500 space-y-3">
                    <Megaphone className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
                    <div className="text-base font-bold text-slate-400">لا توجد حملات تطابق المعايير المحددة</div>
                    <p className="text-xs text-slate-500">جرب تغيير حالة الفلتر أو البحث بكلمات أخرى</p>
                  </div>
                ) : (
                  filteredCampaigns.map((camp) => {
                    const mediaUrl =
                      camp.firstMediaUrl ||
                      (camp.media && camp.media.length > 0 ? camp.media[0].mediaUrl : null);
                    const impressions =
                      camp.reachCount ??
                      camp.stats?.impressionsCount ??
                      camp.stats?.impressions ??
                      camp.totalImpressions ??
                      0;
                    const clicks = camp.stats?.clicksCount ?? camp.stats?.clicks ?? camp.totalClicks ?? 0;
                    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0';

                    return (
                      <div
                        key={camp.id}
                        className="group relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border border-white/10 hover:border-amber-500/40 shadow-xl hover:shadow-2xl hover:shadow-amber-500/5 transition-all flex flex-col justify-between overflow-hidden"
                      >
                        {/* Top Media & Status Header */}
                        <div className="relative w-full h-44 bg-slate-950 overflow-hidden shrink-0">
                          {mediaUrl ? (
                            <img
                              src={mediaUrl}
                              alt={camp.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-600 gap-2">
                              <Megaphone className="w-10 h-10 opacity-40 text-amber-400" />
                              <span className="text-xs font-semibold text-slate-500">لا توجد وسائط مرفقة</span>
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                          {/* Floating Badges */}
                          <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
                            {/* Status Badge */}
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-black backdrop-blur-md shadow-md border ${
                                camp.status === 'Active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : camp.status === 'PendingReview'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                  : camp.status === 'PendingPayment'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : camp.status === 'Rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : camp.status === 'Completed'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                              }`}
                            >
                              {camp.status === 'Active'
                                ? '● نشطة ومعروضة'
                                : camp.status === 'PendingReview'
                                ? '⏳ بانتظار المراجعة'
                                : camp.status === 'PendingPayment'
                                ? '💳 بانتظار السداد'
                                : camp.status === 'Rejected'
                                ? '✕ مرفوضة'
                                : camp.status === 'Cancelled'
                                ? 'ملغاة'
                                : camp.status === 'Completed'
                                ? '✓ مكتملة'
                                : camp.status}
                            </span>

                            {/* Placement / Type */}
                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/20">
                              {camp.campaignType || 'Feed'}
                            </span>
                          </div>

                          {/* Countdown Timer chip on bottom of media */}
                          <div className="absolute bottom-2.5 right-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black backdrop-blur-md border ${
                                camp.isExpiringSoon
                                  ? 'bg-rose-500/30 text-rose-300 border-rose-500/40 animate-pulse'
                                  : 'bg-black/60 text-slate-200 border-white/10'
                              }`}
                            >
                              <Timer className="w-3 h-3 text-amber-400" />
                              {camp.remainingTimeText || (camp.status === 'Active' ? 'جاري العرض' : '—')}
                            </span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* Title & Advertiser */}
                            <div>
                              <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                                {camp.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="font-bold text-slate-200">{camp.advertiserName || 'معلن مجهول'}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {camp.planName || 'باقة مخصصة'}
                                </span>
                              </div>
                            </div>

                            {/* Dates Pill */}
                            <div className="flex items-center justify-between text-xs text-slate-400 bg-white/[0.03] p-2.5 rounded-2xl border border-white/5">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>المدة الزمنية:</span>
                              </span>
                              <span className="font-semibold text-slate-200">
                                {new Date(camp.startDate).toLocaleDateString('ar-EG')} ←{' '}
                                {new Date(camp.endDate).toLocaleDateString('ar-EG')}
                              </span>
                            </div>

                            {/* Live Performance HUD */}
                            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-amber-400">
                                  <Flame className="w-3.5 h-3.5" />
                                  <span>{impressions.toLocaleString()} ظهور</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                  <MousePointerClick className="w-3.5 h-3.5" />
                                  <span>{clicks.toLocaleString()} نقرة ({ctr}%)</span>
                                </span>
                              </div>
                              {/* Mini CTR progress bar */}
                              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                                  style={{ width: `${Math.min(parseFloat(ctr) * 10, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Price / Budget */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-400 font-bold">الميزانية المقررة:</span>
                              <span className="text-base font-black text-amber-400 font-mono">
                                {camp.totalPrice} <span className="text-xs font-bold text-slate-400">{camp.currency}</span>
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons Dock */}
                          <div className="pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewCampaign(camp.id)}
                              className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>التفاصيل</span>
                            </button>

                            <button
                              onClick={() => openEditCampaignModal(camp)}
                              className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
                              title="تعديل الحملة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {camp.status === 'PendingReview' && (
                              <>
                                <button
                                  onClick={() => handleApproveCampaign(camp.id)}
                                  className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
                                  title="موافقة واعتماد البث"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>موافقة</span>
                                </button>
                                <button
                                  onClick={() => openRejectModal(camp.id, 'campaign')}
                                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-all"
                                  title="رفض الإعلان"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {camp.status === 'Active' && (
                              <button
                                onClick={() => handlePauseCampaign(camp.id)}
                                className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 transition-all"
                                title="إيقاف مؤقت"
                              >
                                <PauseCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {camp.status === 'Paused' && (
                              <button
                                onClick={() => handleResumeCampaign(camp.id)}
                                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-all"
                                title="استئناف البث"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {camp.status !== 'Cancelled' && camp.status !== 'Completed' && (
                              <button
                                onClick={() => openCancelCampaignModal(camp.id)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-all"
                                title="إلغاء الحملة"
                              >
                                <XOctagon className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW MODE: TABLE */}
            {campaignsViewMode === 'table' && (
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs md:text-sm">
                    <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold">
                      <tr>
                        <th className="p-4">الحملة</th>
                        <th className="p-4">المعلن</th>
                        <th className="p-4">الباقة والمدة</th>
                        <th className="p-4">الوقت المتبقي</th>
                        <th className="p-4">عداد الانتشار</th>
                        <th className="p-4">الميزانية</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 text-center">إجراءات وتحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {filteredCampaigns.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-500">
                            لا توجد حملات تطابق المعايير المحددة.
                          </td>
                        </tr>
                      ) : (
                        filteredCampaigns.map((camp) => {
                          const mediaUrl =
                            camp.firstMediaUrl ||
                            (camp.media && camp.media.length > 0 ? camp.media[0].mediaUrl : null);
                          const impressions =
                            camp.reachCount ??
                            camp.stats?.impressionsCount ??
                            camp.stats?.impressions ??
                            camp.totalImpressions ??
                            0;
                          const clicks =
                            camp.stats?.clicksCount ?? camp.stats?.clicks ?? camp.totalClicks ?? 0;
                          const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0';

                          return (
                            <tr key={camp.id} className="hover:bg-white/[0.03] transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  {mediaUrl ? (
                                    <img
                                      src={mediaUrl}
                                      alt=""
                                      className="w-12 h-12 rounded-xl object-cover bg-black/50 border border-white/10 shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                                      <Megaphone className="w-5 h-5 text-amber-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-black text-white max-w-[200px] truncate">
                                      {camp.title}
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-amber-300 border border-white/10 mt-1 inline-block">
                                      {camp.campaignType}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-white">{camp.advertiserName || 'معلن'}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {camp.advertiserUserId?.substring(0, 8)}...
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-white block">{camp.planName || 'مخصصة'}</span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(camp.startDate).toLocaleDateString('ar-EG')} ←{' '}
                                  {new Date(camp.endDate).toLocaleDateString('ar-EG')}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1 items-start">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                                      camp.isExpiringSoon
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                                        : camp.status === 'Active'
                                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                        : 'bg-white/5 text-slate-400'
                                    }`}
                                  >
                                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                                    {camp.remainingTimeText || (camp.status === 'Active' ? 'جاري العرض' : '—')}
                                  </span>
                                  {camp.isExpiringSoon && (
                                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      سينتهي قريباً
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400">
                                    <Flame className="w-3.5 h-3.5" />
                                    <span>{impressions.toLocaleString()} ظهور</span>
                                  </div>
                                  <div className="text-[11px] text-emerald-400 font-semibold">
                                    {clicks.toLocaleString()} نقرة ({ctr}% CTR)
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-mono font-black text-amber-400 text-sm">
                                {camp.totalPrice} <span className="text-xs text-slate-400">{camp.currency}</span>
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                                    camp.status === 'Active'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                      : camp.status === 'PendingReview'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                                      : camp.status === 'PendingPayment'
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                      : camp.status === 'Rejected'
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                      : camp.status === 'Cancelled'
                                      ? 'bg-slate-500/20 text-slate-400 border-slate-500/30 line-through'
                                      : camp.status === 'Completed'
                                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                      : 'bg-white/10 text-slate-400'
                                  }`}
                                >
                                  {camp.status === 'Active'
                                    ? 'نشطة'
                                    : camp.status === 'PendingReview'
                                    ? 'بانتظار المراجعة'
                                    : camp.status === 'PendingPayment'
                                    ? 'بانتظار السداد'
                                    : camp.status === 'Rejected'
                                    ? 'مرفوضة'
                                    : camp.status === 'Cancelled'
                                    ? 'ملغاة'
                                    : camp.status === 'Paused'
                                    ? 'متوقفة مؤقتاً'
                                    : camp.status === 'Completed'
                                    ? 'مكتملة'
                                    : camp.status}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => handleViewCampaign(camp.id)}
                                    title="عرض التفاصيل"
                                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 text-amber-400" />
                                  </button>

                                  <button
                                    onClick={() => openEditCampaignModal(camp)}
                                    title="تعديل الحملة"
                                    className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  {camp.status === 'PendingReview' && (
                                    <>
                                      <button
                                        onClick={() => handleApproveCampaign(camp.id)}
                                        title="موافقة وتفعيل"
                                        className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => openRejectModal(camp.id, 'campaign')}
                                        title="رفض"
                                        className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition-colors"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}

                                  {camp.status === 'Active' && (
                                    <button
                                      onClick={() => handlePauseCampaign(camp.id)}
                                      title="إيقاف مؤقت"
                                      className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 transition-colors"
                                    >
                                      <PauseCircle className="w-4 h-4" />
                                    </button>
                                  )}

                                  {camp.status === 'Paused' && (
                                    <button
                                      onClick={() => handleResumeCampaign(camp.id)}
                                      title="استئناف"
                                      className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                                    >
                                      <PlayCircle className="w-4 h-4" />
                                    </button>
                                  )}

                                  {camp.status !== 'Cancelled' && camp.status !== 'Completed' && (
                                    <button
                                      onClick={() => openCancelCampaignModal(camp.id)}
                                      title="إلغاء الإعلان"
                                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
                                    >
                                      <XOctagon className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteCampaign(camp.id)}
                                    title="حذف الإعلان نهائياً"
                                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PAYMENTS ================= */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filter and Search Bar */}
            <div className="p-4 md:p-5 rounded-3xl bg-slate-950/80 border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    placeholder="ابحث برقم المعاملة، اسم المعلن، عنوان الحملة، أو وسيلة الدفع..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all"
                  />
                  {paymentSearch && (
                    <button
                      onClick={() => setPaymentSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => setPaymentsViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      paymentsViewMode === 'cards'
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>كروت الإيصالات</span>
                  </button>
                  <button
                    onClick={() => setPaymentsViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      paymentsViewMode === 'table'
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>جدول المعاملات</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-white/5">
                {[
                  { id: '', label: 'كافة المعاملات' },
                  { id: 'PaymentSubmitted', label: 'إيصالات قيد المراجعة' },
                  { id: 'PaymentConfirmed', label: 'مدفوعة ومؤكدة' },
                  { id: 'Pending', label: 'معلقة' },
                  { id: 'PaymentFailed', label: 'فاشلة / مرفوضة' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setPaymentStatusFilter(pill.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      paymentStatusFilter === pill.id
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
                <span className="text-[11px] text-slate-500 font-semibold mr-auto">
                  العدد المعروض: {filteredPayments.length}
                </span>
              </div>
            </div>

            {/* VIEW MODE: CARDS */}
            {paymentsViewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPayments.length === 0 ? (
                  <div className="col-span-full py-16 text-center rounded-3xl bg-slate-950/60 border border-white/10 text-slate-500 space-y-3">
                    <Receipt className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
                    <div className="text-base font-bold text-slate-400">لا توجد عمليات دفع مسجلة</div>
                    <p className="text-xs text-slate-500">جرب تغيير حالة الفلتر أو البحث بكلمات أخرى</p>
                  </div>
                ) : (
                  filteredPayments.map((p) => {
                    const isInstaPay = p.paymentMethod?.toLowerCase().includes('insta');
                    const isBank = p.paymentMethod?.toLowerCase().includes('bank');

                    return (
                      <div
                        key={p.id}
                        className={`group relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border p-5 shadow-xl transition-all flex flex-col justify-between space-y-4 ${
                          p.status === 'PaymentSubmitted'
                            ? 'border-amber-500/40 shadow-amber-500/5'
                            : p.status === 'PaymentConfirmed'
                            ? 'border-emerald-500/30'
                            : 'border-white/10'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Method Badge & Reference */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                isInstaPay
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : isBank
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {isInstaPay ? (
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                              ) : (
                                <Landmark className="w-3.5 h-3.5 text-cyan-300" />
                              )}
                              <span>{p.paymentMethod || 'تحويل مباشر'}</span>
                            </span>

                            <button
                              onClick={() => copyText(p.transactionReference || p.id, 'رقم المعاملة')}
                              title="نسخ رقم المرجع"
                              className="flex items-center gap-1 font-mono text-[11px] text-slate-400 hover:text-amber-400 transition-colors bg-white/5 px-2.5 py-1 rounded-xl border border-white/5"
                            >
                              <span>{p.transactionReference || p.id.substring(0, 8)}</span>
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Giant Amount Display */}
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center space-y-1">
                            <div className="text-2xl md:text-3xl font-black text-amber-400 font-mono tracking-tight">
                              {p.amount.toLocaleString()}{' '}
                              <span className="text-xs font-bold text-amber-300/80">{p.currency || 'ج.م'}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              تاريخ المعاملة: {new Date(p.createdAt).toLocaleDateString('ar-EG')} -{' '}
                              {new Date(p.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* Receipt Proof Section */}
                          <div>
                            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                              <span>صورة إيصال التحويل:</span>
                              <span className="text-[10px] text-amber-400">تدقيق مجهري 🔍</span>
                            </div>

                            {p.proofMediaUrl ? (
                              <div
                                onClick={() => openReceiptLightbox(p)}
                                className="group/proof relative h-36 rounded-2xl overflow-hidden bg-slate-950 border border-white/10 hover:border-amber-500/50 cursor-pointer transition-all shadow-inner flex items-center justify-center"
                              >
                                <img
                                  src={p.proofMediaUrl}
                                  alt="إيصال التحويل"
                                  className="w-full h-full object-cover group-hover/proof:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/proof:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity backdrop-blur-xs">
                                  <ZoomIn className="w-6 h-6 text-amber-400 animate-bounce" />
                                  <span className="text-xs font-black text-white">انقر للتكبير وفحص الإيصال</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-24 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5">
                                <Receipt className="w-6 h-6 opacity-30" />
                                <span>لم يتم إرفاق إيصال إلكتروني</span>
                              </div>
                            )}
                          </div>

                          {/* Campaign & Advertiser Information */}
                          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">الحملة الإعلانية:</span>
                              <span className="font-bold text-white max-w-[160px] truncate">
                                {p.campaignTitle || 'حملة إعلانية'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400">المعلن:</span>
                              <span className="font-bold text-slate-200">{p.advertiserName || 'معلن'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Action Dock */}
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          {p.status === 'PaymentSubmitted' || p.status === 'Pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleConfirmPayment(p.id)}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                              >
                                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                                <span>تأكيد واستلام</span>
                              </button>
                              <button
                                onClick={() => openRejectModal(p.id, 'payment')}
                                className="py-2.5 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
                              >
                                <span>رفض</span>
                              </button>
                            </div>
                          ) : p.status === 'PaymentConfirmed' ? (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-black text-center flex items-center justify-center gap-1.5">
                              <CheckCheck className="w-4 h-4 text-emerald-400" />
                              <span>تم تأكيد الدفعة واعتماد الحملة بنجاح</span>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-bold text-center">
                              معاملة مرفوضة أو ملغاة
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW MODE: TABLE */}
            {paymentsViewMode === 'table' && (
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs md:text-sm">
                    <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-bold">
                      <tr>
                        <th className="p-4">رقم المعاملة / المرجع</th>
                        <th className="p-4">الحملة المعلنة</th>
                        <th className="p-4">المعلن</th>
                        <th className="p-4">المبلغ</th>
                        <th className="p-4">طريقة الدفع</th>
                        <th className="p-4">إيصال التحويل</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-500">
                            لا توجد عمليات دفع مسجلة.
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="p-4 font-mono">
                              <div className="font-bold text-white">{p.transactionReference || p.id.substring(0, 8)}</div>
                              <div className="text-[10px] text-slate-500">
                                {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-white max-w-[180px] truncate">
                                {p.campaignTitle || 'حملة إعلانية'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {p.campaignId?.substring(0, 8)}...
                              </div>
                            </td>
                            <td className="p-4 font-bold text-white">{p.advertiserName || 'معلن'}</td>
                            <td className="p-4 font-mono font-black text-amber-400">
                              {p.amount.toLocaleString()} {p.currency}
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs font-bold border border-white/10">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="p-4">
                              {p.proofMediaUrl ? (
                                <button
                                  type="button"
                                  onClick={() => openReceiptLightbox(p)}
                                  className="group relative flex items-center gap-2 p-1.5 rounded-xl bg-black/40 hover:bg-black/70 border border-white/10 hover:border-amber-500/50 transition-all text-right cursor-pointer"
                                  title="انقر لتكبير الإيصال وعرضه بالحجم الكامل"
                                >
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-white/10 shrink-0">
                                    <img
                                      src={p.proofMediaUrl}
                                      alt="إيصال التحويل"
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                                      <span>عرض</span>
                                      <Eye className="w-3 h-3" />
                                    </div>
                                    <span className="text-[10px] text-slate-400">تكبير 🔍</span>
                                  </div>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-xs">لا يوجد إيصال</span>
                              )}
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                                  p.status === 'PaymentConfirmed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : p.status === 'PaymentSubmitted'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                                    : p.status === 'PaymentFailed' || p.status === 'Cancelled'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : 'bg-white/10 text-slate-400 border-white/10'
                                }`}
                              >
                                {p.status === 'PaymentConfirmed'
                                  ? 'مؤكدة ومقبولة'
                                  : p.status === 'PaymentSubmitted'
                                  ? 'قيد المراجعة'
                                  : p.status === 'PaymentFailed'
                                  ? 'مرفوضة'
                                  : p.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {p.status === 'PaymentSubmitted' || p.status === 'Pending' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleConfirmPayment(p.id)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-colors shadow-md"
                                  >
                                    تأكيد
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(p.id, 'payment')}
                                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition-colors"
                                  >
                                    رفض
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-500 text-xs font-bold">مكتمل</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PLANS ================= */}
        {activeTab === 'plans' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-slate-950/80 border border-white/10">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>باقات الترويج والإعلانات المعتمدة</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  حدد أسعار الباقات بالجنيه المصري ومدة صلاحيتها ومواضع الظهور في خلاصة الأخبار، القصص، وفيديوهات الريلز
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPlan({
                    name: '',
                    description: '',
                    price: 500,
                    currency: 'EGP',
                    durationDays: 7,
                    allowedAdTypes: 'Feed,Story,Reels',
                    isActive: true,
                    displayOrder: plans.length + 1,
                  });
                  setPlanModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة باقة جديدة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="group rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 border border-white/10 hover:border-amber-500/40 p-6 flex flex-col justify-between space-y-5 shadow-xl hover:shadow-2xl hover:shadow-amber-500/5 transition-all relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black border ${
                          plan.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {plan.isActive ? '● باقة نشطة' : '✕ معطلة'}
                      </span>
                      <span className="text-xs text-amber-400/80 font-black font-mono">
                        ترتيب #{plan.displayOrder}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1.5 min-h-[36px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price Tag */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center">
                      <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                        {plan.price.toLocaleString()}{' '}
                        <span className="text-xs font-bold text-amber-300/80">{plan.currency}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-bold">
                        صلاحية العرض: <span className="text-white">{plan.durationDays} أيام</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-2 text-xs border-t border-white/5 pt-3">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">مواضع الظهور:</span>
                        <span className="font-bold text-amber-300">{plan.allowedAdTypes}</span>
                      </div>
                      {plan.maxImpressions != null && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">الحد الأقصى للظهور:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {(plan.maxImpressions ?? 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanModalOpen(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleTogglePlan(plan.id)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-colors ${
                        plan.isActive
                          ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      {plan.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: ACCOUNTS ================= */}
        {activeTab === 'accounts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-slate-950/80 border border-white/10">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-400" />
                  <span>حسابات تحصيل المدفوعات المصرية (InstaPay & البنوك)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تظهر هذه الحسابات للمعلنين عند سداد رسوم الحملات الإعلانية لتحويل الأموال عبر تطبيق إنستاباي أو الحسابات البنكية المصرية
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setEditingAccount({
                      name: '',
                      accountType: 'InstaPay',
                      bankName: '',
                      accountHolderName: '',
                      accountNumber: '',
                      iban: '',
                      instaPayIdentifier: '',
                      instructions: 'يرجى كتابة رقم المرجع في خانة الملاحظات أثناء التحويل عبر تطبيق إنستاباي',
                      currency: 'EGP',
                      isActive: true,
                      isDefault: false,
                      displayOrder: accounts.length + 1,
                    });
                    setAccountModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>إضافة إنستاباي</span>
                </button>
                <button
                  onClick={() => {
                    setEditingAccount({
                      name: '',
                      accountType: 'BankAccount',
                      bankName: '',
                      accountHolderName: '',
                      accountNumber: '',
                      iban: '',
                      instaPayIdentifier: '',
                      instructions: 'يرجى إرسال التحويل البنكي ثم رفع صورة إشعار التحويل للمطابقة',
                      currency: 'EGP',
                      isActive: true,
                      isDefault: false,
                      displayOrder: accounts.length + 1,
                    });
                    setAccountModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all"
                >
                  <Landmark className="w-4 h-4 text-cyan-200" />
                  <span>إضافة حساب بنكي</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accounts.map((acc) => {
                const isInsta = acc.accountType === 'InstaPay';

                return (
                  <div
                    key={acc.id}
                    className={`rounded-3xl p-6 border shadow-2xl transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                      isInsta
                        ? 'bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950 border-purple-500/40 hover:border-purple-500/70 shadow-purple-500/5'
                        : 'bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-950 border-blue-500/40 hover:border-blue-500/70 shadow-blue-500/5'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Type & Default Badge */}
                      <div className="flex items-center justify-between">
                        {isInsta ? (
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>إنستاباي (InstaPay Egypt)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <Landmark className="w-3.5 h-3.5 text-cyan-300" />
                            <span>حساب بنكي (Bank Wire)</span>
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {acc.isDefault && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              افتراضي
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              acc.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {acc.isActive ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-base font-black text-white">{acc.name}</h4>

                      {/* InstaPay Details Box */}
                      {isInsta ? (
                        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/25 space-y-3">
                          <div>
                            <span className="text-[11px] text-purple-300 font-bold block mb-1">
                              معرف إنستاباي المعتمد (IPA):
                            </span>
                            <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-purple-500/20">
                              <span className="font-mono font-black text-amber-300 text-sm md:text-base tracking-wide select-all">
                                {acc.instaPayIdentifier || '-'}
                              </span>
                              {acc.instaPayIdentifier && (
                                <button
                                  onClick={() => copyText(acc.instaPayIdentifier, 'معرف إنستاباي')}
                                  title="نسخ المعرف"
                                  className="p-1 rounded-lg hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1 pt-1 border-t border-purple-500/15">
                            <div>
                              صاحب الحساب: <span className="font-bold text-white">{acc.accountHolderName}</span>
                            </div>
                            {acc.bankName && (
                              <div>
                                البنك المرتبط: <span className="text-slate-400">{acc.bankName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Bank Details Box */
                        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/25 space-y-2.5 text-xs">
                          <div className="flex justify-between items-center text-slate-200">
                            <span className="text-slate-400">البنك:</span>
                            <span className="font-black text-white">{acc.bankName || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-200">
                            <span className="text-slate-400">المستفيد:</span>
                            <span className="font-bold text-white">{acc.accountHolderName}</span>
                          </div>
                          {acc.accountNumber && (
                            <div className="flex justify-between items-center text-slate-200 pt-1 border-t border-blue-500/15">
                              <span className="text-slate-400">رقم الحساب:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-amber-300 select-all">
                                  {acc.accountNumber}
                                </span>
                                <button
                                  onClick={() => copyText(acc.accountNumber, 'رقم الحساب البنكي')}
                                  title="نسخ رقم الحساب"
                                  className="text-slate-400 hover:text-white"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                          {acc.iban && (
                            <div className="pt-1 border-t border-blue-500/15">
                              <span className="text-[11px] text-slate-400 block mb-1">رقم الآيبان (IBAN):</span>
                              <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-blue-500/20">
                                <span className="font-mono text-xs font-bold text-cyan-300 break-all select-all">
                                  {acc.iban}
                                </span>
                                <button
                                  onClick={() => copyText(acc.iban, 'رقم الآيبان IBAN')}
                                  title="نسخ رقم الآيبان"
                                  className="text-slate-400 hover:text-white shrink-0 mr-1"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {acc.instructions && (
                        <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
                          {acc.instructions}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      <button
                        onClick={() => {
                          setEditingAccount(acc);
                          setAccountModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleToggleAccount(acc.id)}
                        className={`py-2 px-4 rounded-xl text-xs font-bold transition-colors ${
                          acc.isActive
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {acc.isActive ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= MODAL: CAMPAIGN FULL DETAILS & PROOFS (PREMIUM EXPERIENCE) ================= */}
        {selectedCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border border-amber-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(245,158,11,0.08)] overflow-hidden text-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. STICKY GLASS HEADER */}
              <div className="px-5 sm:px-7 py-4 bg-slate-900/90 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-white">{selectedCampaign.title}</h3>
                      {/* Campaign Type Pill */}
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {selectedCampaign.campaignType === 'Feed' ? 'إعلان خلاصة (Feed)' :
                         selectedCampaign.campaignType === 'Story' ? 'إعلان ستوري (Story)' :
                         selectedCampaign.campaignType === 'Reels' ? 'إعلان ريلز (Reels)' :
                         selectedCampaign.campaignType === 'Banner' ? 'بانر رئيسي (Banner)' :
                         selectedCampaign.campaignType}
                      </span>
                      {/* Campaign Status Pill */}
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${
                        selectedCampaign.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : selectedCampaign.status === 'PendingReview'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : selectedCampaign.status === 'Paused'
                          ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                          : selectedCampaign.status === 'Completed'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : selectedCampaign.status === 'Cancelled'
                          ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          selectedCampaign.status === 'Active' ? 'bg-emerald-400' :
                          selectedCampaign.status === 'PendingReview' ? 'bg-amber-400 animate-ping' :
                          selectedCampaign.status === 'Paused' ? 'bg-yellow-400' :
                          selectedCampaign.status === 'Completed' ? 'bg-blue-400' :
                          selectedCampaign.status === 'Cancelled' ? 'bg-slate-400' : 'bg-rose-400'
                        }`} />
                        {selectedCampaign.status === 'Active' ? 'نشط وجاري العرض' :
                         selectedCampaign.status === 'PendingReview' ? 'قيد المراجعة والاعتماد' :
                         selectedCampaign.status === 'Paused' ? 'متوقف مؤقتاً' :
                         selectedCampaign.status === 'Completed' ? 'مكتمل المدة' :
                         selectedCampaign.status === 'Cancelled' ? 'تم الإلغاء' :
                         selectedCampaign.status === 'Rejected' ? 'مرفوض' : selectedCampaign.status}
                      </span>
                    </div>
                    {/* Campaign ID with copy button */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-slate-400 font-mono">ID: {selectedCampaign.id}</span>
                      <button
                        type="button"
                        onClick={() => copyText(selectedCampaign.id, 'campaign_id')}
                        className="text-slate-400 hover:text-amber-400 p-0.5 transition-colors"
                        title="نسخ المعرف"
                      >
                        {copiedField === 'campaign_id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5 hover:border-white/20"
                  title="إغلاق (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. SCROLLABLE BODY WITH CUSTOM SCROLLBAR */}
              <div
                className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-200"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(245, 158, 11, 0.3) rgba(15, 23, 42, 0.5)',
                }}
              >
                {/* Urgent Expiring Soon Alert */}
                {selectedCampaign.isExpiringSoon && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-amber-950/40 to-rose-950/40 border border-rose-500/40 flex items-start gap-3 shadow-lg shadow-rose-950/30 animate-pulse">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div className="font-black text-rose-300 text-sm">تنبيه: اقتراب انتهاء مدة الإعلان!</div>
                      <p className="text-rose-200/90 leading-relaxed">
                        متبقي أقل من 48 ساعة على انتهاء مدة ظهور هذا الإعلان للمستخدمين. تم إرسال إشعار تذكير تلقائي لحساب المعلن لإتاحة خيار التجديد.
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejection Note if Rejected */}
                {selectedCampaign.status === 'Rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-rose-300">تم رفض هذه الحملة الإعلانية</div>
                      <p className="text-rose-200 leading-relaxed font-mono bg-black/30 p-2.5 rounded-xl border border-rose-500/20">
                        {selectedCampaign.rejectedReason || 'لم يتم تحديد سبب الرفض'}
                      </p>
                      {selectedCampaign.rejectedAt && (
                        <span className="text-[10px] text-slate-400 block">
                          تاريخ الرفض: {new Date(selectedCampaign.rejectedAt).toLocaleString('ar-EG')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* HERO PERFORMANCE & DURATION METRICS TILES */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Reach / Impressions */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white/[0.03] to-transparent border border-amber-500/20 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                      <span>الظهور والانتشار</span>
                      <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                      {((selectedCampaign.reachCount ?? selectedCampaign.stats?.impressionsCount ?? selectedCampaign.stats?.impressions) ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      الوصول الفريد: {(selectedCampaign.stats?.reachCount ?? selectedCampaign.reachCount ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Clicks & CTR */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-transparent border border-emerald-500/20 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                      <span>النقرات والتفاعل</span>
                      <MousePointerClick className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">
                      {((selectedCampaign.stats?.clicksCount ?? selectedCampaign.stats?.clicks) ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      نسبة النقر (CTR): {
                        selectedCampaign.stats?.ctr !== undefined
                          ? selectedCampaign.stats.ctr + '%'
                          : ((selectedCampaign.reachCount ?? selectedCampaign.stats?.impressions ?? 0) > 0)
                            ? (((selectedCampaign.stats?.clicks ?? 0) / (selectedCampaign.reachCount ?? selectedCampaign.stats?.impressions ?? 1)) * 100).toFixed(1) + '%'
                            : '0.0%'
                      }
                    </span>
                  </div>

                  {/* Likes ❤️ */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-white/[0.03] to-transparent border border-rose-500/20 relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                      <span>الإعجابات (Likes)</span>
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-500/30" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-rose-300 tracking-tight">
                      {((selectedCampaign.stats?.likesCount ?? selectedCampaign.stats?.likes) ?? 0).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      إجمالي إعجابات الإعلان ❤️
                    </span>
                  </div>

                  {/* Remaining Time Countdown */}
                  <div className={`p-4 rounded-2xl border relative overflow-hidden group ${
                    selectedCampaign.isExpiringSoon
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-gradient-to-br from-blue-500/10 via-white/[0.03] to-transparent border-blue-500/20'
                  }`}>
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                      <span>الوقت المتبقي</span>
                      <Timer className={`w-4 h-4 ${selectedCampaign.isExpiringSoon ? 'text-rose-400 animate-spin' : 'text-blue-400'}`} />
                    </div>
                    <div className={`text-lg sm:text-xl font-black tracking-tight ${selectedCampaign.isExpiringSoon ? 'text-rose-300' : 'text-blue-300'}`}>
                      {selectedCampaign.remainingTimeText || (selectedCampaign.status === 'Completed' ? 'انتهت الحملة' : selectedCampaign.status === 'Active' ? 'جاري العرض' : '—')}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {selectedCampaign.remainingDays !== undefined ? `متبقي حوالي ${selectedCampaign.remainingDays} يوم` : 'حسب جدول الباقة'}
                    </span>
                  </div>

                  {/* Pricing & Plan */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white/[0.03] to-transparent border border-purple-500/20 relative overflow-hidden group col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
                      <span>الباقة والتكلفة</span>
                      <DollarSign className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-purple-300 tracking-tight font-mono">
                      {selectedCampaign.totalPrice?.toLocaleString()} {selectedCampaign.currency || 'EGP'}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block truncate">
                      {selectedCampaign.planName || 'باقة مخصصة'}
                    </span>
                  </div>
                </div>

                {/* 1. DEDICATED VIDEO ANALYTICS SECTION */}
                {(selectedCampaign.media?.some(m => m.mediaType === 'Video') ||
                  (selectedCampaign.stats?.videoStartsCount ?? 0) > 0 ||
                  (selectedCampaign.stats?.videoStarts ?? 0) > 0 ||
                  selectedCampaign.campaignType === 'Video' ||
                  selectedCampaign.campaignType === 'Reels') && (() => {
                  const vStarts = selectedCampaign.stats?.videoStartsCount ?? selectedCampaign.stats?.videoStarts ?? 0;
                  const vCompletes = selectedCampaign.stats?.videoCompletesCount ?? selectedCampaign.stats?.videoCompletes ?? 0;
                  const compRate = selectedCampaign.stats?.videoCompletionRate ?? (vStarts > 0 ? Math.round((vCompletes / vStarts) * 100) : 0);
                  return (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-purple-950/20 border border-amber-500/30 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                            <Film className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>إحصائيات إعلانات ومقاطع الفيديو (Video Analytics)</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                فيديو تفاعلي
                              </span>
                            </h4>
                            <p className="text-xs text-slate-400">عدد مرات فتح وتشغيل الفيديو ومعدل الإكمال من قبل المستخدمين</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] text-slate-400 block">معدل الإكمال</span>
                          <span className="text-base font-black text-emerald-400 font-mono">{compRate}%</span>
                        </div>
                      </div>

                      {/* Video 3 metrics tiles */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                            <PlayCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">مرات فتح/بدء الفيديو:</span>
                            <div className="text-lg font-black text-amber-300 font-mono">{vStarts.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">مرات إكمال المشاهدة:</span>
                            <div className="text-lg font-black text-emerald-300 font-mono">{vCompletes.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400 shrink-0">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">نسبة الإكمال الفعلي:</span>
                            <div className="text-lg font-black text-purple-300 font-mono">{compRate}%</div>
                          </div>
                        </div>
                      </div>

                      {/* Video completion progress bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>نسبة المشاهدات المكتملة</span>
                          <span className="font-mono text-emerald-300">{vCompletes} من {vStarts} مشاهدة</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, compRate))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. DEDICATED PLACEMENTS BREAKDOWN SECTION */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>إحصائيات التوزيع والمواضع (Placements Breakdown)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            ريلز • حالات • منشورات
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">تفاصيل دقيقة لكل موضع يظهر فيه الإعلان داخل تطبيق الهاتف</p>
                      </div>
                    </div>
                  </div>

                  {/* Actionable CTA Clicks Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                      <span className="text-[11px] text-emerald-300 font-bold flex items-center justify-center gap-1">
                        <span>💬</span> واتساب
                      </span>
                      <span className="text-lg font-black text-white font-mono block">
                        {(selectedCampaign.stats?.whatsAppClicksCount ?? selectedCampaign.stats?.whatsAppClicks ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block">نقرة مباشرة</span>
                    </div>

                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center space-y-1">
                      <span className="text-[11px] text-sky-300 font-bold flex items-center justify-center gap-1">
                        <span>📞</span> اتصال هاتفي
                      </span>
                      <span className="text-lg font-black text-white font-mono block">
                        {(selectedCampaign.stats?.callClicksCount ?? selectedCampaign.stats?.callClicks ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block">طلب مكالمة</span>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center space-y-1">
                      <span className="text-[11px] text-purple-300 font-bold flex items-center justify-center gap-1">
                        <span>✉️</span> شات التطبيق
                      </span>
                      <span className="text-lg font-black text-white font-mono block">
                        {(selectedCampaign.stats?.chatClicksCount ?? selectedCampaign.stats?.chatClicks ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block">محادثة معلن</span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                      <span className="text-[11px] text-amber-300 font-bold flex items-center justify-center gap-1">
                        <span>🌐</span> رابط / متجر
                      </span>
                      <span className="text-lg font-black text-white font-mono block">
                        {(selectedCampaign.stats?.websiteClicksCount ?? selectedCampaign.stats?.websiteClicks ?? 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block">زيارة موقع</span>
                    </div>
                  </div>

                  {/* 3 Placement Cards (Feed / Post, Stories / Status, Reels) */}
                  {(() => {
                    const totalImpr = (selectedCampaign.reachCount ?? selectedCampaign.stats?.impressionsCount ?? selectedCampaign.stats?.impressions ?? 0);
                    const placements = selectedCampaign.stats?.placements && selectedCampaign.stats.placements.length > 0
                      ? selectedCampaign.stats.placements
                      : [
                          {
                            placement: 'Feed',
                            placementNameAr: 'منشورات الخلاصة (Feed / Post)',
                            impressions: selectedCampaign.campaignType === 'Feed' ? totalImpr : Math.round(totalImpr * 0.5),
                            clicks: selectedCampaign.stats?.clicksCount ?? selectedCampaign.stats?.clicks ?? 0,
                            likes: selectedCampaign.stats?.likesCount ?? selectedCampaign.stats?.likes ?? 0,
                            videoStarts: (selectedCampaign.campaignType === 'Feed' || selectedCampaign.campaignType === 'Video') ? (selectedCampaign.stats?.videoStartsCount ?? selectedCampaign.stats?.videoStarts ?? 0) : 0,
                            videoCompletes: (selectedCampaign.campaignType === 'Feed' || selectedCampaign.campaignType === 'Video') ? (selectedCampaign.stats?.videoCompletesCount ?? selectedCampaign.stats?.videoCompletes ?? 0) : 0,
                            reach: selectedCampaign.reachCount ?? Math.round(totalImpr * 0.9),
                            ctr: selectedCampaign.stats?.ctr ?? 0
                          },
                          {
                            placement: 'Stories',
                            placementNameAr: 'القصص والحالات (Stories)',
                            impressions: selectedCampaign.campaignType === 'Story' ? totalImpr : Math.round(totalImpr * 0.3),
                            clicks: selectedCampaign.campaignType === 'Story' ? (selectedCampaign.stats?.clicksCount ?? 0) : Math.round((selectedCampaign.stats?.clicksCount ?? 0) * 0.3),
                            likes: selectedCampaign.campaignType === 'Story' ? (selectedCampaign.stats?.likesCount ?? 0) : Math.round((selectedCampaign.stats?.likesCount ?? 0) * 0.3),
                            videoStarts: selectedCampaign.campaignType === 'Story' ? (selectedCampaign.stats?.videoStartsCount ?? 0) : 0,
                            videoCompletes: selectedCampaign.campaignType === 'Story' ? (selectedCampaign.stats?.videoCompletesCount ?? 0) : 0,
                            reach: Math.round(totalImpr * 0.28),
                            ctr: selectedCampaign.stats?.ctr ?? 0
                          },
                          {
                            placement: 'Reels',
                            placementNameAr: 'مقاطع ريلز (Reels)',
                            impressions: selectedCampaign.campaignType === 'Reels' ? totalImpr : Math.round(totalImpr * 0.2),
                            clicks: selectedCampaign.campaignType === 'Reels' ? (selectedCampaign.stats?.clicksCount ?? 0) : Math.round((selectedCampaign.stats?.clicksCount ?? 0) * 0.2),
                            likes: selectedCampaign.campaignType === 'Reels' ? (selectedCampaign.stats?.likesCount ?? 0) : Math.round((selectedCampaign.stats?.likesCount ?? 0) * 0.2),
                            videoStarts: (selectedCampaign.campaignType === 'Reels') ? (selectedCampaign.stats?.videoStartsCount ?? selectedCampaign.stats?.videoStarts ?? 0) : 0,
                            videoCompletes: (selectedCampaign.campaignType === 'Reels') ? (selectedCampaign.stats?.videoCompletesCount ?? selectedCampaign.stats?.videoCompletes ?? 0) : 0,
                            reach: Math.round(totalImpr * 0.19),
                            ctr: selectedCampaign.stats?.ctr ?? 0
                          }
                        ];

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {placements.map((p) => {
                          const isFeed = p.placement.toLowerCase().includes('feed') || p.placement.toLowerCase().includes('post');
                          const isStory = p.placement.toLowerCase().includes('stor');
                          const isReels = p.placement.toLowerCase().includes('reel');

                          const icon = isFeed ? (
                            <Smartphone className="w-5 h-5 text-blue-400" />
                          ) : isStory ? (
                            <Zap className="w-5 h-5 text-amber-400" />
                          ) : (
                            <Video className="w-5 h-5 text-rose-400" />
                          );

                          const borderCls = isFeed
                            ? 'border-blue-500/20 hover:border-blue-500/40 bg-blue-950/10'
                            : isStory
                            ? 'border-amber-500/20 hover:border-amber-500/40 bg-amber-950/10'
                            : 'border-rose-500/20 hover:border-rose-500/40 bg-rose-950/10';

                          const sharePercent = totalImpr > 0 ? Math.round((p.impressions / totalImpr) * 100) : 0;

                          return (
                            <div key={p.placement} className={`p-4 rounded-xl border ${borderCls} transition-all space-y-3`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-white/5">{icon}</div>
                                  <span className="font-bold text-xs text-white">{p.placementNameAr}</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 font-mono text-slate-300">
                                  {sharePercent}% من الظهور
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block text-[10px]">مرات الظهور:</span>
                                  <span className="font-bold text-slate-200 font-mono">{p.impressions.toLocaleString()}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block text-[10px]">النقرات:</span>
                                  <span className="font-bold text-emerald-400 font-mono">{p.clicks.toLocaleString()}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block text-[10px]">الإعجابات ❤️:</span>
                                  <span className="font-bold text-rose-400 font-mono">{p.likes.toLocaleString()}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block text-[10px]">الوصول الفريد:</span>
                                  <span className="font-bold text-cyan-400 font-mono">{p.reach.toLocaleString()}</span>
                                </div>
                                {p.videoStarts > 0 && (
                                  <div className="space-y-0.5 col-span-2 pt-1 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-slate-400 text-[10px]">فتح الفيديو 🎥:</span>
                                    <span className="font-bold text-amber-300 font-mono">{p.videoStarts.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* CAMPAIGN TIMELINE DATES */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ البداية:</span>
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>{selectedCampaign.startDate ? new Date(selectedCampaign.startDate).toLocaleDateString('ar-EG') : '—'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ النهاية:</span>
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      <span>{selectedCampaign.endDate ? new Date(selectedCampaign.endDate).toLocaleDateString('ar-EG') : '—'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ الإنشاء:</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {selectedCampaign.createdAt ? new Date(selectedCampaign.createdAt).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ الموافقة:</span>
                    <span className="font-mono text-slate-300 text-[11px]">
                      {selectedCampaign.approvedAt ? new Date(selectedCampaign.approvedAt).toLocaleDateString('ar-EG') : 'لم يتم الاعتماد بعد'}
                    </span>
                  </div>
                </div>

                {/* SECTION: ADVERTISER DETAILS */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/80 border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-white">بيانات صاحب الإعلان (المعلن)</h4>
                    </div>
                    <span className="text-[10px] text-slate-400">معلومات التواصل والحساب</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {/* Name */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 block">اسم المعلن:</span>
                      <div className="font-bold text-white text-sm">
                        {selectedCampaign.advertiserName || 'معلن مسجل'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <span>المعرف: {selectedCampaign.advertiserUserId?.substring(0, 10)}...</span>
                        <button
                          type="button"
                          onClick={() => copyText(selectedCampaign.advertiserUserId, 'adv_user_id')}
                          className="hover:text-amber-400"
                          title="نسخ معرف المستخدم"
                        >
                          {copiedField === 'adv_user_id' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 block">البريد الإلكتروني:</span>
                      {selectedCampaign.advertiserEmail ? (
                        <div className="flex items-center justify-between gap-1">
                          <a
                            href={`mailto:${selectedCampaign.advertiserEmail}`}
                            className="font-mono text-cyan-400 hover:underline truncate text-xs"
                            title={selectedCampaign.advertiserEmail}
                          >
                            {selectedCampaign.advertiserEmail}
                          </a>
                          <button
                            type="button"
                            onClick={() => copyText(selectedCampaign.advertiserEmail!, 'adv_email')}
                            className="text-slate-400 hover:text-amber-400 p-1"
                            title="نسخ البريد"
                          >
                            {copiedField === 'adv_email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">غير متوفر</span>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 block">رقم الهاتف:</span>
                      {selectedCampaign.advertiserPhoneNumber ? (
                        <div className="flex items-center justify-between gap-1">
                          <a
                            href={`tel:${selectedCampaign.advertiserPhoneNumber}`}
                            className="font-mono text-emerald-400 hover:underline text-xs font-bold"
                            dir="ltr"
                          >
                            {selectedCampaign.advertiserPhoneNumber}
                          </a>
                          <button
                            type="button"
                            onClick={() => copyText(selectedCampaign.advertiserPhoneNumber!, 'adv_phone')}
                            className="text-slate-400 hover:text-amber-400 p-1"
                            title="نسخ رقم الهاتف"
                          >
                            {copiedField === 'adv_phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">غير متوفر</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION: CREATIVE MEDIA (الوسائط الإعلانية) */}
                {selectedCampaign.media && selectedCampaign.media.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-white">الوسائط الإعلانية والتصاميم</h4>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-amber-300">
                        {selectedCampaign.media.length} وسائط مرفوعة
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedCampaign.media.map((m, idx) => (
                        <div
                          key={m.id || idx}
                          className="rounded-2xl overflow-hidden border border-white/15 bg-black/60 group relative flex flex-col hover:border-amber-400/50 transition-all shadow-md"
                        >
                          {m.mediaType?.toLowerCase().includes('video') ? (
                            <div className="relative aspect-video bg-black flex items-center justify-center">
                              <video src={m.mediaUrl} controls className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div
                              onClick={() => openMediaLightbox(m.mediaUrl, `${selectedCampaign.title} - تصميم ${idx + 1}`)}
                              className="relative aspect-video bg-black/80 flex items-center justify-center cursor-pointer overflow-hidden"
                              title="انقر لتكبير الصورة في شاشة كاملة"
                            >
                              <img
                                src={m.mediaUrl}
                                alt={`تصميم إعلاني ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity text-white text-xs font-bold">
                                <ZoomIn className="w-6 h-6 text-amber-400 animate-pulse" />
                                <span>تكبير ملء الشاشة</span>
                              </div>
                            </div>
                          )}

                          <div className="p-2.5 bg-slate-900/80 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-white uppercase">{m.mediaType}</span>
                            <span className="font-mono">ترتيب العرض: {m.displayOrder ?? (idx + 1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION: AD COPY & DESTINATION CTA */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-black text-white">نص الإعلان ورابط الوجهة (CTA)</h4>
                  </div>

                  {/* Description */}
                  {selectedCampaign.description && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">نص الحملة الترويجي (Ad Copy):</label>
                      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-slate-200 leading-relaxed font-sans select-text">
                        {selectedCampaign.description}
                      </div>
                    </div>
                  )}

                  {/* Destination URL & CTA Button */}
                  {(selectedCampaign.destinationUrl || selectedCampaign.ctaValue || selectedCampaign.ctaType) && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-300">زر الإجراء المباشر (CTA):</label>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            selectedCampaign.ctaType?.toLowerCase().includes('whatsapp')
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : selectedCampaign.ctaType?.toLowerCase().includes('call')
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : selectedCampaign.ctaType?.toLowerCase().includes('chat')
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}>
                            {selectedCampaign.ctaType?.toLowerCase().includes('whatsapp') && '💬 واتساب'}
                            {selectedCampaign.ctaType?.toLowerCase().includes('call') && '📞 اتصال هاتفي'}
                            {selectedCampaign.ctaType?.toLowerCase().includes('chat') && '✉️ مراسلة شات'}
                            {!selectedCampaign.ctaType?.toLowerCase().includes('whatsapp') &&
                             !selectedCampaign.ctaType?.toLowerCase().includes('call') &&
                             !selectedCampaign.ctaType?.toLowerCase().includes('chat') && '🌐 رابط / متجر'}
                            <span>({selectedCampaign.ctaLabel || selectedCampaign.ctaType || 'المزيد'})</span>
                          </span>
                        </div>
                        {selectedCampaign.ctaAction && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            نوع التفاعل: {selectedCampaign.ctaAction}
                          </span>
                        )}
                      </div>

                      {/* CTA Target / URL Box */}
                      {(selectedCampaign.ctaValue || selectedCampaign.destinationUrl) && (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <div className="flex items-center gap-2 truncate text-xs font-mono text-cyan-300">
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                            <span className="truncate select-all" title={selectedCampaign.ctaValue || selectedCampaign.destinationUrl}>
                              {selectedCampaign.ctaValue || selectedCampaign.destinationUrl}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyText((selectedCampaign.ctaValue || selectedCampaign.destinationUrl)!, 'dest_url')}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1 shrink-0 transition-colors"
                          >
                            {copiedField === 'dest_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>نسخ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* SECTION: AUDIENCE & TARGETING */}
                {selectedCampaign.targeting && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black text-white">الاستهداف الجغرافي والديمغرافي</h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-slate-400 block mb-1">المحافظة:</span>
                        <span className="font-bold text-white text-xs">{selectedCampaign.targeting.governorate || 'كافة المحافظات'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-slate-400 block mb-1">المدينة / المنطقة:</span>
                        <span className="font-bold text-white text-xs">{selectedCampaign.targeting.city || 'الكل'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-slate-400 block mb-1">النوع / الجنس:</span>
                        <span className="font-bold text-white text-xs">
                          {selectedCampaign.targeting.gender === 'Male' ? 'رجال فقط' : selectedCampaign.targeting.gender === 'Female' ? 'نساء فقط' : 'الجميع (رجال ونساء)'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] text-slate-400 block mb-1">الفئة العمرية:</span>
                        <span className="font-bold text-white text-xs">
                          {selectedCampaign.targeting.minAge || 18} - {selectedCampaign.targeting.maxAge || 65}+ سنة
                        </span>
                      </div>
                    </div>

                    {selectedCampaign.targeting.interests && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 block">الاهتمامات المستهدفة:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCampaign.targeting.interests.split(',').map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= SECTION: FINANCIAL RECORDS & PAYMENT TRANSFER PROOFS ================= */}
                {/* THIS IS THE CORE REQUIREMENT OF THE USER: 'و الصورة بتاعت الدفع اشوفها وعايز تصميم وتنسيق مميز وخرافي' */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900/70 to-slate-950 border-2 border-amber-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-300">سجلات الدفع وإيصالات التحويل البنكي / إنستاباي</h4>
                        <p className="text-[10px] text-slate-400">فحص وتدقيق إيصال التحويل والصور المرفقة مع إمكانية التكبير والتصديق</p>
                      </div>
                    </div>

                    {selectedCampaign.payments && selectedCampaign.payments.length > 0 && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {selectedCampaign.payments.length} معاملة دفع
                      </span>
                    )}
                  </div>

                  {selectedCampaign.payments && selectedCampaign.payments.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCampaign.payments.map((p) => {
                        const proofsList = (p.transferProofs && p.transferProofs.length > 0)
                          ? p.transferProofs
                          : p.proofMediaUrl
                          ? [{
                              id: p.id,
                              paymentId: p.id,
                              proofMediaUrl: p.proofMediaUrl,
                              senderName: p.proofSenderName || 'غير مسجل',
                              amount: p.proofAmount || p.amount,
                              referenceNumber: p.proofReferenceNumber || p.transactionReference,
                              transferDate: p.proofTransferDate || p.createdAt,
                              status: p.status,
                              submittedAt: p.createdAt,
                            }]
                          : [];

                        return (
                          <div
                            key={p.id}
                            className="rounded-2xl bg-black/40 border border-white/10 p-4 sm:p-5 space-y-4 shadow-inner"
                          >
                            {/* Payment Header */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
                              <div className="flex items-center gap-2">
                                {p.paymentMethod === 'InstaPay' ? (
                                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 text-xs font-bold">
                                    <Zap className="w-4 h-4" />
                                    إنستاباي (InstaPay)
                                  </div>
                                ) : p.paymentMethod === 'BankAccount' ? (
                                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 text-xs font-bold">
                                    <Landmark className="w-4 h-4" />
                                    تحويل بنكي
                                  </div>
                                ) : (
                                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold">
                                    <CreditCard className="w-4 h-4" />
                                    {p.paymentMethod}
                                  </div>
                                )}

                                <span className="font-mono text-xs text-slate-400">
                                  مرجع: {p.transactionReference || p.id.substring(0, 8)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyText(p.transactionReference || p.id, `pay_ref_${p.id}`)}
                                  className="text-slate-400 hover:text-amber-400 p-0.5"
                                  title="نسخ رقم المرجع"
                                >
                                  {copiedField === `pay_ref_${p.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">المبلغ الإجمالي:</span>
                                  <span className="text-base font-black text-amber-300 font-mono">
                                    {p.amount.toLocaleString()} {p.currency}
                                  </span>
                                </div>

                                {/* Status Badge */}
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  p.status === 'Confirmed'
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : p.status === 'PendingReview'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                }`}>
                                  {p.status === 'Confirmed' ? 'مؤكد ومسجل' :
                                   p.status === 'PendingReview' ? 'قيد المراجعة' :
                                   p.status === 'Failed' ? 'فاشل / مرفوض' : p.status}
                                </span>
                              </div>
                            </div>

                            {/* Transfer Proof Images Display */}
                            {proofsList.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                    <Receipt className="w-4 h-4 text-amber-400" />
                                    صورة إيصال التحويل المرفقة:
                                  </span>
                                  <span className="text-[11px] text-slate-400">انقر على الإيصال للمعاينة والتكبير والتصديق</span>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {proofsList.map((proof, pIdx) => (
                                    <div
                                      key={proof.id || pIdx}
                                      className="rounded-2xl bg-black/60 border border-amber-500/25 p-4 space-y-3 relative group"
                                    >
                                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                                        {/* Proof Image Box (md:col-span-5) */}
                                        <div
                                          onClick={() => {
                                            if (proof.proofMediaUrl) {
                                              openReceiptLightbox({
                                                ...p,
                                                proofMediaUrl: proof.proofMediaUrl,
                                                proofSenderName: proof.senderName,
                                                proofAmount: proof.amount,
                                                proofReferenceNumber: proof.referenceNumber,
                                                proofTransferDate: proof.transferDate,
                                              });
                                            }
                                          }}
                                          className="md:col-span-5 relative rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-black/90 group cursor-pointer aspect-video flex items-center justify-center hover:border-amber-400 transition-all shadow-xl shadow-amber-950/20"
                                        >
                                          {proof.proofMediaUrl ? (
                                            <>
                                              <img
                                                src={proof.proofMediaUrl}
                                                alt="صورة إيصال التحويل"
                                                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                                              />
                                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity text-white text-xs font-bold backdrop-blur-[2px]">
                                                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                                                  <ZoomIn className="w-5 h-5 animate-pulse" />
                                                </div>
                                                <span className="text-amber-300">معاينة مكبرة (Zoom & Rotate)</span>
                                              </div>
                                            </>
                                          ) : (
                                            <span className="text-xs text-slate-500">لا توجد صورة للإيصال</span>
                                          )}
                                          <span className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 border border-amber-500/30 text-[10px] text-amber-300 font-bold backdrop-blur-sm shadow">
                                            إيصال تحويل بنكي / إنستاباي
                                          </span>
                                        </div>

                                        {/* Proof Details (md:col-span-7) */}
                                        <div className="md:col-span-7 space-y-2.5 text-xs">
                                          <div className="grid grid-cols-2 gap-2.5">
                                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                              <span className="text-[10px] text-slate-400 block mb-0.5">اسم صاحب التحويل:</span>
                                              <span className="font-bold text-white text-xs sm:text-sm">{proof.senderName || '—'}</span>
                                            </div>
                                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                              <span className="text-[10px] text-slate-400 block mb-0.5">المبلغ المحوّل بالإيصال:</span>
                                              <span className="font-bold text-amber-300 text-xs sm:text-sm font-mono">
                                                {proof.amount?.toLocaleString()} {p.currency}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2.5">
                                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                              <span className="text-[10px] text-slate-400 block mb-0.5">رقم المعاملة / المرجع:</span>
                                              <span className="font-mono text-xs text-cyan-300 break-all select-all font-semibold">
                                                {proof.referenceNumber || '—'}
                                              </span>
                                            </div>
                                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                              <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ التحويل:</span>
                                              <span className="font-mono text-[11px] text-slate-300">
                                                {proof.transferDate ? new Date(proof.transferDate).toLocaleString('ar-EG') : '—'}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Action Buttons for Lightbox / Direct Tab */}
                                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                                            {proof.proofMediaUrl && (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    openReceiptLightbox({
                                                      ...p,
                                                      proofMediaUrl: proof.proofMediaUrl,
                                                      proofSenderName: proof.senderName,
                                                      proofAmount: proof.amount,
                                                      proofReferenceNumber: proof.referenceNumber,
                                                      proofTransferDate: proof.transferDate,
                                                    })
                                                  }
                                                  className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-500/30 shadow"
                                                >
                                                  <Maximize2 className="w-3.5 h-3.5" />
                                                  تكبير الإيصال وفحصه
                                                </button>
                                                <a
                                                  href={proof.proofMediaUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                                                >
                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                  فتح الصورة الأصلية
                                                </a>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                <span>تم الدفع إلكترونياً عبر البوابة أو لم يتم إرفاق إيصال تحويل يدوي لهذه المعاملة.</span>
                              </div>
                            )}

                            {/* Payment review actions if PendingReview */}
                            {p.status === 'PendingReview' && (
                              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                                <span className="text-xs text-amber-400 font-semibold ml-auto flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  إجراء التدقيق المالي المطلوب:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPayment(p.id)}
                                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  تأكيد واستلام المبلغ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openRejectModal(p.id, 'payment')}
                                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition-colors border border-rose-500/30 flex items-center gap-1.5"
                                >
                                  <XCircle className="w-4 h-4" />
                                  رفض الإيصال
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-slate-400 space-y-1">
                      <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-300">لا توجد سجلات دفع مسجلة لهذه الحملة الإعلانية حتى الآن.</p>
                      <p className="text-[11px] text-slate-500">سيظهر هنا إيصال التحويل البنكي أو إنستاباي بمجرد رفعه من قِبل المستخدم.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. STICKY BOTTOM ACTION FOOTER */}
              <div className="px-5 sm:px-7 py-4 bg-slate-900/90 border-t border-white/10 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 flex-wrap z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => openEditCampaignModal(selectedCampaign)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-1.5 border border-blue-500/30"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    تعديل الحملة
                  </button>

                  {selectedCampaign.status !== 'Cancelled' && selectedCampaign.status !== 'Completed' && (
                    <button
                      onClick={() => openCancelCampaignModal(selectedCampaign.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 border border-amber-500/20"
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                      إلغاء الإعلان
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف نهائي
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    إغلاق
                  </button>

                  {selectedCampaign.status === 'PendingReview' && (
                    <>
                      <button
                        onClick={() => handleApproveCampaign(selectedCampaign.id)}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        موافقة وتفعيل الحملة
                      </button>
                      <button
                        onClick={() => openRejectModal(selectedCampaign.id, 'campaign')}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors border border-rose-500/30 flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        رفض الحملة
                      </button>
                    </>
                  )}

                  {selectedCampaign.status === 'Active' && (
                    <button
                      onClick={() => handlePauseCampaign(selectedCampaign.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors border border-amber-500/30 flex items-center gap-1.5"
                    >
                      <PauseCircle className="w-4 h-4" />
                      إيقاف مؤقت
                    </button>
                  )}

                  {selectedCampaign.status === 'Paused' && (
                    <button
                      onClick={() => handleResumeCampaign(selectedCampaign.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors border border-emerald-500/30 flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-4 h-4" />
                      استئناف الحملة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: EDIT CAMPAIGN ================= */}
        {editCampaignModalOpen && editingCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <form
              onSubmit={handleSaveCampaign}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-4 text-right"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setEditCampaignModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">تعديل بيانات الحملة الإعلانية</h3>
                  <Edit3 className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">عنوان الحملة:</label>
                  <input
                    type="text"
                    required
                    value={editingCampaign.title}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">الوصف:</label>
                  <textarea
                    rows={3}
                    value={editingCampaign.description}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">رابط الوجهة (Destination URL):</label>
                  <input
                    type="url"
                    value={editingCampaign.destinationUrl}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, destinationUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">نص زر الإجراء (CTA):</label>
                    <select
                      value={editingCampaign.ctaType}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, ctaType: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="WhatsApp">💬 تواصل عبر واتساب (WhatsApp Direct)</option>
                      <option value="CallNow">📞 اتصال هاتفي مباشر (Direct Phone Call)</option>
                      <option value="SendChatMessage">✉️ مراسلة شات داخل التطبيق (In-App Chat)</option>
                      <option value="VisitWebsite">🌐 زيارة الموقع أو المتجر (Visit Website)</option>
                      <option value="LearnMore">معرفة المزيد (Learn More)</option>
                      <option value="ShopNow">تسوق الآن (Shop Now)</option>
                      <option value="ContactUs">تواصل معنا (Contact Us)</option>
                      <option value="BookNow">احجز الآن (Book Now)</option>
                      <option value="SignToday">سجل الآن (Sign Up)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">حالة الحملة:</label>
                    <select
                      value={editingCampaign.status}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="Active">نشطة (Active)</option>
                      <option value="Paused">متوقفة مؤقتاً (Paused)</option>
                      <option value="PendingReview">بانتظار المراجعة (PendingReview)</option>
                      <option value="Scheduled">مجدولة (Scheduled)</option>
                      <option value="Completed">مكتملة (Completed)</option>
                      <option value="Cancelled">ملغاة (Cancelled)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">تاريخ ووقت البداية:</label>
                    <input
                      type="datetime-local"
                      value={editingCampaign.startDate}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">تاريخ ووقت النهاية:</label>
                    <input
                      type="datetime-local"
                      value={editingCampaign.endDate}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-md shadow-amber-500/20"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= MODAL: CANCEL CAMPAIGN ================= */}
        {cancelCampaignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  onClick={() => setCancelCampaignModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">إلغاء الحملة الإعلانية</h3>
                  <XOctagon className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت متأكد من إلغاء هذا الإعلان؟ سيتم إيقاف ظهوره فوراً في التطبيق وتغيير حالته إلى &quot;ملغاة&quot;.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">سبب الإلغاء (اختياري):</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="مثال: بناء على طلب المعلن، أو تعذر استيفاء شروط النشر..."
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setCancelCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  تراجع
                </button>
                <button
                  onClick={handleConfirmCancelCampaign}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
                >
                  تأكيد الإلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: REJECT REASON ================= */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-right">
              <h3 className="text-base font-bold text-white">
                {rejectionType === 'campaign' ? 'سبب رفض الحملة الإعلانية' : 'سبب رفض عملية الدفع'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يرجى توضيح سبب الرفض ليتم إرساله للمعلن في الإشعار أو تفاصيل الحملة.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="مثال: المحتوى يخالف سياسات النشر، أو صورة إيصال التحويل غير واضحة أو المبلغ غير مطابق..."
                className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmRejection}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                >
                  تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL: EDIT/CREATE PLAN ================= */}
        {planModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <form
              onSubmit={handleSavePlan}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 text-right"
            >
              <h3 className="text-base font-bold text-white">
                {editingPlan.id ? 'تعديل الباقة الإعلانية' : 'إضافة باقة إعلانية جديدة'}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">اسم الباقة:</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">الوصف:</label>
                  <textarea
                    rows={2}
                    value={editingPlan.description || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">السعر:</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingPlan.price || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">المدة بالأيام:</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingPlan.durationDays || 7}
                      onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">الحد الأقصى للظهور:</label>
                    <input
                      type="number"
                      value={editingPlan.maxImpressions || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, maxImpressions: Number(e.target.value) || undefined })}
                      placeholder="اختياري"
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">أقصى مدة فيديو (ثوان):</label>
                    <input
                      type="number"
                      value={editingPlan.maxVideoDurationSeconds || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, maxVideoDurationSeconds: Number(e.target.value) || undefined })}
                      placeholder="60"
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">الأنواع المدعومة (مفصولة بفاصلة):</label>
                  <input
                    type="text"
                    value={editingPlan.allowedAdTypes || 'Feed,Story,Reels'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, allowedAdTypes: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
                >
                  حفظ الباقة
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= MODAL: EDIT/CREATE RECEIVING ACCOUNT ================= */}
        {accountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <form
              onSubmit={handleSaveAccount}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 text-right max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-bold text-white">
                  {editingAccount.id ? 'تعديل حساب الاستقبال' : 'إضافة حساب استقبال جديد'}
                </h3>
              </div>

              {/* Account Type Selector (InstaPay vs Bank Account) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">نوع حساب التحويل:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccount({
                        ...editingAccount,
                        accountType: 'InstaPay',
                        instructions: 'يرجى كتابة رقم المرجع في خانة الملاحظات أثناء التحويل عبر تطبيق إنستاباي',
                      });
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      editingAccount.accountType === 'InstaPay'
                        ? 'bg-purple-500/20 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Zap className={`w-5 h-5 ${editingAccount.accountType === 'InstaPay' ? 'text-purple-400' : ''}`} />
                    <span className="font-bold text-xs">إنستاباي (InstaPay)</span>
                    <span className="text-[10px] text-slate-400">تحويل فوري بالمعرف</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccount({
                        ...editingAccount,
                        accountType: 'BankAccount',
                        instructions: 'يرجى إجراء التحويل البنكي ثم رفع صورة إشعار التحويل للمطابقة',
                      });
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      editingAccount.accountType === 'BankAccount'
                        ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Landmark className={`w-5 h-5 ${editingAccount.accountType === 'BankAccount' ? 'text-blue-400' : ''}`} />
                    <span className="font-bold text-xs">حساب بنكي (Bank Transfer)</span>
                    <span className="text-[10px] text-slate-400">برقم الحساب و IBAN</span>
                  </button>
                </div>
              </div>

              {/* Common Field: Name */}
              <div className="space-y-1 text-xs">
                <label className="block font-bold text-slate-300">اسم الحساب التوضيحي (للإدارة):</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  placeholder={
                    editingAccount.accountType === 'InstaPay'
                      ? 'مثال: حساب إنستاباي الرئيسي للمبيعات'
                      : 'مثال: حساب البنك الأهلي المصري للشركات'
                  }
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                />
              </div>

              {/* ================= CONDITIONAL: INSTAPAY ================= */}
              {editingAccount.accountType === 'InstaPay' && (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3 text-xs">
                  <div className="font-bold text-purple-300 flex items-center gap-1.5 pb-1 border-b border-purple-500/20">
                    <Zap className="w-4 h-4 text-purple-400" />
                    بيانات حساب إنستاباي (المطلوبة):
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      معرف إنستاباي (IPA / Username أو رقم الهاتف) <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAccount.instaPayIdentifier || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, instaPayIdentifier: e.target.value })}
                      placeholder="todayinegypt@instapay أو 010xxxxxxxx"
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-purple-500/40 text-amber-300 text-xs font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      هذا المعرف سيظهر للمستخدم لتحويل المبلغ إليه في تطبيق إنستاباي.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      اسم صاحب الحساب في إنستاباي <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAccount.accountHolderName || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, accountHolderName: e.target.value })}
                      placeholder="مثال: شركة النهار ده في مصر"
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">اسم البنك التابع له الحساب (اختياري):</label>
                    <input
                      type="text"
                      value={editingAccount.bankName || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                      placeholder="مثال: البنك الأهلي المصري / بنك مصر"
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ================= CONDITIONAL: BANK ACCOUNT ================= */}
              {editingAccount.accountType === 'BankAccount' && (
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3 text-xs">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5 pb-1 border-b border-blue-500/20">
                    <Landmark className="w-4 h-4 text-blue-400" />
                    بيانات التحويل البنكي (المطلوبة):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        اسم البنك <span className="text-rose-400">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAccount.bankName || ''}
                        onChange={(e) => setEditingAccount({ ...editingAccount, bankName: e.target.value })}
                        placeholder="مثال: البنك التجاري الدولي (CIB)"
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        اسم المستفيد / صاحب الحساب <span className="text-rose-400">*</span>:
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAccount.accountHolderName || ''}
                        onChange={(e) => setEditingAccount({ ...editingAccount, accountHolderName: e.target.value })}
                        placeholder="مثال: شركة النهار ده في مصر"
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      رقم الحساب البنكي <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAccount.accountNumber || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, accountNumber: e.target.value })}
                      placeholder="مثال: 10002938475"
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-blue-500/40 text-amber-300 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      رقم الآيبان الدولي (IBAN) <span className="text-rose-400">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingAccount.iban || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, iban: e.target.value })}
                      placeholder="مثال: EG380003000010002938475"
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-blue-500/40 text-cyan-300 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Instructions & Checkboxes */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">تعليمات التحويل للعميل:</label>
                  <textarea
                    rows={2}
                    value={editingAccount.instructions || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, instructions: e.target.value })}
                    placeholder="يرجى كتابة رقم المرجع في خانة الملاحظات أثناء التحويل"
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingAccount.isDefault || false}
                      onChange={(e) => setEditingAccount({ ...editingAccount, isDefault: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-black/50 border-white/20 focus:ring-0"
                    />
                    <span className="font-bold">تعيين كحساب افتراضي</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingAccount.isActive ?? true}
                      onChange={(e) => setEditingAccount({ ...editingAccount, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 bg-black/50 border-white/20 focus:ring-0"
                    />
                    <span className="font-bold">الحساب نشط ويستقبل تحويلات</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= ULTRA-PREMIUM INTERACTIVE RECEIPT & MEDIA LIGHTBOX ================= */}
        {lightboxImageUrl && (
          <div
            className={`fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-right transition-all duration-300 animate-in fade-in select-none ${
              isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
            }`}
          >
            {/* Lightbox Container Card */}
            <div
              className={`relative flex flex-col w-full h-full bg-slate-900/95 border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden ${
                isFullscreen ? 'rounded-none border-0' : ''
              }`}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-black/60 backdrop-blur-md z-20">
                {/* Left: Window & Close Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeLightbox}
                    className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="إغلاق (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="hidden sm:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={isFullscreen ? 'تصغير' : 'ملء الشاشة'}
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <a
                    href={lightboxImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors"
                    title="فتح الصورة الأصلية في نافذة جديدة أو تحميلها"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>

                {/* Center: Metadata Badges (if payment) */}
                {lightboxPayment && (
                  <div className="hidden md:flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                      {lightboxPayment.transactionReference || lightboxPayment.id.substring(0, 8)}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-black">
                      {lightboxPayment.amount} {lightboxPayment.currency}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
                      {lightboxPayment.paymentMethod}
                    </span>
                    {lightboxPayment.advertiserName && (
                      <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                        المعلن: {lightboxPayment.advertiserName}
                      </span>
                    )}
                  </div>
                )}

                {/* Right: Title & Icon */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-black text-white flex items-center gap-2 justify-end">
                      <span>{lightboxTitle || 'معاينة إيصال التحويل'}</span>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      استخدم أزرار التحكم للتكبير والتدوير أو عجلة الفأرة مع Ctrl
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Floating Interactive Toolbar */}
              <div className="absolute top-18 right-1/2 translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.4}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200 transition-colors cursor-pointer"
                  title="تصغير (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-3 py-1 rounded-lg text-xs font-mono font-bold text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
                  title="إعادة تعيين إلى 100%"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4.0}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200 transition-colors cursor-pointer"
                  title="تكبير (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-2 rounded-xl hover:bg-white/10 text-cyan-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                  title="تدوير 90 درجة مع عقارب الساعة"
                >
                  <RotateCw className="w-4 h-4" />
                  <span className="text-[10px] hidden sm:inline">{rotation}°</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="إعادة الوضع الافتراضي"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Viewport Canvas (Draggable / Zoomable / High-Res) */}
              <div
                className="relative flex-1 w-full overflow-auto flex items-center justify-center p-4 md:p-8 bg-radial from-slate-900 to-black cursor-grab active:cursor-grabbing"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) handleZoomIn();
                    else handleZoomOut();
                  }
                }}
              >
                <div
                  className="transition-transform duration-200 ease-out flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <img
                    src={lightboxImageUrl}
                    alt="صورة الإيصال بالحجم الكامل"
                    className="max-w-[85vw] max-h-[68vh] object-contain rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-white/10 select-none"
                    draggable={false}
                  />
                </div>
              </div>

              {/* Bottom Quick-Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-white/10 bg-black/60 backdrop-blur-md z-20">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>معاينة عالية الدقة للإيصال والمطابقة المباشرة</span>
                </div>

                {lightboxPayment && (
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {lightboxPayment.status === 'PaymentSubmitted' || lightboxPayment.status === 'Pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const id = lightboxPayment.id;
                            closeLightbox();
                            handleConfirmPayment(id);
                          }}
                          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تأكيد واستلام التحويل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const id = lightboxPayment.id;
                            closeLightbox();
                            openRejectModal(id, 'payment');
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رفض الإيصال مع السبب</span>
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${
                          lightboxPayment.status === 'PaymentConfirmed'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        حالة الدفع: {lightboxPayment.status}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </AdminShell>
  );
}
