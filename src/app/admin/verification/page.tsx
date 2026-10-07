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
  ActiveVerificationItem,
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
  Hourglass,
  ScanSearch,
  ShieldCheck,
  Ban,
  CircleSlash,
  Ticket,
  Award,
  Crown,
  ShieldOff,
  Gem,
  LayoutGrid,
  List,
} from 'lucide-react';
import { NationalIdInspectorModal } from '@/components/admin/verification/NationalIdInspectorModal';
import { VerificationRequestCard } from '@/components/admin/verification/VerificationRequestCard';
import { VerificationNavBar, VerificationTabId } from '@/components/admin/verification/VerificationNavBar';
import { VerificationTypeCard } from '@/components/admin/verification/VerificationTypeCard';
import { VerificationPlanCard } from '@/components/admin/verification/VerificationPlanCard';
import { ActiveVerificationCard } from '@/components/admin/verification/ActiveVerificationCard';
import { DirectGrantPanel } from '@/components/admin/verification/DirectGrantPanel';
import { RevokeExtendPanel } from '@/components/admin/verification/RevokeExtendPanel';
import { VerificationSecurityPanel } from '@/components/admin/verification/VerificationSecurityPanel';
import { VerificationConfirmModal } from '@/components/admin/verification/VerificationConfirmModal';

