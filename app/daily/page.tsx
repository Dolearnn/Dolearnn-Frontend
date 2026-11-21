import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import DailyPlay from '@/components/daily/DailyPlay';

export const metadata: Metadata = {
  title: 'The Daily | DoLearnn',
  description: 'One short quiz, the same for everyone, new every day. Can you top the leaderboard?',
};

export default function DailyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="DoLearnn home">
          <Logo size="sm" />
        </Link>
        <Link href="/student/arena" className="-mr-2 inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-brand hover:bg-brand-50">
          Arena
        </Link>
      </header>
      <div className="mx-auto max-w-xl px-4 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-2">
        <DailyPlay />
      </div>
    </main>
  );
}
