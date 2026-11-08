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
    <main className="min-h-screen bg-[#f4f8fb]">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" aria-label="DoLearnn home">
          <Logo size="md" />
        </Link>
        <Link href="/student/arena" className="text-sm font-medium text-brand">
          Arena
        </Link>
      </header>
      <div className="mx-auto max-w-xl px-4 pb-16 pt-4">
        <DailyPlay />
      </div>
    </main>
  );
}
