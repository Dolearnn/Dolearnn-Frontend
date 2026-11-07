import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { montserrat } from '@/lib/fonts';
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  GraduationCap,
  MessageCircle,
  School,
  ShieldCheck,
  Swords,
  Target,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { LandingNav, NewsletterForm } from '@/components/landing/LandingNav';
import { Reveal } from '@/components/Home/Motion';


export const metadata: Metadata = {
  title: 'DoLearnn: Know what to fix. Prove you fixed it.',
  description:
    'Exam practice for JAMB, WAEC, NECO, Post-UTME, IGCSE and SAT. DoLearnn finds the topics holding you back, gives you practice and a tutor when you need one, and tests you again so you can see the improvement.',
  openGraph: {
    title: 'DoLearnn: Know what to fix. Prove you fixed it.',
    description: 'Find the topics holding you back, get the right support, and prove the improvement.',
    images: ['/logo.png'],
  },
};

const whatsapp = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '2349057638887').replace(/\D/g, '')}?text=${encodeURIComponent('Hi DoLearnn! I would like to know more about learning and tutor support.')}`;
const trial = process.env.NEXT_PUBLIC_TRIAL_FORM_URL ?? 'https://forms.gle/SYjkRgS1Y5JoD43v7';

const exams = ['JAMB UTME', 'WAEC', 'NECO', 'Post-UTME', 'IGCSE / GCSE', 'SAT'];
const subjects = [
  'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature',
  'Accounting', 'Commerce', 'Geography', 'CRS', 'IRS', 'Further Maths', 'Agric', 'Civic Education',
  'Yoruba', 'French', 'Music', 'Computer Studies',
];

const steps = [
  {
    n: '01',
    title: 'Take a short test',
    text: 'Pick your exam and subject. A quick quiz shows where you stand today.',
    tone: 'bg-[#EAF2FB]',
  },
  {
    n: '02',
    title: 'See your weak topics',
    text: 'Your results become a ranked list of the topics costing you marks.',
    tone: 'bg-accent2-50',
  },
  {
    n: '03',
    title: 'Practise or get a tutor',
    text: 'Daily missions target those topics. Need more help? A tutor sees your results first.',
    tone: 'bg-[#FFF4E5]',
  },
  {
    n: '04',
    title: 'Test again, see the change',
    text: 'Retake the topic and watch the score move. That is your proof.',
    tone: 'bg-[#F3EEFF]',
  },
];

const audiences = [
  {
    icon: GraduationCap,
    title: 'Students',
    text: 'SS1 to SS3 and school leavers. Practise free every day and know exactly what to fix next.',
    href: '/register',
    cta: 'Start free',
  },
  {
    icon: Users,
    title: 'Parents',
    text: 'Sign up on behalf of your child. See their weak topics, why a tutor helps and how their scores change.',
    href: '/register',
    cta: 'Create an account',
  },
  {
    icon: School,
    title: 'Schools',
    text: 'Class-wide diagnostics, progress dashboards, parent reports and competitions: ₦900,000 a year.',
    href: trial,
    cta: 'Ask about a pilot',
    external: true,
  },
];

const plans = [
  {
    name: 'Free',
    price: '₦0',
    unit: 'forever',
    tagline: 'Start practising today',
    features: ['1 full diagnostic per month', '3 practice missions per day', '15 AI Study Coach messages per day', 'Basic progress view'],
  },
  {
    name: 'Plus',
    price: '₦2,500',
    unit: 'per month',
    tagline: 'For daily exam prep',
    popular: true,
    features: ['Unlimited diagnostics and practice', '150 AI Coach messages per day', 'Full topic-gap report', 'Weekly reassessment'],
  },
  {
    name: 'Pro',
    price: '₦4,500',
    unit: 'per month',
    tagline: 'For the final push',
    features: ['Everything in Plus', 'Unlimited AI Coach (fair use)', 'Timed WAEC / UTME mock exams', 'Parent progress report', '10% off tutoring + priority booking'],
  },
];

const extras = [
  ['Exam Season Pass', '₦12,000 for 3 months of Pro, timed to WAEC and UTME.'],
  ['Tutoring', '₦10,000 per session, focused on your weak topics.'],
  ['Schools', '₦900,000 a year: diagnostics, dashboards and parent reports.'],
];

const faqs = [
  {
    q: 'Who is DoLearnn for?',
    a: 'Secondary school students and recent school leavers preparing for JAMB UTME, WAEC, NECO, Post-UTME, IGCSE / GCSE or SAT. Parents can sign up on behalf of their child, and schools can use DoLearnn for whole classes.',
  },
  {
    q: 'How is this different from a quiz app?',
    a: 'A quiz gives you a score. DoLearnn ranks your weak topics, gives you practice on exactly those topics, brings in a tutor when you need one, then tests you again so you can see the improvement.',
  },
  {
    q: 'Are these real past questions?',
    a: 'They are original questions written in the style and syllabus of each exam, so you practise the same topics and difficulty without copied papers.',
  },
  {
    q: 'What is exam mode?',
    a: 'A timed mock that fills the whole screen like the real CBT. Leaving the screen is recorded, so your score reflects what you can really do.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. Every learner gets a monthly diagnostic, daily practice missions and a capped AI Study Coach at no cost. Paid plans lift the limits when you need more.',
  },
  {
    q: 'How does tutoring work?',
    a: '₦10,000 per session with a tutor matched to your weak topics. Request one from your results; the tutor sees your diagnosis before the first lesson. Pro members get 10% off.',
  },
];

function Shot({ src, alt, width, height, className = '', priority = false }: { src: string; alt: string; width: number; height: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes="(min-width: 1024px) 640px, 100vw"
      className={`h-auto w-full rounded-2xl border border-slate-200/70 bg-white shadow-[0_24px_60px_-24px_rgba(4,66,114,0.35)] ${className}`}
    />
  );
}

function SectionHead({ kicker, title, text, center = true }: { kicker: string; title: React.ReactNode; text?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent2-600">{kicker}</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight tracking-tight text-brand-700 sm:text-4xl">
        {title}
      </h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-slate-600">{text}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <div className={`${montserrat.variable} min-h-screen overflow-x-hidden bg-white text-slate-800`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <div className="relative">
        {/* Soft brand glow behind the hero */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[720px] bg-[radial-gradient(60%_60%_at_15%_10%,#DDF5EA_0%,transparent_60%),radial-gradient(55%_55%_at_90%_0%,#DCE8F5_0%,transparent_65%)]" />
        <div className="relative">
          <LandingNav />
        </div>

        <main id="main-content" className="relative">
          {/* ---------- HERO ---------- */}
          <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-16" aria-labelledby="hero-title">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-accent2-200 bg-white/80 px-3 py-1 text-sm font-medium text-brand">
                <span className="h-2 w-2 rounded-full bg-accent2-400" /> JAMB · WAEC · NECO<span className="hidden sm:inline"> · Post-UTME · IGCSE · SAT</span><span className="sm:hidden"> and more</span>
              </p>
              <h1 id="hero-title" className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-700 sm:text-6xl">
                Know what to fix.{' '}
                <span className="relative whitespace-nowrap text-accent2-500">
                  Prove you fixed it.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                DoLearnn finds the exact topics costing you marks, gives you daily practice and a tutor when you need one, then tests you again so you can see the improvement.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-700 sm:w-auto">
                  Start practising free <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/practice" className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-brand transition hover:border-brand sm:w-auto">
                  Try a free quiz
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">No card needed. Parents can sign up for their child.</p>
            </div>

            <Reveal className="relative mx-auto mt-14 max-w-5xl">
              <Shot src="/landing/today.webp" alt="The DoLearnn Today page with a streak, daily missions and the next topic to practise" width={2000} height={1250} priority />
              <div className="absolute -bottom-10 -right-2 hidden w-44 rotate-3 sm:block lg:-right-12 lg:w-56">
                <Image src="/landing/share-card.webp" alt="A streak card a learner can share" width={664} height={830} className="h-auto w-full rounded-2xl shadow-2xl ring-4 ring-white" />
              </div>
              <div className="absolute -left-3 top-10 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-200 md:flex lg:-left-10">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-500"><Flame className="h-5 w-5" /></span>
                <span className="text-left text-sm"><strong className="block text-brand-700">Daily streaks</strong><span className="text-slate-500">Share them with friends</span></span>
              </div>
            </Reveal>
          </section>
        </main>
      </div>

      {/* ---------- EXAMS STRIP ---------- */}
      <section id="exams" className="border-y border-slate-100 bg-slate-50/70 py-12" aria-labelledby="exams-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="exams-title" className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Practise for</h2>
          <ul className="mt-6 flex flex-wrap justify-center gap-3">
            {exams.map((exam) => (
              <li key={exam} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-[family-name:var(--font-display)] text-base font-bold text-brand-700 shadow-sm">
                {exam}
              </li>
            ))}
          </ul>
          <ul className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2" aria-label="Subjects">
            {subjects.map((subject) => (
              <li key={subject} className="rounded-full bg-white px-3 py-1 text-sm text-slate-600 ring-1 ring-slate-200">{subject}</li>
            ))}
            <li className="rounded-full px-3 py-1 text-sm font-medium text-accent2-600">and more</li>
          </ul>
        </div>
      </section>

      {/* ---------- STATEMENT ---------- */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28" aria-label="Why DoLearnn">
        <Reveal>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold leading-snug tracking-tight text-brand-700 sm:text-4xl">
            A score tells you <span className="text-slate-400">how you did.</span> DoLearnn tells you <span className="text-accent2-500">what to do next</span>, and shows you when it worked.
          </p>
        </Reveal>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-28" aria-labelledby="how-title">
        <SectionHead kicker="How it works" title={<span id="how-title">Four steps. One simple loop.</span>} />
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal as="li" key={step.n} delay={index * 90} className={`flex flex-col rounded-3xl ${step.tone} p-6`}>
              <span className="font-[family-name:var(--font-display)] text-sm font-bold text-brand/50">{step.n}</span>
              <h3 className="mt-6 font-[family-name:var(--font-display)] text-xl font-bold text-brand-700">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{step.text}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal className="mt-10">
          <Shot src="/landing/topics.webp" alt="Topics to strengthen, ranked from weakest to strongest" width={2000} height={477} />
        </Reveal>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="bg-brand-700 py-20 text-white lg:py-28" aria-labelledby="features-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent2-300">Built for exam season</p>
            <h2 id="features-title" className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need, in one place.
            </h2>
          </div>

          <div className="mt-16 space-y-20 lg:space-y-28">
            <Feature
              icon={ShieldCheck}
              kicker="Exam mode"
              title="Feels like the real CBT."
              text="Timed mocks fill the whole screen with the exam name at the top. Leaving the screen is recorded, so your score shows what you can really do on the day."
              points={['Full screen, one question at a time', 'Timer and question map', 'Honest scores you can trust']}
              image={{ src: '/landing/exam.webp', alt: 'Exam mode running a JAMB UTME Mathematics mock', width: 2000, height: 1250 }}
            />
            <Feature
              reverse
              icon={Flame}
              kicker="Streaks, missions and badges"
              title="Show up daily. Share your streak."
              text="Three short missions a day keep you moving. Earn badges, climb the weekly leaderboard (or hide your name) and share a streak card that says which exam you are preparing for."
              points={['Daily missions on your weak topics', 'Badges for real progress', 'Share to WhatsApp in one tap']}
              image={{ src: '/landing/missions.webp', alt: 'Daily missions and progress', width: 1100, height: 948 }}
              narrow
            />
            <Feature
              icon={Swords}
              kicker="Arena"
              title="Practise with friends."
              text="Start a battle, send your friend the code and answer the same questions. Best score wins."
              points={['Same questions for both of you', 'Invite with a battle code', 'See who won and by how much']}
              image={{ src: '/landing/arena.webp', alt: 'The Arena page for quiz battles', width: 2000, height: 1014 }}
            />
            <Feature
              reverse
              icon={Target}
              kicker="Tutors who come prepared"
              title="Help that starts from your results."
              text="Request a tutor in a few taps. Before the first lesson your tutor sees your weak topics and recent scores, so no time is wasted. ₦10,000 per session."
              points={['Matched to your weak topics', 'Session notes after every lesson', 'Progress reports for parents']}
              image={{ src: '/landing/tutor-summary.webp', alt: 'A tutor’s summary of a learner’s weak topics', width: 1104, height: 617 }}
              narrow
            />
          </div>
        </div>
      </section>

      {/* ---------- AUDIENCES ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28" aria-labelledby="who-title">
        <SectionHead kicker="Who it’s for" title={<span id="who-title">One account. Everyone on the same page.</span>} />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {audiences.map((item, index) => (
            <Reveal as="article" key={item.title} delay={index * 90} className="flex flex-col rounded-3xl border border-slate-200 p-7 transition hover:border-accent2-300 hover:shadow-lg">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent2-50 text-accent2-600"><item.icon className="h-6 w-6" /></span>
              <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-bold text-brand-700">{item.title}</h3>
              <p className="mt-2 flex-1 leading-relaxed text-slate-600">{item.text}</p>
              {item.external ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand hover:text-accent2-600">
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link href={item.href} className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand hover:text-accent2-600">
                  {item.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </Reveal>
          ))}
        </div>

        {/* Real traction only */}
        <Reveal className="mt-14 grid gap-6 rounded-3xl bg-slate-50 p-8 sm:grid-cols-3">
          <Stat value="15" label="students in our free pilot" />
          <Stat value="4" label="students tutored so far" />
          <Stat value="2" label="schools in conversation" />
        </Reveal>
      </section>

      {/* ---------- PRICING ---------- */}
      <section id="pricing" className="bg-slate-50/70 py-20 lg:py-28" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead kicker="Pricing" title={<span id="pricing-title">Free to start. Priced for students.</span>} text="Upgrade only when you need more practice or the final push before your exam." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <Reveal
                as="article"
                key={plan.name}
                delay={index * 90}
                className={`relative flex flex-col rounded-3xl p-7 ${plan.popular ? 'bg-brand text-white shadow-2xl shadow-brand/25 lg:-my-3 lg:py-10' : 'border border-slate-200 bg-white'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-7 rounded-full bg-accent2-400 px-3 py-1 text-xs font-bold text-brand-700">Most popular</span>
                )}
                <h3 className={`font-[family-name:var(--font-display)] text-lg font-bold ${plan.popular ? 'text-white' : 'text-brand-700'}`}>{plan.name}</h3>
                <p className={`mt-1 text-sm ${plan.popular ? 'text-white/70' : 'text-slate-500'}`}>{plan.tagline}</p>
                <p className="mt-5">
                  <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold">{plan.price}</span>{' '}
                  <span className={plan.popular ? 'text-white/70' : 'text-slate-500'}>{plan.unit}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.popular ? 'text-accent2-300' : 'text-accent2-500'}`} strokeWidth={3} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 rounded-full py-3 text-center font-semibold transition ${plan.popular ? 'bg-accent2-400 text-brand-700 hover:bg-accent2-300' : 'border border-slate-300 text-brand hover:border-brand'}`}
                >
                  {plan.name === 'Free' ? 'Start free' : `Get ${plan.name}`}
                </Link>
              </Reveal>
            ))}
          </div>
          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {extras.map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <dt className="font-semibold text-brand-700">{title}</dt>
                <dd className="mt-1 text-sm text-slate-600">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28" aria-labelledby="faq-title">
        <SectionHead kicker="FAQ" title={<span id="faq-title">Questions, answered.</span>} />
        <div className="mt-10 divide-y divide-slate-200 rounded-3xl border border-slate-200">
          {faqs.map((item) => (
            <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-700">
                {item.q}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-lg leading-none text-brand transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-slate-600">
          Still unsure?{' '}
          <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-accent2-600">
            <MessageCircle className="h-4 w-4" /> Chat with us on WhatsApp
          </a>
        </p>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-accent2-400 to-accent2-500 px-6 py-16 text-center sm:px-12">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15" />
          <div aria-hidden className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand/10" />
          <BarChart3 className="relative mx-auto h-10 w-10 text-brand-700" />
          <h2 className="relative mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-brand-700 sm:text-5xl">
            Your next score starts today.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-brand-700/80">Take a free quiz, see your weak topics and get a plan in minutes.</p>
          <Link href="/register" className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-brand-700">
            Create your free account <ArrowRight className="h-5 w-5" />
          </Link>
        </Reveal>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="bg-brand-800 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo tone="light" size="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">Know what to fix. Prove you fixed it. Exam practice, diagnosis and tutoring in one place.</p>
            <p className="mt-6 text-sm font-semibold">Get study tips and exam updates</p>
            <NewsletterForm />
          </div>
          <nav aria-label="Product" className="text-sm">
            <p className="font-semibold">Product</p>
            <ul className="mt-4 space-y-2.5 text-white/70">
              <li><a href="#how-it-works" className="hover:text-white">How it works</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link href="/practice" className="hover:text-white">Free quiz</Link></li>
            </ul>
          </nav>
          <nav aria-label="Account" className="text-sm">
            <p className="font-semibold">Get started</p>
            <ul className="mt-4 space-y-2.5 text-white/70">
              <li><Link href="/register" className="hover:text-white">Create account</Link></li>
              <li><Link href="/login" className="hover:text-white">Log in</Link></li>
              <li><a href={trial} target="_blank" rel="noreferrer" className="hover:text-white">For schools</a></li>
              <li><a href={whatsapp} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp</a></li>
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-[family-name:var(--font-display)] text-5xl font-extrabold text-brand">{value}</p>
      <p className="mt-1 text-slate-600">{label}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  kicker,
  title,
  text,
  points,
  image,
  reverse = false,
  narrow = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  kicker: string;
  title: string;
  text: string;
  points: string[];
  image: { src: string; alt: string; width: number; height: number };
  reverse?: boolean;
  narrow?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={reverse ? 'lg:order-2' : ''}>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-accent2-300">
          <Icon className="h-4 w-4" /> {kicker}
        </span>
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h3>
        <p className="mt-4 text-lg leading-relaxed text-white/75">{text}</p>
        <ul className="mt-6 space-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-3 text-white/90">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent2-400/20"><Check className="h-3.5 w-3.5 text-accent2-300" strokeWidth={3} /></span>
              {point}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal className={`${reverse ? 'lg:order-1' : ''} ${narrow ? 'mx-auto w-full max-w-md' : ''}`}>
        <div className="rounded-3xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
          <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1024px) 560px, 100vw" className="h-auto w-full rounded-2xl" />
        </div>
      </Reveal>
    </div>
  );
}
