import { AppLayout } from '@/components/layout/AppLayout';

export default function TermsPage() {
  return (
    <AppLayout showSidebar={false}>
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xs space-y-6 text-right">
        <h1 className="text-2xl font-black text-slate-900 border-b border-slate-100 pb-4">
          شروط الاستخدام
        </h1>
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            باستخدامك لمنصة &quot;النهارده في مصر&quot;، فإنك توافق على الالتزام بالقواعد المجتمعية والقانونية المنظمة لنشر المحتوى.
          </p>
          <h2 className="text-sm font-bold text-slate-900">المعايير المجتمعية للمنصة:</h2>
          <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-600">
            <li>الالتزام بالصدق والدقة في نقل وتوثيق الأحداث.</li>
            <li>يُحظر نشر الشائعات أو الأخبار المضللة أو التحريضية أو غير المؤكدة.</li>
            <li>يُحظر نشر محتوى ينتهك خصوصية الأفراد أو يحتوي على عبارات كراهية أو إساءة.</li>
            <li>يحق لإدارة المنصة حجب أو حذف أي حدث يجمع 10 بلاغات أو يخالف هذه الشروط فورًا.</li>
            <li>قد يتعرض المستخدمون المخالفون للحظر النهائي من نشر المحتوى.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
