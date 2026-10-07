'use client';

import React from 'react';
import { ActiveVerificationItem } from '@/api/verificationAdmin';
import {
  Crown,
  Award,
  Sparkles,
  Ticket,
  Calendar,
  Clock,
  Eye,
  ShieldOff,
  Phone,
  MessageCircle,
  User,
  AlertTriangle,
} from 'lucide-react';

interface ActiveVerificationCardProps {
  uv: ActiveVerificationItem;
  onInspectDocs?: (requestId: string) => void;
  onRevoke: (uv: ActiveVerificationItem) => void;
  isRevoking?: boolean;
}

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

function activeDaysProgress(uv: ActiveVerificationItem) {
  const start = new Date(uv.startedAt).getTime();
  const end = new Date(uv.expiresAt).getTime();
  const total = Math.max(1, Math.round((end - start) / 86_400_000));
  const remaining = Math.max(0, uv.daysRemaining);
  const pct = Math.min(100, Math.max(4, (remaining / total) * 100));
  const urgent = remaining <= 7;
  return { total, remaining, pct, urgent };
}

export function ActiveVerificationCard({
  uv,
  onInspectDocs,
  onRevoke,
  isRevoking = false,
}: ActiveVerificationCardProps) {
  const progress = activeDaysProgress(uv);
  const circumference = 2 * Math.PI * 18;
  const dash = (progress.pct / 100) * circumference;
  const ringColor = progress.urgent ? '#f43f5e' : '#10b981';

  return (
    <article
      className={`group relative rounded-2xl sm:rounded-3xl bg-slate-900/90 border transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between overflow-hidden text-right shadow-xl hover:shadow-2xl ${
        progress.urgent
          ? 'border-rose-500/40 hover:border-rose-500/70 hover:shadow-rose-500/10'
          : 'border-slate-800 hover:border-purple-500/40 hover:shadow-purple-500/10'
      }`}
    >
      {/* Top Ambient Glow */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all ${
          progress.urgent ? 'bg-rose-500/15' : 'bg-purple-500/10 group-hover:bg-purple-500/20'
        }`}
      />

      <div className="space-y-3.5 sm:space-y-4 relative z-10">
        {/* Top Header: Identity & Circular Remaining Ring */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 via-sky-500/15 to-emerald-500/20 border border-white/10 flex items-center justify-center font-black text-purple-300 text-xs sm:text-sm shrink-0 shadow-md">
              {userInitials(uv.userName)}
            </div>

            <div className="min-w-0 space-y-0.5">
              <h4 className="font-black text-white text-sm sm:text-base truncate group-hover:text-purple-300 transition-colors">
                {uv.userName}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span dir="ltr" className="text-cyan-400 font-semibold">{uv.userPhoneNumber}</span>
                {uv.userPhoneNumber && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${uv.userPhoneNumber}`}
                      className="p-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="اتصال هاتفي"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://wa.me/20${uv.userPhoneNumber.replace(/\D/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="مراسلة واتساب"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Circular Days Meter */}
          <div
            className="flex flex-col items-center shrink-0 cursor-default"
            title={`متبقي ${progress.remaining} يوم من أصل ${progress.total} يوماً`}
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center">
              <svg className="w-11 h-11 sm:w-12 sm:h-12 -rotate-90 transform" viewBox="0 0 44 44" aria-hidden>
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-[11px] sm:text-xs font-black leading-none ${progress.urgent ? 'text-rose-400' : 'text-white'}`}>
                  {progress.remaining}
                </span>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold leading-none mt-0.5">يوم</span>
              </div>
            </div>
            {progress.urgent && (
              <span className="text-[9px] sm:text-[10px] font-black text-rose-400 flex items-center gap-0.5 mt-1 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" />
                تنتهي قريباً
              </span>
            )}
          </div>
        </div>

        {/* Chips Row: Badge + Plan + Free */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] sm:text-xs font-black inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>توثيق نشط</span>
          </span>

          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] sm:text-xs font-black inline-flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span>{uv.badgeName || uv.verificationTypeName}</span>
          </span>

          {uv.isFree && (
            <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] sm:text-xs font-black inline-flex items-center gap-1">
              <Ticket className="w-3 h-3 text-purple-400" />
              <span>منح مجاني</span>
            </span>
          )}
        </div>

        {/* Timeline Dates */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px]">بدأ في:</span>
            <span className="font-mono font-bold text-slate-200 text-[11px] sm:text-xs">
              {new Date(uv.startedAt).toLocaleDateString('ar-EG')}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px]">ينتهي في:</span>
            <span className={`font-mono font-bold text-[11px] sm:text-xs ${progress.urgent ? 'text-rose-400' : 'text-emerald-400'}`}>
              {new Date(uv.expiresAt).toLocaleDateString('ar-EG')}
            </span>
          </div>
          {uv.grantedByUserName && (
            <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
              <span className="text-[10px] sm:text-[11px]">بواسطة المسؤول:</span>
              <span className="font-bold text-slate-300 truncate max-w-[140px] text-[11px]">
                {uv.grantedByUserName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-1.5 sm:gap-2 relative z-10">
        {uv.verificationRequestId && onInspectDocs ? (
          <button
            type="button"
            onClick={() => onInspectDocs(uv.verificationRequestId!)}
            className="flex-1 py-2 px-2.5 sm:px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-sky-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[38px] active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>الطلب والوثائق</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-500 italic">توثيق مباشر من الإدارة</div>
        )}

        <button
          type="button"
          disabled={isRevoking}
          onClick={() => onRevoke(uv)}
          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 min-h-[38px] active:scale-95"
          title="سحب التوثيق من الحساب"
        >
          <ShieldOff className="w-3.5 h-3.5" />
          <span>سحب الشارة</span>
        </button>
      </div>
    </article>
  );
}
