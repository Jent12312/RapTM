'use client';

import { useEffect, useState } from 'react';

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    import('@twa-dev/sdk').then((module) => {
      const WebApp = module.default;

      WebApp.ready();
      WebApp.expand();
      WebApp.setBackgroundColor('#f8fafc');

      // В версии 6.0 и ниже hex цвета в setHeaderColor не поддерживались.
      // Используем безопасный способ установки цвета.
      if (WebApp.isVersionAtLeast('6.9')) {
        WebApp.setHeaderColor('#ffffff');
      } else {
        WebApp.setHeaderColor('bg_color');
      }

      if (WebApp.isVersionAtLeast('7.7')) {
        WebApp.setHeaderColor('bg_color');
      }

      setIsReady(true);
    }).catch(err => {
      console.error("Ошибка загрузки Telegram SDK:", err);
      // Если открыли вне телеграма, всё равно показываем приложение
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}