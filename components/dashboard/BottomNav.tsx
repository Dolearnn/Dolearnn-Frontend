'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BottomNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
};

/**
 * The main pages as a tab bar along the bottom of the screen, where a
 * thumb can reach them. Phones only; larger screens keep the sidebar.
 */
const itemClass = (active: boolean) =>
  cn(
    'group flex min-h-[60px] w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-none',
    active ? 'text-brand dark:text-accent2-400' : 'text-gray-500 dark:text-muted-foreground',
  );

const pillClass = (active: boolean) =>
  cn(
    'flex h-8 w-14 items-center justify-center rounded-full transition-colors group-focus-visible:ring-2 group-focus-visible:ring-ring group-active:scale-95',
    active ? 'bg-accent2-100 dark:bg-accent2-500/15' : 'group-hover:bg-gray-100 dark:group-hover:bg-white/5',
  );

export default function BottomNav({
  items,
  onMore,
  moreActive = false,
}: {
  items: BottomNavItem[];
  // When set, a last "More" tab opens the full menu.
  onMore?: () => void;
  moreActive?: boolean;
}) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-border dark:bg-card/95 lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map(({ label, href, icon: Icon, active }) => (
          <li key={href} className="flex-1">
            <Link href={href} aria-current={active ? 'page' : undefined} className={itemClass(active)}>
              <span className={pillClass(active)}>
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          </li>
        ))}
        {onMore && (
          <li className="flex-1">
            <button type="button" onClick={onMore} className={itemClass(moreActive)} aria-label="More pages">
              <span className={pillClass(moreActive)}>
                <Menu className="h-5 w-5" />
              </span>
              More
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
