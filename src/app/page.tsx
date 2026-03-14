'use client';

import WebApp from '@twa-dev/sdk';
import { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      setUser(WebApp.initDataUnsafe.user);
    }
  }, []);

  return (
    <main className="p-4 flex flex-col items-center justify-center min-h-screen">
      <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl text-center">
        <h1 className="text-2xl font-black italic mb-2">RAPIRA TM</h1>
        <p>Привет, {user?.first_name || 'Гость'}!</p>
        <p className="text-sm opacity-80 mt-2">Твой Telegram ID: {user?.id || 'Неизвестно'}</p>
      </div>
    </main>
  );
}