'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export const TUTOR_TABS = [
  { href: '/student/tutor', label: 'Get a tutor' },
  { href: '/student/sessions', label: 'Sessions' },
  { href: '/student/payments', label: 'Payments' },
  { href: '/student/reports', label: 'Reports' },
];

/** Everything about tutoring lives under one sidebar item; these tabs move between its pages. */
export default function TutorTabs() {
  const pathname = usePathname();
  if (!TUTOR_TABS.some((tab) => pathname.startsWith(tab.href))) return null;

  return (
    <nav aria-label="Tutoring" className="-mx-4 mb-6 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex w-max gap-1 rounded-full border border-gray-200 bg-white p-1 text-sm dark:border-border dark:bg-card">
        {TUTOR_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block whitespace-nowrap rounded-full px-4 py-1.5 font-medium transition-colors',
                  active
                    ? 'bg-brand text-white dark:bg-accent2-500 dark:text-brand'
                    : 'text-gray-600 hover:text-brand dark:text-muted-foreground',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
