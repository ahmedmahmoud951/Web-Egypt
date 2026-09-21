'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { signalRService } from '@/lib/signalr';
import {
  verificationAdminApi,
  verificationDocumentTypeLabel,
  VerificationRequestItem,
  VerificationTypeItem,
  VerificationPlanItem,
  CreateTypePayload,
  CreatePlanPayload,
  UserLookupItem,
} from '@/api/verificationAdmin';
import { resolveMediaUrl } from '@/lib/media';
import {
  BadgeCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Gift,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  User,
  Phone,
  Lock,
  Tag,
  Flame,
  ArrowRight,
  ZoomIn,
  ImageIcon,
} from 'lucide-react';

export default function AdminVerificationPage() {
  const adminReady = useAdminQueryEnabled();
  const queryClient = useQueryClient();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'requests' | 'types' | 'plans' | 'grants' | 'settings'>('requests');

  // Filters for Requests
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Selected Request for Modal Details
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

  // Modals state
  const [approveModalRequest, setApproveModalRequest] = useState<VerificationRequestItem | null>(null);
  const [approvedDuration, setApprovedDuration] = useState<number>(30);
  const [isFreeApprove, setIsFreeApprove] = useState<boolean>(false);
  const [adminNotes, setAdminNotes] = useState<string>('');

  const [rejectModalRequest, setRejectModalRequest] = useState<VerificationRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Type Modal
  const [typeModalOpen, setTypeModalOpen] = useState<boolean>(false);
  const [editingType, setEditingType] = useState<VerificationTypeItem | null>(null);
  const [typeFormData, setTypeFormData] = useState<CreateTypePayload>({
    name: '',
    description: '',
    badgeName: '',
    badgeIcon: 'BadgeCheck',
    requiresDocuments: true,
    requiresReview: true,
    allowUserRequest: true,
  });

  // Plan Modal
  const [planModalOpen, setPlanModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<VerificationPlanItem | null>(null);
  const [planFormData, setPlanFormData] = useState<CreatePlanPayload>({
    verificationTypeId: '',
    name: '',
    description: '',
    durationDays: 30,
    price: 0,
    currency: 'EGP',
    isActive: true,
    isFree: false,
    sortOrder: 1,
  });

  // Direct Grant State (Username, Phone Number, or User ID)
  const [grantUserIdentifier, setGrantUserIdentifier] = useState<string>('');
  const [grantMatchedUser, setGrantMatchedUser] = useState<UserLookupItem | null>(null);
  const [grantTypeId, setGrantTypeId] = useState<string>('');
  const [grantDays, setGrantDays] = useState<number>(90);
  const [grantIsFree, setGrantIsFree] = useState<boolean>(true);
  const [grantNotes, setGrantNotes] = useState<string>('');

  // Revoke & Extend State (Username, Phone Number, or ID)
  const [actionIdentifier, setActionIdentifier] = useState<string>('');
  const [actionMatchedUser, setActionMatchedUser] = useState<UserLookupItem | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [extendDays, setExtendDays] = useState<number>(30);

  // Notification / Feedback alert
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Queries
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['admin', 'verification', 'dashboard'],
    queryFn: ({ signal }) => verificationAdminApi.getDashboard(signal),
    enabled: adminReady,
    staleTime: 60_000,
  });

  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['admin', 'verification', 'requests', statusFilter, typeFilter, searchQuery, page],
    queryFn: ({ signal }) =>
      verificationAdminApi.getRequests({
        status: statusFilter,
        verificationTypeId: typeFilter || undefined,
        search: searchQuery || undefined,
        page,
        pageSize: 15,
        signal,
      }),
    enabled: adminReady && activeTab === 'requests',
    staleTime: 30_000,
  });

  const { data: typesData, refetch: refetchTypes } = useQuery({
    queryKey: ['admin', 'verification', 'types'],
    queryFn: ({ signal }) => verificationAdminApi.getTypes(signal),
    enabled: adminReady,
  });

  const { data: plansData, refetch: refetchPlans } = useQuery({
    queryKey: ['admin', 'verification', 'plans'],
    queryFn: ({ signal }) => verificationAdminApi.getPlans(undefined, signal),
    enabled: adminReady,
  });

  const { data: selectedRequestDetail, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin', 'verification', 'request', selectedRequestId],
    queryFn: ({ signal }) => verificationAdminApi.getRequestById(selectedRequestId!, signal),
    enabled: !!selectedRequestId,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (vars: { id: string; payload: any }) => verificationAdminApi.approveRequest(vars.id, vars.payload),
    onSuccess: () => {
      showToast('تم اعتماد وتفعيل توثيق الحساب بنجاح وإرسال الإشعار!');
      setApproveModalRequest(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل اعتماد الطلب', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      verificationAdminApi.rejectRequest(vars.id, { rejectionReason: vars.reason }),
    onSuccess: () => {
      showToast('تم رفض الطلب وحفظ سبب الرفض وإشعار المستخدم بنجاح.');
      setRejectModalRequest(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل رفض الطلب', 'error'),
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) => verificationAdminApi.moveToReview(id),
    onSuccess: () => {
      showToast('تم نقل الطلب إلى حالة "قيد المراجعة" بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل تحديث حالة الطلب', 'error'),
  });

  // User Lookup queries for suggestions
  const { data: grantSuggestions } = useQuery({
    queryKey: ['admin', 'verification', 'lookup', grantUserIdentifier],
    queryFn: ({ signal }) => verificationAdminApi.lookupUsers(grantUserIdentifier, signal),
    enabled: adminReady && grantUserIdentifier.trim().length >= 2,
    staleTime: 5000,
  });

  const { data: actionSuggestions } = useQuery({
    queryKey: ['admin', 'verification', 'lookup', actionIdentifier],
    queryFn: ({ signal }) => verificationAdminApi.lookupUsers(actionIdentifier, signal),
    enabled: adminReady && actionIdentifier.trim().length >= 2,
    staleTime: 5000,
  });

  const directGrantMutation = useMutation({
    mutationFn: () =>
      verificationAdminApi.grantByIdentifier({
        userIdentifier: grantUserIdentifier.trim(),
        verificationTypeId: grantTypeId,
        durationDays: grantDays,
        isFree: grantIsFree,
        adminNotes: grantNotes,
      }),
    onSuccess: () => {
      showToast('تم منح التوثيق المباشر للمستخدم بنجاح!');
      setGrantUserIdentifier('');
      setGrantMatchedUser(null);
      setGrantNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل منح التوثيق المباشر', 'error'),
  });

  const revokeMutation = useMutation({
    mutationFn: () => verificationAdminApi.revokeByIdentifier(actionIdentifier.trim(), actionReason),
    onSuccess: () => {
      showToast('تم سحب التوثيق الفعال بنجاح.');
      setActionIdentifier('');
      setActionMatchedUser(null);
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل سحب التوثيق', 'error'),
  });

  const extendMutation = useMutation({
    mutationFn: () => verificationAdminApi.extendByIdentifier(actionIdentifier.trim(), extendDays, actionReason),
    onSuccess: () => {
      showToast('تم تمديد صلاحية التوثيق بنجاح.');
      setActionIdentifier('');
      setActionMatchedUser(null);
      setActionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل تمديد التوثيق', 'error'),
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (id: string) => verificationAdminApi.deleteRequest(id),
    onSuccess: () => {
      showToast('تم مسح طلب التوثيق بالكامل من النظام.');
      setSelectedRequestId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل مسح طلب التوثيق', 'error'),
  });

  // Real-Time Listener: Instantly update requests table when a user submits/cancels or admin reviews
  useEffect(() => {
    const unsub = signalRService.onVerificationEvent((msg) => {
      refetchRequests();
      refetchStats();
      showToast(`🔔 تحديث لحظي للتوثيق: ${msg.type} (${msg.status})`, 'success');
    });
    return () => unsub();
  }, [refetchRequests, refetchStats]);

  const saveTypeMutation = useMutation({
    mutationFn: () => {
      if (editingType) {
        return verificationAdminApi.updateType(editingType.id, typeFormData);
      }
      return verificationAdminApi.createType(typeFormData);
    },
    onSuccess: () => {
      showToast(editingType ? 'تم تعديل نوع التوثيق بنجاح!' : 'تم إضافة نوع التوثيق الجديد بنجاح!');
      setTypeModalOpen(false);
      setEditingType(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification', 'types'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل حفظ نوع التوثيق', 'error'),
  });

  const savePlanMutation = useMutation({
    mutationFn: () => {
      if (editingPlan) {
        return verificationAdminApi.updatePlan(editingPlan.id, planFormData);
      }
      return verificationAdminApi.createPlan(planFormData);
    },
    onSuccess: () => {
      showToast(editingPlan ? 'تم تحديث الباقة/العرض بنجاح!' : 'تم إنشاء الباقة بنجاح!');
      setPlanModalOpen(false);
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification', 'plans'] });
    },
    onError: (err: any) => showToast(err?.response?.data?.message || 'فشل حفظ الباقة', 'error'),
  });

  const getStatusBadge = (status: number, name: string) => {
    switch (status) {
      case 1:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium">قيد الانتظار</span>;
      case 2:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-medium">قيد المراجعة</span>;
      case 3:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">معتمد وموثق</span>;
      case 4:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 font-medium">مرفوض</span>;
      case 5:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-gray-500/10 text-gray-600 border border-gray-500/20 font-medium">ملغي</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{name}</span>;
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 text-right max-w-7xl mx-auto pb-12 font-sans" dir="rtl">
        {/* Toast Alert */}
        {feedback && (
          <div
            className={`fixed top-5 left-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition-all transform animate-in slide-in-from-top ${
              feedback.type === 'success'
                ? 'bg-emerald-600 text-white border border-emerald-400'
                : 'bg-rose-600 text-white border border-rose-400'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-semibold text-sm">{feedback.message}</span>
          </div>
        )}

        {/* Header Title & Quick Actions */}
        <div className="bg-gradient-to-l from-[#0F1B2D] via-[#162740] to-[#1F6B7A] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4A35A]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C4A35A] text-xs font-semibold backdrop-blur-md mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                منظومة توثيق الحسابات والشارات الرسمية
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">إدارة ومراجعة طلبات التوثيق</h1>
              <p className="text-sm text-gray-300 mt-1 max-w-xl">
                التحكم الكامل بأنواع التوثيق، الخطط والعروض الخاصة، فحص الوثائق الثبوتية، واعتماد أو سحب التوثيقات بأمان تام.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  refetchStats();
                  refetchRequests();
                  refetchTypes();
                  refetchPlans();
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setGrantUserIdentifier('');
                  setGrantMatchedUser(null);
                  setActiveTab('grants');
                }}
                className="px-4 py-2.5 rounded-xl bg-[#C4A35A] hover:bg-[#b09149] text-[#0F1B2D] font-bold text-sm transition shadow-lg flex items-center gap-2"
              >
                <Gift className="w-4 h-4" />
                منح توثيق فوري
              </button>
            </div>
          </div>

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-white/10">
            <div
              onClick={() => {
                setStatusFilter(1);
                setActiveTab('requests');
              }}
              className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl cursor-pointer transition border border-white/10 text-center group"
            >
              <div className="text-xs text-amber-300 font-medium">قيد الانتظار</div>
              <div className="text-2xl font-bold mt-1 group-hover:scale-105 transition">{stats?.pendingRequests ?? 0}</div>
            </div>

            <div
              onClick={() => {
                setStatusFilter(2);
                setActiveTab('requests');
              }}
              className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl cursor-pointer transition border border-white/10 text-center group"
            >
              <div className="text-xs text-blue-300 font-medium">قيد المراجعة</div>
              <div className="text-2xl font-bold mt-1 group-hover:scale-105 transition">{stats?.underReviewRequests ?? 0}</div>
            </div>

            <div
              onClick={() => {
                setStatusFilter(3);
                setActiveTab('requests');
              }}
              className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl cursor-pointer transition border border-white/10 text-center group"
            >
              <div className="text-xs text-emerald-300 font-medium">توثيقات نشطة</div>
              <div className="text-2xl font-bold mt-1 group-hover:scale-105 transition">{stats?.activeVerifications ?? 0}</div>
            </div>

            <div
              onClick={() => {
                setStatusFilter(undefined);
                setActiveTab('requests');
              }}
              className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl cursor-pointer transition border border-white/10 text-center group"
            >
              <div className="text-xs text-orange-300 font-medium">تنتهي قريباً</div>
              <div className="text-2xl font-bold mt-1 group-hover:scale-105 transition">{stats?.expiringSoon ?? 0}</div>
            </div>

            <div
              onClick={() => {
                setStatusFilter(4);
                setActiveTab('requests');
              }}
              className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl cursor-pointer transition border border-white/10 text-center group"
            >
              <div className="text-xs text-rose-300 font-medium">مرفوضة</div>
              <div className="text-2xl font-bold mt-1 group-hover:scale-105 transition">{stats?.rejectedRequests ?? 0}</div>
            </div>

            <div
              onClick={() => {
                setStatusFilter(undefined);
                setActiveTab('requests');
              }}
              className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl cursor-pointer transition border border-white/10 text-center group"
            >
              <div className="text-xs text-gray-300 font-medium">منتهية الصلاحية</div>
              <div className="text-2xl font-bold mt-1 group-hover:scale-105 transition">{stats?.expired ?? 0}</div>
            </div>

            <div
              onClick={() => {
                setStatusFilter(undefined);
                setActiveTab('requests');
              }}
              className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl cursor-pointer transition border border-white/10 text-center group"
            >
              <div className="text-xs text-[#C4A35A] font-medium">توثيقات مجانية</div>
              <div className="text-2xl font-bold mt-1 group-hover:scale-105 transition">{stats?.freeVerifications ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white rounded-xl shadow-sm p-1.5 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'requests' ? 'bg-[#1F6B7A] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            طلبات التوثيق والمراجعة
          </button>

          <button
            onClick={() => setActiveTab('types')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'types' ? 'bg-[#1F6B7A] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BadgeCheck className="w-4 h-4" />
            أنواع وشارات التوثيق ({typesData?.length ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'plans' ? 'bg-[#1F6B7A] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            الباقات والعروض الخاصة ({plansData?.length ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('grants')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'grants' ? 'bg-[#1F6B7A] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Gift className="w-4 h-4" />
            المنح المباشر والسحب والتمديد
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-[#1F6B7A] text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            الأمان وقواعد العمل
          </button>
        </div>

        {/* TAB 1: REQUESTS REVIEW CENTER */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="بحث برقم الهاتف أو الاسم أو المعرف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F6B7A]"
                  />
                </div>

                <select
                  value={statusFilter === undefined ? '' : statusFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStatusFilter(val === '' ? undefined : parseInt(val));
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F6B7A]"
                >
                  <option value="">جميع الحالات</option>
                  <option value="1">قيد الانتظار</option>
                  <option value="2">قيد المراجعة</option>
                  <option value="3">معتمد وموثق</option>
                  <option value="4">مرفوض</option>
                  <option value="5">ملغي</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1F6B7A]"
                >
                  <option value="">كافة أنواع التوثيق</option>
                  {typesData?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter !== undefined || typeFilter !== '' || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setStatusFilter(undefined);
                    setTypeFilter('');
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  إلغاء الفلاتر
                </button>
              )}
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">المستخدم</th>
                      <th className="py-3.5 px-4">نوع التوثيق</th>
                      <th className="py-3.5 px-4">الخطة / السعر</th>
                      <th className="py-3.5 px-4">تاريخ التقديم</th>
                      <th className="py-3.5 px-4">الوثائق</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requestsLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1F6B7A]" />
                          جاري تحميل طلبات التوثيق...
                        </td>
                      </tr>
                    ) : requestsData?.items?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500">
                          لا توجد طلبات تطابق معايير البحث الحالية.
                        </td>
                      </tr>
                    ) : (
                      requestsData?.items?.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{r.userName || 'مستخدم بدون اسم'}</div>
                            <div className="text-xs text-gray-500 font-mono">{r.userPhoneNumber}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 font-semibold text-gray-800">
                              <BadgeCheck className="w-4 h-4 text-[#C4A35A]" />
                              {r.verificationTypeName}
                            </div>
                            <div className="text-xs text-gray-500">شارة: {r.badgeName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-gray-800">{r.planName || `${r.requestedDurationDays} يوم`}</div>
                            <div className="text-xs text-gray-500">
                              {r.planPrice ? `${r.planPrice} ج.م` : 'مجاني / حسب الطلب'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-gray-500">
                            {new Date(r.requestedAt).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
                              <FileText className="w-3.5 h-3.5" />
                              {r.documentsCount} مرفق
                            </span>
                          </td>
                          <td className="py-3.5 px-4">{getStatusBadge(r.status, r.statusName)}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => setSelectedRequestId(r.id)}
                                className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-[#1F6B7A] transition"
                                title="عرض التفاصيل والمستندات"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Actions for Pending / UnderReview */}
                              {(r.status === 1 || r.status === 2) && (
                                <>
                                  {r.status === 1 && (
                                    <button
                                      onClick={() => reviewMutation.mutate(r.id)}
                                      className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition"
                                    >
                                      بدء المراجعة
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setApproveModalRequest(r);
                                      setApprovedDuration(r.requestedDurationDays || 30);
                                      setIsFreeApprove(false);
                                      setAdminNotes('');
                                    }}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition shadow-sm"
                                  >
                                    اعتماد
                                  </button>

                                  <button
                                    onClick={() => {
                                      setRejectModalRequest(r);
                                      setRejectReason('');
                                    }}
                                    className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold transition"
                                  >
                                    رفض
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من مسح طلب التوثيق للمستخدم (${r.userName || r.userPhoneNumber}) نهائياً من قاعدة البيانات؟`)) {
                                    deleteRequestMutation.mutate(r.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="مسح طلب التوثيق نهائياً"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {requestsData && requestsData.totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    صفحة {requestsData.page} من {requestsData.totalPages} (إجمالي {requestsData.totalCount} طلب)
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={!requestsData.hasPreviousPage}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      disabled={!requestsData.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VERIFICATION TYPES */}
        {activeTab === 'types' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div>
                <h2 className="font-bold text-gray-900">أنواع وشارات التوثيق المعرفة في النظام</h2>
                <p className="text-xs text-gray-500">
                  تحديد فئات الحسابات التي يمكن توثيقها (مثل: مواطن، مراسل صحفي، مؤسسة، جهة حكومية أو إعلامية).
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingType(null);
                  setTypeFormData({
                    name: '',
                    description: '',
                    badgeName: '',
                    badgeIcon: 'BadgeCheck',
                    requiresDocuments: true,
                    requiresReview: true,
                    allowUserRequest: true,
                  });
                  setTypeModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#1F6B7A] text-white font-bold text-sm hover:bg-[#185561] transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                إضافة نوع جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typesData?.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-[#C4A35A]/15 text-[#C4A35A] flex items-center justify-center font-bold">
                          <BadgeCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{t.name}</h3>
                          <div className="text-xs text-[#1F6B7A] font-semibold">شارة: {t.badgeName}</div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                          t.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {t.isActive ? 'مفعل' : 'معطل'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-3 line-clamp-2">{t.description || 'لا يوجد وصف متاح لهذا النوع.'}</p>

                    <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        الوثائق: <span className="font-bold">{t.requiresDocuments ? 'مطلوبة 📄' : 'اختيارية'}</span>
                      </div>
                      <div>
                        التقديم من التطبيق: <span className="font-bold">{t.allowUserRequest ? 'متاح ✅' : 'إدارة فقط 🔒'}</span>
                      </div>
                      <div>
                        الخطط الفعالة: <span className="font-bold">{t.activePlansCount} باقة</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => verificationAdminApi.toggleTypeStatus(t.id, !t.isActive).then(() => refetchTypes())}
                      className="text-xs text-gray-600 hover:text-gray-900 font-semibold underline"
                    >
                      {t.isActive ? 'تعطيل النوع' : 'تفعيل النوع'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingType(t);
                          setTypeFormData({
                            name: t.name,
                            description: t.description || '',
                            badgeName: t.badgeName,
                            badgeIcon: t.badgeIcon || 'BadgeCheck',
                            requiresDocuments: t.requiresDocuments,
                            requiresReview: t.requiresReview,
                            allowUserRequest: t.allowUserRequest,
                          });
                          setTypeModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#1F6B7A] transition"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من رغبتك في حذف أو تعطيل النوع (${t.name})؟`)) {
                            verificationAdminApi.deleteType(t.id).then(() => {
                              showToast('تم حذف/تعطيل النوع بنجاح');
                              refetchTypes();
                            });
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PLANS & OFFERS */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div>
                <h2 className="font-bold text-gray-900">باقات وخطط التوثيق والعروض الترويجية</h2>
                <p className="text-xs text-gray-500">
                  التحكم في مدد التوثيق، الأسعار، العروض والخصومات، وتعيين باقات مجانية لفئات معينة.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanFormData({
                    verificationTypeId: typesData?.[0]?.id || '',
                    name: '',
                    description: '',
                    durationDays: 30,
                    price: 150,
                    currency: 'EGP',
                    isActive: true,
                    isFree: false,
                    sortOrder: 1,
                  });
                  setPlanModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#1F6B7A] text-white font-bold text-sm hover:bg-[#185561] transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                إنشاء باقة أو عرض جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plansData?.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition relative flex flex-col justify-between ${
                    p.isFree ? 'border-[#C4A35A]/50 bg-gradient-to-b from-[#C4A35A]/5 to-white' : 'border-gray-200'
                  }`}
                >
                  {p.isFree && (
                    <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-[#C4A35A] text-[#0F1B2D] text-xs font-black shadow flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      عرض مجاني
                    </div>
                  )}

                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#1F6B7A]">{p.verificationTypeName || 'نوع عام'}</span>
                        <h3 className="text-lg font-bold text-gray-900 mt-0.5">{p.name}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                          p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.isActive ? 'نشطة' : 'معطلة'}
                      </span>
                    </div>

                    <div className="my-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900">{p.isFree ? 'مجاناً' : p.price}</span>
                      {!p.isFree && <span className="text-xs text-gray-500 font-bold">{p.currency}</span>}
                      <span className="text-xs text-gray-400 mr-2">/ لمدة {p.durationDays} يوم</span>
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2">{p.description || 'باقة توثيق معتمدة.'}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => verificationAdminApi.togglePlanStatus(p.id, !p.isActive).then(() => refetchPlans())}
                      className="text-xs text-gray-600 hover:text-gray-900 font-semibold underline"
                    >
                      {p.isActive ? 'تعطيل الباقة' : 'تفعيل الباقة'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPlan(p);
                          setPlanFormData({
                            verificationTypeId: p.verificationTypeId,
                            name: p.name,
                            description: p.description || '',
                            durationDays: p.durationDays,
                            price: p.price,
                            currency: p.currency,
                            isActive: p.isActive,
                            isFree: p.isFree,
                            sortOrder: p.sortOrder,
                          });
                          setPlanModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#1F6B7A] transition"
                        title="تعديل السعر أو المدة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من رغبتك في حذف أو تعطيل الباقة (${p.name})؟`)) {
                            verificationAdminApi.deletePlan(p.id).then(() => {
                              showToast('تم حذف/تعطيل الباقة بنجاح');
                              refetchPlans();
                            });
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="حذف الباقة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DIRECT GRANTS & ACTIVE MANAGEMENT */}
        {activeTab === 'grants' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direct Grant Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-[#1F6B7A] font-bold text-lg mb-1">
                <Gift className="w-5 h-5" />
                منح توثيق مباشر لمستخدم (Direct Grant)
              </div>
              <p className="text-xs text-gray-500 mb-5">
                تتيح للإدارة منح شارة توثيق فورية لأي حساب برقم الموبايل أو اسم المستخدم دون الحاجة لمعرفة الـ ID أو رفع وثائق.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    اسم المستخدم أو رقم الموبايل (Username or Phone Number)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="مثال: 01012345678 أو ahmed_soliman أو المعرف..."
                      value={grantUserIdentifier}
                      onChange={(e) => {
                        setGrantUserIdentifier(e.target.value);
                        setGrantMatchedUser(null);
                      }}
                      className="w-full px-3.5 py-2.5 pl-8 text-sm rounded-lg border border-gray-300 font-medium focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                  </div>

                  {/* Live Suggestions Dropdown */}
                  {grantSuggestions && grantSuggestions.length > 0 && !grantMatchedUser && (
                    <div className="mt-1.5 p-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto space-y-1 z-20 relative">
                      <div className="text-[11px] font-bold text-gray-400 px-2 py-0.5">اختر المستخدم من نتائج البحث:</div>
                      {grantSuggestions.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setGrantUserIdentifier(u.phoneNumber || u.username || u.id);
                            setGrantMatchedUser(u);
                          }}
                          className="p-2 rounded-lg hover:bg-[#1F6B7A]/5 border border-transparent hover:border-[#1F6B7A]/20 cursor-pointer transition flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-900">{u.name}</span>
                            {u.username && <span className="text-gray-400 mr-1.5">(@{u.username})</span>}
                            <span className="text-gray-500 mr-2 font-mono">📱 {u.phoneNumber}</span>
                          </div>
                          {u.hasActiveVerification ? (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              موثق: {u.badgeName}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 font-bold">
                              غير موثق
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {grantMatchedUser && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                      <div>
                        تم تحديد: <span className="font-black">{grantMatchedUser.name}</span> ({grantMatchedUser.phoneNumber})
                      </div>
                      <button
                        onClick={() => {
                          setGrantMatchedUser(null);
                          setGrantUserIdentifier('');
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        تغيير
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">نوع وشارة التوثيق</label>
                    <select
                      value={grantTypeId}
                      onChange={(e) => setGrantTypeId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                    >
                      <option value="">-- اختر نوع التوثيق --</option>
                      {typesData?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.badgeName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">المدة الممنوحة (بالأيام)</label>
                    <input
                      type="number"
                      min={1}
                      value={grantDays}
                      onChange={(e) => setGrantDays(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="grantIsFree"
                    checked={grantIsFree}
                    onChange={(e) => setGrantIsFree(e.target.checked)}
                    className="rounded text-[#1F6B7A] focus:ring-[#1F6B7A]"
                  />
                  <label htmlFor="grantIsFree" className="text-xs font-bold text-gray-800 cursor-pointer">
                    منح مجاني بالكامل (بدون رسوم أو مدفوعات)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الإدارة وسبب المنح</label>
                  <textarea
                    rows={2}
                    placeholder="شخصية عامة، دعوة شرفية، مراسل رسمي..."
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                  />
                </div>

                <button
                  disabled={!grantUserIdentifier.trim() || !grantTypeId || directGrantMutation.isPending}
                  onClick={() => directGrantMutation.mutate()}
                  className="w-full py-2.5 rounded-xl bg-[#1F6B7A] hover:bg-[#185561] text-white font-bold text-sm transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  {directGrantMutation.isPending ? 'جاري المنح...' : 'تأكيد منح التوثيق فوراً'}
                </button>
              </div>
            </div>

            {/* Revoke & Extend Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-700 font-bold text-lg mb-1">
                  <AlertTriangle className="w-5 h-5" />
                  سحب التوثيق أو تمديده (Revoke / Extend)
                </div>
                <p className="text-xs text-gray-500 mb-5">
                  إلغاء شارة التوثيق الفعالة أو تمديدها باستخدام اسم المستخدم أو رقم الموبايل مباشرة.
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      اسم المستخدم أو رقم الموبايل أو المعرف
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="مثال: 01012345678 أو ahmed_soliman أو معرف التوثيق..."
                        value={actionIdentifier}
                        onChange={(e) => {
                          setActionIdentifier(e.target.value);
                          setActionMatchedUser(null);
                        }}
                        className="w-full px-3.5 py-2.5 pl-8 text-sm rounded-lg border border-gray-300 font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                    </div>

                    {/* Suggestions for Revoke / Extend */}
                    {actionSuggestions && actionSuggestions.length > 0 && !actionMatchedUser && (
                      <div className="mt-1.5 p-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto space-y-1 z-20 relative">
                        <div className="text-[11px] font-bold text-gray-400 px-2 py-0.5">المستخدمون المطابقون:</div>
                        {actionSuggestions.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setActionIdentifier(u.phoneNumber || u.username || u.id);
                              setActionMatchedUser(u);
                            }}
                            className="p-2 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 cursor-pointer transition flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-gray-900">{u.name}</span>
                              {u.username && <span className="text-gray-400 mr-1.5">(@{u.username})</span>}
                              <span className="text-gray-500 mr-2 font-mono">📱 {u.phoneNumber}</span>
                            </div>
                            {u.hasActiveVerification ? (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                سارٍ: {u.badgeName} ({u.daysRemaining} يوم)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-500 font-medium">
                                لا يوجد توثيق سارٍ
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {actionMatchedUser && (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-900">
                        <div>
                          الحساب المحدد: <span className="font-black">{actionMatchedUser.name}</span> (
                          {actionMatchedUser.hasActiveVerification ? `شارة: ${actionMatchedUser.badgeName}` : 'غير موثق'}
                          )
                        </div>
                        <button
                          onClick={() => {
                            setActionMatchedUser(null);
                            setActionIdentifier('');
                          }}
                          className="text-rose-700 hover:text-rose-900 font-bold"
                        >
                          تغيير
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">السبب / الملاحظات (إلزامي للسحب)</label>
                    <input
                      type="text"
                      placeholder="مخالفة معايير المجتمع، انتحال صفة، أو رغبة المستخدم..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      disabled={!actionIdentifier.trim() || !actionReason || revokeMutation.isPending}
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من رغبتك في سحب وإلغاء شارة التوثيق للحساب (${actionIdentifier})؟`)) {
                          revokeMutation.mutate();
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition shadow disabled:opacity-50"
                    >
                      {revokeMutation.isPending ? 'جاري السحب...' : 'سحب التوثيق الفعال'}
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        min={1}
                        value={extendDays}
                        onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
                        className="w-20 px-2.5 py-2 text-sm rounded-lg border border-gray-300 outline-none text-center"
                        title="عدد الأيام الإضافية"
                      />
                      <button
                        disabled={!actionIdentifier.trim() || extendMutation.isPending}
                        onClick={() => extendMutation.mutate()}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow disabled:opacity-50"
                      >
                        {extendMutation.isPending ? 'جاري التمديد...' : 'تمديد الصلاحية'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-500">
                💡 يمكنك كتابة رقم الموبايل (مثلاً 01012345678) أو اسم المستخدم وسيقوم النظام بالتعرف على الحساب فورياً.
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY POLICIES & ENGINE STATUS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1F6B7A]" />
                سياسات أمان منظومة التوثيق والخدمات الخلفية
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                قواعد الحماية الصارمة المحققة 100% على مستوى خادم الـ API وقاعدة البيانات.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
                <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  حماية الأسعار والمدد
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  لا يثق الخادم بأي سعر أو مدة أو حالة مرسلة من جانب العميل أو التطبيق، وتُحدد الأسعار من قاعدة البيانات فقط.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
                <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  خدمة انتهاء الصلاحية الخلفية
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  محرك خلفي دوري يتفقد انتهاء الصلاحية ويرسل إشعارات متدرجة (30 يوماً، 7 أيام، ويوم واحد) مع منع التكرار.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
                <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  التوثيق ببطاقة الرقم القومي
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  يتم رفع صورة البطاقة (وش وضهر) في أول مرة فقط، وتُستعار تلقائياً في التجديدات اللاحقة دون إرهاق المستخدم.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
                <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  بث SignalR اللحظي
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  تحديث فوري لجميع الأحداث (تقديم، مراجعة، اعتماد، رفض، سحب، تمديد) لجميع شاشات الإدارة والتطبيق.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
                <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  سرية المستندات
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  مفاتيح Backblaze B2 ووسائط التوثيق لا تخرج أبداً من الخادم ولا يمكن لأي مستخدم آخر الوصول لمستندات غيره.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/70">
                <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  سجل تدقيق زمني غير قابل للمحو
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  تسجيل هوية المسؤول وتاريخ كل إجراء بدقة لمنع التلاعب وحفظ حقوق المستخدمين والإدارة.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS & DOCUMENT PREVIEW MODAL */}
        {selectedRequestId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-right animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-6 h-6 text-[#C4A35A]" />
                  <h3 className="font-bold text-lg text-gray-900">تفاصيل طلب التوثيق وفحص الوثائق</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequestId(null);
                    setPreviewDocUrl(null);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {detailsLoading || !selectedRequestDetail ? (
                <div className="py-16 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1F6B7A]" />
                  جاري تحميل التفاصيل والمستندات...
                </div>
              ) : (
                <div className="space-y-6 mt-4">
                  {/* User Snapshot */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block">المستخدم:</span>
                      <span className="font-bold text-gray-900 text-sm">{selectedRequestDetail.userName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">رقم الهاتف:</span>
                      <span className="font-bold font-mono text-gray-900 text-sm">{selectedRequestDetail.userPhoneNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">نوع وشارة التوثيق:</span>
                      <span className="font-bold text-[#1F6B7A] text-sm">
                        {selectedRequestDetail.verificationTypeName} ({selectedRequestDetail.badgeName})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">الحالة الحالية:</span>
                      {getStatusBadge(selectedRequestDetail.status, selectedRequestDetail.statusName)}
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#1F6B7A]" />
                      الوثائق والمستندات المرفقة بالطلب ({selectedRequestDetail.documents?.length ?? 0})
                    </h4>

                    {!selectedRequestDetail.documents?.length ? (
                      <div className="p-4 rounded-xl bg-gray-50 text-center text-xs text-gray-500">
                        لم يتم إرفاق أي وثائق في هذا الطلب.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedRequestDetail.documents.map((doc) => {
                          const rawUrl = doc.documentUrl || doc.mediaUrl || '';
                          const imageUrl = resolveMediaUrl(rawUrl);
                          const title = verificationDocumentTypeLabel(doc.documentType, doc.documentTypeName);
                          const fileLabel = doc.fileName || doc.mediaFileName;

                          return (
                            <div
                              key={doc.id}
                              className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-[#1F6B7A] transition flex flex-col"
                            >
                              {imageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewDocUrl(imageUrl);
                                    setPreviewDocTitle(title);
                                  }}
                                  className="relative group bg-slate-100 aspect-[4/3] w-full overflow-hidden text-left"
                                  title="اضغط للتكبير"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imageUrl}
                                    alt={title}
                                    className="w-full h-full object-contain bg-slate-50"
                                    loading="lazy"
                                  />
                                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1.5 rounded-full bg-white/95 text-[#1F6B7A] text-xs font-bold px-3 py-1.5 shadow">
                                      <ZoomIn className="w-3.5 h-3.5" />
                                      تكبير المعاينة
                                    </span>
                                  </span>
                                </button>
                              ) : (
                                <div className="aspect-[4/3] w-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 gap-2">
                                  <ImageIcon className="w-8 h-8" />
                                  <span className="text-xs">لا تتوفر معاينة للصورة</span>
                                </div>
                              )}

                              <div className="p-3 flex flex-col gap-2">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-gray-800">{title}</span>
                                  {fileLabel && (
                                    <span className="text-[10px] text-gray-400 truncate max-w-[40%]" title={fileLabel}>
                                      {fileLabel}
                                    </span>
                                  )}
                                </div>
                                {doc.notes && <p className="text-xs text-gray-500">{doc.notes}</p>}
                                <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(doc.createdAt).toLocaleDateString('ar-EG')}
                                  </span>
                                  {imageUrl && (
                                    <a
                                      href={imageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-[#1F6B7A] hover:underline font-semibold"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      فتح في تبويب جديد
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Audit Logs Timeline */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#C4A35A]" />
                      سجل المراجعة والتدقيق الزمني (Audit Timeline)
                    </h4>

                    <div className="space-y-2 border-r-2 border-gray-200 pr-4 mr-2 text-xs">
                      {selectedRequestDetail.auditLogs?.map((log) => (
                        <div key={log.id} className="relative">
                          <div className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#1F6B7A]" />
                          <div className="flex items-center justify-between font-bold text-gray-800">
                            <span>{log.actionName}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              {new Date(log.createdAt).toLocaleString('ar-EG')}
                            </span>
                          </div>
                          {log.notes && <p className="text-gray-600 mt-0.5">{log.notes}</p>}
                          {log.performedByUserName && (
                            <span className="text-[10px] text-[#1F6B7A]">بواسطة: {log.performedByUserName}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modal Action Footer */}
                  <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من مسح طلب التوثيق هذا نهائياً من النظام؟ سيتم حذف جميع المستندات وسجلات التدقيق المرتبطة به.`)) {
                          deleteRequestMutation.mutate(selectedRequestId!);
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      مسح الطلب نهائياً
                    </button>

                    <button
                      onClick={() => {
                    setSelectedRequestId(null);
                    setPreviewDocUrl(null);
                  }}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPROVAL DIALOG */}
        {approveModalRequest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-lg text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  اعتماد طلب التوثيق
                </h3>
                <button
                  onClick={() => setApproveModalRequest(null)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
                <div>
                  المستخدم: <span className="font-bold">{approveModalRequest.userName}</span>
                </div>
                <div>
                  نوع التوثيق: <span className="font-bold">{approveModalRequest.verificationTypeName}</span>
                </div>
                <div>
                  الخطة المقترحة: <span className="font-bold">{approveModalRequest.planName || 'افتراضية'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">مدة الصلاحية المعتمدة (بالأيام)</label>
                  <input
                    type="number"
                    min={1}
                    value={approvedDuration}
                    onChange={(e) => setApprovedDuration(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-center"
                  />
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="freeGrantApprove"
                    checked={isFreeApprove}
                    onChange={(e) => setIsFreeApprove(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="freeGrantApprove" className="text-xs font-bold text-gray-800 cursor-pointer">
                    اعتماد مجاني بدون دفع رسوم (Grant Free Verification)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الإدارة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="ملاحظات توثيق، استثناء مدة..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={() => setApproveModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  disabled={approveMutation.isPending}
                  onClick={() =>
                    approveMutation.mutate({
                      id: approveModalRequest.id,
                      payload: {
                        approvedDurationDays: approvedDuration,
                        isFree: isFreeApprove,
                        adminNotes,
                      },
                    })
                  }
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow disabled:opacity-50"
                >
                  {approveMutation.isPending ? 'جاري الاعتماد...' : 'تأكيد الاعتماد والتفعيل'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REJECT DIALOG */}
        {rejectModalRequest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-lg text-rose-700 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  رفض طلب التوثيق
                </h3>
                <button
                  onClick={() => setRejectModalRequest(null)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-600">
                المستخدم: <span className="font-bold">{rejectModalRequest.userName}</span>
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  سبب الرفض (إلزامي — يظهر للمستخدم في الإشعار) *
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: صورة البطاقة غير واضحة، انتهاء صلاحية الرقم القومي، المستندات ناقصة..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={() => setRejectModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  تراجع
                </button>
                <button
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  onClick={() =>
                    rejectMutation.mutate({
                      id: rejectModalRequest.id,
                      reason: rejectReason.trim(),
                    })
                  }
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'جاري الرفض...' : 'تأكيد الرفض'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT TYPE MODAL */}
        {typeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-right shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-[#1F6B7A]" />
                  {editingType ? 'تعديل نوع التوثيق' : 'إضافة نوع توثيق جديد'}
                </h3>
                <button
                  onClick={() => setTypeModalOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم النوع *</label>
                  <input
                    type="text"
                    placeholder="مثال: مواطن موثق، مراسل صحفي معتمد..."
                    value={typeFormData.name}
                    onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم الشارة الظاهرة بجانب الاسم *</label>
                  <input
                    type="text"
                    placeholder="مثال: موثق، صحفي، جهة رسمية..."
                    value={typeFormData.badgeName}
                    onChange={(e) => setTypeFormData({ ...typeFormData, badgeName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الوصف</label>
                  <textarea
                    rows={2}
                    placeholder="شروط ومزايا هذا النوع من التوثيق..."
                    value={typeFormData.description}
                    onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeFormData.requiresDocuments}
                      onChange={(e) => setTypeFormData({ ...typeFormData, requiresDocuments: e.target.checked })}
                      className="rounded text-[#1F6B7A] focus:ring-[#1F6B7A]"
                    />
                    يتطلب وثائق ثبوتية
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeFormData.allowUserRequest}
                      onChange={(e) => setTypeFormData({ ...typeFormData, allowUserRequest: e.target.checked })}
                      className="rounded text-[#1F6B7A] focus:ring-[#1F6B7A]"
                    />
                    متاح للتقديم من التطبيق
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={() => setTypeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  disabled={!typeFormData.name.trim() || !typeFormData.badgeName.trim() || saveTypeMutation.isPending}
                  onClick={() => saveTypeMutation.mutate()}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1F6B7A] hover:bg-[#185561] rounded-lg shadow disabled:opacity-50"
                >
                  {saveTypeMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT PLAN MODAL */}
        {planModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-right shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#C4A35A]" />
                  {editingPlan ? 'تعديل الباقة أو العرض' : 'إنشاء باقة / عرض ترويجي جديد'}
                </h3>
                <button
                  onClick={() => setPlanModalOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نوع التوثيق المرتبط بالباقة *</label>
                  <select
                    value={planFormData.verificationTypeId}
                    onChange={(e) => setPlanFormData({ ...planFormData, verificationTypeId: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                  >
                    {typesData?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اسم الباقة أو العرض *</label>
                  <input
                    type="text"
                    placeholder="مثال: باقة 30 يوم، عرض السنة الذهبي..."
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">المدة (بالأيام) *</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.durationDays}
                      onChange={(e) => setPlanFormData({ ...planFormData, durationDays: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">السعر (ج.م) *</label>
                    <input
                      type="number"
                      min={0}
                      value={planFormData.isFree ? 0 : planFormData.price}
                      disabled={planFormData.isFree}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none font-bold disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="planIsFree"
                    checked={planFormData.isFree}
                    onChange={(e) =>
                      setPlanFormData({
                        ...planFormData,
                        isFree: e.target.checked,
                        price: e.target.checked ? 0 : planFormData.price,
                      })
                    }
                    className="rounded text-[#C4A35A] focus:ring-[#C4A35A]"
                  />
                  <label htmlFor="planIsFree" className="text-xs font-bold text-gray-800 cursor-pointer">
                    عرض مجاني بالكامل (0 جنيه)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الوصف</label>
                  <textarea
                    rows={2}
                    placeholder="وصف الباقة وشروطها..."
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#1F6B7A] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  disabled={!planFormData.name.trim() || !planFormData.verificationTypeId || savePlanMutation.isPending}
                  onClick={() => savePlanMutation.mutate()}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1F6B7A] hover:bg-[#185561] rounded-lg shadow disabled:opacity-50"
                >
                  {savePlanMutation.isPending ? 'جاري الحفظ...' : 'حفظ الباقة'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full-size document image preview */}
        {previewDocUrl && (
          <div
            className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewDocUrl(null)}
            role="dialog"
            aria-modal="true"
            aria-label={previewDocTitle || 'معاينة المستند'}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-white px-1">
                <h3 className="text-sm font-bold truncate">{previewDocTitle || 'معاينة المستند'}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    فتح
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewDocUrl(null)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white"
                    aria-label="إغلاق"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl overflow-auto flex items-center justify-center min-h-[40vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewDocUrl}
                  alt={previewDocTitle || 'مستند'}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
