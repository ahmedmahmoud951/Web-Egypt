'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import {
  Radio,
  MessageSquare,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Database,
  CheckCircle2,
  Lock,
  RefreshCw,
  Sparkles,
  Server,
  Layers,
  Cpu,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import Link from 'next/link';

export default function ArchitecturePage() {
  const [realtimeConfig, setRealtimeConfig] = useState<any>(null);
  const [isTestingRealtime, setIsTestingRealtime] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestRealtime = async () => {
    setIsTestingRealtime(true);
    setTestResult(null);
    try {
      const res = await apiClient.get('/config/realtime');
      setRealtimeConfig(res.data);
      setTestResult('success');
    } catch (err: any) {
      setTestResult(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setIsTestingRealtime(false);
    }
  };

  const steps = [
    {
      id: 'step-1',
      number: '01',
      title: 'محرك البث اللحظي SignalR Hub',
      subtitle: 'Real-Time Event Stream Driven by SQL Server',
      icon: Radio,
      color: 'red',
      bgGradient: 'from-red-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-red-200/80',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      description:
        'بنية تحتية متطورة للبث اللحظي للبيانات. الرابط ومسار الهب يتم جلبهما ديناميكيًا من قاعدة بيانات SQL Server دون تثبيت صلب (No Hardcoding).',
      highlights: [
        'جدول قاعدة البيانات: [dbo].[SignalRHubConfigurations]',
        'نقطة النهاية الآمنة: GET /api/config/realtime',
        'الأحداث اللحظية: EventCreated, EventConfirmed, EventHidden, EventRestored',
        'سياسة إعادة الاتصال الذاتية: [0, 2s, 5s, 10s, 30s]',
      ],
      interactiveAction: (
        <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Server className="w-4 h-4 text-red-400" />
              <span>فحص مباشر: GET /api/config/realtime</span>
            </span>
            <Button
              size="sm"
              variant="outline"
              isLoading={isTestingRealtime}
              onClick={handleTestRealtime}
              className="text-xs bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700 py-1"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>فحص التكوين الآن</span>
            </Button>
          </div>
          {realtimeConfig && (
            <pre className="p-3 bg-slate-950 rounded-xl text-emerald-400 overflow-x-auto text-[11px] leading-relaxed" dir="ltr">
              {JSON.stringify(realtimeConfig, null, 2)}
            </pre>
          )}
          {testResult && testResult !== 'success' && (
            <p className="text-rose-400 text-xs">{testResult}</p>
          )}
        </div>
      ),
    },
    {
      id: 'step-2',
      number: '02',
      title: 'بوابة التحقق ومصادقة OTP عبر WhatsApp',
      subtitle: 'Authevo WhatsApp / SMS Gateway + E.164 + 2FA',
      icon: MessageSquare,
      color: 'emerald',
      bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'border-emerald-200/80',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description:
        'ربط كامل ومباشر مع بوابة Authevo لإرسال رموز التحقق OTP فورياً عبر WhatsApp أو الرسائل القصيرة للأرقام المصرية مع معالجة حماية التبريد وتكرار الطلب.',
      highlights: [
        'التحويل التلقائي لصيغة E.164 الدولية: 01xxxxxxxxx ➔ +201xxxxxxxxx',
        'مفتاح الربط الرسمي الفعال: sk_0aa20...56b9',
        'حماية ضد السبام (Rate Limiting & Cooldown) بكود HTTP 429',
        'مصادقة JWT مع Refresh Tokens ثنائية لتأمين الجلسات وتجديدها بسلاسة',
      ],
      interactiveAction: (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <span className="text-xs font-black text-emerald-950 block">البوابة نشطة ومتصلة عبر WhatsApp</span>
              <span className="text-[11px] text-emerald-700">Authevo API: https://api.authevo.dev/v1/otp</span>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="primary" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
              تجربة تسجيل الدخول
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'step-3',
      number: '03',
      title: 'محرك التقسيم الجغرافي لمحافظات مصر',
      subtitle: 'Hierarchical 27 Governorates & Community Suggestions',
      icon: MapPin,
      color: 'amber',
      bgGradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
      borderColor: 'border-amber-200/80',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description:
        'شجرة جغرافية هرمية تضم كافة محافظات مصر الـ 27، مع إمكانية تفريع المدن والمراكز والقرى، وتمكين المواطنين من اقتراح مواقع جديدة تخضع لمراجعة واعتماد الإدارة.',
      highlights: [
        '27 محافظة مصرية مع كود التوزيع الإداري الرسمي',
        'هيكلية هرمية: محافظة ➔ مدينة / مركز ➔ قرية / حي',
        'واجهة اقتراح موقع جديد: /locations/suggest',
        'لوحة اعتماد ورفض الاقتراحات من الإدارة: /admin/locations',
      ],
      interactiveAction: (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/locations">
            <Button size="sm" variant="outline" className="text-xs border-amber-300 text-amber-900 hover:bg-amber-50">
              استعراض الـ 27 محافظة
            </Button>
          </Link>
          <Link href="/locations/suggest">
            <Button size="sm" variant="ghost" className="text-xs text-amber-800 hover:bg-amber-50">
              اقترح مكاناً جديداً
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'step-4',
      number: '04',
      title: 'دورة حياة الأحداث والحماية الذاتية',
      subtitle: 'Community Verification & Auto-Moderation (10 Reports)',
      icon: ShieldCheck,
      color: 'rose',
      bgGradient: 'from-rose-500/10 via-red-500/5 to-transparent',
      borderColor: 'border-rose-200/80',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description:
        'نظام مجتمعي ذكي لتوثيق الوقائع الميدانية؛ مع زر تأكيد لمنع الشائعات، وخوارزمية حجب تلقائي فور تلقي الحدث 10 بلاغات لحماية المجتمع من المحتوى المضلل.',
      highlights: [
        'نشر الحدث بالتصنيف والموقع والصور التوثيقية (حتى 5MB)',
        'تأكيد المجتمع: زيادة عداد التوثيق مع منع تأكيد المستخدم مرتين',
        'الحجب الذاتي: بلوغ 10 بلاغات ينقل الحدث فورياً إلى حالة UnderReview / Hidden',
        'لوحة فحص البلاغات والأحداث المحجوبة للإدارة: /admin/reports',
      ],
      interactiveAction: (
        <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-bold">
            <span>مقياس الحماية التلقائية للحدث:</span>
            <span className="text-rose-600 font-black">10 بلاغات = حجب تلقائي فوري</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 h-2.5 rounded-full w-full" />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>منشور وموثق (0 بلاغ)</span>
            <span>تحت المراجعة (5 بلاغات)</span>
            <span>محجوب ومستبعد (10 بلاغات)</span>
          </div>
        </div>
      ),
    },
    {
      id: 'step-5',
      number: '05',
      title: 'قسم التعليقات والمشاركات المجتمعية',
      subtitle: 'Live Event Comments & Community Discussions',
      icon: MessageCircle,
      color: 'indigo',
      bgGradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
      borderColor: 'border-indigo-200/80',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description:
        'أحدث إضافات قاعدة البيانات والباك أند؛ تمكين المواطنين من كتابة تعليقات فورية وإفادات حية حول الأحداث، مع عداد إجمالي وتحديث فوري للكاش.',
      highlights: [
        'جدول قاعدة البيانات المنفذ: [dbo].[EventComments]',
        'إضافة حقل CommentsCount لجدول الأحداث لسرعة الاسترجاع',
        'نقاط النهاية: GET/POST /api/events/{eventId}/comments',
        'التحقق من المدخلات: ألا يقل التعليق عن حرفين ولا يتجاوز 1000 حرف',
      ],
      interactiveAction: (
        <div className="mt-4 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between">
          <span>متوفر الآن في كل صفحة تفاصيل حدث وكروت الأحداث في الرئيسية!</span>
          <Link href="/">
            <Button size="sm" variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
              تصفح الأحداث الآن
            </Button>
          </Link>
        </div>
      ),
    },
    {
      id: 'step-6',
      number: '06',
      title: 'أمان قاعدة البيانات والحماية ضد الإنتاج',
      subtitle: 'AppRuntimeRole & Anti-Production Safety Locks',
      icon: Database,
      color: 'slate',
      bgGradient: 'from-slate-500/10 via-slate-400/5 to-transparent',
      borderColor: 'border-slate-300',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description:
        'تطبيق أعلى معايير أمان SQL Server: عزل الصلاحيات، واستخدام دور تشغيلي مقيد (DML Only)، وسكربتات استرجاع مقفلة بحراس أمان لتجنب مسح بيانات الإنتاج بالخطأ.',
      highlights: [
        'دور التطبيق: AppRuntimeRole (SELECT, INSERT, UPDATE, DELETE فقط دون صلاحيات DDL)',
        'حارس بيئة الإنتاج: DEVELOPMENT_RESET_CONFIRMED مطلوب يدوياً في 17_ResetDevelopmentDatabase.sql',
        'حماية الخصوصية (PII): تشفير وإخفاء أرقام الهواتف ****0123 في السجلات',
        'فهارس عالية الأداء على مفاتيح البحث: LocationId, Status, CreatedAt',
      ],
      interactiveAction: (
        <div className="mt-4 p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>تمت تهيئة قاعدة البيانات db66962 بنجاح مع كافة الجداول والقيود والأدوار الأمنية.</span>
        </div>
      ),
    },
  ];

  return (
    <AppLayout showSidebar={true}>
      <div className="space-y-6 text-right">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/" label="العودة للرئيسية" variant="pill" />
        </div>

        {/* Hero Banner */}
        <section className="relative overflow-hidden glass-card bg-white/95 rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg shadow-slate-100/60 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-red-50 to-rose-50 text-red-700 rounded-full text-xs font-black border border-red-100 shadow-xs">
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>مركز المنظومة والعمليات التقنية (System Architecture)</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              معمارية منصة &quot;النهارده في مصر 🇪🇬&quot;
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              استعراض حي ومفصل لكافة الخطوات الست التي تم بناؤها وتفعيلها في الباك أند وقاعدة البيانات:
              من محرك البث اللحظي SignalR، وبوابة WhatsApp OTP، ونظام الحجب الذاتي، وقسم التعليقات المجتمعية، وحتى أمان SQL Server.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">نقاط النهاية (API)</span>
              <span className="text-xl font-black text-slate-900">31 Endpoint</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">بوابة التحقق</span>
              <span className="text-xl font-black text-emerald-600">WhatsApp / SMS</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">المحافظات الموثقة</span>
              <span className="text-xl font-black text-amber-600">27 محافظة</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 block font-medium">حماية السبام التلقائية</span>
              <span className="text-xl font-black text-rose-600">10 بلاغات</span>
            </div>
          </div>
        </section>

        {/* Steps Grid */}
        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                id={step.id}
                className={`glass-card bg-white/95 rounded-3xl p-6 sm:p-8 border ${step.borderColor} shadow-xs hover:shadow-md transition-smooth space-y-4`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 flex items-center justify-center font-black text-slate-800 text-base shadow-xs">
                      {step.number}
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                        <Icon className="w-5 h-5 text-red-600" />
                        <span>{step.title}</span>
                      </h2>
                      <span className="text-xs text-slate-400 font-mono" dir="ltr">
                        {step.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className={`self-start sm:self-auto text-xs px-3 py-1 rounded-full font-bold border ${step.badgeColor}`}>
                    مكتمل ويعمل بالكامل ✓
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Highlights List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {step.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Action Widget */}
                {step.interactiveAction}
              </div>
            );
          })}
        </div>

        {/* Footer Navigation CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-red-600 to-rose-700 text-white text-center space-y-4 shadow-xl shadow-red-500/20">
          <h3 className="text-xl sm:text-2xl font-black">
            هل أنت مستعد لتجربة المنصة الآن؟
          </h3>
          <p className="text-xs sm:text-sm text-red-100 max-w-xl mx-auto">
            تصفح الأحداث الموثقة لحظة بلحظة، أو أضف حدثًا في محافظتك، وشارك بتعليقك وتأكيدك.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/">
              <Button size="lg" className="bg-white text-red-700 hover:bg-red-50 font-black text-sm px-6">
                الذهاب للصفحة الرئيسية
              </Button>
            </Link>
            <Link href="/events/new">
              <Button size="lg" variant="outline" className="text-white border-white/60 hover:bg-white/10 font-bold text-sm px-6">
                أضف حدثًا جديدًا
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
