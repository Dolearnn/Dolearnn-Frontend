'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Magnetic,
  Marquee,
  ScrollProgress,
  SparkleField,
  WordsReveal,
} from '@/components/Home/animations';
import {
  AuroraBackdrop,
  ConfettiBurst,
  CursorGlow,
  DrawnUnderline,
  MatchingVisualizer,
  OrbitAvatars,
  PointerSpotlight,
  RollingNumber,
  TestimonialsMarquee,
  WaveDivider,
  orbitTeachers,
  sampleTestimonials,
} from '@/components/Home/extra-animations';
import {
  ChatPreview,
  GlitchText,
  GlobalRipples,
  JourneyTimeline,
  KonamiParty,
  MouseConstellation,
  SectionDotNav,
  SplashLoader,
  journeySteps,
  navSections,
} from '@/components/Home/wild-animations';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { joinWaitlist, subscribeNewsletter } from '@/lib/api/public';
import {
  Award,
  Check,
  ChevronUp,
  ClipboardList,
  Compass,
  Facebook,
  Flame,
  GraduationCap,
  HeartHandshake,
  Instagram,
  Linkedin,
  LineChart,
  MessageCircle,
  Music2,
  PhoneCall,
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
  { icon: ShieldCheck, label: 'Payments recorded by admin after confirmation' },
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
    price: '$15',
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
    price: '$100',
    per: '7 sessions',
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

const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/dolearnn';
const LINKEDIN_URL =
  process.env.NEXT_PUBLIC_LINKEDIN_URL ?? 'https://linkedin.com/company/dolearnn';
const TIKTOK_URL =
  process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@dolearnn';
const FACEBOOK_URL =
  process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://facebook.com/dolearnn';
const PHONE_NUMBER =
  process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '0905 763 8887';

const socialLinks = [
  { label: 'Instagram', href: INSTAGRAM_URL, icon: Instagram },
  { label: 'LinkedIn', href: LINKEDIN_URL, icon: Linkedin },
  { label: 'TikTok', href: TIKTOK_URL, icon: Music2 },
  { label: 'Facebook', href: FACEBOOK_URL, icon: Facebook },
  {
    label: 'Call us',
    href: `tel:${PHONE_NUMBER.replace(/\s/g, '')}`,
    icon: PhoneCall,
  },
];

// TEMP: dashboard not live yet — auth CTAs route to the waitlist.
// To restore: search for `WAITLIST_*` and replace each occurrence with the
// original /register or /login Link + label (Create family account / Log in).
const WAITLIST_HREF = '#waitlist';
const WAITLIST_LABEL = 'Join the waitlist';

const subjectStrip = [
  'Maths',
  'English',
  'Sciences',
  'Coding',
  'Music',
  'French',
  'SAT prep',
  'Reading',
  'Chemistry',
  'Biology',
  'Physics',
  'Writing',
];

const stats = [
  { value: 24, suffix: 'h', label: 'Average pairing time' },
  { value: 100, suffix: '+', label: 'Vetted teachers on roster' },
  { value: 12, suffix: '', label: 'Subjects covered' },
  { value: 98, suffix: '%', label: 'Parents who re-book' },
];

export default function Home() {
  const { toast } = useToast();
  const [waitlistForm, setWaitlistForm] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' });

  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(heroProgress, [0, 1], [0, -120]);
  const heroImageRotate = useTransform(heroProgress, [0, 1], [0, -6]);

  const pairingRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress: pairingProgress } = useScroll({
    target: pairingRef,
    offset: ['start end', 'end start'],
  });
  const pairingImageY = useTransform(pairingProgress, [0, 1], [80, -80]);

  const waitlistMutation = useMutation({
    mutationFn: joinWaitlist,
    onSuccess: () => {
      setWaitlistForm({ fullName: '', email: '', phone: '' });
      toast({
        title: 'You are on the waitlist',
        description: 'We will reach out as soon as spots open up.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not join waitlist',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: subscribeNewsletter,
    onSuccess: () => {
      setNewsletterEmail('');
      toast({
        title: 'Subscribed',
        description: 'You will now get DoLearn updates in your inbox.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not subscribe',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <main id="top" className="min-h-screen bg-white dark:bg-background overflow-x-hidden">
      <SplashLoader />
      <ScrollProgress />
      <CursorGlow />
      <GlobalRipples />
      <KonamiParty />
      <SectionDotNav sections={navSections} />

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
              <Link href="#waitlist" className="hover:text-brand dark:hover:text-accent2-400 transition">
                Waitlist
              </Link>
              <Link href="#faq" className="hover:text-brand dark:hover:text-accent2-400 transition">
                FAQ
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {/* WAITLIST_SWAP: was <Link href="/login"> Log in (md+ only) */}
              {/* WAITLIST_SWAP: was <Link href="/register"> Create family account / Sign up */}
              <Link href={WAITLIST_HREF}>
                <Button className="bg-brand hover:bg-brand-600 px-3 sm:px-6 rounded-full text-xs sm:text-sm">
                  <span className="sm:hidden">Join waitlist</span>
                  <span className="hidden sm:inline">{WAITLIST_LABEL}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-16 lg:pb-20 bg-accent2-50 dark:bg-gradient-to-br dark:from-background dark:to-brand-900/40 overflow-hidden noise-overlay"
      >
        <AuroraBackdrop />
        <SparkleField count={28} />
        <MouseConstellation density={42} />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white dark:bg-card border border-accent2-200 text-brand text-xs font-medium px-3 py-1 rounded-full mb-4 shadow-sm"
              >
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-accent2-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-accent2-500" />
                </span>
                <Sparkles className="w-3.5 h-3.5" />
                Curated pairing model
              </motion.span>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-foreground leading-tight mb-4">
                <span className="block overflow-hidden">
                  <WordsReveal text="The right teacher," />
                </span>
                <span className="block overflow-hidden">
                  <WordsReveal
                    text="hand-picked for your"
                    delay={0.25}
                    highlight={{
                      'hand-picked':
                        'animate-gradient-text bg-gradient-to-r from-brand via-accent2-500 to-brand dark:from-accent2-400 dark:via-accent2-300 dark:to-accent2-400',
                    }}
                  />
                </span>
                <span className="block overflow-hidden">
                  <WordsReveal
                    text="child."
                    delay={0.55}
                    highlight={{
                      'child':
                        'animate-gradient-text bg-gradient-to-r from-accent2-500 via-accent2-400 to-brand',
                    }}
                  />
                </span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-base lg:text-lg text-gray-600 dark:text-muted-foreground mb-8 max-w-lg"
              >
                We hand-pick a teacher for your child and run live 1-on-1
                sessions in Classroom. You skip the profile-scrolling. Our
                team owns the match.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.6 }}
                className="flex flex-wrap gap-3 mb-10"
              >
                {/* WAITLIST_SWAP: was Create family account → /register and Log in → /login */}
                <ConfettiBurst>
                  <Magnetic>
                    <Link href={WAITLIST_HREF}>
                      <Button className="shine-sweep relative overflow-hidden bg-brand hover:bg-brand-600 rounded-full px-6 shadow-lg shadow-brand/25">
                        {WAITLIST_LABEL}
                      </Button>
                    </Link>
                  </Magnetic>
                </ConfettiBurst>
                <Magnetic>
                  <Link href="#how-it-works">
                    <Button
                      variant="outline"
                      className="rounded-full px-6 border-brand text-brand hover:bg-accent2-50"
                    >
                      How we match
                    </Button>
                  </Link>
                </Magnetic>
              </motion.div>

              {/* Animated stat row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.05, duration: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl"
              >
                {stats.map((s) => (
                  <div key={s.label} className="text-left">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand dark:text-accent2-400">
                      <RollingNumber to={s.value} suffix={s.suffix} />
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-muted-foreground leading-tight mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:flex justify-center"
            >
              <motion.div
                style={{ y: heroImageY, rotate: heroImageRotate }}
                className="relative"
              >
                {/* Rotating decorative ring */}
                <div
                  aria-hidden
                  className="absolute -inset-6 rounded-full border-2 border-dashed border-accent2-300/60 animate-spin-slow"
                />
                <Image
                  src={slantArrow}
                  alt=""
                  className="absolute -left-[110px] w-28 h-[120px] top-[170px] animate-float-slow"
                />
                <div
                  className="absolute w-[370px] h-[350px] rounded-full left-[28px] top-36 bg-[url('/circle.png')] bg-cover bg-center"
                />
                <motion.div className="animate-float">
                  <Image
                    src={graduateImg}
                    alt="Paired student"
                    className="relative z-10 w-full h-[498px] object-cover"
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.1, type: 'spring', stiffness: 180, damping: 12 }}
                  className="absolute top-[130px] left-20 z-20"
                >
                  <div className="relative animate-pulse-ring rounded-full">
                    <Image
                      src={profileSmallImg}
                      alt="teacher"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -30, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 1.3, duration: 0.6 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="bg-white dark:bg-card z-20 absolute bottom-24 -left-24 shadow-xl rounded-xl px-4 py-3 w-[230px] animate-float"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent2-100 text-brand flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-foreground">
                      Paired in under 24h
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-muted-foreground mt-2 leading-relaxed">
                    We matched Alex with a Maths teacher based on his goals,
                    schedule, and how his learns best.
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Subjects marquee strip */}
      <section className="relative py-6 bg-brand text-white overflow-hidden">
        <Marquee
          items={subjectStrip.map((label) => (
            <span
              key={label}
              className="flex items-center gap-3 text-lg lg:text-xl font-semibold tracking-tight"
            >
              {label}
              <span className="inline-block w-2 h-2 rounded-full bg-accent2-400" />
            </span>
          ))}
        />
      </section>

      {/* Live matching visualizer */}
      <section className="relative pt-16 sm:pt-20 lg:pt-24 pb-14 sm:pb-16 lg:pb-20 bg-white dark:bg-card overflow-hidden">
        <WaveDivider flip fill="#044272" className="text-brand" />
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-accent2-200/40 dark:bg-accent2-500/10 blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-brand/10 blur-3xl animate-blob-slow" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 max-w-2xl mx-auto"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              Live pairing
            </p>
            <h2 className="relative inline-block text-2xl sm:text-3xl font-bold text-brand mb-3">
              <span>Watch a match happen.</span>
              <DrawnUnderline className="absolute left-0 -bottom-3 w-full" />
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground mt-5">
              Intake comes in. Our team picks the right teacher. The session
              lands within 24 hours. No profile-scrolling roulette.
            </p>
          </motion.div>
          <MatchingVisualizer />
        </div>
      </section>

      {/* Subjects orbit */}
      <section
        id="subjects"
        className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-accent2-50 to-white dark:from-background dark:to-card overflow-hidden"
      >
        <AuroraBackdrop className="opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              Subjects covered
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-3 leading-tight">
              One roster. Every core subject your child needs.
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground max-w-md mb-6">
              Maths, English, Sciences, Coding, Music, French, SAT prep — and
              when we don&apos;t cover something, we say so on the spot.
            </p>
            <div className="flex flex-wrap gap-2">
              {subjectStrip.map((s) => (
                <motion.span
                  key={s}
                  whileHover={{ scale: 1.08, rotate: -2 }}
                  className="px-3 py-1 rounded-full bg-white dark:bg-card border border-accent2-200 dark:border-accent2-500/30 text-sm text-brand dark:text-accent2-300 shadow-sm cursor-default"
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </motion.div>
          <div className="relative mx-auto flex items-center justify-center w-full aspect-square max-w-[400px] sm:max-w-[460px] lg:max-w-[480px]">
            <div className="absolute inset-0">
              <OrbitAvatars
                items={orbitTeachers}
                radiusPct={0.45}
                maxRadius={220}
                speed={28}
              />
            </div>
            <div className="absolute inset-[18%]">
              <OrbitAvatars
                items={orbitTeachers.slice().reverse()}
                radiusPct={0.5}
                maxRadius={140}
                speed={20}
                reverse
              />
            </div>
            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-brand text-white flex items-center justify-center shadow-2xl shadow-brand/40 animate-pulse-ring">
              <div className="text-center px-2">
                <p className="text-xl sm:text-2xl font-extrabold">DoLearn</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-accent2-300">
                  Curated
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — vertical journey timeline */}
      <JourneyTimeline steps={journeySteps} />

      {/* Live chat preview */}
      <section className="relative py-16 sm:py-20 bg-gray-50 dark:bg-background overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-72 h-72 rounded-full bg-accent2-200/50 dark:bg-accent2-500/10 blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 -left-10 w-72 h-72 rounded-full bg-brand/10 blur-3xl animate-blob-slow" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              Behind the scenes
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-3 leading-tight">
              Watch a real{' '}
              <GlitchText text="pairing" className="text-brand" /> happen.
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground max-w-md mb-6">
              This is what the first day looks like — a parent reaches out, our
              team picks the right teacher, and the teacher reaches out
              directly. All before the first session.
            </p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-foreground/80">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent2-500" />
                Real conversation, not auto-generated.
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent2-500" />
                Encrypted thread inside the dashboard.
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent2-500" />
                You stay in the loop — but you don&apos;t have to manage it.
              </li>
            </ul>
          </div>
          <ChatPreview />
        </div>
      </section>

      {/* Pairing Model */}
      <section
        id="pairing"
        ref={pairingRef}
        className="relative py-16 sm:py-20 text-white bg-[url('/graduation.svg')] bg-cover bg-center bg-no-repeat overflow-hidden"
      >
        <div className="absolute inset-0 bg-brand-800/85" />
        {/* Floating accent dots */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-accent2-400 animate-float" />
          <div className="absolute top-1/3 right-20 w-3 h-3 rounded-full bg-accent2-300 animate-float-slow" />
          <div className="absolute bottom-20 left-1/4 w-2 h-2 rounded-full bg-accent2-400 animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent2-400 mb-2">
                Why pairing beats browsing
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                You shouldn&apos;t have to pick a teacher blind.
              </h2>
              <p className="text-white/80 mb-8 leading-relaxed max-w-lg">
                Most platforms hand you hundreds of profiles and let you guess.
                We read every intake, know every teacher on our roster, and
                make the call ourselves — so the first session actually lands.
              </p>
              <div className="space-y-5">
                {pairingReasons.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <motion.div
                      key={r.title}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
                      className="flex gap-4 group"
                    >
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        className="w-10 h-10 rounded-lg bg-accent2-500/20 text-accent2-400 flex items-center justify-center flex-shrink-0 group-hover:bg-accent2-500/30"
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold mb-1">{r.title}</h3>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {r.body}
                        </p>
                      </div>
                    </motion.div>
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
              <motion.div
                style={{ y: pairingImageY }}
                className="rounded-3xl overflow-hidden shadow-2xl relative"
              >
                <div className="absolute inset-0 ring-1 ring-accent2-400/30 rounded-3xl z-10 pointer-events-none" />
                <Image
                  src={onlineImg1}
                  alt="Tutor and student on a video call"
                  className="w-full h-[440px] object-cover"
                />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-xl"
                >
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-accent2-500" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-accent2-500 animate-ping" />
                  </div>
                  <p className="text-sm font-semibold text-brand">Live session in progress</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Parents & Students */}
      <section className="py-16 sm:py-20 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              Built for the whole family
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand mb-3">
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
              initial={{ opacity: 0, y: 40, rotateY: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-accent2-50 dark:bg-accent2-500/10 rounded-3xl p-6 sm:p-8 border border-accent2-100 dark:border-accent2-500/20 overflow-hidden spotlight"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-accent2-200/40 blur-2xl animate-blob" />
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                transition={{ duration: 0.5 }}
                className="relative w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center mb-5"
              >
                <Users className="w-5 h-5" />
              </motion.div>
              <h3 className="text-xl font-bold text-brand mb-2 relative">
                For parents
              </h3>
              <p className="text-sm text-gray-700 dark:text-foreground/90 mb-6 relative">
                Visibility into every session, without hovering.
              </p>
              <ul className="space-y-3 relative">
                {parentFeatures.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <motion.li
                      key={f.label}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-card text-brand flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-800 dark:text-foreground pt-1.5">{f.label}</p>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>

            <motion.div
              id="students"
              initial={{ opacity: 0, y: 40, rotateY: 10 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-brand rounded-3xl p-6 sm:p-8 text-white overflow-hidden"
            >
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-accent2-500/30 blur-3xl animate-blob-slow" />
              <div className="absolute top-6 right-6 opacity-30">
                <Sparkles className="w-8 h-8 text-accent2-400 animate-sparkle" />
              </div>
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                transition={{ duration: 0.5 }}
                className="relative w-12 h-12 rounded-xl bg-accent2-500 text-brand flex items-center justify-center mb-5"
              >
                <GraduationCap className="w-5 h-5" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2 relative">For students</h3>
              <p className="text-sm text-white/80 mb-6 relative">
                A dashboard students actually open.
              </p>
              <ul className="space-y-3 relative">
                {studentFeatures.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <motion.li
                      key={f.label}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/10 text-accent2-400 flex items-center justify-center flex-shrink-0 backdrop-blur">
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-white/90 pt-1.5">{f.label}</p>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="waitlist" className="py-16 sm:py-20 bg-white dark:bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
                Waitlist
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand mb-3">
                Join the list and hear from us first.
              </h2>
              <p className="text-gray-600 dark:text-muted-foreground max-w-xl">
                Leave your full name, email, and WhatsApp number. We&apos;ll use it
                for launch updates, new slot openings, and early family onboarding.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-8">
                <div className="rounded-2xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-background px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    Early access
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    Be first in line when we open new spots.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-background px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    Fast follow-up
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    WhatsApp makes it easy for our team to reach you.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-background px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
                    Launch news
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                    Product updates without needing to check back.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={(event) => {
                event.preventDefault();
                waitlistMutation.mutate({
                  fullName: waitlistForm.fullName.trim(),
                  email: waitlistForm.email.trim(),
                  phone: waitlistForm.phone.trim(),
                });
              }}
              className="rounded-3xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-background p-6 space-y-4"
            >
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-foreground">
                  Save my spot
                </p>
                <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                  We&apos;ll only use these details for DoLearn updates and onboarding.
                </p>
              </div>
              <Input
                value={waitlistForm.fullName}
                onChange={(event) =>
                  setWaitlistForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Full name"
                className="h-11 rounded-2xl bg-white dark:bg-card"
              />
              <Input
                type="email"
                value={waitlistForm.email}
                onChange={(event) =>
                  setWaitlistForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="Email address"
                className="h-11 rounded-2xl bg-white dark:bg-card"
              />
              <Input
                value={waitlistForm.phone}
                onChange={(event) =>
                  setWaitlistForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="WhatsApp number"
                className="h-11 rounded-2xl bg-white dark:bg-card"
              />
              <Button
                type="submit"
                className="w-full h-11 rounded-2xl bg-brand hover:bg-brand-600"
                disabled={
                  waitlistMutation.isPending ||
                  !waitlistForm.fullName.trim() ||
                  !waitlistForm.email.trim() ||
                  !waitlistForm.phone.trim()
                }
              >
                {waitlistMutation.isPending ? 'Joining...' : 'Join the waitlist'}
              </Button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20 bg-gray-50 dark:bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-14"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              Pricing
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand mb-3">
              Start with one session. Or save with a bundle.
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground max-w-xl mx-auto">
              No subscriptions. No lock-in. Payments are confirmed offline by admin.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`relative rounded-3xl p-6 sm:p-8 border overflow-hidden ${
                  plan.highlight
                    ? 'bg-brand text-white border-brand shadow-xl shadow-brand/30'
                    : 'bg-white dark:bg-card border-gray-200 dark:border-border'
                }`}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-accent2-500/30 blur-3xl animate-blob" />
                    <div className="absolute -bottom-16 -left-12 w-48 h-48 rounded-full bg-accent2-400/20 blur-2xl animate-blob-slow" />
                  </>
                )}
                {plan.highlight && (
                  <motion.span
                    initial={{ scale: 0, rotate: -10 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 220 }}
                    className="relative inline-block text-xs font-semibold bg-accent2-500 text-brand px-3 py-1 rounded-full mb-4 shadow-md"
                  >
                    Best value
                  </motion.span>
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
                {/* WAITLIST_SWAP: was Link href="/register" with plan.cta label */}
                <Magnetic strength={0.25} className="block w-full">
                  <Link href={WAITLIST_HREF} className="block">
                    <Button
                      className={`shine-sweep relative overflow-hidden w-full rounded-full ${
                        plan.highlight
                          ? 'bg-accent2-500 text-brand hover:bg-accent2-400'
                          : 'bg-brand text-white hover:bg-brand-600'
                      }`}
                    >
                      {WAITLIST_LABEL}
                    </Button>
                  </Link>
                </Magnetic>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 dark:text-muted-foreground mt-6">
            After payment confirmation, admin records the plan in your family dashboard.
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
              Sessions in Classroom
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-border">·</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand" />
              Offline payment confirmation by admin
            </span>
          </div>
        </div>
      </section>

      {/* Testimonials marquee */}
      <section
        id="voices"
        className="relative py-16 sm:py-20 bg-white dark:bg-card overflow-hidden"
      >
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent2-200/40 dark:bg-accent2-500/10 blur-3xl animate-blob-slow" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
              What parents say
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brand mb-3 leading-tight">
              Real families.{' '}
              <span className="animate-gradient-text bg-gradient-to-r from-brand via-accent2-500 to-brand">
                Real progress.
              </span>
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground max-w-md">
              Pulled straight from messages parents send our team after
              sessions, weekly check-ins, and after the first month.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['👩🏾', '👨🏾', '👩🏾‍🦰', '🧑🏾‍🎓'].map((e, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-accent2-400 to-brand flex items-center justify-center text-base border-2 border-white dark:border-card shadow"
                  >
                    {e}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-700 dark:text-foreground/80">
                <span className="font-bold text-brand dark:text-accent2-400">
                  <RollingNumber to={250} suffix="+" />
                </span>{' '}
                families and counting
              </p>
            </div>
          </motion.div>
          <PointerSpotlight className="rounded-3xl">
            <TestimonialsMarquee items={sampleTestimonials} />
          </PointerSpotlight>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-20 bg-gray-50 dark:bg-background">
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
            <h2 className="text-2xl sm:text-3xl font-bold text-brand mb-3">
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
                  Every session is live and 1-on-1 in Classroom. A join button
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
                  A parent pays offline, then the admin team confirms the plan
                  and records the sessions inside the dashboard.
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
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-foreground mb-3">
              Ready to find the right teacher for your{' '}
              <span className="text-brand">child?</span>
            </h2>
            <p className="text-gray-700 dark:text-foreground/90 mb-6 max-w-md">
              Start the intake. We&apos;ll take it from there.
            </p>
            {/* WAITLIST_SWAP: was Create family account → /register */}
            <div className="flex flex-wrap gap-3">
              <Magnetic>
                <Link href={WAITLIST_HREF}>
                  <Button className="shine-sweep relative overflow-hidden bg-brand hover:bg-brand-600 rounded-full px-6 shadow-lg shadow-brand/25">
                    {WAITLIST_LABEL}
                  </Button>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="#pricing">
                  <Button
                    variant="outline"
                    className="rounded-full px-6 border-brand text-brand"
                  >
                    See pricing
                  </Button>
                </Link>
              </Magnetic>
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
          <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
            <Image
              src={logo}
              alt="DoLearn"
              className="w-[150px] h-[28px]"
            />
            <div className="text-center lg:text-left">
              <h3 className="font-semibold text-gray-800 dark:text-foreground text-lg">
                DoLearn updates, once a week
              </h3>
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                New teacher stories, learning tips, and product updates. No spam.
              </p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                newsletterMutation.mutate({ email: newsletterEmail.trim() });
              }}
              className="flex flex-col sm:flex-row items-center bg-white dark:bg-card rounded-3xl p-2 shadow-sm border border-gray-200 dark:border-border"
            >
              <Input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="your@email.com"
                className="flex-1 w-full bg-transparent border-none shadow-none h-10 rounded-2xl"
              />
              <Button
                type="submit"
                className="mt-2 sm:mt-0 sm:ml-2 px-6 py-2 text-sm font-medium bg-brand text-white rounded-2xl hover:bg-brand-600 transition"
                disabled={newsletterMutation.isPending || !newsletterEmail.trim()}
              >
                {newsletterMutation.isPending ? 'Subscribing...' : 'Subscribe'}
              </Button>
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
            {/* <div> */}
              {/* <h4 className="text-white font-semibold mb-4">Teachers</h4> */}
              {/* <ul className="space-y-2 text-sm text-gray-500 dark:text-muted-foreground"> */}
                {/* <li className="hover:text-white cursor-pointer">
                  <a href={`mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'dolearnnn@gmail.com'}`}>
                    Apply to teach
                  </a>
                </li> */}
                {/* WAITLIST_SWAP: was <Link href="/login">Teacher login</Link> */}
                {/* <li className="hover:text-white cursor-pointer">
                  <Link href={WAITLIST_HREF}>{WAITLIST_LABEL}</Link>
                </li> */}
              {/* </ul> */}
            {/* </div> */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-muted-foreground">
                <li className="hover:text-white cursor-pointer">Contact</li>
                <li className="hover:text-white cursor-pointer">Terms</li>
                <li className="hover:text-white cursor-pointer">Privacy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-wrap items-center gap-3">
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              );
            })}
            <a
              href={`https://wa.me/${PHONE_NUMBER.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-800 px-3 py-2 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-6 text-center text-xs text-gray-600 dark:text-muted-foreground">
            DoLearn © {new Date().getFullYear()} · All rights reserved
          </div>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, margin: '-200px' }}
          whileHover={{ scale: 1.1, rotate: -8 }}
          whileTap={{ scale: 0.92 }}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 bg-brand p-3 rounded-full text-white shadow-xl shadow-brand/40 hover:bg-brand-600 transition animate-pulse-ring"
        >
          <ChevronUp size={20} />
        </motion.button>
      </footer>
    </main>
  );
}
