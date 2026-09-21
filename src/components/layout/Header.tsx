'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { PlusCircle, User, Shield, LogOut, MapPin, Cpu } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center font-extrabold text-xl shadow-sm shadow-red-500/20 group-hover:scale-105 transition-transform">
            🇪🇬
          </div>
          <div>
            <span className="font-black text-lg text-slate-900 tracking-tight block">
              النهارده في مصر
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              أحداث المحافظات لحظة بلحظة
            </span>
          </div>
        </Link>

        {/* Desktop Navigation & Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/architecture">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50/60 font-semibold">
              <Cpu className="w-4 h-4 text-red-600" />
              <span>المنظومة والتقنيات</span>
            </Button>
          </Link>

          <Link href="/locations">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>المحافظات</span>
            </Button>
          </Link>

          <Link href="/events/new">
            <Button variant="primary" size="sm" className="gap-1.5 font-bold shadow-xs">
              <PlusCircle className="w-4 h-4" />
              <span>أضف حدث</span>
            </Button>
          </Link>

          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                <Shield className="w-4 h-4" />
                <span>لوحة الإدارة</span>
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>{user?.name || user?.phoneNumber}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title="تسجيل الخروج"
                className="text-slate-400 hover:text-rose-600 p-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                تسجيل الدخول
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Quick Action */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/events/new">
            <Button variant="primary" size="sm" className="gap-1 font-semibold text-xs px-2.5">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>أضف حدث</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
