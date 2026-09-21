'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

/** Consumer registration is Flutter-only. Web is Admin Control Center. */
export default function RegisterDisabledPage() {
  return (
    <div className="min-h-screen admin-canvas flex items-center justify-center p-6" dir="rtl">
      <div className="admin-card max-w-md w-full rounded-3xl p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#0F1C2E] text-teal-300 flex items-center justify-center">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900">التسجيل من الموبايل فقط</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          هذه النسخة من الموقع مخصصة لمركز تحكم الأدمن. تسجيل المستخدمين يتم عبر تطبيق Flutter.
        </p>
        <Link
          href="/admin/login"
          className="inline-flex justify-center w-full rounded-xl bg-teal-700 text-white text-sm font-bold py-2.5"
        >
          دخول لوحة الأدمن
        </Link>
      </div>
    </div>
  );
}
