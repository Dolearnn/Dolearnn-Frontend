import Link from 'next/link';
import { frauncesAuth as serif } from '@/lib/fonts';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/theme-toggle';

// Same headline font as the landing page, so the two feel like one product.

const loop = ['Take a quiz', 'See weak topics', 'Practise', 'Get help', 'Test again'];

// Illustrative topic map, as on the landing page.
const gaps = [
  { topic: 'Probability', score: 31, tone: 'bg-red-400' },
  { topic: 'Calculus', score: 43, tone: 'bg-amber-400' },
  { topic: 'Trigonometry', score: 68, tone: 'bg-accent2-400' },
  { topic: 'Algebra', score: 84, tone: 'bg-accent2-400' },
];

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="DoLearnn home" className="inline-flex">
      <Logo tone={light ? 'light' : 'brand'} size={light ? 'lg' : 'md'} />
    </Link>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={`${serif.variable} min-h-screen grid lg:grid-cols-2 bg-[#f4f8fb] dark:bg-background`}>
      <aside className="relative hidden lg:flex min-h-screen overflow-hidden bg-gradient-to-br from-[#022a49] to-brand text-white p-12 xl:p-16 flex-col justify-between">
        {/* Soft mint glow, as on the landing page hero. */}
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent2-400/20 blur-3xl" />

        <Wordmark light />

        <div className="relative max-w-xl">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent2-300">
            {loop.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                {step}
                {index < loop.length - 1 && <span aria-hidden className="text-white/40">→</span>}
              </li>
            ))}
          </ol>
          <h2 className="mt-6 font-[family-name:var(--f-serif)] text-5xl xl:text-6xl font-semibold leading-[1.04] tracking-[-0.03em]">
            Know what to fix. <em className="text-accent2-300">Prove you fixed it.</em>
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-white/75">
            Practise exam-style questions, see the exact topics costing you marks, get the right support,
            then reassess to see the change.
          </p>

          <figure className="mt-10 rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm">
            <figcaption className="flex items-center justify-between border-b border-white/15 pb-4 font-mono text-[10px] uppercase tracking-wider text-white/60">
              Your topic map
              <span className="rounded-full bg-accent2-400 px-2 py-0.5 text-[9px] font-semibold text-[#022a49]">Example</span>
            </figcaption>
            <ul className="mt-5 space-y-3 text-sm">
              {gaps.map((row) => (
                <li key={row.topic} className="grid grid-cols-[110px_1fr_40px] items-center gap-3">
                  <span className="text-white/90">{row.topic}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
                    <span className={`block h-full rounded-full ${row.tone}`} style={{ width: `${row.score}%` }} />
                  </span>
                  <span className="text-right tabular-nums text-white/80">{row.score}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-lg bg-accent2-400/15 px-3 py-2 text-xs text-accent2-200">
              Start with Probability: your next mission is built around it.
            </p>
          </figure>
        </div>

        <Link
          href="/practice"
          className="relative inline-flex items-center gap-2 text-xs font-semibold text-white/90 underline underline-offset-4 hover:text-accent2-300"
        >
          <ArrowLeft className="h-4 w-4" /> Try a free warm-up first
        </Link>
      </aside>

      <section className="flex min-h-screen flex-col">
        <header className="flex w-full items-center justify-between px-6 py-4">
          <span className="lg:hidden">
            <Wordmark />
          </span>
          <Link
            href="/practice"
            className="hidden text-xs font-semibold text-brand underline underline-offset-4 lg:block dark:text-accent2-400"
          >
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
