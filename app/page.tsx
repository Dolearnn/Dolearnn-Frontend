import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Check,
  Clock,
  Flame,
  GraduationCap,
  MessageCircle,
  School,
  Swords,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { LandingNav, NewsletterForm } from '@/components/landing/LandingNav';
import { naira } from '@/lib/money';
import { BANK_FACTS, PRICING } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'DoLearnn: Know what to fix. Prove you fixed it.',
  description:
    'Exam prep for JAMB, WAEC, NECO and Post-UTME. DoLearnn finds the topics costing you marks, gives you practice on exactly those topics and a tutor when you need one, then tests you again so you can see the improvement.',
  openGraph: {
    title: 'DoLearnn: Know what to fix. Prove you fixed it.',
    description: 'Find the topics costing you marks, practise them, and prove the improvement.',
    images: ['/logo.png'],
  },
};

const whatsapp = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '2349057638887').replace(/\D/g, '')}?text=${encodeURIComponent('Hi DoLearnn! I would like to know more about learning and tutor support.')}`;
const schoolsForm = process.env.NEXT_PUBLIC_TRIAL_FORM_URL ?? 'https://forms.gle/SYjkRgS1Y5JoD43v7';

const exams = ['JAMB UTME', 'WAEC', 'NECO', 'Post-UTME', 'IGCSE / GCSE', 'SAT'];
const subjects = [
  'Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government',
  'Literature', 'CRS', 'IRS', 'Geography', 'Commerce', 'Accounting', 'Further Maths', 'Agric',
  'Civic Education', 'Computer Studies', 'Yoruba', 'French', 'Music',
];

// The learning loop is a real sequence, so the steps are numbered.
const steps = [
  { title: 'Take a short quiz', text: 'Pick your exam and subject. Ten questions show where you stand today.' },
  { title: 'See your weak topics', text: 'Your answers become a ranked list of the topics costing you marks.' },
  { title: 'Practise those topics', text: 'Daily practice, the Daily quiz and Arena battles, aimed at what you got wrong.' },
  { title: 'Test again, see the change', text: 'Retake a topic and your score moves from where it started. That is your proof.' },
];

const faqs = [
  {
    q: 'Who is DoLearnn for?',
    a: 'Secondary school students and school leavers preparing for JAMB UTME, WAEC, NECO, Post-UTME, IGCSE / GCSE or SAT, and the parents supporting them. Schools can use DoLearnn for whole classes.',
  },
  {
    q: 'How is this different from a quiz app?',
    a: 'A quiz gives you a score. DoLearnn ranks your weak topics, gives you practice on exactly those topics, brings in a tutor when you need one, then tests you again so you can see the improvement.',
  },
  {
    q: 'Are these real past questions?',
    a: 'No. They are original questions written to the syllabus and style of each exam, so you practise the same topics at the same level without copied papers.',
  },
  {
    q: 'Is there a full JAMB mock?',
    a: `Yes. The full UTME paper has ${BANK_FACTS.utmeQuestions} questions (Use of English plus three subjects) and runs for ${BANK_FACTS.utmeHours} hours in exam mode, with a calculator, subject tabs and a question grid like the CBT centre.`,
  },
  {
    q: 'Is it free?',
    a: `Practice, the Daily quiz, Arena battles and the full UTME paper are free today. Tutoring is ${naira(PRICING.tutoringSession)} per session.`,
  },
  {
    q: 'How can a parent follow progress?',
    a: 'From the Progress page a learner can send a weekly report to a parent on WhatsApp: practice this week, the topics that improved and what they are working on next, all from real results.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-gray-800">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>

      <LandingNav />

      <main id="main-content">
        {/* ---------- HERO ---------- */}
        <section className="relative overflow-hidden bg-gray-50" aria-labelledby="hero-title">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent2-200/50 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-16">
            <div>
              <p className="text-sm font-semibold text-accent2-600">For JAMB, WAEC, NECO and Post-UTME</p>
              <h1 id="hero-title" className="mt-3 font-display text-[40px] font-extrabold leading-[1.04] tracking-tight text-brand-700 sm:text-6xl">
                {/* Each sentence wraps on its own, evenly, on a narrow phone. */}
                <span className="block [text-wrap:balance]">Know what to fix.</span>
                <span className="block [text-wrap:balance]">Prove you fixed it.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">
                DoLearnn finds the exact topics costing you marks, gives you practice on those topics and a tutor when you need one, then tests you again so you can see your score move.
              </p>
              <div className="mt-7 grid gap-3 sm:flex">
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-700 active:scale-[0.98]"
                >
                  Start practising free <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/daily"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-7 text-base font-semibold text-brand transition hover:border-brand/40 active:scale-[0.98]"
                >
                  <Zap className="h-5 w-5 fill-accent2-400 text-accent2-500" /> Play today&apos;s Daily
                </Link>
              </div>
              <p className="mt-3 text-sm text-gray-500">Free. No card needed. Works on any phone.</p>
            </div>

            <HeroDemo />
          </div>
        </section>

        {/* ---------- FACTS ---------- */}
        <section aria-label="DoLearnn in numbers" className="border-y border-gray-100 bg-white">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
            <Fact value={BANK_FACTS.questions} label="original practice questions" />
            <Fact value={String(BANK_FACTS.subjects)} label="subjects" />
            <Fact value={String(BANK_FACTS.exams)} label="exams, JAMB to SAT" />
            <Fact value={String(BANK_FACTS.utmeQuestions)} label="questions in the full UTME paper" />
          </dl>
        </section>

        {/* ---------- HOW IT WORKS ---------- */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="how-title">
          <SectionHead title={<span id="how-title">One simple loop</span>} text="Every quiz feeds the next step, so you never guess what to study." />
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4 rounded-3xl border border-gray-200/80 bg-white p-5 lg:flex-col">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-display text-base font-extrabold text-white">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-display text-lg font-bold text-gray-950">{step.title}</span>
                  <span className="mt-1 block leading-relaxed text-gray-600">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- FEATURES ---------- */}
        <section id="features" className="scroll-mt-20 bg-gray-50 py-16 lg:py-24" aria-labelledby="features-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead title={<span id="features-title">Built for exam season</span>} text="Everything a JAMB or WAEC candidate needs, on the phone they already have." />
            <div className="mt-12 space-y-16 lg:space-y-24">
              <Feature
                title="Sit the full UTME paper, CBT style"
                text={`${BANK_FACTS.utmeQuestions} questions in ${BANK_FACTS.utmeHours} hours: Use of English plus your three subjects. A timer, a calculator, subject tabs and a question grid, like the screen at the CBT centre.`}
                points={['60 English questions and 40 per subject', 'Keys for answer, next, previous and submit', 'Leaving the screen is recorded, so the score is honest']}
              >
                <CbtDemo />
              </Feature>
              <Feature
                reverse
                title="Parents see the real progress"
                text="Each week a learner can send a short report to a parent on WhatsApp, built from their own results. No guessing whether the practice is working."
                points={['Practice this week and percent right', 'Topics that improved, from first score to latest', 'What they are working on next']}
              >
                <ReportDemo />
              </Feature>
              <Feature
                title="Show up every day"
                text="The Daily is one short quiz, the same for everyone, new each morning. Challenge friends in Arena, keep your streak and climb the leaderboard, with a nickname if you prefer."
                points={['Ten questions, about three minutes', 'Arena battles with a code you share', 'Streaks and badges for real progress']}
              >
                <DailyDemo />
              </Feature>
              <Feature
                reverse
                title="Tutors who start from your results"
                text={`Request a tutor in a few taps. Before the first lesson they see your weak topics and recent scores, so no time is wasted. ${naira(PRICING.tutoringSession)} per session.`}
                points={['Matched to your weak topics', 'Notes after every lesson', 'Monthly lesson report']}
              >
                <TutorDemo />
              </Feature>
            </div>
          </div>
        </section>

        {/* ---------- EXAMS ---------- */}
        <section id="exams" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="exams-title">
          <SectionHead title={<span id="exams-title">Your exam, your subjects</span>} />
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {exams.map((exam) => (
              <li key={exam} className="rounded-2xl bg-brand px-4 py-2.5 font-display text-sm font-bold text-white sm:text-base">
                {exam}
              </li>
            ))}
          </ul>
          <ul className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2" aria-label="Subjects">
            {subjects.map((subject) => (
              <li key={subject} className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">{subject}</li>
            ))}
          </ul>
        </section>

        {/* ---------- PRICING ---------- */}
        <section id="pricing" className="scroll-mt-20 bg-gray-50 py-16 lg:py-24" aria-labelledby="pricing-title">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHead title={<span id="pricing-title">Free to practise</span>} text="Pay only when you want a person to help." />
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <PriceCard
                featured
                icon={GraduationCap}
                name="Practice"
                price="Free"
                unit="for every learner"
                points={['Topic quizzes with written explanations', 'Weak-topic list and progress tracking', 'The Daily quiz and Arena battles', 'The full UTME paper in exam mode']}
                cta={{ label: 'Start practising free', href: '/register' }}
              />
              <PriceCard
                icon={MessageCircle}
                name="Tutoring"
                price={naira(PRICING.tutoringSession)}
                unit="per 60-minute session"
                points={['A tutor matched to your weak topics', 'They see your results before lesson one', 'Notes after every lesson']}
                cta={{ label: 'Request a tutor', href: '/register' }}
              />
              <PriceCard
                icon={School}
                name="Schools"
                price={naira(PRICING.schoolYear)}
                unit="per year"
                points={['Class-wide diagnostics', 'Progress dashboards and class reports', 'Ask us about a pilot with one class']}
                cta={{ label: 'Ask about a pilot', href: schoolsForm, external: true }}
              />
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="faq-title">
          <SectionHead title={<span id="faq-title">Questions, answered</span>} />
          <div className="mt-8 divide-y divide-gray-100 rounded-3xl border border-gray-200/80 bg-white">
            {faqs.map((item) => (
              <details key={item.q} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-gray-950">
                  {item.q}
                  <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gray-100 text-lg leading-none text-brand transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 leading-relaxed text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-gray-600">
            Still unsure?{' '}
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1 font-semibold text-brand hover:text-accent2-600">
              <MessageCircle className="h-4 w-4" /> Chat with us on WhatsApp
            </a>
          </p>
        </section>

        {/* ---------- FINAL CTA ---------- */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-brand px-6 py-14 text-center text-white sm:px-12">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent2-400/25 blur-3xl" />
            <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-5xl">Your next score starts today.</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/75">Take a free quiz, see your weak topics and get a plan in minutes.</p>
            <Link
              href="/register"
              className="relative mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent2-400 px-8 text-base font-semibold text-brand-700 transition hover:bg-accent2-300 active:scale-[0.98] sm:w-auto"
            >
              Create your free account <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="bg-brand-800 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo tone="light" size="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">Exam prep for Nigerian learners. Know what to fix. Prove you fixed it.</p>
            <p className="mt-6 text-sm font-semibold">Get study tips and exam updates</p>
            <NewsletterForm />
          </div>
          <nav aria-label="Product" className="text-sm">
            <p className="font-semibold">Product</p>
            <ul className="mt-4 space-y-1 text-white/70">
              <li><a href="#how-it-works" className="inline-flex min-h-10 items-center hover:text-white">How it works</a></li>
              <li><a href="#features" className="inline-flex min-h-10 items-center hover:text-white">Features</a></li>
              <li><a href="#pricing" className="inline-flex min-h-10 items-center hover:text-white">Pricing</a></li>
              <li><Link href="/daily" className="inline-flex min-h-10 items-center hover:text-white">Daily quiz</Link></li>
            </ul>
          </nav>
          <nav aria-label="Account" className="text-sm">
            <p className="font-semibold">Get started</p>
            <ul className="mt-4 space-y-1 text-white/70">
              <li><Link href="/register" className="inline-flex min-h-10 items-center hover:text-white">Create account</Link></li>
              <li><Link href="/login" className="inline-flex min-h-10 items-center hover:text-white">Log in</Link></li>
              <li><a href={schoolsForm} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center hover:text-white">For schools</a></li>
              <li><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center hover:text-white">WhatsApp</a></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-white/50 sm:px-6">© {new Date().getFullYear()} DoLearnn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ title, text }: { title: React.ReactNode; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg leading-relaxed text-gray-600">{text}</p>}
    </div>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 text-center">
      <dd className="font-display text-3xl font-extrabold tabular-nums text-brand sm:text-4xl">{value}</dd>
      <dt className="mt-1 text-sm text-gray-500">{label}</dt>
    </div>
  );
}

function Feature({
  title,
  text,
  points,
  reverse = false,
  children,
}: {
  title: string;
  text: string;
  points: string[];
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? 'lg:order-2' : ''}>
        <h3 className="font-display text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">{title}</h3>
        <p className="mt-3 text-lg leading-relaxed text-gray-600">{text}</p>
        <ul className="mt-5 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-gray-800">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent2-100">
                <Check className="h-3.5 w-3.5 text-accent2-700" strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? 'lg:order-1' : ''}>{children}</div>
    </div>
  );
}

function PriceCard({
  icon: Icon,
  name,
  price,
  unit,
  points,
  cta,
  featured = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  price: string;
  unit: string;
  points: string[];
  cta: { label: string; href: string; external?: boolean };
  featured?: boolean;
}) {
  const ctaClass = featured
    ? 'mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-accent2-400 font-semibold text-brand-700 transition hover:bg-accent2-300'
    : 'mt-7 inline-flex h-12 items-center justify-center rounded-2xl border-2 border-gray-200 font-semibold text-brand transition hover:border-brand/40';
  return (
    <article
      className={
        featured
          ? 'flex flex-col rounded-[28px] bg-brand p-6 text-white shadow-[0_18px_40px_-24px_rgba(4,66,114,0.9)]'
          : 'flex flex-col rounded-[28px] border border-gray-200/80 bg-white p-6'
      }
    >
      <span className={featured ? 'grid h-11 w-11 place-items-center rounded-2xl bg-accent2-400 text-brand-700' : 'grid h-11 w-11 place-items-center rounded-2xl bg-accent2-100 text-brand'}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className={`mt-4 font-display text-lg font-bold ${featured ? 'text-white' : 'text-gray-950'}`}>{name}</h3>
      <p className="mt-1">
        <span className="font-display text-4xl font-extrabold tabular-nums">{price}</span>{' '}
        <span className={featured ? 'text-white/70' : 'text-gray-500'}>{unit}</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {points.map((point) => (
          <li key={point} className="flex gap-2.5 text-sm">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-accent2-300' : 'text-accent2-600'}`} strokeWidth={3} />
            {point}
          </li>
        ))}
      </ul>
      {cta.external ? (
        <a href={cta.href} target="_blank" rel="noreferrer" className={ctaClass}>{cta.label}</a>
      ) : (
        <Link href={cta.href} className={ctaClass}>{cta.label}</Link>
      )}
    </article>
  );
}

