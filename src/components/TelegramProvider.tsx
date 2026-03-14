'use client';

import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    if (WebApp.isVersionAtLeast('7.7')) {
      WebApp.setHeaderColor('bg_color');
    }
    
    setIsReady(true);
  }, []);

  if (!isReady) return null; 

  return <>{children}</>;
}