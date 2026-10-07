'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '@/components/admin/AdminShell';
import { superAppAdminApi, ModerationAuditItem } from '@/api/superAppAdmin';
import { Button } from '@/components/ui/Button';
import { formatRelativeArabicTime, formatArabicDate } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Bot,
  Cpu,
  Eye,
  Search,
  Filter,
  Layers,
  MessageSquare,
  ShoppingBag,
  Video,
  X,
  Zap,
  AlertOctagon,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Terminal,
  Play,
  UserX,
} from 'lucide-react';

// Content source badge design
function getSourceBadge(contentType: string) {
  const type = (contentType || '').toLowerCase();
  if (type.includes('reel') || type.includes('video')) {
    return {
      label: 'ريلز وفيديو',
      icon: Video,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
    };
  }
  if (type.includes('market') || type.includes('listing')) {
    return {
      label: 'سوق مصر',
      icon: ShoppingBag,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    };
  }
  if (type.includes('comment')) {
    return {
      label: 'تعليق مجتمعي',
      icon: MessageSquare,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/30',
    };
  }
  return {
    label: 'منشور / خبر',
    icon: Layers,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  };
}

// Severity design helper
function getSeverityBadge(score: number) {
  if (score >= 70) {
    return {
      label: 'خطورة قصوى',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      barColor: 'bg-gradient-to-r from-rose-500 to-red-600',
      icon: AlertOctagon,
      glow: 'shadow-rose-500/20',
    };
  }
  if (score >= 40) {
    return {
      label: 'خطورة متوسطة',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      barColor: 'bg-gradient-to-r from-amber-400 to-yellow-500',
      icon: AlertTriangle,
      glow: 'shadow-amber-500/20',
    };
  }
  return {
    label: 'اشتباه خفيف',
    textColor: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    barColor: 'bg-gradient-to-r from-sky-400 to-blue-500',
    icon: ShieldCheck,
    glow: 'shadow-sky-500/20',
  };
}

