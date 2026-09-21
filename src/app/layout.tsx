import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'مركز تحكم الأدمن | النهارده في مصر',
  description: 'لوحة مراقبة المنشورات والمستخدمين القادمة من تطبيق الموبايل.',
  icons: {
    icon: '/brand/egypt-logo.jpeg',
    apple: '/brand/egypt-logo.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full font-sans admin-canvas text-[#1A2433] flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
