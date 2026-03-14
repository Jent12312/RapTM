'use client';

import { useEffect, useState } from 'react';

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Динамический импорт спасет нас от ошибки "window is not defined" при билде на Vercel
    import('@twa-dev/sdk').then((module) => {
      const WebApp = module.default;
      
      WebApp.ready();
      WebApp.expand();
      
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

  if (!isReady) return null;

  return <>{children}</>;
}