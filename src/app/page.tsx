'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { devLog } from '@/lib/devLog';
import { ShieldCheck, LogIn, Car, ArrowRight } from 'lucide-react';

/** Admin Control Center entry — consumers use the Flutter app. */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [showDirectLinks, setShowDirectLinks] = useState(false);

  useEffect(() => {
    // Show direct links after 1 second if still on this page
    const timer = setTimeout(() => {
      setShowDirectLinks(true);
    }, 1200);

    // Hard fallback redirect after 2.5 seconds
    const fallbackTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const target = isAuthenticated && isAdmin ? '/admin' : '/admin/login';
        window.location.replace(target);
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && isAdmin) {
      devLog.ok('home', 'Redirect → /admin');
      router.replace('/admin');
    } else {
      devLog.step('home', 'Redirect → /admin/login');
      router.replace('/admin/login');
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  return (
    <div className="min-h-screen admin-canvas flex flex-col items-center justify-center p-4 text-[#2A6B78]">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-[#2A6B78]/20 rounded-2xl shadow-xl p-8 flex flex-col items-center gap-5 text-center">
        <BrandLogo size={88} priority />
        
        <div>
          <h1 className="text-xl font-bold text-[#1E4D56]">منصة مصر اليوم — لوحة الإدارة</h1>
          <p className="text-xs text-gray-500 mt-1">TodayInEgypt Control Center</p>
        </div>

        <div className="flex items-center gap-2 text-sm font-semibold text-[#2A6B78] py-2">
          <div className="w-4 h-4 border-2 border-[#2A6B78] border-t-transparent rounded-full animate-spin" />
          <span>جاري فتح مركز التحكم...</span>
        </div>

        {showDirectLinks && (
          <div className="w-full pt-4 border-t border-gray-100 flex flex-col gap-2.5">
            <p className="text-xs text-gray-400">إذا لم يتم التحويل تلقائياً، اضغط للدخول المباشر:</p>
            
            <Link
              href="/admin/login"
              className="w-full flex items-center justify-between px-4 py-2.5 bg-[#2A6B78] hover:bg-[#1E4D56] text-white rounded-xl text-sm font-bold transition shadow-sm"
            >
              <div className="flex items-center gap-2">
                <LogIn size={18} />
                <span>تسجيل دخول المسؤولين</span>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin"
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E4D56] border border-gray-200 rounded-xl text-sm font-medium transition"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} />
                <span>الرئيسية (لوحة التحكم)</span>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin/drivers"
              className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E4D56] border border-gray-200 rounded-xl text-sm font-medium transition"
            >
              <div className="flex items-center gap-2">
                <Car size={18} />
                <span>طلبات توثيق السائقين والمشاوير</span>
              </div>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
