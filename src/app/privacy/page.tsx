import { AppLayout } from '@/components/layout/AppLayout';

export default function PrivacyPage() {
  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-6 text-right">
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
          سياسة الخصوصية
        </h1>
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            نحن في منصة &quot;النهارده في مصر&quot; نولي خصوصية بياناتك اهتمامًا فائقًا. لا نطلب سوى رقم هاتفك المحمول للتحقق من هوية الناشرين والحد من الحسابات الوهمية أو البلاغات الكيدية.
          </p>
          <h2 className="text-sm font-bold text-slate-900">البيانات التي نجمعها:</h2>
          <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-600">
            <li>رقم الهاتف المحمول لأغراض المصادقة وإرسال رمز التحقق (OTP).</li>
            <li>الاسم المستعار أو الاسم الحقيقي الذي تختاره للظهور على مشاركاتك.</li>
            <li>الصور والأوصاف التي ترفعها لتوثيق الأحداث.</li>
          </ul>
          <p>
            لا نقوم ببيع أو مشاركة بياناتك الشخصية مع أي أطراف ثالثة لأغراض دعائية، ويتم تشفير رموز التحقق وحفظها بأمان كامل.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
