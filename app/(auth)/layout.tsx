import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Target } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#f8f8f0] dark:bg-background">
      <aside className="hidden lg:flex min-h-screen bg-[#173e32] text-white p-12 xl:p-16 flex-col justify-between">
        <Link href="/" className="text-3xl font-bold tracking-tight">
          do<span className="font-medium">learnn</span><span className="text-[#c1eb8c]">.</span>
        </Link>
        <div className="max-w-xl">
          <p className="font-mono text-[10px] tracking-[0.13em] text-[#c1eb8c]">
            PRACTICE → FEEDBACK → NEXT MOVE
          </p>
          <h2 className="mt-6 text-5xl xl:text-6xl font-bold leading-[1.02] tracking-[-0.045em]">
            Your result should tell you what to do next.
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-white/70">
            Use the full practice bank, follow targeted missions and return to the same topics to see what changes.
          </p>
          <div className="mt-10 border border-white/15 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <span className="font-mono text-[10px] tracking-wider text-white/60">YOUR PRACTICE LOOP</span>
              <Target className="h-5 w-5 text-[#c1eb8c]" />
            </div>
            <ol className="mt-5 space-y-4 text-sm">
              <li className="flex items-center gap-3"><Check className="h-4 w-4 text-[#c1eb8c]" /> Answer exam-style questions</li>
              <li className="flex items-center gap-3"><ArrowRight className="h-4 w-4 text-[#c1eb8c]" /> See which topics need attention</li>
              <li className="flex items-center gap-3"><ArrowRight className="h-4 w-4 text-[#c1eb8c]" /> Start a focused learning mission</li>
            </ol>
          </div>
        </div>
        <Link href="/practice" className="inline-flex items-center gap-2 text-xs font-semibold underline underline-offset-4">
          <ArrowLeft className="h-4 w-4" /> Return to the free warm-up
        </Link>
      </aside>
      <section className="flex min-h-screen flex-col">
        <header className="flex w-full items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-brand dark:text-accent2-400 lg:hidden">
            dolearnn.
          </Link>
          <Link href="/practice" className="hidden text-xs font-semibold text-brand underline underline-offset-4 lg:block dark:text-accent2-400">
            Try practice first
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </section>
    </main>
  );
}
