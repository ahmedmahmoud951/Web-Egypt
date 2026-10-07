'use client';

import React, { useRef, useEffect } from 'react';
import {
  Clock,
  BadgeCheck,
  Tag,
  Crown,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';

export type VerificationTabId = 'requests' | 'types' | 'plans' | 'grants' | 'settings';

interface VerificationNavBarProps {
  activeTab: VerificationTabId;
  onSelectTab: (tab: VerificationTabId) => void;
  pendingCount?: number;
  typesCount?: number;
  plansCount?: number;
  activeCount?: number;
}

export function VerificationNavBar({
  activeTab,
  onSelectTab,
  pendingCount = 0,
  typesCount = 0,
  plansCount = 0,
  activeCount = 0,
}: VerificationNavBarProps) {
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const containerRef = useRef<HTMLElement | null>(null);

  // Auto-scroll active tab into view on mobile when tab changes
  useEffect(() => {
    const activeEl = tabsRef.current[activeTab];
    if (activeEl && containerRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeTab]);

  const tabs = [
    {
      id: 'requests' as const,
      label: 'طلبات التوثيق',
      shortLabel: 'الطلبات',
      subtext: 'مراجعة الوثائق والهوية',
      icon: Clock,
      badge: pendingCount > 0 ? `${pendingCount} معلق` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      activeGradient: 'from-sky-500/20 via-sky-600/10 to-transparent border-sky-500/60 text-sky-100 shadow-[0_0_25px_rgba(14,165,233,0.25)]',
      iconTone: 'text-sky-400',
      activeIndicator: 'bg-sky-400 shadow-[0_0_10px_#38bdf8]',
    },
    {
      id: 'types' as const,
      label: 'أنواع وشارات التوثيق',
      shortLabel: 'الشارات',
      subtext: 'الشارات وفئات الحسابات',
      icon: BadgeCheck,
      badge: `${typesCount} نوع`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      activeGradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent border-emerald-500/60 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      iconTone: 'text-emerald-400',
      activeIndicator: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
    },
    {
      id: 'plans' as const,
      label: 'باقات وخطط التوثيق',
      shortLabel: 'الباقات',
      subtext: 'الأسعار والمدد والعروض',
      icon: Tag,
      badge: `${plansCount} باقة`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      activeGradient: 'from-amber-500/20 via-amber-600/10 to-transparent border-amber-500/60 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      iconTone: 'text-amber-400',
      activeIndicator: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
    },
    {
      id: 'grants' as const,
      label: 'التوثيقات النشطة والمنح',
      shortLabel: 'النشطة والمنح',
      subtext: 'الخزنة الحية والمنح والسحب',
      icon: Crown,
      badge: activeCount > 0 ? `${activeCount} نشط` : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      activeGradient: 'from-purple-500/20 via-purple-600/10 to-transparent border-purple-500/60 text-purple-100 shadow-[0_0_25px_rgba(168,85,247,0.25)]',
      iconTone: 'text-purple-400',
      activeIndicator: 'bg-purple-400 shadow-[0_0_10px_#c084fc]',
    },
    {
      id: 'settings' as const,
      label: 'سياسات الأمان والخدمات',
      shortLabel: 'الأمان والمحركات',
      subtext: 'المحركات الخلفية والنزاهة',
      icon: Shield,
      badge: 'آمن 100%',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      activeGradient: 'from-teal-500/20 via-teal-600/10 to-transparent border-teal-500/60 text-teal-100 shadow-[0_0_25px_rgba(20,184,166,0.25)]',
      iconTone: 'text-teal-400',
      activeIndicator: 'bg-teal-400 shadow-[0_0_10px_#2dd4bf]',
    },
  ];

  return (
    <div className="relative group/nav">
      {/* Background Outer Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-purple-500/10 rounded-2xl sm:rounded-3xl blur-xl pointer-events-none -z-10" />

      {/* Main Tab Deck Container */}
      <div className="relative">
        <nav
          ref={containerRef}
          aria-label="قوائم منظومة التوثيق"
          className="p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl flex items-stretch gap-1.5 sm:gap-2.5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth touch-pan-x"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabsRef.current[tab.id] = el;
                }}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`group relative flex-1 min-w-[130px] xs:min-w-[140px] sm:min-w-[170px] lg:min-w-0 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-right transition-all duration-300 flex flex-col justify-between overflow-hidden select-none outline-none snap-center shrink-0 lg:shrink active:scale-[0.98] ${
                  isActive
                    ? `bg-gradient-to-b ${tab.activeGradient}`
                    : 'bg-slate-950/40 border-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:border-slate-700/60'
                }`}
              >
                {/* Active Top Ambient Light */}
                {isActive && (
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent animate-pulse" />
                )}

                {/* Top Row: Icon + Badge */}
                <div className="flex items-center justify-between gap-1.5 mb-2 w-full">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-inner'
                        : 'bg-slate-800/50 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? tab.iconTone : ''}`} strokeWidth={2.3} />
                  </div>

                  {tab.badge && (
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-black rounded-full border shrink-0 backdrop-blur-sm ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                {/* Bottom Row: Text Labels + Active Indicator */}
                <div className="w-full">
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className={`w-1.5 h-1.5 rounded-full ${tab.activeIndicator} animate-ping shrink-0`} />
                    )}
                    <span className="font-black text-xs sm:text-sm tracking-tight truncate block">
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate mt-0.5 opacity-90 font-medium">
                    {tab.subtext}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
