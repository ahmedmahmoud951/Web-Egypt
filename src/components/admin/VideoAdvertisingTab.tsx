'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { advertisingAdminApi } from '@/api/advertisingAdmin';
import {
  VideoAdvertisingSettings,
  UpdateVideoAdvertisingSettingsRequest,
  VideoAdAnalytics,
  CampaignVideoPerformance,
} from '@/types/advertising';
import {
  Film,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  MousePointerClick,
  FastForward,
  CheckCheck,
  TrendingUp,
  DollarSign,
  Save,
  RefreshCw,
  Sliders,
  Layers,
  Settings2,
  Calendar,
  Percent,
  Play,
  Pause,
  Volume2,
  ShieldCheck,
  Sparkles,
  Cpu,
  Maximize2,
  SkipForward,
  Info,
  SlidersHorizontal,
  Zap,
  BarChart3,
  ArrowUpRight,
  Activity,
  Search,
  ChevronDown,
  RotateCcw,
  Smartphone,
  Monitor,
} from 'lucide-react';

export function VideoAdvertisingTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Time range filter
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Global settings
  const [settings, setSettings] = useState<VideoAdvertisingSettings>({
    id: 1,
    enabled: true,
    preRollEnabled: true,
    midRollEnabled: true,
    postRollEnabled: true,
    defaultMaxAdsPerVideo: 2,
    defaultMinimumAdIntervalSeconds: 20,
    defaultMidRollIntervalSeconds: 20,
    defaultMinimumVideoDurationSeconds: 20,
    defaultSkipAfterSeconds: 5,
    updatedAt: new Date().toISOString(),
  });

  // Analytics
  const [analytics, setAnalytics] = useState<VideoAdAnalytics | null>(null);

  // Interactive Simulator State
  const [simActive, setSimActive] = useState(false);
  const [simAdType, setSimAdType] = useState<'PreRoll' | 'MidRoll' | 'PostRoll'>('PreRoll');
  const [simCountdown, setSimCountdown] = useState(5);
  const [simCanSkip, setSimCanSkip] = useState(false);
  const [simCompleted, setSimCompleted] = useState(false);
  const [simDevice, setSimDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Search & filter for campaign leaderboard
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignSortBy, setCampaignSortBy] = useState<'starts' | 'completionRate' | 'clicks' | 'ctr'>('starts');

  const loadData = async (range = timeRange) => {
    setLoading(true);
    try {
      let fromDate: string | undefined = undefined;
      const now = new Date();
      if (range === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        fromDate = todayStart.toISOString();
      } else if (range === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        fromDate = d.toISOString();
      } else if (range === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        fromDate = d.toISOString();
      }

      const [settingsRes, analyticsRes] = await Promise.all([
        advertisingAdminApi.getVideoSettings(),
        advertisingAdminApi.getVideoAnalytics(fromDate),
      ]);
      if (settingsRes) setSettings(settingsRes);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (err: any) {
      console.error('Failed to load video ads data:', err);
      setFeedback({ text: err?.message || 'تعذر تحميل بيانات إعلانات الفيديو', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);
  }, [timeRange]);

  // Simulator countdown timer
  useEffect(() => {
    let timer: any = null;
    if (simActive && !simCompleted && !simCanSkip) {
      if (simCountdown > 0) {
        timer = setTimeout(() => {
          setSimCountdown((prev) => {
            if (prev <= 1) {
              setSimCanSkip(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [simActive, simCountdown, simCompleted, simCanSkip]);

  const startSimulator = (type: 'PreRoll' | 'MidRoll' | 'PostRoll') => {
    setSimAdType(type);
    setSimCountdown(settings.defaultSkipAfterSeconds || 5);
    setSimCanSkip(false);
    setSimCompleted(false);
    setSimActive(true);
  };

  const handleSkipSimAd = () => {
    setSimActive(false);
    setSimCanSkip(false);
    setSimCompleted(false);
  };

  const handleCompleteSimAd = () => {
    setSimCompleted(true);
    setTimeout(() => {
      setSimActive(false);
      setSimCompleted(false);
      setSimCanSkip(false);
    }, 1200);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const payload: UpdateVideoAdvertisingSettingsRequest = {
        enabled: settings.enabled,
        preRollEnabled: settings.preRollEnabled,
        midRollEnabled: settings.midRollEnabled,
        postRollEnabled: settings.postRollEnabled,
        defaultMaxAdsPerVideo: Number(settings.defaultMaxAdsPerVideo),
        defaultMinimumAdIntervalSeconds: Number(settings.defaultMinimumAdIntervalSeconds),
        defaultMidRollIntervalSeconds: Number(settings.defaultMidRollIntervalSeconds),
        defaultMinimumVideoDurationSeconds: Number(settings.defaultMinimumVideoDurationSeconds),
        defaultSkipAfterSeconds: Number(settings.defaultSkipAfterSeconds),
      };

      const updated = await advertisingAdminApi.updateVideoSettings(payload);
      if (updated) setSettings(updated);
      setFeedback({
        text: 'تم حفظ إعدادات محرك إعلانات الفيديو وتطبيق خوارزمية البث على كافة مشغلات التطبيق بنجاح!',
        type: 'success',
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ text: err?.message || 'فشل حفظ إعدادات إعلانات الفيديو', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: 'balanced' | 'revenue' | 'gentle' | 'reels') => {
    if (preset === 'reels') {
      setSettings((prev) => ({
        ...prev,
        enabled: true,
        preRollEnabled: true,
        midRollEnabled: true,
        postRollEnabled: true,
        defaultMaxAdsPerVideo: 3,
        defaultMinimumAdIntervalSeconds: 20,
        defaultMidRollIntervalSeconds: 20,
        defaultMinimumVideoDurationSeconds: 20,
        defaultSkipAfterSeconds: 5,
      }));
    } else if (preset === 'balanced') {
      setSettings((prev) => ({
        ...prev,
        enabled: true,
        preRollEnabled: true,
        midRollEnabled: true,
        postRollEnabled: true,
        defaultMaxAdsPerVideo: 2,
        defaultMinimumAdIntervalSeconds: 20,
        defaultMidRollIntervalSeconds: 20,
        defaultMinimumVideoDurationSeconds: 20,
        defaultSkipAfterSeconds: 5,
      }));
    } else if (preset === 'revenue') {
      setSettings((prev) => ({
        ...prev,
        enabled: true,
        preRollEnabled: true,
        midRollEnabled: true,
        postRollEnabled: true,
        defaultMaxAdsPerVideo: 4,
        defaultMinimumAdIntervalSeconds: 20,
        defaultMidRollIntervalSeconds: 20,
        defaultMinimumVideoDurationSeconds: 20,
        defaultSkipAfterSeconds: 5,
      }));
    } else if (preset === 'gentle') {
      setSettings((prev) => ({
        ...prev,
        enabled: true,
        preRollEnabled: true,
        midRollEnabled: false,
        postRollEnabled: false,
        defaultMaxAdsPerVideo: 1,
        defaultMinimumAdIntervalSeconds: 60,
        defaultMidRollIntervalSeconds: 60,
        defaultMinimumVideoDurationSeconds: 60,
        defaultSkipAfterSeconds: 4,
      }));
    }
  };

  // Filtered & sorted campaigns
  const filteredCampaigns = useMemo(() => {
    if (!analytics?.campaigns) return [];
    return analytics.campaigns
      .filter((c) => {
        if (!campaignSearch.trim()) return true;
        const q = campaignSearch.toLowerCase();
        return (
          c.campaignTitle?.toLowerCase().includes(q) ||
          c.campaignId?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (campaignSortBy === 'starts') return b.starts - a.starts;
        if (campaignSortBy === 'completionRate') return b.completionRate - a.completionRate;
        if (campaignSortBy === 'clicks') return b.clicks - a.clicks;
        if (campaignSortBy === 'ctr') return b.ctr - a.ctr;
        return 0;
      });
  }, [analytics?.campaigns, campaignSearch, campaignSortBy]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right" dir="rtl">
      {/* ================= HERO COMMAND BANNER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-600/15 to-indigo-900/30 p-6 md:p-8 border border-amber-500/30 shadow-2xl backdrop-blur-xl">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                محرك الفيديو المضمن
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                خوارزمية VAST 4.2 نشطة
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Server-Side Decisioning
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight">
              إعلانات الفيديو المضمنة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">(In-Stream Ads Engine)</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
              التحكم السيادي فائق الدقة في مواضع البث الإعلاني المضمن بالفيديو (Pre-Roll, Mid-Roll, Post-Roll) مع خوارزمية التخطي بعد 5 ثوانٍ، وسقف التكرار الزمني، ومراقبة مؤشرات المشاهدة والاكتمال والنقر في الوقت الفعلي لمشغلات الموبايل والويب.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick time filter */}
            <div className="inline-flex rounded-2xl bg-black/40 border border-white/10 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('30days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === '30days'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 يوم
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('7days')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === '7days'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 أيام
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeRange === 'today'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                اليوم
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => loadData(timeRange)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all shadow-lg hover:border-amber-400/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              تحديث البيانات
            </button>
          </div>
        </div>
      </div>

      {/* ================= FEEDBACK BANNER ================= */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-between gap-3 border shadow-xl backdrop-blur-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-white/60 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/10"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* ================= 4 HERO 3D METRIC CARDS ================= */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Total Impressions */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-blue-500/20 p-5 md:p-6 shadow-xl hover:border-blue-500/50 transition-all group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">مرات العرض الإجمالية</span>
              <div className="p-2.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
              {analytics.totalImpressions.toLocaleString('ar-EG')}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
              <span className="text-slate-400 font-medium">جلسات معتمدة</span>
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                {analytics.videoStarts.toLocaleString('ar-EG')} بدء تشغيل
              </span>
            </div>
          </div>

          {/* Card 2: Completed Ads */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-emerald-500/20 p-5 md:p-6 shadow-xl hover:border-emerald-500/50 transition-all group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">الإعلانات المكتملة</span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 tracking-tight">
              {analytics.completedAds.toLocaleString('ar-EG')}
            </div>
            <div className="mt-3 space-y-1.5 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">معدل الاكتمال العام</span>
                <span className="text-emerald-300 font-black">{analytics.completionRate}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(analytics.completionRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 3: Skipped Ads */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-amber-500/20 p-5 md:p-6 shadow-xl hover:border-amber-500/50 transition-all group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">الإعلانات المتخطاة (Skipped)</span>
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <FastForward className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-400 tracking-tight">
              {analytics.skippedAds.toLocaleString('ar-EG')}
            </div>
            <div className="mt-3 space-y-1.5 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">نسبة التخطي الكلية</span>
                <span className="text-amber-300 font-black">{analytics.skipRate}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(analytics.skipRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 4: Clicks & CTR */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-purple-500/20 p-5 md:p-6 shadow-xl hover:border-purple-500/50 transition-all group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">النقرات ومعدل التفاعل</span>
              <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <MousePointerClick className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-purple-400 tracking-tight">
              {analytics.clicks.toLocaleString('ar-EG')}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-white/5">
              <span className="text-slate-400 font-medium">معدل النقر CTR: <strong className="text-purple-300">{analytics.ctr}%</strong></span>
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                متوسط {analytics.averageWatchDurationSeconds} ث
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERACTIVE VIRTUAL IN-STREAM SIMULATOR ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 border border-amber-500/25 p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 text-amber-400 shadow-md">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black text-white">
                  محاكي مشغل الفيديو التفاعلي (Live In-Stream Simulation Laboratory)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Real-Time Testing
                </span>
              </div>
              <p className="text-xs text-slate-400">
                اختبر تجربة المستخدم الحقيقية ومطابقة مواضع Pre-Roll, Mid-Roll, Post-Roll وخوارزمية التخطي بعد {settings.defaultSkipAfterSeconds} ثوانٍ
              </p>
            </div>
          </div>

          {/* Device switch buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setSimDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                simDevice === 'mobile'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              تطبيق فلاتر الموبايل
            </button>
            <button
              type="button"
              onClick={() => setSimDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                simDevice === 'desktop'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              مشغل الويب Web
            </button>
          </div>
        </div>

        {/* Simulator Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Player Screen Mock */}
          <div className="lg:col-span-7 bg-black/80 rounded-3xl border border-white/10 p-4 md:p-6 shadow-2xl relative overflow-hidden">
            <div className={`relative mx-auto rounded-2xl overflow-hidden border border-white/10 bg-slate-950 aspect-video shadow-2xl flex flex-col justify-between p-4 ${simDevice === 'mobile' ? 'max-w-md' : 'w-full'}`}>
              {/* Top Bar of player */}
              <div className="flex items-center justify-between text-xs z-20">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-white/10">
                    HD 1080p
                  </span>
                  {simActive && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black shadow-md flex items-center gap-1 animate-pulse">
                      <Film className="w-3 h-3" />
                      إعلان تجاري مضمن ({simAdType})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Volume2 className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Maximize2 className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Center Content Mock */}
              <div className="relative z-10 text-center space-y-2 py-8">
                {simActive ? (
                  <div className="space-y-3 animate-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <Sparkles className="w-7 h-7 animate-bounce" />
                    </div>
                    <div className="text-sm md:text-base font-black text-white">
                      عروض اليوم في مصر - تسوق ووفر الآن
                    </div>
                    <p className="text-[11px] text-amber-200/80">
                      حملة رقم #CAMP-2026-VIP • معتمد ومطابق للاستهداف
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center text-white/80">
                      <Play className="w-6 h-6 fill-white/80 pr-0.5" />
                    </div>
                    <div className="text-xs md:text-sm font-bold text-slate-300">
                      محتوى الفيديو الأصلي للمستخدم (10:00 دقائق)
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Interactive Area & Skip Button */}
              <div className="space-y-3 z-20">
                {/* Skip Ad overlay Button */}
                {simActive && (
                  <div className="flex items-center justify-between gap-3">
                    <a
                      href="#ad-details"
                      onClick={(e) => e.preventDefault()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-[11px] font-bold shadow-lg transition-all"
                    >
                      زيارة الموقع <ArrowUpRight className="w-3 h-3" />
                    </a>

                    <div>
                      {simCanSkip ? (
                        <button
                          type="button"
                          onClick={handleSkipSimAd}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/30 transition-all cursor-pointer animate-pulse"
                        >
                          <span>تخطي الإعلان</span>
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/20 text-slate-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>يمكنك التخطي بعد</span>
                          <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                            {simCountdown}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Video scrubber bar */}
                <div className="space-y-1">
                  <div className="relative w-full bg-white/20 h-2 rounded-full cursor-pointer overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: simActive ? '40%' : '15%' }}
                    ></div>
                    {/* Markers for pre-roll, mid-roll, post-roll */}
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-blue-400" title="Pre-Roll [00:00]"></div>
                    <div className="absolute top-0 right-1/2 w-2 h-2 rounded-full bg-amber-400" title="Mid-Roll [05:00]"></div>
                    <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-purple-400" title="Post-Roll [10:00]"></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{simActive ? '00:04' : '01:30'}</span>
                    <span>10:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simulator Controls & Trigger Deck */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-black text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              اختبار سيناريوهات تشغيل الإعلانات التلقائية:
            </h4>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => startSimulator('PreRoll')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 hover:border-blue-500/60 text-right flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">محاكاة إعلان Pre-Roll (بداية الفيديو)</div>
                    <div className="text-[10px] text-slate-400">يبدأ عند الثانية 00:00 قبل تشغيل المحتوى</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">تجربة الآن</span>
              </button>

              <button
                type="button"
                onClick={() => startSimulator('MidRoll')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 hover:border-amber-500/60 text-right flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">محاكاة إعلان Mid-Roll (أثناء الفيديو)</div>
                    <div className="text-[10px] text-slate-400">يظهر عند الدقيقة 05:00 إذا تخطى الفيديو 60 ثانية</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">تجربة الآن</span>
              </button>

              <button
                type="button"
                onClick={() => startSimulator('PostRoll')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 hover:border-purple-500/60 text-right flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">محاكاة إعلان Post-Roll (نهاية الفيديو)</div>
                    <div className="text-[10px] text-slate-400">يعرض فور انتهاء المشاهدة مباشرة</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">تجربة الآن</span>
              </button>
            </div>

            {/* Quick Status Diagnostic */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">حالة قرار الخادم (Ad Decision):</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> مؤهل ومطابق
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">مهلة التخطي المبرمجة:</span>
                <span className="text-amber-300 font-bold">{settings.defaultSkipAfterSeconds} ثوانٍ</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">سقف الفاصل الزمني:</span>
                <span className="text-purple-300 font-bold">{settings.defaultMinimumAdIntervalSeconds} ثانية بين كل إعلانين</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PLACEMENTS COMPARISON MATRIX ================= */}
      {analytics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm md:text-base font-black text-white">
                توزيع مواضع الإعلانات (Placement Performance Breakdown)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">مقارنة Pre-Roll vs Mid-Roll vs Post-Roll</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pre-Roll Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-blue-950/40 border border-blue-500/30 p-5 space-y-4 shadow-xl hover:border-blue-500/60 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50"></span>
                  <h4 className="text-sm font-black text-white">Pre-Roll (قبل بداية الفيديو)</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  الأعلى وصولاً
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400 font-bold">مرات البدء</div>
                  <div className="text-base font-black text-white">{analytics.preRoll.starts.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-emerald-400 font-bold">المكتملة</div>
                  <div className="text-base font-black text-emerald-400">{analytics.preRoll.completes.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-amber-400 font-bold">المتخطاة</div>
                  <div className="text-base font-black text-amber-400">{analytics.preRoll.skips.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-purple-400 font-bold">النقرات</div>
                  <div className="text-base font-black text-purple-400">{analytics.preRoll.clicks.toLocaleString('ar-EG')}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">معدل الاكتمال:</span>
                  <span className="text-blue-300 font-black">{analytics.preRoll.completionRate}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(analytics.preRoll.completionRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Mid-Roll Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-amber-950/40 border border-amber-500/30 p-5 space-y-4 shadow-xl hover:border-amber-500/60 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-md shadow-amber-500/50"></span>
                  <h4 className="text-sm font-black text-white">Mid-Roll (أثناء الفيديو)</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  الأعلى تفاعلاً
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400 font-bold">مرات البدء</div>
                  <div className="text-base font-black text-white">{analytics.midRoll.starts.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-emerald-400 font-bold">المكتملة</div>
                  <div className="text-base font-black text-emerald-400">{analytics.midRoll.completes.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-amber-400 font-bold">المتخطاة</div>
                  <div className="text-base font-black text-amber-400">{analytics.midRoll.skips.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-purple-400 font-bold">النقرات</div>
                  <div className="text-base font-black text-purple-400">{analytics.midRoll.clicks.toLocaleString('ar-EG')}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">معدل الاكتمال:</span>
                  <span className="text-amber-300 font-black">{analytics.midRoll.completionRate}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(analytics.midRoll.completionRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Post-Roll Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-purple-500/30 p-5 space-y-4 shadow-xl hover:border-purple-500/60 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-purple-500 shadow-md shadow-purple-500/50"></span>
                  <h4 className="text-sm font-black text-white">Post-Roll (بعد نهاية الفيديو)</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ختام الجلسة
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400 font-bold">مرات البدء</div>
                  <div className="text-base font-black text-white">{analytics.postRoll.starts.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-emerald-400 font-bold">المكتملة</div>
                  <div className="text-base font-black text-emerald-400">{analytics.postRoll.completes.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-amber-400 font-bold">المتخطاة</div>
                  <div className="text-base font-black text-amber-400">{analytics.postRoll.skips.toLocaleString('ar-EG')}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[10px] text-purple-400 font-bold">النقرات</div>
                  <div className="text-base font-black text-purple-400">{analytics.postRoll.clicks.toLocaleString('ar-EG')}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">معدل الاكتمال:</span>
                  <span className="text-purple-300 font-black">{analytics.postRoll.completionRate}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(analytics.postRoll.completionRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOP VIDEO CAMPAIGNS PERFORMANCE LEADERBOARD ================= */}
      {analytics && (
        <div className="p-6 md:p-8 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  أداء حملات إعلانات الفيديو (Top Video Campaigns Leaderboard)
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {filteredCampaigns.length} حملة
                  </span>
                </h3>
                <p className="text-xs text-slate-400">مقارنة المشاهدات، معدل الاكتمال، ونسبة التفاعل الحقيقي لكل فيديو إعلاني</p>
              </div>
            </div>

            {/* Search and Sort controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="بحث باسم الحملة أو الكود..."
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  className="pl-3 pr-9 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-500 transition-all w-52"
                />
              </div>

              <select
                value={campaignSortBy}
                onChange={(e: any) => setCampaignSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="starts" className="bg-slate-900 text-white">الأكثر مشاهدة</option>
                <option value="completionRate" className="bg-slate-900 text-white">الأعلى اكتمالاً</option>
                <option value="clicks" className="bg-slate-900 text-white">الأكثر نقراً</option>
                <option value="ctr" className="bg-slate-900 text-white">الأعلى CTR</option>
              </select>
            </div>
          </div>

          {filteredCampaigns.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 font-bold bg-white/[0.02]">
                    <th className="py-3.5 px-4">الحملة الإعلانية</th>
                    <th className="py-3.5 px-4">جلسات البدء</th>
                    <th className="py-3.5 px-4">المكتملة</th>
                    <th className="py-3.5 px-4">المتخطاة</th>
                    <th className="py-3.5 px-4">معدل الاكتمال</th>
                    <th className="py-3.5 px-4">النقرات ومعدل CTR</th>
                    <th className="py-3.5 px-4">متوسط المشاهدة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-slate-200">
                  {filteredCampaigns.map((camp) => (
                    <tr key={camp.campaignId} className="hover:bg-white/[0.04] transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-white group-hover:text-amber-400 transition-colors">
                          {camp.campaignTitle || 'حملة ترويجية'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{camp.campaignId.substring(0, 12)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {camp.starts.toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">
                        {camp.completes.toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3.5 px-4 text-amber-400 font-bold">
                        {camp.skips.toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-300 w-10 text-left font-mono">{camp.completionRate}%</span>
                          <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-1.5 rounded-full"
                              style={{ width: `${Math.min(camp.completionRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-purple-400">{camp.clicks.toLocaleString('ar-EG')} نقرة</div>
                        <span className="text-[10px] font-extrabold text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                          CTR {camp.ctr}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {camp.avgWatchSeconds ? `${Math.round(camp.avgWatchSeconds)} ثانية` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-3">
              <Film className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-sm font-bold text-slate-300">
                لا توجد بيانات جلسات فيديو مسجلة ضمن هذا النطاق الزمني
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                عند تشغيل إعلانات الفيديو في تطبيق فلاتر أو الويب ستظهر إحصائيات كل حملة بدقة فورية هنا.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= GLOBAL CONFIGURATION FORM & ENGINE RULES ================= */}
      <form onSubmit={handleSaveSettings} className="p-6 md:p-8 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/40 text-amber-400 shadow-md">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">إعدادات المنصة وقواعد الخوارزمية (Global In-Stream Rules)</h3>
              <p className="text-xs text-slate-400">تتحكم هذه القواعد مباشرة في السلوك الافتراضي لجميع مشغلات الفيديو في التطبيق</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Presets */}
            <div className="hidden md:flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-bold">قوالب سريعة:</span>
              <button
                type="button"
                onClick={() => applyPreset('reels')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-black"
              >
                ريلز سريعة (20 ث)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('balanced')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-bold"
              >
                متوازنة (موصى بها)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('revenue')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20 text-[11px] font-bold"
              >
                أقصى عائد
              </button>
              <button
                type="button"
                onClick={() => applyPreset('gentle')}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-bold"
              >
                هادئة
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs md:text-sm font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-xl shadow-amber-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}
            </button>
          </div>
        </div>

        {/* 4 Master Switches with 3D styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Master Toggle */}
          <div
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
              settings.enabled
                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">محرك إعلانات الفيديو العام</span>
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                  settings.enabled ? 'bg-amber-500 justify-start' : 'bg-slate-700 justify-end'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">تفعيل أو تعطيل محرك إعلانات الفيديو كلياً في التطبيق</p>
          </div>

          {/* Pre-Roll Toggle */}
          <div
            onClick={() => setSettings({ ...settings, preRollEnabled: !settings.preRollEnabled })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
              settings.preRollEnabled
                ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/5'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">Pre-Roll (قبل الفيديو)</span>
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                  settings.preRollEnabled ? 'bg-blue-500 justify-start' : 'bg-slate-700 justify-end'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">تشغيل إعلان قبل بدء المحتوى الأصلي مباشرة</p>
          </div>

          {/* Mid-Roll Toggle */}
          <div
            onClick={() => setSettings({ ...settings, midRollEnabled: !settings.midRollEnabled })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
              settings.midRollEnabled
                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">Mid-Roll (أثناء الفيديو)</span>
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                  settings.midRollEnabled ? 'bg-amber-500 justify-start' : 'bg-slate-700 justify-end'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">تشغيل فواصل إعلانية خلال الفيديوهات الطويلة</p>
          </div>

          {/* Post-Roll Toggle */}
          <div
            onClick={() => setSettings({ ...settings, postRollEnabled: !settings.postRollEnabled })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
              settings.postRollEnabled
                ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5'
                : 'bg-white/5 border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">Post-Roll (بعد نهاية الفيديو)</span>
              <div
                className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                  settings.postRollEnabled ? 'bg-purple-500 justify-start' : 'bg-slate-700 justify-end'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">تشغيل إعلان بعد اكتمال مشاهدة الفيديو الأصلي</p>
          </div>
        </div>

        {/* Detailed Configuration Inputs with Steppers & Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Max Ads per video */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                الحد الأقصى للإعلانات لكل فيديو
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.defaultMaxAdsPerVideo ?? 2}
                  onChange={(e) => setSettings({ ...settings, defaultMaxAdsPerVideo: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 font-mono font-black text-xs text-center focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-400 font-bold">إعلانات</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={settings.defaultMaxAdsPerVideo || 2}
              onChange={(e) => setSettings({ ...settings, defaultMaxAdsPerVideo: parseInt(e.target.value) || 1 })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">يمنع ظهور أكثر من هذا العدد من الإعلانات في جلسة المشاهدة الواحدة</p>
          </div>

          {/* 2. Skip ad delay */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                ظهور زر التخطي Skip Ad بعد
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.defaultSkipAfterSeconds ?? 5}
                  onChange={(e) => setSettings({ ...settings, defaultSkipAfterSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 font-mono font-black text-xs text-center focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-400 font-bold">ثوانٍ</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={settings.defaultSkipAfterSeconds || 5}
              onChange={(e) => setSettings({ ...settings, defaultSkipAfterSeconds: parseInt(e.target.value) || 5 })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">الإعلانات الأقصر من أو تساوي هذه المدة تكتمل تلقائياً بدون زر تخطي</p>
          </div>

          {/* 3. Min Ad Interval */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                الفاصل الزمني بين الإعلانات
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={settings.defaultMinimumAdIntervalSeconds ?? 20}
                  onChange={(e) => setSettings({ ...settings, defaultMinimumAdIntervalSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 font-mono font-black text-xs text-center focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-400 font-bold">ثانية</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="600"
              step="5"
              value={settings.defaultMinimumAdIntervalSeconds ?? 20}
              onChange={(e) => setSettings({ ...settings, defaultMinimumAdIntervalSeconds: parseInt(e.target.value) || 0 })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">فترة حماية للمستخدم لمنع تتابع الإعلانات بشكل مزعج (يتم حفظها في قاعدة البيانات)</p>
          </div>

          {/* 4. Mid-Roll Interval */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                فاصل فواصل Mid-Roll التلقائي
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={settings.defaultMidRollIntervalSeconds ?? 20}
                  onChange={(e) => setSettings({ ...settings, defaultMidRollIntervalSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 font-mono font-black text-xs text-center focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-400 font-bold">ثانية</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="900"
              step="5"
              value={settings.defaultMidRollIntervalSeconds ?? 20}
              onChange={(e) => setSettings({ ...settings, defaultMidRollIntervalSeconds: parseInt(e.target.value) || 0 })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">توقيت ظهور فاصل الـ Mid-Roll (يتم حفظها في قاعدة البيانات ويقرؤها تطبيق فلاتر)</p>
          </div>

          {/* 5. Minimum Video Duration */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                الحد الأدنى لطول الفيديو للـ Mid-Roll
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={settings.defaultMinimumVideoDurationSeconds ?? 20}
                  onChange={(e) => setSettings({ ...settings, defaultMinimumVideoDurationSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-16 px-2 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300 font-mono font-black text-xs text-center focus:outline-none focus:border-amber-400"
                />
                <span className="text-[11px] text-slate-400 font-bold">ثانية</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={settings.defaultMinimumVideoDurationSeconds ?? 20}
              onChange={(e) => setSettings({ ...settings, defaultMinimumVideoDurationSeconds: parseInt(e.target.value) || 0 })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">الفيديوهات الأقصر من هذه القيمة لن يظهر فيها فاصل Mid-Roll</p>
          </div>

          {/* Engine Status Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/20 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                حالة التزامن اللحظي
              </div>
              <p className="text-[11px] text-slate-300">
                أي تعديل يتم حفظه هنا يُعمم فوراً على كافة مشغلات التطبيق وتطبيقات Flutter دون الحاجة لإعادة نشر التطبيق.
              </p>
            </div>
            <div className="text-[10px] text-amber-300/80 font-mono pt-2">
              آخر تحديث: {new Date(settings.updatedAt || Date.now()).toLocaleTimeString('ar-EG')}
            </div>
          </div>
        </div>

        {/* Technical Standards & Algorithmic Guardrails Box */}
        <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-purple-500/10 border border-amber-500/30 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
            <ShieldCheck className="w-5 h-5" />
            معايير الامتثال الرقمي والحماية الخوارزمية (Video Ad Engine Specs):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[11px] leading-relaxed">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                قاعدة الإعلانات القصيرة (Short Ad Auto-Play):
              </div>
              <p className="text-slate-400">
                الإعلانات التي تقل مدتها عن 5 ثوانٍ يتم تشغيلها بالكامل تلقائياً دون إظهار زر تخطي، لضمان أعلى عائد للمعلن، ثم يستأنف الفيديو الأصلي فوراً بدون انقطاع.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                قاعدة الإعلانات الطويلة وتخطي الـ 5 ثوانٍ:
              </div>
              <p className="text-slate-400">
                يبدأ عداد زمني 5 ثوانٍ، وفور انقضائه يظهر زر التخطي (Skip Ad) مع خيار استمرار المشاهدة، ويُحتسب العرض كـ Completed إذا استمر المشاهد بعد الثواني المحددة.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                التحكم السيادي من الخادم (Server-Side Decisioning):
              </div>
              <p className="text-slate-400">
                تطبيقات الموبايل لا تقرر عرض الإعلان محلياً؛ بل ترسل طلباً للخادم للتحقق من دفع الحملة، والتحقق من الاستهداف الجغرافي، وسقف التكرار لمنع الاحتيال والتلاعب.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                التوافق التام مع مشغلات Flutter و Web:
              </div>
              <p className="text-slate-400">
                مهيأ بالكامل للعمل بسلاسة تامة مع حزم Flutter Video Player و Chewie و BetterPlayer بدون أي تعليق في تشغيل الفيديوهات و الريلز.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