/* ---------- Product views, drawn in code so they stay sharp and light on data ---------- */

function ExampleTag({ light = false }: { light?: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${light ? 'bg-white/15 text-white/80' : 'bg-gray-100 text-gray-500'}`}>
      Example
    </span>
  );
}

function HeroDemo() {
  const gains = [
    { topic: 'Algebra', before: 31, after: 74 },
    { topic: 'Mechanics', before: 40, after: 68 },
    { topic: 'Comprehension', before: 52, after: 81 },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md" aria-label="Example of a learner's DoLearnn home screen" role="img">
      <div className="relative overflow-hidden rounded-[28px] bg-brand p-5 text-white shadow-[0_24px_50px_-24px_rgba(4,66,114,0.9)]">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent2-400/25 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <p className="text-sm text-white/75">JAMB UTME</p>
          <ExampleTag light />
        </div>
        <p className="relative mt-2 flex items-baseline gap-2">
          <span className="font-display text-6xl font-extrabold leading-none tracking-tight tabular-nums">154</span>
          <span className="text-lg text-white/80">days to go</span>
        </p>
        <div className="relative mt-5 flex gap-[3px]">
          {Array.from({ length: 21 }, (_, i) => (
            <span key={i} className={`h-2.5 flex-1 rounded-full ${i < 6 ? 'bg-accent2-400' : i < 15 ? 'bg-white/70' : 'bg-white/15'}`} />
          ))}
        </div>
        <p className="relative mt-2 text-sm text-white/80">
          <strong className="font-display font-bold text-white">15</strong> of 21 topics covered, 6 strong
        </p>
      </div>
      <div className="relative -mt-4 ml-6 rounded-3xl border border-gray-200/80 bg-white p-4 shadow-xl sm:ml-10">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-950">
          <TrendingUp className="h-4 w-4 text-accent2-600" aria-hidden /> Most improved
        </p>
        <ul className="mt-3 space-y-3">
          {gains.map((row) => (
            <li key={row.topic}>
              <p className="flex items-baseline justify-between text-sm">
                <span className="text-gray-800">{row.topic}</span>
                <span className="tabular-nums text-gray-500">
                  {row.before}% → <strong className="font-display font-bold text-gray-950">{row.after}%</strong>
                </span>
              </p>
              <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-gray-100">
                <span className="h-full bg-brand-300" style={{ width: `${row.before}%` }} />
                <span className="h-full bg-accent2-500" style={{ width: `${row.after - row.before}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CbtDemo() {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200/80 bg-white shadow-xl" role="img" aria-label="Example of the full UTME paper in exam mode">
      <div className="flex items-center gap-2 bg-brand px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-white/70">JAMB UTME, exam mode</p>
          <p className="font-display text-sm font-bold">4 subjects</p>
        </div>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10"><Calculator className="h-4 w-4" /></span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-display text-sm font-extrabold tabular-nums">
          <Clock className="h-3.5 w-3.5" /> 1:58:38
        </span>
      </div>
      <div className="flex gap-4 border-b border-gray-100 px-4 text-xs font-semibold">
        <span className="border-b-2 border-brand py-2.5 text-brand">English 12/60</span>
        <span className="py-2.5 text-gray-400">Maths 0/40</span>
        <span className="py-2.5 text-gray-400">Physics 0/40</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Question <strong className="font-display text-lg text-brand">13</strong> of 60
          </p>
          <ExampleTag />
        </div>
        <p className="mt-1 text-sm font-medium text-gray-950">Choose the word nearest in meaning to DILIGENT.</p>
        <div className="mt-3 space-y-2">
          {['A  careless', 'B  hardworking', 'C  clever', 'D  polite'].map((option, i) => (
            <p key={option} className={`rounded-xl border-2 px-3 py-2 text-sm ${i === 1 ? 'border-brand bg-brand-50 font-semibold text-brand' : 'border-gray-100 text-gray-700'}`}>
              {option}
            </p>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-10 gap-1">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className={`h-6 rounded text-center text-[10px] font-semibold leading-6 ${i < 12 ? 'bg-accent2-500 text-white' : i === 12 ? 'bg-white text-brand ring-2 ring-brand' : 'bg-gray-100 text-gray-500'}`}>
              {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportDemo() {
  return (
    <div className="mx-auto w-full max-w-md rounded-[28px] bg-[#e5ddd5] p-4 shadow-xl" role="img" aria-label="Example of a weekly report sent to a parent on WhatsApp">
      <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-3.5 text-[13px] leading-5 text-gray-900 shadow-sm">
        <p className="font-semibold">Tolu&apos;s DoLearnn report, 10 to 16 Nov</p>
        <p className="mt-2">• Practised 9 times this week: 90 questions, 68% right</p>
        <p>• Practice streak: 6 days in a row</p>
        <p>• Most improved: Algebra 31% → 74%, Mechanics 40% → 68%</p>
        <p>• Working on next: Organic Chemistry (38%)</p>
        <p>• 154 days to JAMB UTME</p>
        <p className="mt-1.5 text-right text-[11px] text-gray-500">7:42 pm ✓✓</p>
      </div>
      <p className="mt-3 text-center"><ExampleTag /></p>
    </div>
  );
}

function DailyDemo() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3" role="img" aria-label="Examples of the Daily quiz, an Arena battle and a streak">
      <div className="flex items-center gap-4 rounded-3xl bg-accent2-400 p-4 text-brand-700">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-700 text-accent2-300"><Zap className="h-5 w-5 fill-current" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">The Daily</p>
          <p className="text-sm text-brand-700/80">You scored 8/10, rank #3 today</p>
        </div>
        <ExampleTag />
      </div>
      <div className="flex items-center gap-4 rounded-3xl border border-gray-200/80 bg-white p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-white"><Swords className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-950">Physics battle</p>
          <p className="text-sm text-gray-500">You vs Kemi</p>
        </div>
        <p className="font-display text-xl font-extrabold tabular-nums text-gray-950">80<span className="mx-1 text-gray-300">–</span>70</p>
      </div>
      <div className="flex items-center gap-4 rounded-3xl border border-gray-200/80 bg-white p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50"><Flame className="h-5 w-5 fill-amber-400 text-amber-500" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-950">Practice streak</p>
          <p className="text-sm text-gray-500">Share it to WhatsApp in one tap</p>
        </div>
        <p className="font-display text-3xl font-extrabold tabular-nums text-gray-950">12</p>
      </div>
    </div>
  );
}

function TutorDemo() {
  return (
    <div className="mx-auto w-full max-w-md rounded-[28px] border border-gray-200/80 bg-white p-5 shadow-xl" role="img" aria-label="Example of what a tutor sees before the first lesson">
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-bold text-gray-950">Before class: learning summary</p>
        <ExampleTag />
      </div>
      <p className="mt-3 text-xs font-semibold text-gray-500">Focus on</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {['Organic Chemistry 38%', 'Probability 42%', 'Mechanics 45%'].map((chip) => (
          <span key={chip} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">{chip}</span>
        ))}
      </div>
      <p className="mt-3 text-xs font-semibold text-gray-500">Already strong</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {['Algebra 74%', 'Comprehension 81%'].map((chip) => (
          <span key={chip} className="rounded-full bg-accent2-50 px-2.5 py-1 text-xs font-medium text-accent2-700">{chip}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-gray-50 p-3">
        <p className="text-sm text-gray-700">One-to-one, 60 minutes</p>
        <p className="font-display text-lg font-extrabold tabular-nums text-gray-950">{naira(PRICING.tutoringSession)}</p>
      </div>
    </div>
  );
}
