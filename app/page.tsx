'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Award,
  Check,
  ChevronUp,
  ClipboardList,
  Compass,
  Flame,
  GraduationCap,
  HeartHandshake,
  LineChart,
  Radar,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import logo from '../assests/home/logo.svg';
import fullLogo from '../assests/home/full-logo.png';
import graduateImg from '../assests/home/hero-profile-img.png';
import profileSmallImg from '../assests/home/small-profile-img.jpg';
import slantArrow from '../assests/home/slant-arrow.svg';
import onlineImg1 from '../assests/home/online-img1.png';
import productImg from '../assests/home/productive-img.png';

const howItWorks = [
  {
    icon: ClipboardList,
    title: 'Tell us about your child',
    body: 'Fill a short intake form — subject, goal, level, availability, and budget.',
  },
  {
    icon: UserCheck,
    title: 'We pair them with the right teacher',
    body: 'Our team reviews the intake and hand-picks a vetted teacher — usually within 24 hours.',
  },
  {
    icon: Video,
    title: 'Meet live on Google Meet',
    body: 'Join 1-on-1 sessions from your dashboard. No extra apps, no setup.',
  },
  {
    icon: LineChart,
    title: 'Track progress every session',
    body: 'Teacher feedback after every session, plus a monthly progress report.',
  },
];

const pairingReasons = [
  {
    icon: ShieldCheck,
    title: 'Quality controlled',
    body: 'Every teacher is interviewed, trial-taught, and approved by our team before they ever meet your child.',
  },
  {
    icon: HeartHandshake,
    title: 'Personalised match',
    body: 'We match on learning goals, schedule, and how your child learns — not just the subject name.',
  },
  {
    icon: Users,
    title: 'One team, end-to-end',
    body: 'One team owns your child\u2019s journey from intake to progress report. If the match isn\u2019t right, we re-pair at no cost.',
  },
];

const parentFeatures = [
  { icon: Users, label: 'Family Hub — manage 2–4 children from one account' },
  { icon: ClipboardList, label: 'Teacher notes after every session' },
  { icon: LineChart, label: 'Monthly progress report, sent as PDF' },
  { icon: ShieldCheck, label: 'Secure payments via Stripe or Flutterwave' },
];

const studentFeatures = [
  { icon: Compass, label: 'Learning Journey Map with milestones' },
  { icon: Award, label: 'Badges for streaks, subjects, and milestones' },
  { icon: Radar, label: 'Skills Radar — see strengths build across subjects' },
  { icon: Flame, label: 'Daily streaks and goal tracking' },
];

const plans = [
  {
    name: 'Single Session',
    price: '$25–$40',
    per: 'per session',
    description: 'Try it with no commitment.',
    features: [
      '1 live 1-on-1 session',
      'Teacher hand-picked for your child',
      'Session feedback in your dashboard',
    ],
    cta: 'Book a session',
    highlight: false,
  },
  {
    name: 'Starter Bundle',
    price: '$100–$150',
    per: '5 sessions',
    description: 'Enough sessions to see real change.',
    features: [
      '5 sessions with the same teacher',
      'Save vs. single session price',
      'Progress tracked across every session',
      'Monthly PDF report',
    ],
    cta: 'Get started',
    highlight: true,
  },
];

