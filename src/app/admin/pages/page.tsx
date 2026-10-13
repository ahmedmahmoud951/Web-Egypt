'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { formatArabicDate } from '@/lib/utils';
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Ban,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Users,
  Heart,
  Film,
  FileText,
  Sparkles,
  BadgeCheck,
  X,
  RotateCcw,
  Copy,
  Check,
  Building2,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  Compass,
  ArrowRight,
  UserCheck,
  User,
  Zap,
} from 'lucide-react';

interface PageDto {
  id: string;
  ownerUserId: string;
  ownerName: string;
  name: string;
  slug: string;
  category: string;
  subCategory?: string;
  bio?: string;
  about?: string;
  avatarUrl?: string;
  coverUrl?: string;
  phoneNumber?: string;
  whatsAppNumber?: string;
  email?: string;
  websiteUrl?: string;
  address?: string;
  governorate?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  actionType: string;
  actionUrl?: string;
  isVerified: boolean;
  verificationBadge?: string;
  verificationCategory?: string;
  followersCount: number;
  likesCount: number;
  postsCount: number;
  reelsCount: number;
  rating: number;
  reviewsCount: number;
  status: string;
  suspensionReason?: string;
  isFollowing?: boolean;
  isLiked?: boolean;
  myRole?: string;
  createdAt: string;
}

const CATEGORIES_MAP: Record<string, string> = {
  Business: 'نشاط تجاري وشركات',
  Restaurant: 'مطاعم وكافيهات',
  ECommerce: 'تجارة وتسوق إلكتروني',
  PublicFigure: 'شخصيات عامة ومؤثرين',
  MediaNews: 'إعلام وصحافة',
  Entertainment: 'ترفيه وفنون',
  Education: 'تعليم وتدريب',
  Health: 'صحة ورعاية طبية',
  Community: 'مجتمع ومبادرات',
  Other: 'أخرى',
};

const VERIFICATION_CATEGORIES: Record<string, string> = {
  OfficialBrand: 'علامة تجارية رسمية (Official Brand)',
  PublicFigure: 'شخصية عامة وموثقة (Public Figure)',
  GovOrganization: 'مؤسسة حكومية أو رسمية (Government)',
  VerifiedBusiness: 'نشاط تجاري معتمد (Verified Business)',
  Business: 'صفحة تجارية موثقة (Business)',
};

const SUSPENSION_PRESETS = [
  'انتهاك معايير المجتمع ونشر محتوى غير لائق',
  'اشتباه احتيال تجاري أو بيع منتجات مضللة',
  'انتحال صفة علامة تجارية أو شخصية مشهورة',
  'إرسال رسائل سبام أو مضايقات متكررة للمستخدمين',
  'طلب وثائق غير قانونية أو بيانات حساسة للمستخدمين',
  'إيقاف إداري مؤقت بناءً على بلاغات رسمية',
];

interface PageCompletenessAudit {
  score: number;
  completedItems: { label: string; icon: string }[];
  missingItems: { label: string; icon: string; importance: 'high' | 'medium' | 'low' }[];
}

