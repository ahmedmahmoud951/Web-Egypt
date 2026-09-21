import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-100 py-8 mt-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">النهارده في مصر 🇪🇬</span>
          <span>— جميع الحقوق محفوظة {new Date().getFullYear()}</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/architecture" className="hover:text-red-600 font-semibold transition text-slate-700">
            المنظومة والتقنيات (Architecture)
          </Link>
          <Link href="/about" className="hover:text-slate-900 transition">
            عن المنصة
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 transition">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-slate-900 transition">
            شروط الاستخدام
          </Link>
          <Link href="/locations/suggest" className="hover:text-slate-900 transition">
            اقترح مكانًا
          </Link>
        </div>
      </div>
    </footer>
  );
}