function activeDaysProgress(uv: ActiveVerificationItem) {
  const start = new Date(uv.startedAt).getTime();
  const end = new Date(uv.expiresAt).getTime();
  const total = Math.max(1, Math.round((end - start) / 86_400_000));
  const remaining = Math.max(0, uv.daysRemaining);
  const pct = Math.min(100, Math.max(4, (remaining / total) * 100));
  const urgent = remaining <= 7;
  return { total, remaining, pct, urgent };
}

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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
  const [activeSearch, setActiveSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [focusActiveList, setFocusActiveList] = useState(false);

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
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const { data: typesData, isLoading: typesLoading, refetch: refetchTypes } = useQuery({
    queryKey: ['admin', 'verification', 'types'],
    queryFn: ({ signal }) => verificationAdminApi.getTypes(signal),
    enabled: adminReady,
  });

  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useQuery({
    queryKey: ['admin', 'verification', 'plans'],
    queryFn: ({ signal }) => verificationAdminApi.getPlans(undefined, signal),
    enabled: adminReady,
  });

  const { data: activeVerifications, isLoading: activeLoading, refetch: refetchActive } = useQuery({
    queryKey: ['admin', 'verification', 'active', activeSearch, activePage],
    queryFn: ({ signal }) =>
      verificationAdminApi.getActiveVerifications(
        { page: activePage, pageSize: 12, search: activeSearch || undefined },
        signal
      ),
    enabled: adminReady && (activeTab === 'grants' || focusActiveList),
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
    mutationFn: (vars?: { verificationId?: string; identifier?: string; reason: string }) => {
      if (vars?.verificationId) {
        return verificationAdminApi.revokeVerification(vars.verificationId, vars.reason);
      }
      return verificationAdminApi.revokeByIdentifier(
        (vars?.identifier ?? actionIdentifier).trim(),
        vars?.reason ?? actionReason
      );
    },
    onSuccess: () => {
      showToast('تم سحب شارة التوثيق — الطلب التاريخي محفوظ ولم يعد كقيد الانتظار.');
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

  // Real-Time Listener: Instantly update lists when a user creates/submits or admin acts
  useEffect(() => {
    const unsub = signalRService.onVerificationEvent((msg) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'verification'], refetchType: 'active' });
      void refetchRequests();
      void refetchStats();
      void refetchActive();
      showToast(`🔔 تحديث لحظي للتوثيق: ${msg.type} (${msg.status})`, 'success');
    });
    return () => unsub();
  }, [queryClient, refetchRequests, refetchStats, refetchActive]);

  // Fallback poll while SignalR is down — otherwise new requests only appear after leaving the page
  useEffect(() => {
    if (!adminReady) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const syncPolling = (status: string) => {
      const needPoll =
        status === 'disconnected' ||
        status === 'disabled' ||
        status === 'reconnecting' ||
        status === 'connecting';
      if (needPoll && !intervalId) {
        intervalId = setInterval(() => {
          void queryClient.invalidateQueries({ queryKey: ['admin', 'verification'], refetchType: 'active' });
        }, 12_000);
      } else if (!needPoll && intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    syncPolling(signalRService.getStatus());
    const unsubStatus = signalRService.onStatusChange(syncPolling);

    return () => {
      unsubStatus();
      if (intervalId) clearInterval(intervalId);
    };
  }, [adminReady, queryClient]);

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

  const normalizeStatus = (status: any, name?: string): number => {
    if (typeof status === 'number') return status;
    const num = parseInt(status, 10);
    if (!isNaN(num)) return num;
    const str = String(status || name || '').toLowerCase().trim();
    if (str === 'pending' || str.includes('انتظار')) return 1;
    if (str === 'underreview' || str.includes('مراجعة') || str === 'under_review') return 2;
    if (str === 'approved' || str.includes('معتمد') || str.includes('موثق')) return 3;
    if (str === 'rejected' || str.includes('مرفوض')) return 4;
    if (str === 'cancelled' || str === 'canceled' || str.includes('ملغي')) return 5;
    if (str === 'expired' || str.includes('منتهي')) return 6;
    if (str === 'revoked' || str.includes('سحب')) return 7;
    return 1;
  };

  const isActionableStatus = (status: any, name?: string): boolean => {
    const code = normalizeStatus(status, name);
    return code === 1 || code === 2;
  };

  const getStatusBadge = (status: any, name: string) => {
    const s = normalizeStatus(status, name);
    switch (s) {
      case 1:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold inline-flex items-center gap-1">
            <Hourglass className="w-3 h-3" />
            قيد الانتظار
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold inline-flex items-center gap-1">
            <ScanSearch className="w-3 h-3" />
            قيد المراجعة
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            معتمد وموثق
          </span>
        );
      case 4:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold inline-flex items-center gap-1">
            <Ban className="w-3 h-3" />
            مرفوض
          </span>
        );
      case 5:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-gray-500/15 text-gray-300 border border-gray-500/30 font-bold inline-flex items-center gap-1">
            <CircleSlash className="w-3 h-3" />
            ملغي
          </span>
        );
      case 6:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-slate-500/15 text-slate-300 border border-slate-500/30 font-bold inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            منتهي الصلاحية
          </span>
        );
      case 7:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold inline-flex items-center gap-1">
            <ShieldOff className="w-3 h-3" />
            تم سحب التوثيق
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-white/10 text-gray-300 border border-white/15 font-bold">
            {name || 'غير محدد'}
          </span>
        );
    }
  };

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    requiresInput?: boolean;
    inputPlaceholder?: string;
    inputLabel?: string;
    onConfirm: (val?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDeleteType = (t: VerificationTypeItem) => {
    setConfirmConfig({
      isOpen: true,
      title: `حذف نوع التوثيق (${t.name})`,
      message: `هل أنت متأكد من رغبتك في حذف أو تعطيل نوع وشارة التوثيق (${t.name})؟ لن يؤثر هذا على التوثيقات التاريخية.`,
      confirmText: 'نعم، حذف النوع',
      isDestructive: true,
      onConfirm: () => {
        verificationAdminApi.deleteType(t.id).then(() => {
          showToast('تم حذف/تعطيل نوع التوثيق بنجاح');
          refetchTypes();
        });
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeletePlan = (p: VerificationPlanItem) => {
    setConfirmConfig({
      isOpen: true,
      title: `حذف باقة التوثيق (${p.name})`,
      message: `هل أنت متأكد من رغبتك في حذف أو تعطيل الباقة (${p.name})؟`,
      confirmText: 'نعم، حذف الباقة',
      isDestructive: true,
      onConfirm: () => {
        verificationAdminApi.deletePlan(p.id).then(() => {
          showToast('تم حذف/تعطيل الباقة بنجاح');
          refetchPlans();
        });
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRevokeActive = (uv: ActiveVerificationItem) => {
    setConfirmConfig({
      isOpen: true,
      title: `سحب توثيق الحساب (${uv.userName})`,
      message: `سيتم سحب الشارة الفعالة من حساب (${uv.userName}). لن يتم حذف الطلب التاريخي وسيظهر كـ «تم سحب التوثيق». يرجى كتابة سبب السحب:`,
      confirmText: 'تأكيد سحب الشارة',
      isDestructive: true,
      requiresInput: true,
      inputLabel: 'سبب سحب التوثيق الموجه للنظام',
      inputPlaceholder: 'مثال: مخالفة شروط المجتمع، انتحال هوية، بناءً على طلب المستخدم...',
      onConfirm: (reason) => {
        if (!reason?.trim()) {
          showToast('يرجى كتابة سبب السحب أولاً', 'error');
          return;
        }
        revokeMutation.mutate({ verificationId: uv.id, reason: reason.trim() });
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handlePanelRevoke = () => {
    setConfirmConfig({
      isOpen: true,
      title: `تأكيد سحب التوثيق (${actionIdentifier})`,
      message: `هل أنت متأكد من رغبتك في سحب وإلغاء شارة التوثيق للحساب (${actionIdentifier})؟ السبب المسجل: ${actionReason}`,
      confirmText: 'نعم، سحب التوثيق',
      isDestructive: true,
      onConfirm: () => {
        revokeMutation.mutate({ reason: actionReason });
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteRequest = (id: string, name?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف طلب التوثيق نهائياً',
      message: `هل أنت متأكد من مسح طلب التوثيق ${name ? `للمستخدم (${name})` : ''} نهائياً من سجلات النظام؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'نعم، حذف الطلب',
      isDestructive: true,
      onConfirm: () => {
        deleteRequestMutation.mutate(id);
        if (selectedRequestId === id) {
          setSelectedRequestId(null);
        }
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <AdminShell>
      <div className="space-y-4 sm:space-y-6 text-right max-w-7xl mx-auto pb-8 sm:pb-12 font-sans" dir="rtl">
        {/* Toast Alert */}
        {feedback && (
          <div
            className={`admin-toast ${
              feedback.type === 'success'
                ? 'bg-emerald-600 text-white border border-emerald-400/40'
                : 'bg-rose-600 text-white border border-rose-400/40'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className="min-w-0 break-words">{feedback.message}</span>
          </div>
        )}

        {/* Header Title & Quick Actions */}
        <div className="bg-gradient-to-l from-[#0F1B2D] via-[#162740] to-[#1F6B7A] rounded-2xl sm:rounded-[1.5rem] p-4 sm:p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#C4A35A]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#9E1B2C]/15 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[#C4A35A] text-[11px] sm:text-xs font-bold backdrop-blur-md mb-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">منظومة التوثيق والشارات الرسمية</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
                  إدارة ومراجعة طلبات التوثيق
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-1.5 max-w-xl leading-relaxed">
                  فحص الوثائق الثبوتية، اعتماد الشارات، وإدارة الباقات والمنح بأمان.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    refetchStats();
                    refetchRequests();
                    refetchTypes();
                    refetchPlans();
                  }}
                  className="admin-touch-btn bg-white/10 hover:bg-white/20 text-white border border-white/15"
                  title="تحديث البيانات"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">تحديث</span>
                </button>
                <button
                  onClick={() => {
                    setGrantUserIdentifier('');
                    setGrantMatchedUser(null);
                    setActiveTab('grants');
                  }}
                  className="admin-touch-btn bg-[#C4A35A] hover:bg-[#b09149] text-[#F2F6FA] shadow-lg"
                >
                  <Gift className="w-4 h-4" />
                  منح فوري
                </button>
              </div>
            </div>

            {/* Stats KPI Cards */}
            <div className="admin-kpi-grid mt-1 pt-4 border-t border-white/10">
              {[
                {
                  label: 'قيد الانتظار',
                  value: stats?.pendingRequests ?? 0,
                  icon: Hourglass,
                  tone: 'text-amber-300',
                  status: 1 as number | undefined,
                },
                {
                  label: 'قيد المراجعة',
                  value: stats?.underReviewRequests ?? 0,
                  icon: ScanSearch,
                  tone: 'text-sky-300',
                  status: 2 as number | undefined,
                },
                {
                  label: 'توثيقات نشطة',
                  value: stats?.activeVerifications ?? 0,
                  icon: ShieldCheck,
                  tone: 'text-emerald-300',
                  status: undefined as number | undefined,
                  goActive: true,
                },
                {
                  label: 'تنتهي قريباً',
                  value: stats?.expiringSoonVerifications ?? stats?.expiringSoon ?? 0,
                  icon: Clock,
                  tone: 'text-orange-300',
                  status: undefined as number | undefined,
                  goActive: true,
                },
                {
                  label: 'مرفوضة',
                  value: stats?.rejectedRequests ?? 0,
                  icon: Ban,
                  tone: 'text-rose-300',
                  status: 4 as number | undefined,
                  goActive: false,
                },
                {
                  label: 'منتهية',
                  value: stats?.expiredVerifications ?? stats?.expired ?? 0,
                  icon: CircleSlash,
                  tone: 'text-gray-300',
                  status: 6 as number | undefined,
                  goActive: false,
                },
                {
                  label: 'مجانية',
                  value: stats?.freeVerifications ?? 0,
                  icon: Ticket,
                  tone: 'text-[#C4A35A]',
                  status: undefined as number | undefined,
                  goActive: true,
                },
              ].map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <button
                    key={kpi.label}
                    type="button"
                    onClick={() => {
                      if (kpi.goActive) {
                        setFocusActiveList(true);
                        setActiveTab('grants');
                        setActivePage(1);
                        return;
                      }
                      setFocusActiveList(false);
                      setStatusFilter(kpi.status);
                      setActiveTab('requests');
                    }}
                    className="admin-kpi-tile"
                  >
                    <span className={`kpi-icon ${kpi.tone}`}>
                      <Icon className="w-4 h-4" strokeWidth={2.4} />
                    </span>
                    <span className={`kpi-label ${kpi.tone}`}>{kpi.label}</span>
                    <span className="kpi-value">{kpi.value}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Verification System Navigation Bar */}
        <VerificationNavBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'grants') {
              setFocusActiveList(true);
            }
          }}
          pendingCount={stats?.pendingRequests ?? 0}
          typesCount={typesData?.length ?? 0}
          plansCount={plansData?.length ?? 0}
          activeCount={stats?.activeVerifications ?? (activeVerifications?.totalCount ?? 0)}
        />

        {/* TAB 1: REQUESTS REVIEW CENTER */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* SUPERCHARGED FILTER & SEARCH DECK */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="بحث باسم المستخدم، رقم الهاتف، أو الرقم القومي (14 رقم)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title="مسح البحث"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Type Filter Dropdown */}
                <div className="w-full sm:w-64">
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">كافة أنواع وشارات التوثيق</option>
                    {typesData?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.badgeName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 self-end lg:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'cards'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>كروت ذكية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'table'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>جدول</span>
                  </button>
                </div>
              </div>

              {/* Status Quick Filter Chips */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none snap-x touch-pan-x">
                  <span className="text-xs font-bold text-slate-400 ml-1 shrink-0">الحالة:</span>
                  {[
                    { label: 'الكل', value: undefined, color: 'text-slate-200' },
                    { label: 'قيد الانتظار', value: 1, count: stats?.pendingRequests, color: 'text-amber-400', badgeColor: 'bg-amber-500/20 text-amber-300' },
                    { label: 'قيد المراجعة', value: 2, count: stats?.underReviewRequests, color: 'text-sky-400', badgeColor: 'bg-sky-500/20 text-sky-300' },
                    { label: 'معتمد وموثق', value: 3, color: 'text-emerald-400', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
                    { label: 'مرفوض', value: 4, count: stats?.rejectedRequests, color: 'text-rose-400', badgeColor: 'bg-rose-500/20 text-rose-300' },
                  ].map((chip) => {
                    const isSelected = statusFilter === chip.value;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setStatusFilter(chip.value);
                          setPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 snap-center min-h-[34px] active:scale-95 ${
                          isSelected
                            ? 'bg-amber-500/20 border border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{chip.label}</span>
                        {typeof chip.count === 'number' && chip.count > 0 && (
                          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-black ${chip.badgeColor || 'bg-white/10'}`}>
                            {chip.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {(statusFilter !== undefined || typeFilter !== '' || searchQuery !== '') && (
                  <button
                    onClick={() => {
                      setStatusFilter(undefined);
                      setTypeFilter('');
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-bold transition-colors shrink-0 self-start sm:self-auto"
                  >
                    إلغاء كافة الفلاتر ✕
                  </button>
                )}
              </div>
            </div>

            {/* REQUESTS LISTING (CARDS OR TABLE) */}
            {requestsLoading ? (
              <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 font-bold space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
                <div>جاري فحص وتحميل طلبات التوثيق والوثائق...</div>
              </div>
            ) : requestsData?.items?.length === 0 ? (
              <div className="p-16 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 font-bold space-y-2">
                <Shield className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <div className="text-base text-white">لا توجد طلبات توثيق تطابق معايير البحث المحددة</div>
                <p className="text-xs text-slate-500">جرب تغيير حالة الطلب أو مسح نص البحث للاطلاع على باقي الطلبات.</p>
              </div>
            ) : viewMode === 'cards' ? (
              /* CARDS GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {requestsData?.items?.map((r) => (
                  <VerificationRequestCard
                    key={r.id}
                    request={r}
                    onInspect={(req) => setSelectedRequestId(req.id)}
                    onApprove={(req) => {
                      setApproveModalRequest(req);
                      setApprovedDuration(req.requestedDurationDays || 30);
                      setIsFreeApprove(false);
                      setAdminNotes('');
                    }}
                    onReject={(req) => {
                      setRejectModalRequest(req);
                      setRejectReason('');
                    }}
                    onReview={(id) => reviewMutation.mutate(id)}
                    onDelete={(id) => handleDeleteRequest(id, r.userName || r.userPhoneNumber)}
                    normalizeStatus={normalizeStatus}
                    isActionable={isActionableStatus(r.status, r.statusName)}
                  />
                ))}
              </div>
            ) : (
              /* GLOWING TABLE VIEW */
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">المستخدم</th>
                        <th className="p-4">الرقم القومي / المحافظة</th>
                        <th className="p-4">نوع وشارة التوثيق</th>
                        <th className="p-4">الخطة / السعر</th>
                        <th className="p-4">الوثائق المرفقة</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {requestsData?.items?.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white text-xs">{r.userName || 'مستخدم بدون اسم'}</div>
                            <div className="font-mono text-cyan-400 text-[11px] mt-0.5">{r.userPhoneNumber}</div>
                          </td>
                          <td className="p-4 font-mono">
                            {r.extractedNationalId ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-amber-300 text-xs">🪪 {r.extractedNationalId}</span>
                                {r.extractedGovernorate && (
                                  <div className="text-[10px] text-slate-400">{r.extractedGovernorate}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">غير مستخرج</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-white text-xs flex items-center gap-1">
                              <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                              <span>{r.verificationTypeName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">شارة: {r.badgeName}</div>
                          </td>
                          <td className="p-4 font-mono">
                            <div className="font-bold text-emerald-400">
                              {r.planPrice ? `${r.planPrice} ج.م` : 'مجاني'}
                            </div>
                            <div className="text-[10px] text-slate-400">{r.requestedDurationDays} يوم</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold inline-flex items-center gap-1 text-[11px]">
                              <FileText className="w-3 h-3" />
                              <span>{r.documentsCount} مرفق</span>
                            </span>
                          </td>
                          <td className="p-4">{getStatusBadge(r.status, r.statusName)}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedRequestId(r.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>فحص</span>
                              </button>
                              {isActionableStatus(r.status, r.statusName) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setApproveModalRequest(r);
                                      setApprovedDuration(r.requestedDurationDays || 30);
                                      setIsFreeApprove(false);
                                      setAdminNotes('');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                                  >
                                    اعتماد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectModalRequest(r);
                                      setRejectReason('');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
                                  >
                                    رفض
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(r.id, r.userName || r.userPhoneNumber)}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAGINATION TOOLBAR */}
            {requestsData && requestsData.totalPages > 1 && (
              <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-400">
                  صفحة <span className="font-bold text-white">{requestsData.page}</span> من{' '}
                  <span className="font-bold text-white">{requestsData.totalPages}</span> (إجمالي{' '}
                  <span className="font-mono font-bold text-amber-400">{requestsData.totalCount}</span> طلب)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!requestsData.hasPreviousPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-40 font-bold transition-colors flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>
                  <button
                    disabled={!requestsData.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-40 font-bold transition-colors flex items-center gap-1"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERIFICATION TYPES */}
        {activeTab === 'types' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <BadgeCheck className="w-5 h-5" />
                  </div>
                  <h2 className="font-black text-white text-base sm:text-lg">أنواع وشارات التوثيق المعتمدة</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                    {typesData?.length ?? 0} أنواع
                  </span>
                </div>
                <p className="text-xs text-slate-400 pr-11">
                  تحديد فئات الحسابات التي يمكن توثيقها، متطلبات الوثائق، والشارة الظاهرة بجوار الاسم.
                </p>
              </div>

              <button
                type="button"
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
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 shrink-0 self-stretch sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة نوع توثيق جديد</span>
              </button>
            </div>

            {typesLoading ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm font-bold flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>جاري تحميل أنواع التوثيق...</span>
              </div>
            ) : !typesData?.length ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
                <BadgeCheck className="w-10 h-10 mx-auto text-emerald-400 opacity-50" />
                <h4 className="font-black text-white text-base">لا توجد أنواع توثيق معرفة</h4>
                <p className="text-xs text-slate-400">ابدأ بإضافة أول نوع توثيق وشارة في النظام الآن.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {typesData.map((t) => (
                  <VerificationTypeCard
                    key={t.id}
                    type={t}
                    onEdit={(item) => {
                      setEditingType(item);
                      setTypeFormData({
                        name: item.name,
                        description: item.description || '',
                        badgeName: item.badgeName,
                        badgeIcon: item.badgeIcon || 'BadgeCheck',
                        requiresDocuments: item.requiresDocuments,
                        requiresReview: item.requiresReview,
                        allowUserRequest: item.allowUserRequest,
                      });
                      setTypeModalOpen(true);
                    }}
                    onDelete={handleDeleteType}
                    onToggleStatus={(id, currentStatus) => {
                      verificationAdminApi.toggleTypeStatus(id, !currentStatus).then(() => {
                        showToast(!currentStatus ? 'تم تفعيل النوع بنجاح' : 'تم تعطيل النوع بنجاح');
                        refetchTypes();
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLANS & OFFERS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h2 className="font-black text-white text-base sm:text-lg">باقات وخطط التوثيق والعروض</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-black">
                    {plansData?.length ?? 0} باقات
                  </span>
                </div>
                <p className="text-xs text-slate-400 pr-11">
                  تحديد أسعار ومدد الاشتراكات والعروض الترويجية المجانية لكل فئة توثيق.
                </p>
              </div>

              <button
                type="button"
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
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 shrink-0 self-stretch sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء باقة جديدة</span>
              </button>
            </div>

            {plansLoading ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm font-bold flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <span>جاري تحميل باقات التوثيق...</span>
              </div>
            ) : !plansData?.length ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-3">
                <Tag className="w-10 h-10 mx-auto text-amber-400 opacity-50" />
                <h4 className="font-black text-white text-base">لا توجد باقات معرفة</h4>
                <p className="text-xs text-slate-400">أنشئ باقتك الأولى لتفعيل خيارات الاشتراك للمستخدمين.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {plansData.map((p) => (
                  <VerificationPlanCard
                    key={p.id}
                    plan={p}
                    onEdit={(item) => {
                      setEditingPlan(item);
                      setPlanFormData({
                        verificationTypeId: item.verificationTypeId,
                        name: item.name,
                        description: item.description || '',
                        durationDays: item.durationDays,
                        price: item.price,
                        currency: item.currency,
                        isActive: item.isActive,
                        isFree: item.isFree,
                        sortOrder: item.sortOrder,
                      });
                      setPlanModalOpen(true);
                    }}
                    onDelete={handleDeletePlan}
                    onToggleStatus={(id, currentStatus) => {
                      verificationAdminApi.togglePlanStatus(id, !currentStatus).then(() => {
                        showToast(!currentStatus ? 'تم تفعيل الباقة بنجاح' : 'تم تعطيل الباقة بنجاح');
                        refetchPlans();
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DIRECT GRANTS & ACTIVE MANAGEMENT */}
        {activeTab === 'grants' && (
          <div className="space-y-6">
            {/* Active verifications — Nile Vault */}
            <div
              id="active-verifications-panel"
              className="p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl"
            >
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-md">
                    <Crown className="w-6 h-6" strokeWidth={2.4} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-base sm:text-lg">
                        خزنة التوثيقات والشارات الحية
                      </h3>
                      {activeVerifications?.totalCount !== undefined && (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black">
                          {activeVerifications.totalCount} حساب موثق
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      سحب الشارة فورياً دون مسح السجل التاريخي للطلب، مع تدقيق المدة المتبقية لكل مستخدم.
                    </p>
                  </div>
                </div>

                <div className="relative min-w-[280px]">
                  <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="بحث في التوثيقات النشطة..."
                    value={activeSearch}
                    onChange={(e) => {
                      setActiveSearch(e.target.value);
                      setActivePage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {activeLoading ? (
                <div className="p-12 text-center text-slate-400 text-sm font-bold flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                  <span>جاري تحميل التوثيقات النشطة...</span>
                </div>
              ) : !activeVerifications?.items?.length ? (
                <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80">
                  <Gem className="w-10 h-10 mx-auto text-purple-400 opacity-50" />
                  <h4 className="font-black text-white text-base">لا توجد توثيقات نشطة حالياً</h4>
                  <p className="text-xs text-slate-500">
                    يمكنك منح توثيق مباشر بالأسفل أو مراجعة واعتماد الطلبات المعلقة.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeVerifications.items.map((uv: ActiveVerificationItem) => (
                    <ActiveVerificationCard
                      key={uv.id}
                      uv={uv}
                      onInspectDocs={(reqId) => setSelectedRequestId(reqId)}
                      onRevoke={handleRevokeActive}
                      isRevoking={revokeMutation.isPending}
                    />
                  ))}
                </div>
              )}

              {activeVerifications && activeVerifications.totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                  <span className="text-xs font-bold text-slate-400">
                    صفحة {activeVerifications.page} من {activeVerifications.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!activeVerifications.hasPreviousPage}
                      onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!activeVerifications.hasNextPage}
                      onClick={() => setActivePage((p) => p + 1)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Grant & Revoke / Extend Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DirectGrantPanel
                typesData={typesData}
                grantUserIdentifier={grantUserIdentifier}
                setGrantUserIdentifier={setGrantUserIdentifier}
                grantMatchedUser={grantMatchedUser}
                setGrantMatchedUser={setGrantMatchedUser}
                grantSuggestions={grantSuggestions}
                grantTypeId={grantTypeId}
                setGrantTypeId={setGrantTypeId}
                grantDays={grantDays}
                setGrantDays={setGrantDays}
                grantIsFree={grantIsFree}
                setGrantIsFree={setGrantIsFree}
                grantNotes={grantNotes}
                setGrantNotes={setGrantNotes}
                onSubmit={() => directGrantMutation.mutate()}
                isPending={directGrantMutation.isPending}
              />

              <RevokeExtendPanel
                actionIdentifier={actionIdentifier}
                setActionIdentifier={setActionIdentifier}
                actionMatchedUser={actionMatchedUser}
                setActionMatchedUser={setActionMatchedUser}
                actionSuggestions={actionSuggestions}
                actionReason={actionReason}
                setActionReason={setActionReason}
                extendDays={extendDays}
                setExtendDays={setExtendDays}
                onRevoke={handlePanelRevoke}
                onExtend={() => extendMutation.mutate()}
                isRevoking={revokeMutation.isPending}
                isExtending={extendMutation.isPending}
              />
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY POLICIES & ENGINE STATUS */}
        {activeTab === 'settings' && <VerificationSecurityPanel />}

        {/* SMART NATIONAL ID & OCR INSPECTOR MODAL */}
        {selectedRequestId && selectedRequestDetail && (
          <NationalIdInspectorModal
            request={selectedRequestDetail}
            isLoading={detailsLoading}
            onClose={() => {
              setSelectedRequestId(null);
              setPreviewDocUrl(null);
            }}
            onApprove={(req) => {
              setApproveModalRequest(req);
              setApprovedDuration(req.requestedDurationDays || 30);
              setIsFreeApprove(false);
              setAdminNotes('');
            }}
            onReject={(req) => {
              setRejectModalRequest(req);
              setRejectReason('');
            }}
            onReview={(id) => reviewMutation.mutate(id)}
            onDelete={(id) =>
              handleDeleteRequest(id, selectedRequestDetail.userName || selectedRequestDetail.userPhoneNumber)
            }
            isActionable={isActionableStatus(selectedRequestDetail.status, selectedRequestDetail.statusName)}
            isPending={normalizeStatus(selectedRequestDetail.status, selectedRequestDetail.statusName) === 1}
          />
        )}

        {/* APPROVAL DIALOG WITH DURATION PRESETS */}
        {approveModalRequest && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-emerald-500/40 text-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-black text-lg text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>اعتماد وتفعيل توثيق الحساب</span>
                </h3>
                <button
                  onClick={() => setApproveModalRequest(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl text-xs text-emerald-200 space-y-1">
                <div>
                  المستخدم: <span className="font-bold text-white">{approveModalRequest.userName}</span>
                </div>
                <div>
                  نوع التوثيق: <span className="font-bold text-cyan-300">{approveModalRequest.verificationTypeName}</span>
                </div>
                <div>
                  الخطة المطلوبة: <span className="font-bold text-amber-300">{approveModalRequest.planName || 'افتراضية'}</span>
                </div>
              </div>

              <div className="space-y-3.5">
                {/* Duration Presets */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    مدة الصلاحية المعتمدة (بالأيام)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: '30 يوم', days: 30 },
                      { label: '90 يوم (3 أشهر)', days: 90 },
                      { label: '180 يوم (6 أشهر)', days: 180 },
                      { label: 'سنة (365 يوم)', days: 365 },
                      { label: 'سنتين (730 يوم)', days: 730 },
                    ].map((p) => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => setApprovedDuration(p.days)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                          approvedDuration === p.days
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={approvedDuration}
                    onChange={(e) => setApprovedDuration(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-2.5 text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-bold text-center mt-2"
                  />
                </div>

                <div className="flex items-center gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="freeGrantApprove"
                    checked={isFreeApprove}
                    onChange={(e) => setIsFreeApprove(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700 w-4 h-4"
                  />
                  <label htmlFor="freeGrantApprove" className="text-xs font-bold text-slate-200 cursor-pointer">
                    اعتماد مجاني بدون خصم رسوم (Free Official Grant)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">ملاحظات الإدارة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="ملاحظات توثيق، استثناء مدة، رقم قيد..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  onClick={() => setApproveModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
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
                  className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition"
                >
                  {approveMutation.isPending ? 'جاري الاعتماد...' : 'تأكيد الاعتماد والتفعيل ✓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REJECT DIALOG WITH QUICK EGYPTIAN TEMPLATES */}
        {rejectModalRequest && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-rose-500/40 text-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-black text-lg text-rose-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>رفض طلب التوثيق</span>
                </h3>
                <button
                  onClick={() => setRejectModalRequest(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                المستخدم: <span className="font-bold text-white">{rejectModalRequest.userName}</span>
              </p>

              {/* Quick Reason Templates */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400">
                  قوالب أسباب الرفض الشائعة (اضغط لاختيار فوري):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'صورة البطاقة غير واضحة أو مقصوصة',
                    'الرقم القومي غير مطابق لبيانات الحساب',
                    'البطاقة منتهية الصلاحية ومطلوب بطاقة سارية',
                    'مطلوب رفع وش وظهر البطاقة الأصلية معاً',
                    'الاسم بالبطاقة يختلف عن الاسم المسجل بالحساب',
                    'المستند المرفق غير صالح كإثبات شخصية رسمي',
                  ].map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => setRejectReason(tmpl)}
                      className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-800 text-[11px] font-medium transition-colors"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  سبب الرفض الموجه للمستخدم (إلزامي في الإشعار) *
                </label>
                <textarea
                  rows={3}
                  placeholder="اكتب سبب الرفض هنا بوضوح ليعرف المستخدم ما المطلوب تعديله..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalRequest(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  onClick={() =>
                    rejectMutation.mutate({
                      id: rejectModalRequest.id,
                      reason: rejectReason.trim(),
                    })
                  }
                  className="px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-2xl shadow-lg shadow-rose-600/30 disabled:opacity-50 transition"
                >
                  {rejectMutation.isPending ? 'جاري الرفض...' : 'تأكيد الرفض ✕'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT TYPE MODAL */}
        {typeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-emerald-500/40 text-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-400" />
                  <span>{editingType ? 'تعديل نوع وشارة التوثيق' : 'إضافة نوع توثيق جديد'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setTypeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم النوع بالمنظومة *</label>
                  <input
                    type="text"
                    placeholder="مثال: مواطن موثق، مراسل صحفي، جهة معتمدة..."
                    value={typeFormData.name}
                    onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الشارة الظاهرة بجوار الاسم *</label>
                  <input
                    type="text"
                    placeholder="مثال: موثق، صحفي، جهة رسمية..."
                    value={typeFormData.badgeName}
                    onChange={(e) => setTypeFormData({ ...typeFormData, badgeName: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الوصف وشروط الأهلية</label>
                  <textarea
                    rows={2}
                    placeholder="شروط ومزايا هذا النوع من التوثيق..."
                    value={typeFormData.description}
                    onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={typeFormData.requiresDocuments}
                      onChange={(e) => setTypeFormData({ ...typeFormData, requiresDocuments: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <span>يتطلب رفع وثائق ثبوتية</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      checked={typeFormData.allowUserRequest}
                      onChange={(e) => setTypeFormData({ ...typeFormData, allowUserRequest: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <span>متاح للتقديم من التطبيق</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTypeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!typeFormData.name.trim() || !typeFormData.badgeName.trim() || saveTypeMutation.isPending}
                  onClick={() => saveTypeMutation.mutate()}
                  className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition"
                >
                  {saveTypeMutation.isPending ? 'جاري الحفظ...' : 'حفظ البيانات ✓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT PLAN MODAL */}
        {planModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-amber-500/40 text-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <span>{editingPlan ? 'تعديل الباقة أو العرض' : 'إنشاء باقة / عرض ترويجي جديد'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع وشارة التوثيق المستهدفة *</label>
                  <select
                    value={planFormData.verificationTypeId}
                    onChange={(e) => setPlanFormData({ ...planFormData, verificationTypeId: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    {typesData?.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-950 text-white">
                        {t.name} (شارة: {t.badgeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الباقة أو العرض *</label>
                  <input
                    type="text"
                    placeholder="مثال: باقة الشهر، العرض الذهبي السنوي..."
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">المدة (بالأيام) *</label>
                    <input
                      type="number"
                      min={1}
                      value={planFormData.durationDays}
                      onChange={(e) => setPlanFormData({ ...planFormData, durationDays: parseInt(e.target.value) || 30 })}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">السعر (ج.م) *</label>
                    <input
                      type="number"
                      min={0}
                      value={planFormData.isFree ? 0 : planFormData.price}
                      disabled={planFormData.isFree}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-bold disabled:bg-slate-950/50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
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
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">عرض ترويجي مجاني (0 جنيه)</span>
                    <span className="text-[11px] text-slate-400">تظهر الباقة بشارة مجانية مميزة للمستخدمين</span>
                  </div>
                </label>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الوصف والمزايا الإضافية</label>
                  <textarea
                    rows={2}
                    placeholder="وصف الباقة وشروطها..."
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!planFormData.name.trim() || !planFormData.verificationTypeId || savePlanMutation.isPending}
                  onClick={() => savePlanMutation.mutate()}
                  className="px-5 py-2.5 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-2xl shadow-lg shadow-amber-500/30 disabled:opacity-50 transition"
                >
                  {savePlanMutation.isPending ? 'جاري الحفظ...' : 'حفظ الباقة ✓'}
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

        {/* REUSABLE CONFIRMATION MODAL */}
        <VerificationConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          isDestructive={confirmConfig.isDestructive}
          requiresInput={confirmConfig.requiresInput}
          inputLabel={confirmConfig.inputLabel}
          inputPlaceholder={confirmConfig.inputPlaceholder}
          onConfirm={(val) => confirmConfig.onConfirm(val)}
          onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </AdminShell>
  );
}