function calculatePageCompleteness(p: PageDto): PageCompletenessAudit {
  const completed: { label: string; icon: string }[] = [];
  const missing: { label: string; icon: string; importance: 'high' | 'medium' | 'low' }[] = [];

  // 1. Logo
  if (p.avatarUrl) {
    completed.push({ label: 'شعار الصفحة الرسمي', icon: '🖼️' });
  } else {
    missing.push({ label: 'شعار الصفحة (اللوجو)', icon: '🖼️', importance: 'high' });
  }

  // 2. Cover Banner
  if (p.coverUrl) {
    completed.push({ label: 'غلاف البانر التعريفي', icon: '🎨' });
  } else {
    missing.push({ label: 'صورة الغلاف (Banner)', icon: '🎨', importance: 'medium' });
  }

  // 3. Bio / About
  if (p.bio && p.bio.trim().length > 5) {
    completed.push({ label: 'النبذة التعريفية (Bio)', icon: '📝' });
  } else {
    missing.push({ label: 'النبذة التعريفية (Bio)', icon: '📝', importance: 'high' });
  }

  // 4. Phone or WhatsApp
  if (p.phoneNumber || p.whatsAppNumber) {
    completed.push({ label: 'رقم هاتف أو واتساب', icon: '📞' });
  } else {
    missing.push({ label: 'رقم هاتف أو واتساب تجاري', icon: '📞', importance: 'high' });
  }

  // 5. Location / City / Address
  if (p.city || p.governorate || p.address) {
    completed.push({ label: 'المقر أو المدينة', icon: '📍' });
  } else {
    missing.push({ label: 'تحديد المحافظة أو المقر', icon: '📍', importance: 'medium' });
  }

  // 6. Action Button (CTA)
  if (p.actionType && p.actionType !== 'None') {
    completed.push({ label: `زر إجراء تفاعلي (${p.actionType})`, icon: '⚡' });
  } else {
    missing.push({ label: 'زر إجراء تفاعلي (CTA)', icon: '⚡', importance: 'low' });
  }

  // 7. Official Website or Email
  if (p.websiteUrl || p.email) {
    completed.push({ label: 'بريد أو موقع إلكتروني', icon: '🌐' });
  } else {
    missing.push({ label: 'موقع إلكتروني أو بريد رسمي', icon: '🌐', importance: 'low' });
  }

  // 8. Verification Badge
  if (p.isVerified) {
    completed.push({ label: 'شارة التوثيق المعتمدة', icon: '🎖️' });
  } else {
    missing.push({ label: 'التوثيق بالشارة الرسمية', icon: '🎖️', importance: 'medium' });
  }

  const totalPossible = completed.length + missing.length;
  const score = Math.round((completed.length / totalPossible) * 100);

  return { score, completedItems: completed, missingItems: missing };
}

