'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminVideoAdsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/advertising?tab=videoAds');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
      جاري التحويل إلى منصة إدارة الإعلانات...
    </div>
  );
}
