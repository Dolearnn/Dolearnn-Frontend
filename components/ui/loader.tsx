'use client';

import Image from 'next/image';
import logo from '@/assests/home/logo.svg';
import { cn } from '@/lib/utils';

type LoaderProps = {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { ring: 'w-10 h-10', logo: 'w-5 h-5' },
  md: { ring: 'w-16 h-16', logo: 'w-8 h-8' },
  lg: { ring: 'w-20 h-20', logo: 'w-10 h-10' },
} as const;

export function Loader({ label, className, size = 'md' }: LoaderProps) {
  const dims = sizeMap[size];
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-4', className)}
      role="status"
      aria-live="polite"
    >
      <div className={cn('relative flex items-center justify-center', dims.ring)}>
        <span className="absolute inset-0 rounded-full border-2 border-accent2-100 dark:border-white/10" />
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand dark:border-t-accent2-400 animate-spin" />
        <Image
          src={logo}
          alt=""
          className={cn(dims.logo, 'relative z-10 animate-pulse dark:invert dark:brightness-200')}
          priority
        />
      </div>
      {label ? (
        <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground tracking-wide">
          {label}
        </p>
      ) : null}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center p-6">
      <Loader size="lg" label={label ?? 'Loading'} />
    </div>
  );
}
