'use client';

import React from 'react';
import { VerificationTypeItem, UserLookupItem } from '@/api/verificationAdmin';
import {
  Gift,
  User,
  BadgeCheck,
  Calendar,
  Sparkles,
  UserCheck,
  Check,
  Phone,
} from 'lucide-react';

interface DirectGrantPanelProps {
  typesData?: VerificationTypeItem[];
  grantUserIdentifier: string;
  setGrantUserIdentifier: (val: string) => void;
  grantMatchedUser: UserLookupItem | null;
  setGrantMatchedUser: (u: UserLookupItem | null) => void;
  grantSuggestions?: UserLookupItem[];
  grantTypeId: string;
  setGrantTypeId: (val: string) => void;
  grantDays: number;
  setGrantDays: (days: number) => void;
  grantIsFree: boolean;
  setGrantIsFree: (free: boolean) => void;
  grantNotes: string;
  setGrantNotes: (notes: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function DirectGrantPanel({
  typesData,
  grantUserIdentifier,
  setGrantUserIdentifier,
  grantMatchedUser,
  setGrantMatchedUser,
  grantSuggestions,
  grantTypeId,
  setGrantTypeId,
  grantDays,
  setGrantDays,
  grantIsFree,
  setGrantIsFree,
  grantNotes,
  setGrantNotes,
  onSubmit,
  isPending,
}: DirectGrantPanelProps) {
  const durationPresets = [
    { label: '30 يوم', days: 30 },
    { label: '60 يوم', days: 60 },
    { label: '90 يوم (3 أشهر)', days: 90 },
    { label: '180 يوم (نصف سنة)', days: 180 },
    { label: '365 يوم (سنة)', days: 365 },
  ];

  const selectedType = typesData?.find((t) => t.id === grantTypeId);

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-7 shadow-2xl overflow-hidden text-right space-y-5 sm:space-y-6">
      {/* Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Gift className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <h3 className="font-black text-white text-base sm:text-xl truncate">
              منح توثيق مباشر وفوري
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pr-0 sm:pr-12">
            إعطاء شارة رسمية لأي مستخدم (صحفي، شخصية عامة، جهة رسمية) عبر رقم الموبايل أو اسم المستخدم فوراً.
          </p>
        </div>

        <span className="px-2.5 sm:px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] sm:text-xs font-black shrink-0">
          منحة إدارية
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 sm:space-y-5 relative z-10">
        {/* User Lookup Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            اسم المستخدم أو رقم الموبايل أو المعرف *
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="مثال: 01012345678 أو ahmed_soliman أو معرف الحساب..."
              value={grantUserIdentifier}
              onChange={(e) => {
                setGrantUserIdentifier(e.target.value);
                setGrantMatchedUser(null);
              }}
              className="w-full px-4 py-3 pl-10 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium transition-colors"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Live Suggestions Dropdown */}
          {grantSuggestions && grantSuggestions.length > 0 && !grantMatchedUser && (
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-h-52 overflow-y-auto space-y-1 z-30 relative animate-in fade-in">
              <div className="text-[11px] font-bold text-slate-400 px-3 py-1">
                اختر الحساب المستهدف:
              </div>
              {grantSuggestions.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setGrantUserIdentifier(u.phoneNumber || u.username || u.id);
                    setGrantMatchedUser(u);
                  }}
                  className="p-2.5 rounded-xl hover:bg-purple-950/40 border border-transparent hover:border-purple-500/30 cursor-pointer transition flex items-center justify-between text-xs active:bg-purple-900/40"
                >
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-white truncate">{u.name}</span>
                    {u.username && <span className="text-slate-400 mr-1.5 truncate">(@{u.username})</span>}
                    <span className="text-cyan-400 mr-2 font-mono block xs:inline">📱 {u.phoneNumber}</span>
                  </div>
                  {u.hasActiveVerification ? (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                      موثق: {u.badgeName}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400 font-bold shrink-0">
                      غير موثق
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Matched User Pill */}
          {grantMatchedUser && (
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between text-xs text-purple-200">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
                <span className="truncate">
                  تم تحديد:{' '}
                  <strong className="text-white font-black">{grantMatchedUser.name}</strong> (
                  {grantMatchedUser.phoneNumber})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGrantMatchedUser(null);
                  setGrantUserIdentifier('');
                }}
                className="text-purple-400 hover:text-white font-bold underline shrink-0 mr-2"
              >
                تغيير
              </button>
            </div>
          )}
        </div>

        {/* Verification Type Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            نوع وشارة التوثيق الممنوحة *
          </label>
          <select
            value={grantTypeId}
            onChange={(e) => setGrantTypeId(e.target.value)}
            className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="" className="bg-slate-950 text-slate-400">
              -- اختر نوع وشارة التوثيق --
            </option>
            {typesData?.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-950 text-white">
                {t.name} (شارة: {t.badgeName})
              </option>
            ))}
          </select>
        </div>

        {/* Duration Days & Quick Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              المدة الممنوحة (بالأيام) *
            </label>
            <span className="text-xs font-mono font-bold text-purple-400">
              {grantDays} يوماً
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="number"
              min={1}
              value={grantDays}
              onChange={(e) => setGrantDays(parseInt(e.target.value) || 30)}
              className="w-full sm:w-28 px-4 py-2.5 text-center font-black rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
            />
            <div className="flex flex-wrap gap-1.5 flex-1">
              {durationPresets.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setGrantDays(p.days)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] active:scale-95 ${
                    grantDays === p.days
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Free Grant Toggle */}
        <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={grantIsFree}
            onChange={(e) => setGrantIsFree(e.target.checked)}
            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 shrink-0"
          />
          <div>
            <span className="text-xs font-bold text-white block">
              منحة مجانية بالكامل (شرفية / VIP)
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400">
              لن يتم احتساب أي رسوم أو مدفوعات مالية على صاحب الحساب
            </span>
          </div>
        </label>

        {/* Admin Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            سبب وملاحظات المنح (للسجل الإداري)
          </label>
          <textarea
            rows={2}
            placeholder="مثال: دعوة شرفية، مراسل رسمي بمحافظة القاهرة، شخصية عامة..."
            value={grantNotes}
            onChange={(e) => setGrantNotes(e.target.value)}
            className="w-full px-4 py-2.5 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={!grantUserIdentifier.trim() || !grantTypeId || isPending}
          onClick={onSubmit}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm transition-all duration-300 shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none min-h-[48px] active:scale-[0.99]"
        >
          <UserCheck className="w-5 h-5" />
          <span>{isPending ? 'جاري المنح...' : 'تأكيد ومنح التوثيق الفوري ✓'}</span>
        </button>
      </div>
    </div>
  );
}
