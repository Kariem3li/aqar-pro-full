import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import NotificationManager from "@/components/NotificationManager";
// تحميل الخط
const ibmArabic = IBM_Plex_Sans_Arabic({ 
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "رواسي للاستثمار العقاري",
  description: "الجبال الثابتة في عالم الاستثمار.",
  manifest: "/manifest.json", // 👈 أضف هذا السطر
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      {/* استخدام متغيرات الألوان التي عرفناها في CSS */}
      <body className={`${ibmArabic.variable} font-sans bg-brand-light min-h-screen text-brand-primary selection:bg-brand-accent selection:text-white`}>
        <NotificationManager />
        {children}
      </body>
    </html>
  );
}