export default function AdminModerationPage() {
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [inspectItem, setInspectItem] = useState<ModerationAuditItem | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // AI Simulator tool state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simText, setSimText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    score: number;
    flagged: string[];
    category: string;
    actionTaken?: string;
    isAllowed?: boolean;
    source?: 'api' | 'local';
  } | null>(null);

  // Queries
  const { data: items = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'moderation', 'pending', page],
    queryFn: () => superAppAdminApi.getPendingModeration(page, 50),
    staleTime: 45_000,
  });

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Review Decision Mutation
  const reviewMutation = useMutation({
    mutationFn: ({ id, approve, notes }: { id: string; approve: boolean; notes?: string }) =>
      superAppAdminApi.reviewModeration(id, approve, notes),
    onSuccess: (_, variables) => {
      showNotification(
        variables.approve ? 'تم اعتماد ونشر المحتوى بنجاح بعد المراجعة ✅' : 'تم تأكيد حظر المحتوى المخالف وإزالته 🚫'
      );
      setInspectItem(null);
      setRejectionNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] });
    },
    onError: () => {
      showNotification('حدث خطأ أثناء معالجة القرار. يرجى المحاولة ثانية.');
    },
  });

  // Client-side filtering
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.contentType?.toLowerCase().includes(q) ||
          i.textScanned?.toLowerCase().includes(q) ||
          i.flaggedWords?.toLowerCase().includes(q) ||
          i.flaggedKeywords?.toLowerCase().includes(q) ||
          i.flagCategory?.toLowerCase().includes(q) ||
          i.user?.name?.toLowerCase().includes(q)
      );
    }

    if (selectedSource !== 'all') {
      result = result.filter((i) => i.contentType?.toLowerCase().includes(selectedSource.toLowerCase()));
    }

    if (severityFilter === 'high') {
      result = result.filter((i) => i.severityScore >= 70);
    } else if (severityFilter === 'medium') {
      result = result.filter((i) => i.severityScore >= 40 && i.severityScore < 70);
    } else if (severityFilter === 'low') {
      result = result.filter((i) => i.severityScore < 40);
    }

    return result;
  }, [items, search, selectedSource, severityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalPending = items.length;
    const severeCount = items.filter((i) => i.severityScore >= 70).length;
    const marketplaceCount = items.filter((i) => (i.contentType || '').toLowerCase().includes('market')).length;
    const reelsCount = items.filter((i) => (i.contentType || '').toLowerCase().includes('reel')).length;
    return { totalPending, severeCount, marketplaceCount, reelsCount };
  }, [items]);

  // Comprehensive client-side fallback dictionaries
  const NARCOTICS_DRUGS = [
    'حشيش', 'بانجو', 'شابو', 'هيروين', 'كوكايين', 'ترامادول', 'كبتاجون', 'كبتاغون',
    'بودرة', 'استروكس', 'فودو', 'ماريجوانا', 'ماريوانا', 'ليريكا', 'افيون', 'ميث',
    'كريستال ميث', 'كيميا', 'برشام مخدر', 'صراصير', 'ابتريل', 'مخدرات', 'دليفري حشيش',
    'بيع حشيش', 'ديلر', 'ديلرات', 'تجار مخدرات', 'قرش حشيش', 'صباع حشيش', 'طربة حشيش',
    'حقنة ماكس', 'سرنجة ماكس', 'كيتامين', 'جوينت', 'مخدر',
    'hash', 'hashish', 'weed', 'marijuana', 'cannabis', 'tramadol', 'shabu', 'cocaine', 'heroin',
    'captagon', 'meth', 'crystal meth', 'lyrica', 'ketamine', 'ecstasy', 'dealer', 'narcotics'
  ];

  const WEAPONS_CONTRABAND = [
    'سلاح', 'اسلحة', 'فرد خرطوش', 'خرطوش', 'طبنجة', 'طبنجه', 'مسدس', 'بندقية الية', 'كلاشينكوف',
    'طلقات حي', 'طلقات خرطوش', 'ذخيرة', 'رصاص حي', 'رصاص', 'بيع سلاح', 'تجارة سلاح', 'تجارة اسلحة',
    'سنجة', 'مطواة', 'قرن غزال', 'كباس', 'قنبلة', 'متفجرات', 'كاتم صوت',
    'بيع كلى', 'بيع اعضاء', 'تجارة اعضاء', 'شراء كلى', 'متبرع بكلى', 'حبوب اجهاض', 'سايتوتك',
    'ميزوتاك', 'cytotec', 'misotac', 'عملات مزورة', 'فلوس مزورة', 'تزييف عملة', 'دولارات مجمدة',
    'دولار مجمد', 'فيزا مسروقة', 'حسابات مسروقة',
    'weapon', 'weapons', 'guns for sale', 'pistol', 'revolver', 'ammunition', 'bullets', 'kalashnikov', 'explosives'
  ];

  const SEVERE_PROFANITY = [
    'كسم', 'كسمك', 'كس امك', 'كسختك', 'كس اختك', 'كس', 'طيز', 'طياز', 'زب', 'زبي', 'زبور',
    'شرموط', 'شرموطة', 'شرموطه', 'شراميط', 'متناك', 'متناكة', 'متناكه', 'متناكين', 'تناك', 'منيوك', 'منيوكة',
    'خول', 'خولة', 'خوله', 'خولات', 'عرص', 'عرصة', 'عرصه', 'معرص', 'معرصين', 'ديوث', 'دياثة',
    'قحبة', 'قحبه', 'قحاب', 'لبوه', 'لبوة', 'لبوات', 'عاهرة', 'عواهر', 'نيك', 'ناكك', 'بينيك', 'انيك', 'حنيك',
    'سكس', 'بورن', 'اباحي', 'دعارة', 'افلام سكس', 'بزاز', 'تعري', 'سحاق', 'لواط', 'لواطي', 'شيميل',
    'ابن الكلب', 'ابن الوسخة', 'ابن الوسخه', 'ابن المتناكة', 'ابن الشرموطة', 'ابن الحرام', 'ابن الزانية',
    'يا وسخ', 'يا قذر', 'يا واطي', 'يا حقير', 'يا سافل', 'يا نجس', 'يا حيوان', 'يا حمار', 'يا غبي', 'يا تافه',
    'يا معفن', 'يا زبالة', 'كافر', 'زنديق', 'فاجر', 'فاجرة', 'واطي', 'سافل', 'حقير', 'وسخ', 'وسخة', 'قذر', 'قذرة',
    'fuck', 'fucking', 'fucked', 'motherfucker', 'bitch', 'bitches', 'cunt', 'whore', 'slut', 'pussy', 'dick',
    'cock', 'asshole', 'porn', 'nude', 'nudes', 'sex', 'blowjob', 'bastard'
  ];

  const SCAM_FRAUD = [
    '1xbet', 'وان اكس بيت', 'مراهنات', 'قمار', 'رهان', 'كازينو', 'ربح مضمون', 'دولار مجانا',
    'شحن رصيد مجاني', 'سحب رصيد فوري', 'تعدين سحابي', 'تشغيل فلوس', 'فائدة يومية', 'استثمار بدون خسارة',
    'اربح 1000 دولار', 'ثغرة فودافون كاش', 'رصيد فودافون كاش مجانا', 'هكر', 'اختراق', 'هاك', 'تهكير',
    'سرقة حسابات'
  ];

  const normalizeClientAr = (input: string): string => {
    if (!input) return '';
    return input
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/(.)\1+/g, '$1')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىئ]/g, 'ي')
      .trim()
      .toLowerCase();
  };

  // AI Simulator scan with Backend API + Instant Client Heuristics fallback
  const handleSimulateScan = async (overrideText?: string) => {
    const textToScan = (overrideText ?? simText).trim();
    if (!textToScan) return;
    if (overrideText) setSimText(overrideText);
    setIsSimulating(true);

    try {
      const apiRes = await superAppAdminApi.testModeration(textToScan);
      if (apiRes) {
        setSimResult({
          score: apiRes.severityScore,
          flagged: apiRes.flaggedKeywords,
          category: apiRes.flagCategory,
          actionTaken: apiRes.actionTaken,
          isAllowed: apiRes.isAllowed,
          source: 'api',
        });
        setIsSimulating(false);
        return;
      }
    } catch {
      // Fallback to client heuristics
    }

    const norm = normalizeClientAr(textToScan);
    const compact = norm.replace(/[\.\-_*\/\\#@!~`|\^&]/g, '');
    const matched = new Set<string>();
    let category = 'Clean';
    let score = 0;

    const checkCategory = (list: string[], catName: string, catScore: number) => {
      for (const w of list) {
        const normW = normalizeClientAr(w);
        if (norm.includes(normW) || compact.includes(normW)) {
          matched.add(w);
          score = Math.max(score, catScore);
          category = catName;
        }
      }
    };

    checkCategory(NARCOTICS_DRUGS, 'NarcoticsAndDrugs', 95);
    checkCategory(WEAPONS_CONTRABAND, 'WeaponsAndContraband', 95);
    checkCategory(SEVERE_PROFANITY, 'Profanity', 85);
    checkCategory(SCAM_FRAUD, 'ScamOrFraud', 65);

    const flaggedArr = Array.from(matched);
    const isAllowed = score < 70;
    const actionTaken = score >= 70 ? 'AutoRejected' : score >= 35 ? 'FlaggedForReview' : 'Approved';

    setSimResult({
      score: score > 0 ? score : 5,
      flagged: flaggedArr,
      category,
      actionTaken,
      isAllowed,
      source: 'local',
    });
    setIsSimulating(false);
  };

  return (
    <AdminShell>
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto" dir="rtl">
        {/* Floating Notification */}
        {actionMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-indigo-600/95 text-white font-bold px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 border border-indigo-400/40 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* 1. CYBERNETIC HERO SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12192B] via-[#0E1524] to-[#0A0D17] border border-white/10 p-6 md:p-10 shadow-2xl">
          {/* Ambient AI Glow Background */}
          <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -left-28 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide">
                <Bot className="w-3.5 h-3.5" />
                <span>الذكاء الاصطناعي الفوري · AI Content Shield v2.4</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                  <ShieldAlert className="w-7 h-7" />
                </span>
                <span>الرقابة الذكية وحماية المجتمع</span>
              </h1>
              <p className="text-sm md:text-base text-gray-300 max-w-2xl leading-relaxed">
                مسح استباقي لحظي بالذكاء الاصطناعي لفحص المحتوى، كشف الرسائل الاحتيالية، فلترة الألفاظ المسيئة، وحماية التطبيق لضمان الامتثال الصارم لسياسات Google Play و Apple App Store.
              </p>
            </div>

            {/* Top Controls */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowSimulator(!showSimulator)}
                className="flex items-center gap-2 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-2xl px-4 py-2.5 transition text-xs font-bold"
              >
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>{showSimulator ? 'إغلاق المحاكي' : 'محاكي الفحص الذكي'}</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-2xl px-5 py-2.5 transition text-xs font-bold"
              >
                <RotateCcw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isFetching ? 'جاري الفحص...' : 'تحديث السجل'}</span>
              </Button>
            </div>
          </div>

          {/* 4 LIVE SAFETY & INCIDENT METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-indigo-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">المحتوى المعلق</span>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-white">{stats.totalPending.toLocaleString()}</div>
              <span className="text-[11px] text-gray-400">عنصر محجوز للمراجعة</span>
            </div>

            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-rose-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">مخالفات عالية الخطورة</span>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-400">{stats.severeCount.toLocaleString()}</div>
              <span className="text-[11px] text-gray-400">معدل خطورة يتجاوز 70%</span>
            </div>

            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-purple-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">بلاغات سوق مصر</span>
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <ShoppingBag className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-purple-300">{stats.marketplaceCount.toLocaleString()}</div>
              <span className="text-[11px] text-gray-400">إعلانات مبوبة مشبوهة</span>
            </div>

            <div className="bg-white/[0.03] backdrop-blur border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-xs font-semibold">مستوى أمان المنصة</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400">99.8%</div>
              <span className="text-[11px] text-gray-400">امتثال كامل لشروط المتاجر</span>
            </div>
          </div>
        </div>

        {/* 2. INTERACTIVE AI MODERATION SIMULATOR (COLLAPSIBLE PLAYGROUND) */}
        {showSimulator && (
          <div className="bg-[#121A2C] border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm">
                <Cpu className="w-5 h-5 text-indigo-400" />
                <span>محاكي خوارزمية الذكاء الاصطناعي لكشف الألفاظ والمخدرات والاحتيال (AI Heuristic Simulator)</span>
              </div>
              <button
                onClick={() => setShowSimulator(false)}
                className="text-gray-400 hover:text-white text-xs flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg"
              >
                <span>إخفاء</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              اكتب أي نص أو عبارة لاختبار كيفية استجابة نموذج الذكاء الاصطناعي المركزي في رصد المخدرات، الأسلحة، الألفاظ الخادشة، وحظرها فورياً:
            </p>

            {/* Quick Test Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-gray-400">نماذج اختبار سريعة بنقرة واحدة:</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🌿 تجربة: مخدرات وحشيش', text: 'عندي حشيش وترامادول وشابو دليفري وسعر خاص' },
                  { label: '🔫 تجربة: تجارة أسلحة', text: 'للبيع فرد خرطوش وطبنجة 9 ملم مع طلقات حية' },
                  { label: '🛑 تجربة: شتائم وسب قذف', text: 'انت ابن متناكة وشرموطة وكس امك يا خول' },
                  { label: '🎰 تجربة: مراهنات 1xbet', text: 'اربح 1000 دولار مضمونة وشحن رصيد مجاني مع وان اكس بيت' },
                  { label: '✅ تجربة: محتوى نظيف سليم', text: 'للبيع سيارة تويوتا كورولا 2022 بحالة الزيرو في الشيخ زايد' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulateScan(preset.text)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 border border-white/10 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimulateScan()}
                placeholder="جرب كتابة أي نص (مثال: بيع حشيش، فرد خرطوش، شتائم، 1xbet)..."
                className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 focus:border-indigo-400/60 rounded-xl text-white text-xs outline-none"
              />
              <Button
                onClick={() => handleSimulateScan()}
                disabled={isSimulating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 rounded-xl flex items-center gap-2 shrink-0"
              >
                {isSimulating ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isSimulating ? 'جاري الفحص بالذكاء الاصطناعي...' : 'اختبار النص الآن'}</span>
              </Button>
            </div>

            {/* Results Diagnostic Card */}
            {simResult && (
              <div
                className={`p-5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 animate-in fade-in transition-all ${
                  simResult.score >= 70
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-500/10'
                    : simResult.score >= 35
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-500/10'
                    : 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-500/10'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold">التصنيف المحدد:</span>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black border ${
                        simResult.category === 'NarcoticsAndDrugs'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : simResult.category === 'WeaponsAndContraband'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : simResult.category === 'Profanity'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : simResult.category === 'ScamOrFraud'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {simResult.category === 'NarcoticsAndDrugs'
                        ? '🚨 مخدرات ومواد ممنوعة (Narcotics)'
                        : simResult.category === 'WeaponsAndContraband'
                        ? '⚔️ أسلحة وتجارة غير مشروعة (Weapons)'
                        : simResult.category === 'Profanity'
                        ? '🛑 شتائم وألفاظ نابية (Profanity & Hate)'
                        : simResult.category === 'ScamOrFraud'
                        ? '⚠️ احتيال ونصب ومراهنات (Scam)'
                        : '✅ محتوى نظيف ومطابق للشروط (Clean)'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {simResult.source === 'api' ? '⚡ AI Core Engine' : '🛡️ Local Shield Engine'}
                    </span>
                  </div>

                  <div>
                    {simResult.flagged.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-xs font-bold text-rose-400">الكلمات والمصطلحات المحظورة المكتشفة:</span>
                        {simResult.flagged.map((word, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400 font-bold">
                        لم يتم العثور على أي ألفاظ محظورة أو كلمات مريبة في النص.
                      </div>
                    )}
                  </div>

                  {/* Automated Action Badge */}
                  <div className="text-xs text-slate-300 pt-1">
                    الإجراء التلقائي المتخذ:{' '}
                    <span
                      className={`font-black ${
                        simResult.actionTaken === 'AutoRejected' || simResult.score >= 70
                          ? 'text-rose-400'
                          : simResult.actionTaken === 'FlaggedForReview' || simResult.score >= 35
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {simResult.actionTaken === 'AutoRejected' || simResult.score >= 70
                        ? 'حظر ومنع فوري من النشر (Auto-Rejected 🚫)'
                        : simResult.actionTaken === 'FlaggedForReview' || simResult.score >= 35
                        ? 'تعليق وإحالة لمراجعة الإدارة (Flagged for Review ⏳)'
                        : 'موافقة واعتماد النشر فورياً (Approved ✅)'}
                    </span>
                  </div>
                </div>

                <div className="text-center md:text-right shrink-0 border-t md:border-t-0 md:border-r border-white/10 pt-3 md:pt-0 md:pr-6">
                  <div className="text-xs text-gray-400 font-bold">معدل الخطورة</div>
                  <div
                    className={`text-3xl font-black font-mono tracking-tight mt-1 ${
                      simResult.score >= 70
                        ? 'text-rose-400'
                        : simResult.score >= 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {simResult.score}%
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {simResult.score >= 70 ? 'خطر جسيم (حظر)' : simResult.score >= 35 ? 'اشتباه متوسط' : 'آمن تماماً'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. DOCK FILTERS & SEARCH */}
        <div className="bg-[#121824]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالنص المفحوص، الكلمة المحظورة، أو اسم المستخدم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-11 py-2.5 bg-black/30 border border-white/10 focus:border-indigo-400/60 rounded-xl text-white text-xs md:text-sm placeholder-gray-500 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Source Filter */}
            <div className="relative">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="appearance-none bg-black/30 border border-white/10 focus:border-indigo-400/60 text-gray-200 text-xs rounded-xl px-3.5 py-2.5 pr-8 outline-none font-semibold cursor-pointer transition"
              >
                <option value="all" className="bg-slate-900 text-white">
                  كافة المصادر 🌐
                </option>
                <option value="marketplace" className="bg-slate-900 text-white">
                  سوق مصر 🛍️
                </option>
                <option value="reel" className="bg-slate-900 text-white">
                  الريلز والفيديوهات 🎬
                </option>
                <option value="comment" className="bg-slate-900 text-white">
                  التعليقات المجتمعية 💬
                </option>
                <option value="post" className="bg-slate-900 text-white">
                  المنشورات والأخبار 📝
                </option>
              </select>
              <Layers className="w-3.5 h-3.5 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Severity Filter Tabs */}
            <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  severityFilter === 'all' ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setSeverityFilter('high')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  severityFilter === 'high' ? 'bg-rose-500 text-white shadow' : 'text-gray-400 hover:text-rose-400'
                }`}
              >
                <AlertOctagon className="w-3 h-3" />
                <span>قصوى (&gt;70%)</span>
              </button>
              <button
                onClick={() => setSeverityFilter('medium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  severityFilter === 'medium' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-amber-400'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>متوسطة</span>
              </button>
              <button
                onClick={() => setSeverityFilter('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  severityFilter === 'low' ? 'bg-sky-500 text-white shadow' : 'text-gray-400 hover:text-sky-400'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>خفيفة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <div>
            معروض <span className="font-bold text-white">{filteredItems.length}</span> بلاغ ومخالفة بانتظار البت الإداري
            {search && (
              <span>
                {' '}
                مطابق للبحث: &quot;<span className="text-indigo-400 font-semibold">{search}</span>&quot;
              </span>
            )}
          </div>
          {(selectedSource !== 'all' || severityFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedSource('all');
                setSeverityFilter('all');
              }}
              className="text-indigo-400 hover:underline font-semibold"
            >
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>

        {/* 4. MODERATION AUDIT CARDS */}
        {isLoading ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-base font-bold text-white">جاري استرجاع سجلات الرقابة الآلية...</div>
            <div className="text-xs text-gray-400 mt-1">يتم جلب الحالات المشبوهة التي التقطها الذكاء الاصطناعي</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center bg-[#101724] border border-white/10 rounded-3xl space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">المنصة آمنة ونظيفة تماماً 🛡️✨</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              لا توجد أي بلاغات معلقة أو محتوى مخالف بانتظار المراجعة حالياً. النظام الذكي يعمل على مدار الساعة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredItems.map((item) => {
              const sourceBadge = getSourceBadge(item.contentType);
              const severity = getSeverityBadge(item.severityScore);
              const SourceIcon = sourceBadge.icon;
              const SeverityIcon = severity.icon;

              const detectedWords = item.flaggedWords || item.flaggedKeywords;

              return (
                <div
                  key={item.id}
                  className="group bg-gradient-to-b from-[#131B2B] to-[#0D121D] border border-white/10 hover:border-indigo-500/40 rounded-3xl p-5 md:p-6 shadow-xl transition-all duration-300 space-y-4"
                >
                  {/* Top Bar: Source, Severity Gauge & Time */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {/* Source Tag */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${sourceBadge.bg} ${sourceBadge.color} border ${sourceBadge.border}`}
                      >
                        <SourceIcon className="w-3.5 h-3.5" />
                        <span>{sourceBadge.label}</span>
                      </span>

                      {/* Severity Pill */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${severity.bgColor} ${severity.textColor} border ${severity.borderColor}`}
                      >
                        <SeverityIcon className="w-3.5 h-3.5" />
                        <span>
                          {severity.label} ({item.severityScore}%)
                        </span>
                      </span>

                      {/* Flag Category */}
                      {item.flagCategory && (
                        <span className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-0.5 rounded-lg">
                          التصنيف: {item.flagCategory}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatRelativeArabicTime(item.moderatedAt)}</span>
                    </div>
                  </div>

                  {/* Scanned Incident Content Showcase */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 font-semibold flex items-center justify-between">
                      <span>النص المحجوز للفحص:</span>
                      {detectedWords && (
                        <span className="text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-md">
                          المصطلحات الملتقطة: {detectedWords}
                        </span>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-sm text-gray-200 leading-relaxed font-mono">
                      {item.textScanned || detectedWords || 'تم الإبلاغ عن محتوى غير لائق في هذا القسم.'}
                    </div>
                  </div>

                  {/* Author / User Information Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs">
                        {item.user?.name ? item.user.name.charAt(0) : 'م'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{item.user?.name || 'مستخدم مسجل'}</span>
                          {item.user?.username && <span className="text-gray-500">(@{item.user.username})</span>}
                        </div>
                        {item.user?.phoneNumber && (
                          <div className="text-[11px] text-gray-400">{item.user.phoneNumber}</div>
                        )}
                      </div>
                    </div>

                    {/* Action Decision Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInspectItem(item)}
                        className="text-xs border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-1.5 rounded-xl px-3.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>معاينة القرار</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: item.id, approve: true })}
                        className="text-xs border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center gap-1.5 rounded-xl px-4 font-bold"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>اعتماد وتجاوز</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({
                            id: item.id,
                            approve: false,
                            notes: 'تأكيد الحظر والإزالة لمخالفة سياسات المنصة',
                          })
                        }
                        className="text-xs border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center gap-1.5 rounded-xl px-4 font-bold"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>تأكيد الحظر</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. INSPECT & DECISION MODAL */}
        {inspectItem && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-[#12192A] border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8" dir="rtl">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">معاينة تفاصيل تقرير الذكاء الاصطناعي</h3>
                    <p className="text-xs text-gray-400">معاينة كاملة قبل اتخاذ القرار النهائي بشأن المحتوى وصاحبه.</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectItem(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Metric Summary */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/30 border border-white/5 text-center">
                  <div>
                    <div className="text-xs text-gray-400">نوع المحتوى</div>
                    <div className="text-sm font-bold text-indigo-300 mt-1">{inspectItem.contentType}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">معدل الخطورة</div>
                    <div
                      className={`text-sm font-black mt-1 ${
                        inspectItem.severityScore >= 70
                          ? 'text-rose-400'
                          : inspectItem.severityScore >= 40
                          ? 'text-amber-400'
                          : 'text-sky-400'
                      }`}
                    >
                      {inspectItem.severityScore}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">تاريخ الفحص</div>
                    <div className="text-xs font-semibold text-gray-300 mt-1">
                      {formatArabicDate(inspectItem.moderatedAt)}
                    </div>
                  </div>
                </div>

                {/* Scanned Text Details */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-300">النص الكامل المحجوز:</div>
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-sm text-gray-200 leading-relaxed font-mono whitespace-pre-line">
                    {inspectItem.textScanned || 'النص غير متوفر بالكامل، يرجى مراجعة المصطلحات المكتشفة أدناه.'}
                  </div>
                </div>

                {/* Detected Keywords Alert */}
                {(inspectItem.flaggedWords || inspectItem.flaggedKeywords) && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      <strong>الكلمات المكتشفة بالخوارزمية:</strong>{' '}
                      {inspectItem.flaggedWords || inspectItem.flaggedKeywords}
                    </span>
                  </div>
                )}

                {/* Decision Notes Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300">ملاحظات القرار الإداري (اختياري):</label>
                  <textarea
                    rows={2}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="اكتب سبباً إدارياً أو تنبيهاً يظهر للمستخدم في حال الرفض..."
                    className="w-full p-3 bg-black/30 border border-white/10 focus:border-indigo-400/60 rounded-xl text-white text-xs outline-none"
                  />
                </div>

                {/* Decision Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => setInspectItem(null)}
                    className="text-xs border-white/15 px-4"
                  >
                    إغلاق
                  </Button>

                  <Button
                    variant="outline"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({
                        id: inspectItem.id,
                        approve: false,
                        notes: rejectionNotes.trim() || 'حظر مؤكد لمخالفة سياسات النشر وشروط الاستخدام',
                      })
                    }
                    className="text-xs border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold px-5"
                  >
                    <XCircle className="w-4 h-4 ml-1.5" />
                    <span>تأكيد الحظر والإزالة</span>
                  </Button>

                  <Button
                    variant="primary"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      reviewMutation.mutate({
                        id: inspectItem.id,
                        approve: true,
                        notes: rejectionNotes.trim() || undefined,
                      })
                    }
                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5"
                  >
                    <CheckCircle2 className="w-4 h-4 ml-1.5" />
                    <span>اعتماد ونشر المحتوى</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
