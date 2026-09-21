import { AppLayout } from '@/components/layout/AppLayout';

export default function AboutPage() {
  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-6 text-right">
        <div className="space-y-2 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-2xl shadow-sm shadow-red-500/20">
            🇪🇬
          </div>
          <h1 className="text-2xl font-black text-slate-900">عن منصة &quot;النهارده في مصر&quot;</h1>
          <p className="text-xs text-slate-500">
            منصة مجتمعية مفتوحة تهدف إلى توثيق الأحداث اليومية في جميع محافظات مصر لحظة بلحظة.
          </p>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            تأسست المنصة بهدف تمكين المواطنين في مختلف المدن والمراكز والقرى المصرية من مشاركة الأخبار المحلية والأنشطة والفعاليات بصورة سريعة وموثوقة، معتمدة على آلية التأكيد المجتمعي الفوري (Crowd-verification).
          </p>
          <h2 className="text-base font-bold text-slate-900 pt-2">أهدافنا الرئيسية:</h2>
          <ul className="list-disc list-inside space-y-2 pr-2 text-xs sm:text-sm text-slate-600">
            <li>التغطية الشاملة لجميع المحافظات الـ 27 دون إهمال للمناطق النائية أو القرى.</li>
            <li>مكافحة الشائعات عبر آلية الإبلاغ التلقائي والحجب الفوري عند وصول 10 بلاغات.</li>
            <li>الاعتماد على مصادر محلية موثقة من أبناء المحافظة أنفسهم.</li>
            <li>توفير تغذية حية في الوقت الحقيقي (Real-Time) تعكس نبض الشارع المصري.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