export default function AdminPagesPage() {
  const queryClient = useQueryClient();

  // Search and Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedPage, setSelectedPage] = useState<PageDto | null>(null);
  const [moderatingPage, setModeratingPage] = useState<PageDto | null>(null);
  const [modStatus, setModStatus] = useState<'Active' | 'Suspended'>('Active');
  const [modReason, setModReason] = useState('');
  const [modIsVerified, setModIsVerified] = useState(false);
  const [modVerificationCategory, setModVerificationCategory] = useState('OfficialBrand');
  const [deleteConfirmPage, setDeleteConfirmPage] = useState<PageDto | null>(null);

  // Quick suspend modal state
  const [quickSuspendTarget, setQuickSuspendTarget] = useState<PageDto | null>(null);
  const [quickSuspendReason, setQuickSuspendReason] = useState(SUSPENSION_PRESETS[0]);

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`تم نسخ ${label} إلى الحافظة بنجاح.`);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Fetch Pages Query
  const {
    data: pages = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-pages', statusFilter, search, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/pages', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search || undefined,
          page,
          pageSize: 40,
        },
      });
      return (res.data?.data as PageDto[]) || [];
    },
  });

  // Filter client-side by category and verification
  const filteredPages = pages.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (verifiedFilter === 'verified' && !p.isVerified) return false;
    if (verifiedFilter === 'unverified' && p.isVerified) return false;
    return true;
  });

  // Moderation Mutation (حماية، إيقاف، فك إيقاف، توثيق)
  const moderateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      suspensionReason,
      isVerified,
      verificationCategory,
    }: {
      id: string;
      status: string;
      suspensionReason?: string;
      isVerified?: boolean;
      verificationCategory?: string;
    }) => {
      const res = await apiClient.put(`/admin/pages/${id}/moderate`, {
        status,
        suspensionReason: status === 'Suspended' ? suspensionReason : null,
        isVerified,
        verificationCategory: isVerified ? verificationCategory : null,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      showToast(
        variables.status === 'Suspended'
          ? 'تم تعطيل وإيقاف الصفحة بنجاح وحجبها عن المستخدمين'
          : 'تم تنشيط وإلغاء تعطيل الصفحة وتفعيلها بنجاح'
      );
      setModeratingPage(null);
      setQuickSuspendTarget(null);
      if (selectedPage?.id === variables.id) {
        setSelectedPage((prev) =>
          prev
            ? {
                ...prev,
                status: variables.status,
                suspensionReason: variables.suspensionReason,
                isVerified: variables.isVerified ?? prev.isVerified,
              }
            : null
        );
      }
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.error?.message || 'حدث خطأ أثناء تحديث حالة الصفحة', 'error');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/admin/pages/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pages'] });
      showToast('تم حذف الصفحة بالكامل من قاعدة البيانات بنجاح.');
      setDeleteConfirmPage(null);
      if (selectedPage) setSelectedPage(null);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.error?.message || 'تعذر حذف الصفحة', 'error');
    },
  });

  const openModerationModal = (pageItem: PageDto) => {
    setModeratingPage(pageItem);
    setModStatus(pageItem.status === 'Suspended' ? 'Suspended' : 'Active');
    setModReason(pageItem.suspensionReason || SUSPENSION_PRESETS[0]);
    setModIsVerified(pageItem.isVerified);
    setModVerificationCategory(pageItem.verificationCategory || 'OfficialBrand');
  };

  const handleToggleSuspendDirect = (pageItem: PageDto) => {
    if (pageItem.status === 'Suspended') {
      // Direct Activate
      moderateMutation.mutate({
        id: pageItem.id,
        status: 'Active',
        suspensionReason: undefined,
        isVerified: pageItem.isVerified,
        verificationCategory: pageItem.verificationCategory,
      });
    } else {
      // Open Quick Suspend confirmation
      setQuickSuspendTarget(pageItem);
      setQuickSuspendReason(SUSPENSION_PRESETS[0]);
    }
  };

  // KPIs
  const totalCount = pages.length;
  const activeCount = pages.filter((p) => p.status === 'Active').length;
  const suspendedCount = pages.filter((p) => p.status === 'Suspended').length;
  const verifiedCount = pages.filter((p) => p.isVerified).length;

  return (
    <AdminShell>
      <div className="space-y-7 pb-20 max-w-7xl mx-auto text-right">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl shadow-[0_10px_38px_rgba(0,0,0,0.6)] flex items-center gap-3 text-sm font-bold border backdrop-blur-xl transition-all animate-in fade-in slide-in-from-top-4 ${
              toastMessage.type === 'error'
                ? 'bg-red-950/95 text-red-100 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.35)]'
                : 'bg-emerald-950/95 text-emerald-100 border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 🌟 Header Section: Egyptian Command Deck with Glowing Halo */}
        <div className="relative overflow-hidden rounded-3xl p-7 bg-gradient-to-l from-[#0D1F38]/95 via-[#0A1627]/98 to-[#060D19]/95 border border-cyan-500/35 shadow-[0_0_40px_rgba(31,107,122,0.22)] backdrop-blur-2xl">
          {/* Subtle Ambient Light Orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-600/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_24px_rgba(45,138,156,0.35)] shrink-0">
                <Globe className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    إدارة الصفحات العامة والرسمية
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(45,138,156,0.3)]">
                    ★ Pages Command Deck
                  </span>
                </div>
                <p className="text-sm text-[#8B9CB0] font-medium leading-relaxed">
                  التحكم المركزي في الصفحات التجارية والرسمية: فحص منشئ الصفحة، مراقبة اكتمال البيانات، والتعطيل الفوري لمنع الفتح.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/15 hover:border-cyan-400 gap-2 px-4 py-2.5 rounded-xl shadow-[0_0_16px_rgba(31,107,122,0.2)] transition-all font-bold"
              >
                <RotateCcw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                تحديث البيانات اللحظية
              </Button>
            </div>
          </div>
        </div>

        {/* 📊 Glowing KPIs Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group relative rounded-2xl p-5 bg-[#0D1828]/90 border border-slate-700/60 hover:border-cyan-500/60 shadow-[0_0_20px_rgba(15,27,45,0.4)] hover:shadow-[0_0_30px_rgba(45,138,156,0.25)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold">إجمالي الصفحات</p>
                <p className="text-3xl font-black text-white mt-1.5 tabular-nums">{totalCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(45,138,156,0.2)]">
                <Globe className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl p-5 bg-[#0D1828]/90 border border-slate-700/60 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(15,27,45,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold">صفحات نشطة وتفتح</p>
                <p className="text-3xl font-black text-emerald-400 mt-1.5 tabular-nums">{activeCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl p-5 bg-[#0D1828]/90 border border-red-900/50 hover:border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-300 font-bold">صفحات معطلة ومحظورة</p>
                <p className="text-3xl font-black text-red-400 mt-1.5 tabular-nums">{suspendedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                <Ban className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="group relative rounded-2xl p-5 bg-[#0D1828]/90 border border-slate-700/60 hover:border-amber-500/60 shadow-[0_0_20px_rgba(15,27,45,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold">موثقة بشارة رسمية</p>
                <p className="text-3xl font-black text-amber-400 mt-1.5 tabular-nums">{verifiedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <BadgeCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* 🔍 Search & Filters Bar */}
        <div className="bg-[#0A1424]/95 border border-cyan-500/25 rounded-2xl p-4 shadow-[0_0_25px_rgba(15,27,45,0.5)]">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ابحث باسم الصفحة، المعرف (@slug)، أو اسم صاحب الصفحة/المنشئ..."
                className="w-full pl-4 pr-10 py-3 bg-[#060D1A] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#060D1A] border border-slate-700/80 text-sm text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كافة الحالات (النشطة والمعطلة)</option>
              <option value="Active">النشطة فقط (تفتح عادي)</option>
              <option value="Suspended">المعطلة والمحظورة فقط</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#060D1A] border border-slate-700/80 text-sm text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">كافة التصنيفات التجارية</option>
              {Object.entries(CATEGORIES_MAP).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#060D1A] border border-slate-700/80 text-sm text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">حالة التوثيق (الكل)</option>
              <option value="verified">الموثقة بشارة رسمية</option>
              <option value="unverified">غير الموثقة</option>
            </select>
          </div>
        </div>

        {/* 🎴 Iconic Glowing Cards Grid */}
        {isLoading ? (
          <div className="bg-[#0A1424] border border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-slate-400 gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(45,138,156,0.4)]" />
            <p className="text-base font-bold text-slate-200">جاري مسح ورصد بيانات الصفحات العامة...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="bg-[#0A1424] border border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400">
              <Globe className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold text-white">لم يتم العثور على أي صفحات</p>
            <p className="text-xs text-slate-400 max-w-md">
              لا توجد صفحات مطابقة لكلمات البحث أو التصفية الحالية. يمكنك كتابة اسم آخر أو تصفير الفلاتر.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPages.map((pageItem) => {
              const isSuspended = pageItem.status === 'Suspended';
              const audit = calculatePageCompleteness(pageItem);

              return (
                <div
                  key={pageItem.id}
                  className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between backdrop-blur-xl ${
                    isSuspended
                      ? 'bg-gradient-to-b from-[#1A0B0E]/95 via-[#13070A]/95 to-[#0A0406]/98 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.22)] hover:border-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                      : pageItem.isVerified
                      ? 'bg-gradient-to-b from-[#0D1C2E]/95 via-[#091524]/95 to-[#050C17]/98 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.18)] hover:border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]'
                      : 'bg-gradient-to-b from-[#0C182A]/95 via-[#081220]/95 to-[#050B14]/98 border-cyan-500/30 shadow-[0_0_25px_rgba(31,107,122,0.15)] hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(45,138,156,0.35)]'
                  }`}
                >
                  {/* Glowing Top Banner */}
                  <div className="h-32 w-full bg-slate-900 relative overflow-hidden border-b border-slate-800/80">
                    {pageItem.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pageItem.coverUrl}
                        alt="cover"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-cyan-950/80 via-blue-950 to-indigo-950 flex items-center justify-center">
                        <Globe className="w-12 h-12 text-cyan-400/20" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Top Status & Category Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                      {/* Status Badge */}
                      {isSuspended ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-red-950/90 text-red-200 border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] flex items-center gap-1.5 backdrop-blur-md animate-pulse">
                          <Ban className="w-3.5 h-3.5 text-red-400" />
                          معطلة ومحظورة (لا تفتح)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-950/90 text-emerald-200 border border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center gap-1.5 backdrop-blur-md">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          نشطة وتفتح
                        </span>
                      )}

                      {/* Category Pill */}
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/75 text-cyan-200 border border-cyan-500/30 backdrop-blur-md">
                        {CATEGORIES_MAP[pageItem.category] || pageItem.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 pt-0 pb-5 relative flex-1 flex flex-col justify-between">
                    {/* Avatar & Handles Row */}
                    <div className="flex items-end justify-between -mt-12 mb-3">
                      <div className="relative">
                        <div
                          className={`w-20 h-20 rounded-2xl bg-slate-900 border-4 overflow-hidden shadow-2xl flex items-center justify-center text-slate-400 relative ${
                            isSuspended
                              ? 'border-[#1A0B0E]'
                              : pageItem.isVerified
                              ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                              : 'border-[#0C182A] shadow-[0_0_20px_rgba(45,138,156,0.25)]'
                          }`}
                        >
                          {pageItem.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={pageItem.avatarUrl} alt={pageItem.name} className="w-full h-full object-cover" />
                          ) : (
                            <Globe className="w-9 h-9 text-cyan-400/60" />
                          )}
                        </div>

                        {/* Verified Badge Icon */}
                        {pageItem.isVerified && (
                          <div
                            className={`absolute -bottom-1 -right-1 rounded-full p-1 shadow-lg border-2 border-[#0A1424] ${
                              pageItem.verificationBadge === 'gold'
                                ? 'bg-amber-500 text-black'
                                : 'bg-cyan-500 text-white'
                            }`}
                            title="صفحة موثقة رسمياً"
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Slug Chip with Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopy(pageItem.slug, 'معرف الصفحة')}
                        className="text-xs font-mono px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(45,138,156,0.15)]"
                        title="نسخ رابط الصفحة"
                      >
                        {copiedText === pageItem.slug ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-sans">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>@{pageItem.slug}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Page Name & Bio */}
                    <div className="space-y-1.5 mb-3.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white tracking-tight line-clamp-1">{pageItem.name}</h3>
                        {pageItem.isVerified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            موثقة
                          </span>
                        )}
                      </div>

                      {pageItem.bio ? (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{pageItem.bio}</p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">لا توجد نبذة مختصرة مسجلة</p>
                      )}
                    </div>

                    {/* 👤 Who created / owns this page (منشئ ومخصص لمن) */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-cyan-500/20 mb-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold">منشئ ومالك الصفحة:</span>
                          </div>
                          <p className="text-xs font-black text-cyan-100 truncate">{pageItem.ownerName}</p>
                        </div>
                      </div>

                      <Link
                        href={`/admin/users/${pageItem.ownerUserId}`}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                        title="فتح ملف المالك"
                      >
                        <span>بروفايله</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* 🚦 Profile Completeness Audit (إيه اللي كامل وإيه اللي ناقص) */}
                    <div className="p-3 rounded-2xl bg-black/30 border border-slate-800/80 mb-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          اكتمال بيانات الصفحة:
                        </span>
                        <span
                          className={`font-black tabular-nums text-xs ${
                            audit.score >= 80 ? 'text-emerald-400' : audit.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {audit.score}%
                        </span>
                      </div>

                      {/* Glowing Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            audit.score >= 80
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : audit.score >= 50
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                              : 'bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                          }`}
                          style={{ width: `${audit.score}%` }}
                        />
                      </div>

                      {/* Missing fields warning pills */}
                      {audit.missingItems.length > 0 ? (
                        <div className="pt-1 flex flex-wrap gap-1">
                          {audit.missingItems.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                            >
                              <span>{item.icon}</span> ناقص {item.label}
                            </span>
                          ))}
                          {audit.missingItems.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{audit.missingItems.length - 3} نواقص
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          كافة البيانات مكتملة بالكامل 100%
                        </div>
                      )}
                    </div>

                    {/* Suspension Notice if Suspended */}
                    {isSuspended && pageItem.suspensionReason && (
                      <div className="p-3 mb-3.5 rounded-2xl bg-red-950/70 border border-red-500/60 text-xs text-red-200 flex items-start gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-red-300">سبب التعطيل الحالي: </span>
                          <span>{pageItem.suspensionReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Metrics Row */}
                    <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 rounded-xl bg-black/40 border border-slate-800 mb-3.5 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                          <Users className="w-3 h-3 text-cyan-400" />
                          المتابعين
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5 tabular-nums">{pageItem.followersCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                          <Heart className="w-3 h-3 text-rose-400" />
                          الإعجاب
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5 tabular-nums">{pageItem.likesCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                          <FileText className="w-3 h-3 text-amber-400" />
                          المنشورات
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5 tabular-nums">{pageItem.postsCount}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                          <Film className="w-3 h-3 text-purple-400" />
                          الريلز
                        </p>
                        <p className="text-xs font-bold text-white mt-0.5 tabular-nums">{pageItem.reelsCount}</p>
                      </div>
                    </div>

                    {/* ⚡ DIRECT ACTION BUTTONS (تشمل زر التعطيل الفوري المباشر) */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      {/* زر التعطيل/التنشيط المباشر المتوهج */}
                      {isSuspended ? (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspendDirect(pageItem)}
                          disabled={moderateMutation.isPending}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/60 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)]"
                        >
                          <Unlock className="w-4 h-4 text-emerald-400" />
                          إلغاء التعطيل وتنشيط الصفحة فوراً ✅
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspendDirect(pageItem)}
                          disabled={moderateMutation.isPending}
                          className="w-full py-2.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/60 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_25px_rgba(239,68,68,0.45)]"
                        >
                          <Lock className="w-4 h-4 text-red-400" />
                          تعطيل الصفحة (منع الفتح مع المستخدم) ⛔
                        </button>
                      )}

                      {/* أزرار التفاصيل والأمان والحذف */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPage(pageItem)}
                          className="border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyan-200 text-xs gap-1.5 font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          كل البيانات
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModerationModal(pageItem)}
                          className="border-slate-700 bg-slate-800/40 hover:bg-slate-700 text-slate-200 text-xs gap-1.5 font-bold"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          خيارات الأمان
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmPage(pageItem)}
                          className="border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-900/40 text-xs gap-1 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ----------------- MODAL: COMPLETE PAGE DETAILS (عرض كافة بيانات الصفحة التفصيلية) ----------------- */}
        {selectedPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#0B1528] border border-cyan-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(31,107,122,0.3)]">
              {/* Modal Cover */}
              <div className="relative h-44 bg-slate-900 shrink-0">
                {selectedPage.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedPage.coverUrl} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 flex items-center justify-center">
                    <Globe className="w-16 h-16 text-cyan-400/30" />
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedPage(null)}
                  className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {selectedPage.status === 'Suspended' ? (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-red-950/90 text-red-200 border border-red-500 flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                      <Ban className="w-4 h-4 text-red-400" />
                      معطلة ومحظورة إدارياً
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-950/90 text-emerald-200 border border-emerald-500 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      نشطة ومصرحة
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="absolute -bottom-8 right-8 flex items-end gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-[#0B1528] overflow-hidden shadow-2xl flex items-center justify-center text-slate-400 relative">
                    {selectedPage.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedPage.avatarUrl} alt={selectedPage.name} className="w-full h-full object-cover" />
                    ) : (
                      <Globe className="w-10 h-10 text-cyan-400/60" />
                    )}
                    {selectedPage.isVerified && (
                      <div className="absolute bottom-1 right-1 bg-amber-500 text-black rounded-full p-1 shadow border border-white/40">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="p-8 pt-12 overflow-y-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-white">{selectedPage.name}</h2>
                      {selectedPage.isVerified && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          {selectedPage.verificationCategory || 'موثقة'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-cyan-400 font-mono">@{selectedPage.slug}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-300">{CATEGORIES_MAP[selectedPage.category] || selectedPage.category}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">تاريخ الإنشاء: {formatArabicDate(selectedPage.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedPage.status === 'Suspended' ? (
                      <Button
                        size="sm"
                        onClick={() => handleToggleSuspendDirect(selectedPage)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        <Unlock className="w-4 h-4 mr-1" />
                        تنشيط الصفحة الآن
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleToggleSuspendDirect(selectedPage)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold"
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        تعطيل الصفحة فوراً
                      </Button>
                    )}
                  </div>
                </div>

                {/* Audit Grid */}
                {(() => {
                  const audit = calculatePageCompleteness(selectedPage);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Completed */}
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                        <p className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          البيانات المكتملة ({audit.completedItems.length}):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {audit.completedItems.map((item, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                              {item.icon} {item.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing */}
                      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                        <p className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          البيانات الناقصة التي لم تُسجل ({audit.missingItems.length}):
                        </p>
                        {audit.missingItems.length === 0 ? (
                          <p className="text-xs text-emerald-400 font-bold">لا توجد نواقص، الصفحة كاملة 100%!</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {audit.missingItems.map((item, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-200 border border-amber-500/20">
                                {item.icon} ناقص: {item.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Details Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Info */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      معلومات الاتصال والموقع
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">رقم الهاتف:</span>
                        <span className="font-mono text-white">{selectedPage.phoneNumber || 'غير مسجل'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">رقم الواتساب:</span>
                        <span className="font-mono text-emerald-400">{selectedPage.whatsAppNumber || 'غير مسجل'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">البريد الإلكتروني:</span>
                        <span className="text-white">{selectedPage.email || 'غير مسجل'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">الموقع الإلكتروني:</span>
                        {selectedPage.websiteUrl ? (
                          <a href={selectedPage.websiteUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                            {selectedPage.websiteUrl}
                          </a>
                        ) : (
                          <span className="text-slate-500">غير مسجل</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-400">المدينة / المحافظة:</span>
                        <span className="text-white">{selectedPage.city || selectedPage.governorate || 'غير محدد'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner & Identifiers */}
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-400" />
                      بيانات المنشئ والمالك الرسمي
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">اسم المالك:</span>
                        <span className="font-bold text-cyan-200">{selectedPage.ownerName}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">معرف المالك (User ID):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedPage.ownerUserId, 'معرف المالك')}
                          className="font-mono text-[11px] text-slate-300 hover:text-cyan-300"
                        >
                          {selectedPage.ownerUserId}
                        </button>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">معرف الصفحة (Page ID):</span>
                        <span className="font-mono text-[11px] text-slate-400">{selectedPage.id}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-400">زر الإجراء (CTA):</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                          {selectedPage.actionType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {selectedPage.about && (
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <h4 className="text-sm font-bold text-white">تفاصيل عن الصفحة والنشاط:</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedPage.about}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: QUICK SUSPEND REASON CONFIRMATION ----------------- */}
        {quickSuspendTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#12070A] border border-red-500/60 rounded-3xl p-6 w-full max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.4)] space-y-5 text-right">
              <div className="flex items-center gap-3 border-b border-red-900/60 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">تعطيل وإيقاف صفحة «{quickSuspendTarget.name}»</h3>
                  <p className="text-xs text-red-300">سيتم حجب الصفحة فوراً ولن تفتح مع أي مستخدم أو زائر</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200">اختر سبب التعطيل:</label>
                <div className="space-y-1.5">
                  {SUSPENSION_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickSuspendReason(preset)}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold text-right border transition-all ${
                        quickSuspendReason === preset
                          ? 'bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                          : 'bg-black/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-300">أو اكتب سبباً مخصصاً:</label>
                  <textarea
                    value={quickSuspendReason}
                    onChange={(e) => setQuickSuspendReason(e.target.value)}
                    rows={2}
                    className="w-full mt-1.5 p-3 rounded-xl bg-black/50 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    placeholder="اكتب سبب التعطيل بالتفصيل..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-red-900/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickSuspendTarget(null)}
                  className="border-slate-700 text-slate-300 font-bold"
                >
                  إلغاء التراجع
                </Button>
                <Button
                  size="sm"
                  disabled={moderateMutation.isPending}
                  onClick={() => {
                    moderateMutation.mutate({
                      id: quickSuspendTarget.id,
                      status: 'Suspended',
                      suspensionReason: quickSuspendReason,
                      isVerified: quickSuspendTarget.isVerified,
                      verificationCategory: quickSuspendTarget.verificationCategory,
                    });
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-black shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  تأكيد تعطيل الصفحة ⛔
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: SECURITY & MODERATION (الأمان والتوثيق) ----------------- */}
        {moderatingPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#0B1528] border border-cyan-500/50 rounded-3xl p-6 w-full max-w-xl shadow-[0_0_50px_rgba(31,107,122,0.4)] space-y-6 text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">إعدادات الأمان والتوثيق</h3>
                    <p className="text-xs text-slate-400">صفحة: {moderatingPage.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setModeratingPage(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">حالة الصفحة والأمان:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModStatus('Active')}
                    className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      modStatus === 'Active'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    نشطة ومصرحة (Active)
                  </button>

                  <button
                    type="button"
                    onClick={() => setModStatus('Suspended')}
                    className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                      modStatus === 'Suspended'
                        ? 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Ban className="w-4 h-4 text-red-400" />
                    معطلة ومحظورة (Suspended)
                  </button>
                </div>
              </div>

              {modStatus === 'Suspended' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-red-300">سبب الإيقاف والحظر:</label>
                  <textarea
                    value={modReason}
                    onChange={(e) => setModReason(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-black/50 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              {/* Verification Section */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">شارة التوثيق الرسمية المعتمدة</p>
                    <p className="text-[11px] text-slate-400">تفعيل الشارة الزرقاء أو الذهبية بجانب اسم الصفحة</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={modIsVerified}
                    onChange={(e) => setModIsVerified(e.target.checked)}
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                {modIsVerified && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-cyan-300">تصنيف شارة التوثيق:</label>
                    <select
                      value={modVerificationCategory}
                      onChange={(e) => setModVerificationCategory(e.target.value)}
                      className="w-full p-3 bg-black/50 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      {Object.entries(VERIFICATION_CATEGORIES).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setModeratingPage(null)} className="border-slate-700 text-slate-300">
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  disabled={moderateMutation.isPending}
                  onClick={() => {
                    moderateMutation.mutate({
                      id: moderatingPage.id,
                      status: modStatus,
                      suspensionReason: modStatus === 'Suspended' ? modReason : undefined,
                      isVerified: modIsVerified,
                      verificationCategory: modIsVerified ? modVerificationCategory : undefined,
                    });
                  }}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-[0_0_20px_rgba(45,138,156,0.4)]"
                >
                  حفظ وتطبيق التغييرات
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MODAL: DELETE CONFIRMATION ----------------- */}
        {deleteConfirmPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#12070A] border border-red-500/60 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.4)] space-y-4 text-right">
              <div className="flex items-center gap-3 text-red-400">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-black text-white">تأكيد مسح الصفحة نهائياً؟</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت متأكد من حذف صفحة «{deleteConfirmPage.name}» نهائياً؟ سيتم مسح المنشورات والمتابعات بالكامل ولا يمكن التراجع!
              </p>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-950">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirmPage(null)} className="border-slate-700 text-slate-300">
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(deleteConfirmPage.id)}
                  className="bg-red-600 hover:bg-red-500 text-white font-black"
                >
                  مسح نهائي الآن
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
