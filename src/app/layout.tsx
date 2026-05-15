// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TelegramProvider from "@/components/TelegramProvider";
import GlobalNotifications from "@/components/GlobalNotifications";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Rapira TM",
  description: "P2P Crypto Exchange",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      </head>
      <body className={`${inter.className} bg-[#f8fafc] text-slate-900 pb-28 min-h-screen overflow-x-hidden selection:bg-emerald-200`}>
        <TelegramProvider>
          <GlobalNotifications />
          {children}
        </TelegramProvider>
      </body>
    </html>
  );
}
