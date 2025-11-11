import { Alexandria } from 'next/font/google';
import './globals.css';

// تأكد من أن هذا القسم موجود وصحيح
const alexandria = Alexandria({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-alexandria', // هذا السطر ينشئ متغير CSS
});

export const metadata = {
  title: 'نظام أرشفة الملفات',
  description: 'نظام تجريبي لأرشفة ورفع الملفات',
};

export default function RootLayout({ children }) {
  return (
    // تأكد من أن `dir="rtl"` موجود
    <html lang="ar" dir="rtl">
      {/*
        تأكد من أن className يحتوي على كلا الجزأين:
        1. `${alexandria.variable}` -> لتفعيل المتغير
        2. `font-sans` -> لتطبيق الخط عبر Tailwind
      */}
      <body className={`${alexandria.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}