export default function Home() {
  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <main className="min-h-screen bg-white dark:bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-background/80 backdrop-blur-sm z-50 border-b border-gray-100 dark:border-border">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <Image
              src={logo}
              alt="DoLearn"
              className="w-[100px] h-[20px] dark:invert dark:brightness-200"
            />
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-700 dark:text-foreground/90">
              <Link href="#how-it-works" className="hover:text-brand dark:hover:text-accent2-400 transition">
                How it works
              </Link>
              <Link href="#parents" className="hover:text-brand dark:hover:text-accent2-400 transition">
                For parents
              </Link>
              <Link href="#students" className="hover:text-brand dark:hover:text-accent2-400 transition">
                For students
              </Link>
              <Link href="#pricing" className="hover:text-brand dark:hover:text-accent2-400 transition">
                Pricing
              </Link>
              <Link href="#faq" className="hover:text-brand dark:hover:text-accent2-400 transition">
                FAQ
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {/* <Link href="/login" className="hidden md:block">
                <Button variant="outline" className="rounded-full">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-brand hover:bg-brand-600 px-6 rounded-full">
                  Get started
                </Button>
              </Link> */}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 lg:pt-32 pb-16 bg-accent2-50 dark:bg-gradient-to-br dark:from-background dark:to-brand-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 bg-white dark:bg-card border border-accent2-200 text-brand text-xs font-medium px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Curated pairing model
              </span>
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 dark:text-foreground leading-tight mb-4">
                The right teacher,{' '}
                <span className="text-brand dark:text-accent2-400">hand-picked</span> for your{' '}
                <span className="text-accent2-500">child.</span>
              </h1>
              <p className="text-base lg:text-lg text-gray-600 dark:text-muted-foreground mb-8 max-w-lg">
                We hand-pick a teacher for your child and run live 1-on-1
                sessions on Google Meet. You skip the profile-scrolling. Our
                team owns the match.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                {/* <Link href="/register">
                  <Button className="bg-brand hover:bg-brand-600 rounded-full px-6">
                    Start free intake
                  </Button>
                </Link> */}
                <Link href="#how-it-works">
                  <Button
                    variant="outline"
                    className="rounded-full px-6 border-brand text-brand hover:bg-accent2-50"
                  >
                    How we match
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:flex justify-center"
            >
              <div className="relative">
                <Image
                  src={slantArrow}
                  alt=""
                  className="absolute -left-[110px] w-28 h-[120px] top-[170px]"
                />
                <div
                  className="absolute w-[370px] h-[350px] rounded-full left-[28px] top-36 bg-[url('/circle.png')] bg-cover bg-center"
                />
                <Image
                  src={graduateImg}
                  alt="Paired student"
                  className="relative z-10 w-full h-[498px] object-cover"
                />
                <Image
                  src={profileSmallImg}
                  alt="teacher"
                  className="absolute top-[130px] left-20 w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
                <div className="bg-white dark:bg-card z-20 absolute bottom-24 -left-24 shadow-xl rounded-xl px-4 py-3 w-[230px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent2-100 text-brand flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-foreground">
                      Paired in under 24h
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-2 leading-relaxed">
                    We matched Ayo with a Maths teacher based on her goals,
                    schedule, and how she learns best.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              How it works
            </p>
            <h2 className="text-3xl font-bold text-brand mb-3">
              From intake to your first session in under 24 hours
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
              No endless teacher profiles. Just four steps and a team that owns
              the match.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <Card className="border-none shadow-sm h-full bg-white dark:bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl bg-accent2-100 text-brand flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-bold text-accent2-100">
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">
                        {step.body}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pairing Model */}
      <section
        className="relative py-20 text-white bg-[url('/graduation.svg')] bg-cover bg-center bg-no-repeat"
      >
        <div className="absolute inset-0 bg-brand-800/85" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent2-400 mb-2">
                Why pairing beats browsing
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                You shouldn&apos;t have to pick a teacher blind.
              </h2>
              <p className="text-white/80 mb-8 leading-relaxed max-w-lg">
                Most platforms hand you hundreds of profiles and let you guess.
                We read every intake, know every teacher on our roster, and
                make the call ourselves — so the first session actually lands.
              </p>
              <div className="space-y-5">
                {pairingReasons.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent2-500/20 text-accent2-400 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{r.title}</h3>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {r.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="hidden lg:block"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={onlineImg1}
                  alt="Tutor and student on a video call"
                  className="w-full h-[440px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Parents & Students */}
      <section className="py-20 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              Built for the whole family
            </p>
            <h2 className="text-3xl font-bold text-brand mb-3">
              What parents need. What students want.
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
              Parents get the visibility to trust the process. Students get
              something they actually want to log into.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              id="parents"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-accent2-50 dark:bg-accent2-500/10 rounded-3xl p-8 border border-accent2-100 dark:border-accent2-500/20"
            >
              <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center mb-5">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-brand mb-2">
                For parents
              </h3>
              <p className="text-sm text-gray-700 dark:text-foreground/90 mb-6">
                Visibility into every session, without hovering.
              </p>
              <ul className="space-y-3">
                {parentFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <li key={f.label} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-card text-brand flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-800 dark:text-foreground pt-1.5">{f.label}</p>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              id="students"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-brand rounded-3xl p-8 text-white"
            >
              <div className="w-12 h-12 rounded-xl bg-accent2-500 text-brand flex items-center justify-center mb-5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-2">For students</h3>
              <p className="text-sm text-white/80 mb-6">
                A dashboard students actually open.
              </p>
              <ul className="space-y-3">
                {studentFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <li key={f.label} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-card/10 text-accent2-400 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-white/90 pt-1.5">{f.label}</p>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              Pricing
            </p>
            <h2 className="text-3xl font-bold text-brand mb-3">
              Start with one session. Or save with a bundle.
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground max-w-xl mx-auto">
              No subscriptions. No lock-in. Cancel or pause anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`rounded-3xl p-8 border ${
                  plan.highlight
                    ? 'bg-brand text-white border-brand shadow-xl'
                    : 'bg-white dark:bg-card border-gray-200 dark:border-border'
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block text-xs font-semibold bg-accent2-500 text-brand px-3 py-1 rounded-full mb-4">
                    Best value
                  </span>
                )}
                <h3
                  className={`text-xl font-bold mb-1 ${
                    plan.highlight ? 'text-white' : 'text-brand'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm mb-6 ${
                    plan.highlight ? 'text-white/80' : 'text-gray-600'
                  }`}
                >
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span
                    className={`text-sm ${
                      plan.highlight ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {plan.per}
                  </span>
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          plan.highlight
                            ? 'text-accent2-400'
                            : 'text-accent2-500'
                        }`}
                      />
                      <span
                        className={
                          plan.highlight ? 'text-white/90' : 'text-gray-700'
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                {/* <Link href="/register">
                  <Button
                    className={`w-full rounded-full ${
                      plan.highlight
                        ? 'bg-accent2-500 text-brand hover:bg-accent2-400'
                        : 'bg-brand text-white hover:bg-brand-600'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link> */}
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-muted-foreground mt-6">
            Payments processed via Stripe (international) or Flutterwave
            (Africa).
          </p>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-10 bg-white dark:bg-card border-y border-gray-100 dark:border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-gray-600 dark:text-muted-foreground">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand" />
              ID-verified teachers
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-border">·</span>
            <span className="flex items-center gap-2">
              <Video className="w-4 h-4 text-brand" />
              Sessions on Google Meet
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-border">·</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand" />
              Secure payments via Stripe &amp; Flutterwave
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50 dark:bg-background">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              FAQ
            </p>
            <h2 className="text-3xl font-bold text-brand mb-3">
              Before you book, parents usually ask:
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground">
              The honest answers, up front.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem
                value="q1"
                className="border-none rounded-lg bg-white dark:bg-card border dark:border-border"
              >
                <AccordionTrigger className="px-6 rounded-md hover:no-underline text-left">
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    How does the pairing actually work?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-muted-foreground px-6 pb-4">
                  You fill a short intake for your child. A member of the
                  DoLearn team reviews it and hand-picks the best-matched
                  teacher based on subject, availability, and learning style —
                  usually within 24 hours.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="q2"
                className="border-none rounded-lg bg-white dark:bg-card border dark:border-border"
              >
                <AccordionTrigger className="px-6 rounded-md hover:no-underline text-left">
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    What subjects do you support?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-muted-foreground px-6 pb-4">
                  Maths, English, Sciences, Coding, Music, French, SAT prep, and
                  more. If we don&apos;t have a teacher for your subject, we&apos;ll tell
                  you on the spot.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="q3"
                className="border-none rounded-lg bg-white dark:bg-card border dark:border-border"
              >
                <AccordionTrigger className="px-6 rounded-md hover:no-underline text-left">
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    What if the teacher isn&apos;t a good fit?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-muted-foreground px-6 pb-4">
                  Tell us. We&apos;ll re-pair your child with another teacher — no
                  friction, no extra charge. That&apos;s the point of the pairing
                  model.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="q4"
                className="border-none rounded-lg bg-white dark:bg-card border dark:border-border"
              >
                <AccordionTrigger className="px-6 rounded-md hover:no-underline text-left">
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    How are sessions conducted?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-muted-foreground px-6 pb-4">
                  Every session is live and 1-on-1 on Google Meet. A join button
                  appears in your dashboard before the session starts — no extra
                  apps needed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem
                value="q5"
                className="border-none rounded-lg bg-white dark:bg-card border dark:border-border"
              >
                <AccordionTrigger className="px-6 rounded-md hover:no-underline text-left">
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    How do payments work?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-muted-foreground px-6 pb-4">
                  Pay per session or buy a bundle. International parents use
                  Stripe; parents in Africa can pay via Flutterwave in local
                  currency.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-accent2-100 dark:bg-gradient-to-br dark:from-brand-900 dark:to-background relative py-12 lg:py-0">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center"
          >
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-foreground mb-3">
              Ready to find the right teacher for your{' '}
              <span className="text-brand">child?</span>
            </h2>
            <p className="text-gray-700 dark:text-foreground/90 mb-6 max-w-md">
              Start the intake. We&apos;ll take it from there.
            </p>
            <div className="flex gap-3">
              {/* <Link href="/register">
                <Button className="bg-brand hover:bg-brand-600 rounded-full px-6">
                  Start free intake
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="rounded-full px-6 border-brand text-brand"
                >
                  Log in
                </Button>
              </Link> */}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="justify-center hidden lg:flex"
          >
            <Image
              src={productImg}
              alt=""
              className="-mt-24 w-full object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-100 dark:bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <Image
              src={logo}
              alt="DoLearn"
              className="w-[150px] h-[28px]"
            />
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-gray-800 dark:text-foreground">
                DoLearn updates, once a week
              </h3>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                New teacher stories, learning tips, product updates. No spam.
              </p>
            </div>
            <form className="flex flex-col sm:flex-row items-center bg-white dark:bg-card rounded-full p-1 shadow-sm">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 w-full px-4 py-2 text-sm outline-none rounded-full bg-transparent dark:text-foreground dark:placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="mt-2 sm:mt-0 sm:ml-2 px-6 py-2 text-sm font-medium bg-brand text-white rounded-full hover:bg-brand-600 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-300 relative">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-2">
              <Image
                src={fullLogo}
                alt="DoLearn"
                className="w-[160px] h-[30px] mb-4"
              />
              <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed max-w-xs">
                Hand-picked teachers. Live 1-on-1 sessions. One team that owns
                the match.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-muted-foreground">
                <li className="hover:text-white cursor-pointer">
                  <Link href="#how-it-works">How it works</Link>
                </li>
                <li className="hover:text-white cursor-pointer">
                  <Link href="#pricing">Pricing</Link>
                </li>
                <li className="hover:text-white cursor-pointer">
                  <Link href="#faq">FAQ</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Teachers</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-muted-foreground">
                <li className="hover:text-white cursor-pointer">Apply to teach</li>
                <li className="hover:text-white cursor-pointer">Teacher login</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-muted-foreground">
                <li className="hover:text-white cursor-pointer">Contact</li>
                <li className="hover:text-white cursor-pointer">Terms</li>
                <li className="hover:text-white cursor-pointer">Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-6 text-center text-xs text-gray-600 dark:text-muted-foreground">
            DoLearn © {new Date().getFullYear()} · All rights reserved
          </div>
        </div>

        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 bg-brand p-3 rounded-full text-white shadow-lg hover:bg-brand-600 transition"
        >
          <ChevronUp size={20} />
        </button>
      </footer>
    </main>
  );
}
