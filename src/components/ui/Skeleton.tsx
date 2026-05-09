// src/components/ui/Skeleton.tsx
'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'rounded';
}

export default function Skeleton({ className = '', variant = 'rounded' }: SkeletonProps) {
  const variantClasses = {
    rect: 'rounded-none',
    circle: 'rounded-full',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      className={`
        animate-pulse bg-slate-200 
        ${variantClasses[variant]} 
        ${className}
      `}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.2) 20%, rgba(255, 255, 255, 0.5) 60%, rgba(255, 255, 255, 0))',
        backgroundSize: '200% 100%',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2s infinite'
      }}
    />
  );
}
