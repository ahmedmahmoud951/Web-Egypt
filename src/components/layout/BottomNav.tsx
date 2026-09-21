'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Home, MapPin, PlusCircle, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-lg px-2 py-1.5 flex items-center justify-around">
      <Link
        href="/"
        className={cn(
          'flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition',
          pathname === '/' ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        )}
      >
        <Home className="w-5 h-5" />
        <span>الرئيسية</span>
      </Link>

      <Link
        href="/locations"
        className={cn(
          'flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition',
          pathname.startsWith('/locations') && pathname !== '/locations/suggest'
            ? 'text-red-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        )}
      >
        <MapPin className="w-5 h-5" />
        <span>المحافظات</span>
      </Link>

      <Link
        href="/events/new"
        className="flex flex-col items-center gap-1 py-1 px-3 -mt-4 bg-red-600 text-white rounded-full shadow-md shadow-red-500/30 text-[10px] font-bold active:scale-95 transition"
      >
        <PlusCircle className="w-6 h-6" />
        <span className="sr-only">أضف حدث</span>
      </Link>

      {isAdmin ? (
        <Link
          href="/admin"
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition',
            pathname.startsWith('/admin') ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <Shield className="w-5 h-5" />
          <span>الإدارة</span>
        </Link>
      ) : (
        <Link
          href="/locations/suggest"
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition',
            pathname === '/locations/suggest' ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <MapPin className="w-5 h-5" />
          <span>اقترح مكان</span>
        </Link>
      )}

      <Link
        href={isAuthenticated ? '/profile' : '/login'}
        className={cn(
          'flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-medium transition',
          pathname === '/profile' || pathname === '/login'
            ? 'text-red-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        )}
      >
        <User className="w-5 h-5" />
        <span>{isAuthenticated ? 'حسابي' : 'دخول'}</span>
      </Link>
    </nav>
  );
}
