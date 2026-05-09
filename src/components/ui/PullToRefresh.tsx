// src/components/ui/PullToRefresh.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 100;
  const MAX_PULL = 150;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY;

    if (diff > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      // Плавное сопротивление при перетягивании
      const dampenedDiff = Math.min(MAX_PULL, diff * 0.5);
      setPullDistance(dampenedDiff);
      
      // Отменяем нативный скролл если тянем вниз
      if (diff > 5) {
        if (e.cancelable) e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-y-auto h-full touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Индикатор обновления */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-transform duration-200 ease-out"
        style={{ 
          height: `${PULL_THRESHOLD}px`, 
          top: `-${PULL_THRESHOLD}px`,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance / PULL_THRESHOLD
        }}
      >
        <div className="bg-white p-2.5 rounded-full shadow-lg border border-slate-100">
          <RefreshCw 
            className={`w-5 h-5 text-emerald-500 ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
      </div>

      {/* Контент */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
