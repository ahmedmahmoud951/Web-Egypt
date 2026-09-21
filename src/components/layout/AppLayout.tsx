'use client';

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';

export function AppLayout({
  children,
  showSidebar = true,
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 pb-16 md:pb-0">
      <Header />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {showSidebar && <Sidebar />}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
