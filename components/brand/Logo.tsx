import Image from 'next/image';
import { Montserrat } from 'next/font/google';
import { cn } from '@/lib/utils';

/*
 * The DoLearnn logo: the "LD" mark (navy L, mint D) and the word "DoLearnn" in
 * Montserrat Bold, as in the brand artwork. Use this everywhere instead of
 * typing the name, so the logo stays consistent.
 *
 *   tone="brand"  navy wordmark, for light backgrounds (default)
 *   tone="light"  white wordmark, for dark backgrounds; the mark sits on a
 *                 small white tile so its navy L stays visible
 */
const montserrat = Montserrat({ subsets: ['latin'], weight: ['700'], display: 'swap' });

const sizes = {
  sm: { mark: 'h-6', text: 'text-lg', gap: 'gap-2', tile: 'p-0.5 rounded-md' },
  md: { mark: 'h-7', text: 'text-xl', gap: 'gap-2.5', tile: 'p-1 rounded-md' },
  lg: { mark: 'h-9', text: 'text-2xl', gap: 'gap-3', tile: 'p-1 rounded-lg' },
};

export function Logo({
  tone = 'brand',
  size = 'md',
  className,
}: {
  tone?: 'brand' | 'light';
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={281}
        height={265}
        className={cn('w-auto flex-none', s.mark, tone === 'light' && cn('bg-white', s.tile))}
      />
      <span
        className={cn(
          montserrat.className,
          s.text,
          'font-bold leading-none tracking-tight',
          tone === 'light' ? 'text-white' : 'text-brand dark:text-white',
        )}
      >
        DoLearnn
      </span>
    </span>
  );
}
