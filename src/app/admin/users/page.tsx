'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { FlashBanner } from '@/components/ui/FlashBanner';
import { adminApi } from '@/api/admin';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAdminQueryEnabled } from '@/hooks/useAdminQueryEnabled';
import { formatArabicDate, formatRelativeArabicTime } from '@/lib/utils';
import { resolveMediaUrl } from '@/lib/media';
import {
  Search,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Users,
  Ban,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  Crown,
  Edit3,
  Trash2,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  X,
  Lock,
  Unlock,
  BadgeCheck,
  Eye,
  CheckCheck,
  Calendar,
  Zap,
  Info,
  Maximize2,
  ZoomIn,
} from 'lucide-react';
import { AdminVerifiedBadge } from '@/components/ui/AdminVerifiedBadge';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { useFlash } from '@/components/ui/FlashProvider';
import { useAuth } from '@/hooks/useAuth';
import { AdminUserListItem } from '@/types/admin';

/* -------------------------------------------------------------------------- */
/* Completeness Audit Types & Engine                                          */
/* -------------------------------------------------------------------------- */

interface AuditItem {
  key: string;
  label: string;
  icon: string;
  value?: string | null;
  importance?: 'high' | 'medium' | 'low';
  hint?: string;
}

interface UserCompletenessAudit {
  score: number;
  completedCount: number;
  totalCount: number;
  completedItems: AuditItem[];
  missingItems: AuditItem[];
}

function auditUserCompleteness(user: AdminUserListItem): UserCompletenessAudit {
  const completed: AuditItem[] = [];
  const missing: AuditItem[] = [];

  // 1. Phone Number (Mandatory)
  if (user.phoneNumber && user.phoneNumber.trim().length > 0) {
    completed.push({
      key: 'phone',
      label: 'رقم الهاتف المسجل',
      icon: '📱',
      value: user.phoneNumber,
    });
  } else {
    missing.push({
      key: 'phone',
      label: 'رقم الهاتف',
      icon: '📱',
      importance: 'high',
      hint: 'رقم الهاتف مفقود أو غير مسجل',
    });
  }

  // 2. Full Name
  if (user.name && user.name.trim().length > 0) {
    completed.push({
      key: 'name',
      label: 'الاسم الكامل',
      icon: '👤',
      value: user.name,
    });
  } else {
    missing.push({
      key: 'name',
      label: 'الاسم الكامل',
      icon: '👤',
      importance: 'high',
      hint: 'الاسم فارغ أو غير محدد',
    });
  }

  // 3. Username Handle
  if (user.username && user.username.trim().length > 0) {
    completed.push({
      key: 'username',
      label: 'المعرف الفريد',
      icon: '🏷️',
      value: `@${user.username}`,
    });
  } else {
    missing.push({
      key: 'username',
      label: 'اسم المستخدم (@username)',
      icon: '🏷️',
      importance: 'medium',
      hint: 'لم يقم المستخدم بتعيين اسم معرف فريد بعد',
    });
  }

  // 4. Avatar Profile Photo
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) {
    completed.push({
      key: 'avatar',
      label: 'صورة البروفايل الشخصية',
      icon: '🖼️',
      value: 'مرفوعة وموثقة',
    });
  } else {
    missing.push({
      key: 'avatar',
      label: 'الصورة الشخصية (Avatar)',
      icon: '🖼️',
      importance: 'low',
      hint: 'لا توجد صورة بروفايل مخصصة، يُعرض الحرف الأول افتراضياً',
    });
  }

  // 5. National ID (14 digits)
  if (user.nationalId && user.nationalId.trim().length === 14) {
    completed.push({
      key: 'nationalId',
      label: 'بطاقة الرقم القومي (14 رقم)',
      icon: '🪪',
      value: user.nationalId,
    });
  } else {
    missing.push({
      key: 'nationalId',
      label: 'بطاقة الرقم القومي (14 رقم)',
      icon: '🪪',
      importance: 'high',
      hint: 'لم تُسجل بطاقة الرقم القومي المصرية بعد — مهمة للتوثيق والخدمات',
    });
  }

  // 6. Email Address & Email Verification
  if (user.email && user.email.trim().length > 0) {
    if (user.isEmailVerified) {
      completed.push({
        key: 'email',
        label: 'البريد الإلكتروني (موثق بالرمز)',
        icon: '✉️',
        value: `${user.email} (موثق ✅)`,
      });
    } else {
      completed.push({
        key: 'email_unverified',
        label: 'البريد الإلكتروني (مسجل فقط)',
        icon: '✉️',
        value: user.email,
      });
      missing.push({
        key: 'email_verification',
        label: 'توثيق البريد الإلكتروني',
        icon: '🔐',
        importance: 'medium',
        hint: 'البريد مسجل لكن لم يتم التحقق منه وتوثيقه برمز OTP بعد',
      });
    }
  } else {
    missing.push({
      key: 'email',
      label: 'البريد الإلكتروني',
      icon: '✉️',
      importance: 'medium',
      hint: 'لم يقم المستخدم بربط بريد إلكتروني بحسابه',
    });
  }

  // 7. Gender
  if (user.gender === 'Male' || user.gender === 'Female') {
    completed.push({
      key: 'gender',
      label: 'النوع الاجتماعي',
      icon: user.gender === 'Male' ? '👨' : '👩',
      value: user.genderArabic || (user.gender === 'Male' ? 'ذكر' : 'أنثى'),
    });
  } else {
    missing.push({
      key: 'gender',
      label: 'النوع (ذكر / أنثى)',
      icon: '⚧️',
      importance: 'medium',
      hint: 'لم يحدد المستخدم جنسه (ذكر أو أنثى) في إعدادات الحساب',
    });
  }

  // 8. City / Governorate
  if (user.city && user.city.trim().length > 0) {
    completed.push({
      key: 'city',
      label: 'المدينة / المحافظة',
      icon: '📍',
      value: user.city,
    });
  } else {
    missing.push({
      key: 'city',
      label: 'المدينة أو المحافظة',
      icon: '📍',
      importance: 'low',
      hint: 'لم يتم تحديد موقع المدينة الجغرافي للمستخدم',
    });
  }

  // 9. Identity Verification Badge
  if (user.isVerified) {
    completed.push({
      key: 'verified',
      label: 'شارة التوثيق الرسمية',
      icon: '🏆',
      value: 'حساب موثق رسمياً',
    });
  } else {
    missing.push({
      key: 'verified',
      label: 'توثيق الحساب الرسمي',
      icon: '🛡️',
      importance: 'low',
      hint: 'الحساب غير موثق بشارة النسر / التوثيق الرسمي بعد',
    });
  }

  // Weights calculation
  let score = 0;
  if (user.phoneNumber) score += 15;
  if (user.name) score += 15;
  if (user.nationalId && user.nationalId.trim().length === 14) score += 20;
  if (user.email) score += 10;
  if (user.isEmailVerified) score += 10;
  if (user.username) score += 10;
  if (user.gender === 'Male' || user.gender === 'Female') score += 10;
  if (user.city) score += 5;
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) score += 5;

  score = Math.min(100, Math.max(0, score));

  return {
    score,
    completedCount: completed.length,
    totalCount: completed.length + missing.length,
    completedItems: completed,
    missingItems: missing,
  };
}

