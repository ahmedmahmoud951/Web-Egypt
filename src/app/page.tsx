'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { devLog } from '@/lib/devLog';

/** Admin Control Center entry — consumers use the Flutter app. */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

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
    <div className="min-h-screen admin-canvas flex flex-col items-center justify-center gap-3 text-[#2A6B78] text-sm font-bold">
      <BrandLogo size={80} priority />
      جاري فتح مركز التحكم...
    </div>
  );
}
