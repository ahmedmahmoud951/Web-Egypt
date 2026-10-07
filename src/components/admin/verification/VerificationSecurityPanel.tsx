'use client';

import React from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cpu,
  Radio,
  FileKey,
  History,
  Sparkles,
  Server,
  Database,
  Fingerprint,
} from 'lucide-react';

export function VerificationSecurityPanel() {
  const securityEngines = [
    {
      title: 'محرك التحقق من الرقم القومي والـ OCR',
      category: 'هوية رقمية ذكية',
      icon: Fingerprint,
      tone: 'text-amber-400',
      bgTone: 'bg-amber-500/10 border-amber-500/30',
      badge: 'فحص فوري 14 رقم',
      description:
        'استخراج آلي لبيانات بطاقة الرقم القومي المصري (المحافظة، تاريخ الميلاد، والنوع)، مع تدقيق حسابي لخوارزمية الـ Checksum ومنع تكرار البطاقة لأكثر من حساب.',
    },
    {
      title: 'سحابة الوثائق المشفرة Backblaze B2',
      category: 'خصوصية وسرية المستندات',
      icon: FileKey,
      tone: 'text-teal-400',
      bgTone: 'bg-teal-500/10 border-teal-500/30',
      badge: 'تشفير كامل 100%',
      description:
        'تُخزن بطاقات الهوية والوثائق في مستودع سحابي خاص ومغلق تماماً عن الجمهور. الروابط الممنوحة للمعاينة الإدارية موقعة ومؤقتة، ولا يمكن لأي مستخدم الوصول لبيانات غيره.',
    },
    {
      title: 'بث SignalR اللحظي المتزامن',
      category: 'تحديث فوري للبيانات',
      icon: Radio,
      tone: 'text-sky-400',
      bgTone: 'bg-sky-500/10 border-sky-500/30',
      badge: 'بث حي WebSockets',
      description:
        'كل إجراء اعتماد أو رفض أو سحب أو تقديم طلب يُبث فورياً لجميع شاشات الإدارة المفتوحة وتطبيقات المستخدمين دون الحاجة لإعادة تحميل الصفحة إطلاقاً.',
    },
    {
      title: 'حماية الأسعار وقاعدة البيانات الموثوقة',
      category: 'حماية مالية ضد التلاعب',
      icon: Lock,
      tone: 'text-emerald-400',
      bgTone: 'bg-emerald-500/10 border-emerald-500/30',
      badge: 'Server-Authoritative',
      description:
        'لا يثق الخادم بأي أسعار أو مدد أو حالات مرسلة من جانب تطبيق الهاتف. تُستعلم وتُسجل الأسعار من جدول الباقات المعتمد في SQL Server حصراً.',
    },
    {
      title: 'محرك انتهاء الصلاحية الآلي والإشعارات',
      category: 'خدمة دورية خلفية (Cron Daemon)',
      icon: Cpu,
      tone: 'text-purple-400',
      bgTone: 'bg-purple-500/10 border-purple-500/30',
      badge: 'تنبيه 7 أيام قبل الانتهاء',
      description:
        'خدمة خلفية دورية تتفقد التوثيقات الفعالة على مدار الساعة، وتقوم بسحب الشارات المنتهية تلقائياً وإرسال إشعار تذكيري واحد للمستخدم قبل الانتهاء بـ 7 أيام مع منع التكرار.',
    },
    {
      title: 'سجل التدقيق الزمني غير القابل للمحو',
      category: 'نزاهة وامتثال رقابي',
      icon: History,
      tone: 'text-indigo-400',
      bgTone: 'bg-indigo-500/10 border-indigo-500/30',
      badge: 'Immutable Audit Log',
      description:
        'تسجيل هوية المسؤول القائم بالاعتماد أو الرفض أو السحب، مع البصمة الزمنية الكاملة والسبب المدخل، لحماية حقوق المستخدمين ومنع أي تلاعب أو شبهة.',
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 text-right">
      {/* Top Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 shadow-lg">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-white truncate">
                سياسات أمان منظومة التوثيق والخدمات الخلفية
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                قواعد الحماية المطبقة 100% على مستوى خادم الـ API وقاعدة البيانات المركزية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-black shadow-inner shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>جميع المحركات آمنة وتعمل بكفاءة</span>
          </div>
        </div>
      </div>

      {/* Grid of Security Engines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {securityEngines.map((engine) => {
          const Icon = engine.icon;
          return (
            <div
              key={engine.title}
              className="group rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-3 sm:space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border shadow-md ${engine.bgTone}`}>
                    <Icon className={`w-5 h-5 ${engine.tone}`} strokeWidth={2.3} />
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border bg-slate-950/80 text-slate-300 border-slate-800">
                    {engine.badge}
                  </span>
                </div>

                <div>
                  <span className={`text-[10px] font-black block mb-0.5 ${engine.tone}`}>
                    {engine.category}
                  </span>
                  <h3 className="font-black text-white text-sm sm:text-base group-hover:text-teal-300 transition-colors">
                    {engine.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[3.5rem] sm:min-h-[4rem]">
                  {engine.description}
                </p>
              </div>

              <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-bold mt-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  محمي ومفعل بالخادم
                </span>
                <span className="font-mono text-slate-500">v2.4-active</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