const BLOCK_PRESETS = [
  'انتهاك معايير المجتمع ونشر محتوى مسيء أو غير لائق',
  'اشتباه احتيال أو انتحال صفة مستخدم أو جهة أخرى',
  'إرسال رسائل سبام أو مضايقات متكررة للمستخدمين',
  'استخدام بيانات غير حقيقية أو التلاعب بالتوثيق',
  'تجميد احترازي بناءً على بلاغات رسمية متعددة',
];

/* -------------------------------------------------------------------------- */
/* Modal: Avatar Lightbox Zoom Modal (تكبير الصورة الشخصية وإمكانية إغلاقها)    */
/* -------------------------------------------------------------------------- */

interface ZoomedAvatarData {
  url: string;
  name: string;
  username?: string | null;
  role?: string;
  isSuperAdmin?: boolean;
}

interface AvatarZoomModalProps {
  data: ZoomedAvatarData | null;
  onClose: () => void;
}

function AvatarZoomModal({ data, onClose }: AvatarZoomModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (data) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data, onClose]);

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full bg-gradient-to-b from-[#0f1724] to-[#080d14] border border-cyan-500/50 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col text-right animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>الصورة الشخصية:</span>
                <span className="text-cyan-300">{data.name}</span>
                {data.isSuperAdmin && <Crown className="w-4 h-4 text-amber-400" />}
              </h2>
              {data.username && (
                <p className="text-xs text-slate-400 font-mono dir-ltr text-right">@{data.username}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="فتح الصورة الأصلية بالحجم الكامل في نافذة جديدة"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">الحجم الأصلي</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/20 transition-colors"
              title="إغلاق النافذة (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Big Image Viewer Container */}
        <div className="p-6 flex items-center justify-center bg-black/60 min-h-[300px] max-h-[65vh] overflow-hidden">
          <div className="relative group/view rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_35px_rgba(0,0,0,0.8)] max-h-[58vh] max-w-full flex items-center justify-center">
            <img
              src={data.url}
              alt={data.name}
              className="max-h-[58vh] max-w-full object-contain rounded-2xl select-none"
            />
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="p-4 border-t border-slate-800/80 bg-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            يمكنك إغلاق الصورة بالنقر على زر الإغلاق أو مفتاح Esc
          </span>

          <button
            type="button"
            onClick={onClose}
            className="btn-glow btn-glow-ghost px-5 h-9 text-xs font-bold flex items-center gap-1.5 text-slate-200 hover:text-white border-white/20 hover:border-red-500/40 hover:bg-red-500/10"
          >
            <X className="w-3.5 h-3.5 text-red-400" />
            إغلاق الصورة
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component: UserCard (Glowing Neon Holographic Card)                       */
/* -------------------------------------------------------------------------- */

interface UserCardProps {
  user: AdminUserListItem;
  onOpenAudit: (user: AdminUserListItem) => void;
  onEdit: (user: AdminUserListItem) => void;
  onBlock: (user: AdminUserListItem) => void;
  onUnblock: (user: AdminUserListItem) => void;
  onDelete: (user: AdminUserListItem) => void;
  onZoomAvatar: (data: ZoomedAvatarData) => void;
  isSelf: boolean;
}

function UserCard({
  user,
  onOpenAudit,
  onEdit,
  onBlock,
  onUnblock,
  onDelete,
  onZoomAvatar,
  isSelf,
}: UserCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedNationalId, setCopiedNationalId] = useState(false);
  const [imgError, setImgError] = useState(false);

  const audit = useMemo(() => auditUserCompleteness(user), [user]);

  const handleCopy = (text: string, type: 'id' | 'phone' | 'nid') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } else if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 1800);
    } else {
      setCopiedNationalId(true);
      setTimeout(() => setCopiedNationalId(false), 1800);
    }
  };

  // Card Glow Theme
  const cardTheme = useMemo(() => {
    if (user.isBlocked) {
      return {
        wrap: 'border-red-500/50 bg-gradient-to-b from-[#180a0d] via-[#110d14] to-[#0c0f17] shadow-[0_0_30px_rgba(239,68,68,0.22)] ring-1 ring-red-500/30',
        badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        glow: 'from-red-500/10 to-transparent',
      };
    }
    if (user.isSuperAdmin) {
      return {
        wrap: 'border-amber-500/50 bg-gradient-to-b from-[#1a1408] via-[#141217] to-[#0c0f17] shadow-[0_0_35px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/40',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        glow: 'from-amber-500/15 to-transparent',
      };
    }
    if (user.role === 'Admin') {
      return {
        wrap: 'border-cyan-500/45 bg-gradient-to-b from-[#091b22] via-[#0d161d] to-[#0a0f16] shadow-[0_0_30px_rgba(6,182,212,0.22)] ring-1 ring-cyan-500/30',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        glow: 'from-cyan-500/15 to-transparent',
      };
    }
    return {
      wrap: 'border-[rgba(31,107,122,0.35)] bg-gradient-to-b from-[#0f1722]/90 to-[#080d14]/95 shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_0_35px_rgba(31,107,122,0.35)] hover:border-cyan-400/60 ring-1 ring-cyan-500/10',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      glow: 'from-cyan-500/10 to-transparent',
    };
  }, [user.isBlocked, user.isSuperAdmin, user.role]);

  const resolvedAvatar = useMemo(() => {
    return user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '';
  }, [user.avatarUrl]);

  return (
    <div
      className={`relative group rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between overflow-hidden ${cardTheme.wrap}`}
    >
      {/* Background Radial Glow */}
      <div
        className={`absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br ${cardTheme.glow} rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div className="relative z-10 space-y-4">
        {/* Top Bar: Status Badges & Quick Role */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {user.isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-amber-300 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                سوبر أدمن
              </span>
            )}

            {user.role === 'Admin' && !user.isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                مدير نظام
              </span>
            )}

            {user.role === 'User' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10">
                مستخدم عادي
              </span>
            )}

            {user.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#C4A35A]/20 text-[#E7C875] border border-[#C4A35A]/40 shadow-[0_0_10px_rgba(196,163,90,0.3)]">
                <BadgeCheck className="w-3.5 h-3.5" />
                موثق
              </span>
            )}
          </div>

          <div>
            {user.isBlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.4)]">
                <Ban className="w-3.5 h-3.5" />
                محظور وموقوف 🚫
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                نشط ومتصل ✅
              </span>
            )}
          </div>
        </div>

        {/* User Identity Section */}
        <div className="flex items-start gap-3.5 pt-1">
          {/* Avatar with glowing ring & Zoom on Click */}
          <div className="relative shrink-0">
            <div
              className={`w-14 h-14 rounded-2xl p-0.5 shadow-lg overflow-hidden flex items-center justify-center font-black text-lg transition-transform duration-300 group-hover:scale-105 ${
                user.isBlocked
                  ? 'bg-gradient-to-tr from-red-600 to-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : user.isSuperAdmin
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : 'bg-gradient-to-tr from-[#1F6B7A] to-[#38bdf8] shadow-[0_0_20px_rgba(45,138,156,0.4)]'
              }`}
            >
              <div
                className={`w-full h-full rounded-[14px] bg-[#0c141d] overflow-hidden flex items-center justify-center text-[#38bdf8] relative group/avatar ${
                  resolvedAvatar && !imgError ? 'cursor-pointer' : ''
                }`}
                onClick={() => {
                  if (resolvedAvatar && !imgError) {
                    onZoomAvatar({
                      url: resolvedAvatar,
                      name: user.name,
                      username: user.username,
                      role: user.role,
                      isSuperAdmin: user.isSuperAdmin,
                    });
                  }
                }}
                title={resolvedAvatar && !imgError ? 'اضغط لتكبير الصورة الشخصية 🔍' : user.name}
              >
                {resolvedAvatar && !imgError ? (
                  <>
                    <img
                      src={resolvedAvatar}
                      alt={user.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/avatar:scale-110"
                      onError={() => setImgError(true)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-4 h-4 text-cyan-300 drop-shadow" />
                    </div>
                  </>
                ) : (
                  <span>{user.name?.charAt(0) || 'U'}</span>
                )}
              </div>
            </div>

            {/* Micro indicator badge */}
            <span
              className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-[#0c141d] flex items-center justify-center text-[8px] ${
                user.isBlocked ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
              }`}
              title={user.isBlocked ? 'محظور' : 'نشط'}
            >
              {user.isBlocked ? '✕' : '✓'}
            </span>
          </div>

          {/* Name & Handle */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-black text-white truncate hover:text-cyan-300 transition-colors">
                {user.name}
              </h3>
              {(user.role === 'Admin' || user.isSuperAdmin) && (
                <AdminVerifiedBadge title="حساب إدارة معتمد وموثق" />
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              {user.username ? (
                <span className="font-mono text-cyan-400 font-semibold dir-ltr">
                  @{user.username}
                </span>
              ) : (
                <span className="text-amber-400/90 text-[11px] font-medium inline-flex items-center gap-1">
                  <span>⚠️</span> بدون معرف
                </span>
              )}

              <span className="text-slate-600">•</span>

              <button
                type="button"
                onClick={() => handleCopy(user.id, 'id')}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors bg-white/5 px-1.5 py-0.5 rounded"
                title={`نسخ المعرف: ${user.id}`}
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>ID: {user.id.slice(0, 6)}...</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                مسجل {formatRelativeArabicTime(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Registered Data Matrix (كافة البيانات المسجلة) */}
        <div className="bg-[#0b121b]/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-300">
          {/* Phone */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
            <span className="text-slate-400 inline-flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              رقم الهاتف:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-white dir-ltr">{user.phoneNumber}</span>
              <button
                type="button"
                onClick={() => handleCopy(user.phoneNumber, 'phone')}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                title="نسخ رقم الهاتف"
              >
                {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* National ID */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
            <span className="text-slate-400 inline-flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              الرقم القومي:
            </span>
            <div>
              {user.nationalId ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 dir-ltr">
                    {user.nationalId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.nationalId!, 'nid')}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-colors"
                    title="نسخ الرقم القومي"
                  >
                    {copiedNationalId ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 animate-pulse">
                  <span>⚠️</span> غير مسجل (ناقص)
                </span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
            <span className="text-slate-400 inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              البريد:
            </span>
            <div className="max-w-[65%] truncate">
              {user.email ? (
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="font-mono text-slate-200 truncate dir-ltr text-[11px]">
                    {user.email}
                  </span>
                  {user.isEmailVerified ? (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0"
                      title="تم التحقق من البريد بنجاح"
                    >
                      موثق ✅
                    </span>
                  ) : (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0"
                      title="البريد مسجل لكنه غير موثق بعد"
                    >
                      غير موثق ⚠️
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-500 text-[11px] font-medium">غير مسجل (ناقص)</span>
              )}
            </div>
          </div>

          {/* Gender & City */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">النوع:</span>
              {user.gender === 'Male' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 inline-flex items-center gap-1">
                  <span>👨</span> ذكر
                </span>
              ) : user.gender === 'Female' ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30 inline-flex items-center gap-1">
                  <span>👩</span> أنثى
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ⚠️ لم يحدد
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user.city || 'المدينة غير محددة'}</span>
            </div>
          </div>
        </div>

        {/* Profile Completeness Radar & Missing Fields Meter */}
        <div className="bg-[#0f1924]/90 border border-cyan-900/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              مؤشر اكتمال البيانات:
            </span>
            <span
              className={`font-black font-mono px-2 py-0.5 rounded text-[11px] ${
                audit.score >= 80
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : audit.score >= 50
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {audit.score}%
            </span>
          </div>

          {/* Glowing Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                audit.score >= 80
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : audit.score >= 50
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              }`}
              style={{ width: `${audit.score}%` }}
            />
          </div>

          {/* Missing Fields Tags */}
          {audit.missingItems.length > 0 ? (
            <div className="pt-1 space-y-1">
              <div className="text-[11px] text-amber-300/90 font-bold flex items-center justify-between">
                <span>ما هو ناقص لسه ({audit.missingItems.length} بيانات):</span>
                <button
                  type="button"
                  onClick={() => onOpenAudit(user)}
                  className="text-cyan-400 hover:text-cyan-300 underline text-[10px]"
                >
                  فحص التفاصيل
                </button>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {audit.missingItems.slice(0, 3).map((item) => (
                  <span
                    key={item.key}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25 inline-flex items-center gap-1"
                    title={item.hint}
                  >
                    <span>{item.icon}</span> {item.label}
                  </span>
                ))}
                {audit.missingItems.length > 3 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-400">
                    +{audit.missingItems.length - 3} أخرى
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تهانينا! كافة البيانات الأساسية مسجلة ومكتملة 100%</span>
            </div>
          )}
        </div>

        {/* Reason if blocked */}
        {user.isBlocked && user.blockReason && (
          <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 space-y-1">
            <span className="font-bold flex items-center gap-1 text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" /> سبب الحظر:
            </span>
            <p className="text-[11px] leading-relaxed text-red-200/90">{user.blockReason}</p>
          </div>
        )}
      </div>

      {/* Action Buttons (Glowing Cyber Buttons) */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80 mt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/admin/users/${user.id}`}
            className="btn-glow btn-glow-ghost h-9 text-xs justify-center font-bold"
            title="عرض ملف المستخدم ونشاطه بالكامل"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            فتح البروفايل
          </Link>

          <button
            type="button"
            onClick={() => onEdit(user)}
            className="btn-glow btn-glow-secondary h-9 text-xs justify-center font-bold text-cyan-300 border-cyan-500/30"
            title="تعديل بيانات المستخدم والتحكم برتبته"
          >
            <Edit3 className="w-3.5 h-3.5" />
            تعديل
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {user.isBlocked ? (
            <button
              type="button"
              onClick={() => onUnblock(user)}
              className="btn-glow bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-400 h-9 text-xs justify-center font-bold"
              title="إلغاء حظر المستخدم وإعادة تفعيل حسابه"
            >
              <Unlock className="w-3.5 h-3.5" />
              إلغاء الحظر 🔓
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onBlock(user)}
              disabled={isSelf}
              className="btn-glow btn-glow-danger h-9 text-xs justify-center font-bold disabled:opacity-40"
              title={isSelf ? 'لا يمكنك حظر حسابك' : 'حظر الحساب ومنع دخوله للمنصة'}
            >
              <Lock className="w-3.5 h-3.5" />
              حظر الحساب 🚫
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenAudit(user)}
            className="btn-glow btn-glow-ghost text-slate-300 hover:text-white h-9 text-xs justify-center font-bold"
            title="فحص شامل للبيانات الكاملة والناقصة"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            فحص البيانات
          </button>
        </div>

        {!isSelf && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onDelete(user)}
              className="w-full text-[11px] text-red-400/80 hover:text-red-300 hover:bg-red-500/10 py-1.5 rounded-lg border border-transparent hover:border-red-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              مسح المستخدم نهائياً من قاعدة البيانات
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal: Deep User Audit Modal (فحص البيانات المسجلة والناقصة بالتفصيل)       */
/* -------------------------------------------------------------------------- */

interface UserAuditModalProps {
  user: AdminUserListItem | null;
  onClose: () => void;
  onEdit: (user: AdminUserListItem) => void;
  onZoomAvatar: (data: ZoomedAvatarData) => void;
}

function UserAuditModal({ user, onClose, onEdit, onZoomAvatar }: UserAuditModalProps) {
  if (!user) return null;

  const audit = auditUserCompleteness(user);
  const resolvedAvatar = user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0f1722] to-[#080d14] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(31,107,122,0.35)] overflow-hidden max-h-[90vh] flex flex-col text-right">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shrink-0 ${
                resolvedAvatar ? 'cursor-pointer hover:scale-105 transition-transform' : ''
              }`}
              onClick={() => {
                if (resolvedAvatar) {
                  onZoomAvatar({
                    url: resolvedAvatar,
                    name: user.name,
                    username: user.username,
                    role: user.role,
                    isSuperAdmin: user.isSuperAdmin,
                  });
                }
              }}
              title={resolvedAvatar ? 'اضغط لتكبير الصورة الشخصية 🔍' : user.name}
            >
              <div className="w-full h-full bg-[#0c141d] rounded-[10px] flex items-center justify-center text-cyan-300 font-bold overflow-hidden relative">
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                ) : (
                  <span>{user.name.charAt(0)}</span>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>تقرير فحص بيانات:</span>
                <span className="text-cyan-300">{user.name}</span>
              </h2>
              <p className="text-xs text-slate-400">
                المعرف: <span className="font-mono text-slate-300">@{user.username || user.id.slice(0, 8)}</span> •{' '}
                رقم الهاتف: <span className="font-mono text-cyan-300 dir-ltr">{user.phoneNumber}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Score Card Banner */}
          <div className="p-4 rounded-xl bg-[#0b1420] border border-cyan-500/30 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400">نسبة اكتمال ملف المستخدم</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white font-mono">{audit.score}%</span>
                <span className="text-xs text-slate-400">
                  ({audit.completedCount} من {audit.totalCount} معايير مسجلة)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {audit.score >= 80
                  ? 'الملف مكتمل بنسبة ممتازة ويفي بجميع متطلبات الخدمات والتوثيق.'
                  : audit.score >= 50
                  ? 'الملف متوسط الاكتمال؛ هناك بيانات إضافية يفضل استكمالها.'
                  : 'الملف بحاجة لاستكمال عاجل لبيانات الرقم القومي والبريد.'}
              </p>
            </div>

            <div className="w-16 h-16 shrink-0 rounded-full border-4 border-cyan-500/30 flex items-center justify-center font-black text-cyan-300 text-lg bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {audit.score}%
            </div>
          </div>

          {/* Section: Missing Fields (ما هو ناقص لسه) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>ما هو ناقص لسه وغير مسجل ({audit.missingItems.length}):</span>
            </div>

            {audit.missingItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>جميع البيانات مكتملة ولا يوجد أي حقول ناقصة في هذا الحساب!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {audit.missingItems.map((item) => (
                  <div
                    key={item.key}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <span>{item.icon}</span> {item.label}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          item.importance === 'high'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : item.importance === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.importance === 'high'
                          ? 'حرج ومهم'
                          : item.importance === 'medium'
                          ? 'هام'
                          : 'اختياري'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.hint}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Completed Fields (البيانات المسجلة بالكامل) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-400">
              <CheckCheck className="w-4 h-4" />
              <span>البيانات المسجلة والمعتمدة ({audit.completedItems.length}):</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {audit.completedItems.map((item) => (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>{item.icon}</span> {item.label}
                    </span>
                    {item.value && (
                      <span className="text-[11px] font-mono text-emerald-300/90 block dir-ltr text-right">
                        {item.value}
                      </span>
                    )}
                  </div>
                  <span className="text-emerald-400 font-bold text-sm">✓</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn-glow btn-glow-ghost px-4 h-9 text-xs"
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(user);
            }}
            className="btn-glow btn-glow-primary px-4 h-9 text-xs flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            تعديل بيانات المستخدم واستكمال النواقص
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal: Fast Block Modal (نافذة الحظر السريع للمستخدم)                      */
/* -------------------------------------------------------------------------- */

interface BlockModalProps {
  user: AdminUserListItem | null;
  onClose: () => void;
  onConfirm: (userId: string, reason: string) => Promise<void>;
}

function BlockUserModal({ user, onClose, onConfirm }: BlockModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(user.id, reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#180a0d] to-[#0c0f17] border border-red-500/50 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden text-right">
        <div className="p-5 border-b border-red-500/30 flex items-center justify-between bg-red-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                حظر المستخدم: <span className="text-red-400">{user.name}</span>
              </h2>
              <p className="text-xs text-red-300/80">سيتم منع المستخدم من تسجيل الدخول واستخدام حسابه فوراً.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200">اختر سبباً شائعاً للحظر:</label>
            <div className="space-y-1.5">
              {BLOCK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(p)}
                  className={`w-full text-right p-2.5 rounded-xl text-xs border transition-all ${
                    reason === p
                      ? 'bg-red-500/20 border-red-400 text-white font-bold'
                      : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  • {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200">أو اكتب سبباً مخصصاً:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="اكتب سبب الحظر الذي سيظهر للمستخدم وللإدارة..."
              className="admin-input text-xs resize-none"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-glow btn-glow-ghost px-4 h-9 text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="btn-glow btn-glow-danger px-5 h-9 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              {loading ? 'جاري الحظر...' : 'تأكيد حظر المستخدم 🚫'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page Component                                                        */
/* -------------------------------------------------------------------------- */

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [auditingUser, setAuditingUser] = useState<AdminUserListItem | null>(null);
  const [blockingUser, setBlockingUser] = useState<AdminUserListItem | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [zoomedAvatar, setZoomedAvatar] = useState<ZoomedAvatarData | null>(null);

  const debouncedQ = useDebouncedValue(q, 400);
  const adminReady = useAdminQueryEnabled();
  const flash = useFlash();
  const { isSuperAdmin, user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const isBlockedParam = useMemo(() => {
    if (statusFilter === 'blocked') return true;
    if (statusFilter === 'active') return false;
    return undefined;
  }, [statusFilter]);

  const queryKey = useMemo(
    () => ['admin', 'users', { q: debouncedQ, page, isBlocked: isBlockedParam }],
    [debouncedQ, page, isBlockedParam]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      adminApi.getUsers({
        q: debouncedQ.trim() || undefined,
        isBlocked: isBlockedParam,
        page,
        pageSize: 20,
        signal,
      }),
    enabled: adminReady,
    staleTime: 5_000,
    retry: 0,
  });

  // Filtered users by role in memory for client tab
  const displayedUsers = useMemo(() => {
    if (!data?.items) return [];
    let items = [...data.items];

    if (roleFilter === 'admin') {
      items = items.filter((u) => u.role === 'Admin' || u.isSuperAdmin);
    } else if (roleFilter === 'user') {
      items = items.filter((u) => u.role === 'User' && !u.isSuperAdmin);
    } else if (roleFilter === 'superadmin') {
      items = items.filter((u) => u.isSuperAdmin);
    }

    return items;
  }, [data?.items, roleFilter]);

  // Statistics summaries
  const stats = useMemo(() => {
    const total = data?.totalCount || data?.items?.length || 0;
    const items = data?.items || [];
    const verified = items.filter((u) => u.isVerified).length;
    const blocked = items.filter((u) => u.isBlocked).length;
    const complete = items.filter((u) => auditUserCompleteness(u).score >= 80).length;
    const incomplete = items.filter((u) => auditUserCompleteness(u).score < 80).length;

    return { total, verified, blocked, complete, incomplete };
  }, [data]);

  // Mutations
  const handleBlockConfirm = async (userId: string, reason: string) => {
    try {
      await adminApi.blockUser(userId, reason);
      flash.success('تم حظر المستخدم بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر حظر المستخدم';
      flash.error(msg);
    }
  };

  const handleUnblock = async (user: AdminUserListItem) => {
    const ok = await flash.confirm({
      title: 'إلغاء حظر المستخدم؟',
      message: `هل أنت متأكد من إلغاء حظر «${user.name}» وإعادة تفعيل حسابه بالكامل؟`,
      confirmLabel: 'إلغاء الحظر وتفعيل الحساب',
      cancelLabel: 'إلغاء',
      tone: 'info',
    });
    if (!ok) return;

    try {
      await adminApi.unblockUser(user.id);
      flash.success('تم إلغاء الحظر وتفعيل الحساب بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر إلغاء الحظر';
      flash.error(msg);
    }
  };

  const handleDeleteUser = async (user: AdminUserListItem) => {
    if (user.id === currentUser?.id) {
      flash.error('لا يمكنك مسح حسابك الخاص.');
      return;
    }

    const ok = await flash.confirm({
      title: `مسح المستخدم نهائياً؟`,
      message: `هل أنت متأكد من حذف «${user.name}» نهائياً؟ سيتم مسح حسابه وجميع بياناته ومنشوراته وسجلاته بالكامل من قاعدة البيانات. لا يمكن التراجع!`,
      confirmLabel: 'مسح نهائي',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });

    if (!ok) return;

    try {
      await adminApi.deleteUser(user.id);
      flash.success('تم مسح المستخدم بنجاح.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذر مسح المستخدم';
      flash.error(msg);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 text-right max-w-7xl mx-auto pb-12">
        {/* Page Head */}
        <div className="admin-page-head">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="admin-row items-start gap-3">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/15 to-transparent border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] shrink-0">
                <Users className="w-6 h-6" strokeWidth={2.4} />
              </span>
              <div className="admin-col">
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>إدارة المستخدمين والحسابات</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    كروت متوهجة & فحص البيانات
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  متابعة شاملة لكافة حسابات المنصة، استعراض البيانات المسجلة، وما هو ناقص لسه في كل ملف، مع تحكم فوري بالحظر والتعديل وتكبير الصور.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => refetch()}
                className="btn-glow btn-glow-ghost px-3.5 h-10 text-xs flex items-center gap-2 font-bold"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
                تحديث
              </button>
            </div>
          </div>
        </div>

        {/* Stats Holographic Cards Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="admin-card p-3.5 border-cyan-500/30 bg-gradient-to-b from-[#0e1724] to-[#090e15] shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col justify-between">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              إجمالي المستخدمين
            </span>
            <div className="text-2xl font-black text-white mt-2 font-mono">{stats.total}</div>
          </div>

          <div className="admin-card p-3.5 border-amber-500/30 bg-gradient-to-b from-[#181308] to-[#090e15] shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col justify-between">
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              حسابات موثقة
            </span>
            <div className="text-2xl font-black text-amber-300 mt-2 font-mono">{stats.verified}</div>
          </div>

          <div className="admin-card p-3.5 border-emerald-500/30 bg-gradient-to-b from-[#091814] to-[#090e15] shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col justify-between">
            <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ملفات مكتملة (80%+)
            </span>
            <div className="text-2xl font-black text-emerald-300 mt-2 font-mono">{stats.complete}</div>
          </div>

          <div className="admin-card p-3.5 border-orange-500/30 bg-gradient-to-b from-[#1a110a] to-[#090e15] shadow-[0_0_20px_rgba(249,115,22,0.15)] flex flex-col justify-between">
            <span className="text-xs text-orange-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              بحاجة لاكتمال بيانات
            </span>
            <div className="text-2xl font-black text-orange-300 mt-2 font-mono">{stats.incomplete}</div>
          </div>

          <div className="admin-card p-3.5 border-red-500/30 bg-gradient-to-b from-[#190a0d] to-[#090e15] shadow-[0_0_20px_rgba(239,68,68,0.15)] col-span-2 md:col-span-1 flex flex-col justify-between">
            <span className="text-xs text-red-300 font-bold flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-red-400" />
              حسابات محظورة
            </span>
            <div className="text-2xl font-black text-red-300 mt-2 font-mono">{stats.blocked}</div>
          </div>
        </div>

        {/* Error Banner */}
        {isError && (
          <FlashBanner tone="error" title="فشل تحميل المستخدمين" className="admin-row justify-between">
            <span>{(error as Error)?.message || 'تعذر الاتصال بالخادم.'}</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-glow btn-glow-primary px-3 h-9 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
          </FlashBanner>
        )}

        {/* Search, Filter & View Controls */}
        <div className="admin-card p-4 space-y-3 border-cyan-500/25 bg-[#0b121b]/90 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="ابحث بالاسم، المعرف، الموبايل، البريد، أو الرقم القومي..."
                className="admin-input pr-10 text-xs w-full bg-black/40 border-slate-800 focus:border-cyan-400"
              />
            </div>

            {/* Role Filter */}
            <div className="md:col-span-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="admin-input text-xs w-full bg-black/40 border-slate-800"
              >
                <option value="all">كافة الأدوار</option>
                <option value="superadmin">سوبر أدمن 👑</option>
                <option value="admin">مدير نظام 🛡️</option>
                <option value="user">مستخدم عادي</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="admin-input text-xs w-full bg-black/40 border-slate-800"
              >
                <option value="all">كافة الحالات</option>
                <option value="active">نشط فقط ✅</option>
                <option value="blocked">محظور وموقوف 🚫</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="md:col-span-3 flex items-center justify-end gap-2">
              <span className="text-xs text-slate-400 font-bold ml-1 hidden lg:inline">طريقة العرض:</span>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                كروت متوهجة
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                جدول
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-16 rounded-2xl bg-[#091018] border border-cyan-900/30 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-300">جاري تحميل بيانات المستخدمين وتدقيق الملفات...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayedUsers.length === 0 && (
          <div className="p-16 rounded-2xl bg-[#091018] border border-slate-800 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">لا يوجد مستخدمون مطابقون</h3>
            <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو تغيير الفلاتر الحالية.</p>
          </div>
        )}

        {/* CARDS VIEW (كروت متوهجة أيقونية وخرافية) */}
        {!isLoading && viewMode === 'cards' && displayedUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onOpenAudit={(u) => setAuditingUser(u)}
                onEdit={(u) => setEditingUser(u)}
                onBlock={(u) => setBlockingUser(u)}
                onUnblock={handleUnblock}
                onDelete={handleDeleteUser}
                onZoomAvatar={(zoomData) => setZoomedAvatar(zoomData)}
                isSelf={user.id === currentUser?.id}
              />
            ))}
          </div>
        )}

        {/* TABLE VIEW (جدول تفصيلي مع مؤشر الاكتمال) */}
        {!isLoading && viewMode === 'table' && displayedUsers.length > 0 && (
          <div className="admin-data-grid">
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-sm">
                <thead className="admin-thead text-xs">
                  <tr>
                    <th className="text-right">المستخدم والبروفايل</th>
                    <th className="text-right">الموبايل والبريد</th>
                    <th className="text-right">الرقم القومي</th>
                    <th className="text-right">النوع والمدينة</th>
                    <th className="text-center">اكتمال البيانات</th>
                    <th className="text-right">الحالة</th>
                    <th className="text-center">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map((user) => {
                    const audit = auditUserCompleteness(user);
                    const resolvedAvatar = user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '';
                    return (
                      <tr key={user.id} className="admin-tr">
                        <td className="admin-cell-title">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 shrink-0 overflow-hidden relative group/avatar ${
                                resolvedAvatar ? 'cursor-pointer hover:scale-110 transition-transform' : ''
                              }`}
                              onClick={() => {
                                if (resolvedAvatar) {
                                  setZoomedAvatar({
                                    url: resolvedAvatar,
                                    name: user.name,
                                    username: user.username,
                                    role: user.role,
                                    isSuperAdmin: user.isSuperAdmin,
                                  });
                                }
                              }}
                              title={resolvedAvatar ? 'اضغط لتكبير الصورة الشخصية 🔍' : user.name}
                            >
                              <div className="w-full h-full bg-[#0c141d] rounded-[10px] overflow-hidden flex items-center justify-center text-cyan-300 font-bold text-xs relative">
                                {resolvedAvatar ? (
                                  <img
                                    src={resolvedAvatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{user.name.charAt(0)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1.5 font-bold text-white">
                                {user.name}
                                {user.isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                                {user.role === 'Admin' && !user.isSuperAdmin && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                                )}
                                {user.isVerified && <AdminVerifiedBadge title="موثق" />}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                                {user.username ? (
                                  <span className="text-cyan-400">@{user.username}</span>
                                ) : (
                                  <span className="text-amber-400/80">بدون معرف</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="space-y-0.5">
                            <div className="font-mono font-bold text-white dir-ltr text-xs">
                              {user.phoneNumber}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px] dir-ltr text-right">
                              {user.email ? (
                                <span className={user.isEmailVerified ? 'text-emerald-300' : 'text-amber-300'}>
                                  {user.email} {user.isEmailVerified ? '✓' : '⚠️'}
                                </span>
                              ) : (
                                <span className="text-slate-600">بدون بريد</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          {user.nationalId ? (
                            <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 dir-ltr">
                              {user.nationalId}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              ⚠️ ناقص
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="space-y-0.5 text-xs">
                            <div>
                              {user.gender === 'Male' ? (
                                <span className="text-blue-400 font-semibold">👨 ذكر</span>
                              ) : user.gender === 'Female' ? (
                                <span className="text-pink-400 font-semibold">👩 أنثى</span>
                              ) : (
                                <span className="text-amber-400">⚠️ لم يحدد</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.city || 'المدينة غير محددة'}</div>
                          </div>
                        </td>

                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => setAuditingUser(user)}
                            className="inline-flex flex-col items-center gap-1 group/btn"
                            title="اضغط لفحص التفاصيل الناقصة والكاملة"
                          >
                            <span
                              className={`font-mono text-xs font-black px-2 py-0.5 rounded ${
                                audit.score >= 80
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : audit.score >= 50
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {audit.score}%
                            </span>
                            <span className="text-[10px] text-cyan-400 underline opacity-0 group-hover/btn:opacity-100 transition-opacity">
                              فحص النواقص
                            </span>
                          </button>
                        </td>

                        <td>
                          {user.isBlocked ? (
                            <span className="admin-badge admin-badge-danger">
                              <Ban className="w-3 h-3" />
                              محظور
                            </span>
                          ) : (
                            <span className="admin-badge admin-badge-ok">
                              <CheckCircle2 className="w-3 h-3" />
                              نشط
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="btn-glow btn-glow-ghost px-2.5 h-8 text-xs inline-flex"
                              title="عرض البروفايل"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setEditingUser(user)}
                              className="btn-glow btn-glow-secondary px-2.5 h-8 text-xs inline-flex text-cyan-300"
                              title="تعديل المستخدم"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {user.isBlocked ? (
                              <button
                                type="button"
                                onClick={() => handleUnblock(user)}
                                className="btn-glow bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-2.5 h-8 text-xs inline-flex"
                                title="إلغاء الحظر"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setBlockingUser(user)}
                                disabled={user.id === currentUser?.id}
                                className="btn-glow btn-glow-danger px-2.5 h-8 text-xs inline-flex disabled:opacity-40"
                                title="حظر الحساب"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Bar */}
        {(data?.totalPages ?? 0) > 1 && (
          <div className="admin-row justify-between p-4 rounded-xl border border-cyan-900/30 text-xs bg-[#0b121b]/80">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-glow btn-glow-ghost px-3.5 h-8 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              السابق
            </button>
            <span className="font-bold text-slate-300">
              صفحة {page} من {data?.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= (data?.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className="btn-glow btn-glow-ghost px-3.5 h-8 disabled:opacity-40"
            >
              التالي
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Avatar Zoom Lightbox Modal */}
      <AvatarZoomModal
        data={zoomedAvatar}
        onClose={() => setZoomedAvatar(null)}
      />

      {/* Audit Inspection Modal */}
      <UserAuditModal
        user={auditingUser}
        onClose={() => setAuditingUser(null)}
        onEdit={(u) => setEditingUser(u)}
        onZoomAvatar={(zoomData) => setZoomedAvatar(zoomData)}
      />

      {/* Fast Block Modal */}
      <BlockUserModal
        user={blockingUser}
        onClose={() => setBlockingUser(null)}
        onConfirm={handleBlockConfirm}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        isActorSuperAdmin={isSuperAdmin}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        }}
      />
    </AdminShell>
  );
}
