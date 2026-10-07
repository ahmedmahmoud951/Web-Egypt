import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

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
    <html lang="ar" dir="rtl" className="h-full antialiased font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full font-sans admin-canvas text-[#1A2433] flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
