import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";


export const metadata: Metadata = {
  title: "عالم المتباينات الخطية ٣٦٠° | رحلة التحدي والإبداع",
  description: "موقع تعليمي تفاعلي للفصل الرابع: المتباينات الخطية — الصف الثالث المتوسط — المتوسطة ٤٧ — المعلمة نوف المطيري",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1e1038" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
