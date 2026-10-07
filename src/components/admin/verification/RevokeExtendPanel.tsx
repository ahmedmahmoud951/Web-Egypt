'use client';

import React from 'react';
import { UserLookupItem } from '@/api/verificationAdmin';
import {
  ShieldOff,
  Phone,
  Clock,
  AlertTriangle,
  CalendarPlus,
  Ban,
  CheckCircle2,
} from 'lucide-react';

interface RevokeExtendPanelProps {
  actionIdentifier: string;
  setActionIdentifier: (val: string) => void;
  actionMatchedUser: UserLookupItem | null;
  setActionMatchedUser: (u: UserLookupItem | null) => void;
  actionSuggestions?: UserLookupItem[];
  actionReason: string;
  setActionReason: (val: string) => void;
  extendDays: number;
  setExtendDays: (days: number) => void;
  onRevoke: () => void;
  onExtend: () => void;
  isRevoking: boolean;
  isExtending: boolean;
}

export function RevokeExtendPanel({
  actionIdentifier,
  setActionIdentifier,
  actionMatchedUser,
  setActionMatchedUser,
  actionSuggestions,
  actionReason,
  setActionReason,
  extendDays,
  setExtendDays,
  onRevoke,
  onExtend,
  isRevoking,
  isExtending,
}: RevokeExtendPanelProps) {
  const commonReasons = [
    'مخالفة معايير وشروط النزاهة',
    'انتحال صفة شخصية عامة أو كيان رسمي',
    'بناءً على رغبة صاحب الحساب',
    'انتهاء مسوغات الصفة الرسمية المعتمدة',
  ];

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-7 shadow-2xl overflow-hidden text-right space-y-5 sm:space-y-6">
      {/* Ambient Glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldOff className="w-5 h-5" strokeWidth={2.4} />
            </div>
            <h3 className="font-black text-white text-base sm:text-xl truncate">
              سحب التوثيق أو تمديد الصلاحية
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pr-0 sm:pr-12">
            إلغاء الشارة النشطة فوراً لأسباب انضباطية، أو إضافة أيام جديدة لصاحب الحساب الموثق.
          </p>
        </div>

        <span className="px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] sm:text-xs font-black shrink-0">
          إجراءات انضباطية
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 sm:space-y-5 relative z-10">
        {/* User Lookup */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            اسم المستخدم أو رقم الموبايل أو المعرف *
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="مثال: 01012345678 أو ahmed_soliman أو معرف الحساب..."
              value={actionIdentifier}
              onChange={(e) => {
                setActionIdentifier(e.target.value);
                setActionMatchedUser(null);
              }}
              className="w-full px-4 py-3 pl-10 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium transition-colors"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Suggestions Dropdown */}
          {actionSuggestions && actionSuggestions.length > 0 && !actionMatchedUser && (
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-h-52 overflow-y-auto space-y-1 z-30 relative animate-in fade-in">
              <div className="text-[11px] font-bold text-slate-400 px-3 py-1">
                المستخدمون المطابقون:
              </div>
              {actionSuggestions.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    setActionIdentifier(u.phoneNumber || u.username || u.id);
                    setActionMatchedUser(u);
                  }}
                  className="p-2.5 rounded-xl hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 cursor-pointer transition flex items-center justify-between text-xs active:bg-rose-900/40"
                >
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-white truncate">{u.name}</span>
                    {u.username && <span className="text-slate-400 mr-1.5 truncate">(@{u.username})</span>}
                    <span className="text-cyan-400 mr-2 font-mono block xs:inline">📱 {u.phoneNumber}</span>
                  </div>
                  {u.hasActiveVerification ? (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                      موثق: {u.badgeName} ({u.daysRemaining} يوم متبقي)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-400 font-bold shrink-0">
                      لا يوجد توثيق سارٍ
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Matched User Display */}
          {actionMatchedUser && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-between text-xs">
              <div className="truncate">
                <span className="text-slate-400">الحساب المحدد: </span>
                <strong className="text-white font-black truncate">{actionMatchedUser.name}</strong>
                <span className="text-slate-400 mx-1">•</span>
                <span className={actionMatchedUser.hasActiveVerification ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {actionMatchedUser.hasActiveVerification
                    ? `شارة: ${actionMatchedUser.badgeName} (${actionMatchedUser.daysRemaining} يوم متبقي)`
                    : 'غير موثق حالياً'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionMatchedUser(null);
                  setActionIdentifier('');
                }}
                className="text-rose-400 hover:text-white font-bold underline shrink-0 mr-2"
              >
                تغيير
              </button>
            </div>
          )}
        </div>

        {/* Reason Field & Common Templates */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-300">
            سبب السحب أو ملاحظات التمديد *
          </label>
          <div className="flex flex-wrap gap-1.5 pb-1">
            {commonReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActionReason(r)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-200 border border-slate-800 text-[11px] font-medium transition-colors min-h-[34px] active:scale-95"
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="اكتب السبب بوضوح (إلزامي في حالة السحب)..."
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-medium transition-colors"
          />
        </div>

        {/* Actions Grid */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Revoke Button */}
          <button
            type="button"
            disabled={!actionIdentifier.trim() || !actionReason.trim() || isRevoking}
            onClick={onRevoke}
            className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] active:scale-[0.99]"
          >
            <ShieldOff className="w-4 h-4" />
            <span>{isRevoking ? 'جاري السحب...' : 'سحب التوثيق فوراً ✕'}</span>
          </button>

          {/* Extend Days Input + Button */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={extendDays}
              onChange={(e) => setExtendDays(parseInt(e.target.value) || 30)}
              className="w-20 px-3 py-2.5 text-center font-black rounded-2xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
              title="عدد الأيام الإضافية"
            />
            <button
              type="button"
              disabled={!actionIdentifier.trim() || isExtending}
              onClick={onExtend}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all duration-300 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px] active:scale-[0.99]"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>{isExtending ? 'جاري التمديد...' : `تمديد +${extendDays} يوم`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
