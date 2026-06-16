'use client';

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { cn } from '@/lib/utils';

/* ============================================================
   Splash loader — first-paint logo intro that fades away
   ============================================================ */
export function SplashLoader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 2700);
    return () => window.clearTimeout(t);
  }, []);
  if (done) return null;
  return (
    <div className="splash-host" aria-hidden>
      <div className="splash-mark text-center text-white select-none">
        <svg
          viewBox="0 0 220 60"
          className="block w-[220px] h-[60px] mx-auto"
          fill="none"
        >
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="ui-sans-serif, system-ui"
            fontWeight="800"
            fontSize="42"
            letterSpacing="-1.5"
            stroke="#54CD98"
            strokeWidth="1.4"
            fill="white"
            className="draw-on-view"
            style={{ '--draw-len': '900' } as CSSProperties}
          >
            DoLearnn
          </text>
        </svg>
        <div className="mt-3 flex items-center justify-center gap-1 text-accent2-300">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Glitch / scramble text — letters cycle then settle
   ============================================================ */
const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#________';
type GlitchProps = {
  text: string;
  className?: string;
  iterations?: number;
};
export function GlitchText({ text, className, iterations = 18 }: GlitchProps) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement | null>(null);
  const playing = useRef(false);

  const scramble = () => {
    if (playing.current) return;
    playing.current = true;
    let frame = 0;
    const total = iterations;
    const target = text;
    const tick = () => {
      const progress = frame / total;
      const next = target
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          const reveal = i / target.length;
          if (progress >= reveal) return ch;
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        })
        .join('');
      setDisplay(next);
      frame += 1;
      if (frame <= total) {
        setTimeout(tick, 35);
      } else {
        setDisplay(target);
        playing.current = false;
      }
    };
    tick();
  };

  useEffect(() => {
    const t = window.setTimeout(scramble, 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      ref={ref}
      data-text={text}
      className={cn('glitch-host inline-block', className)}
      onMouseEnter={scramble}
    >
      {display}
    </span>
  );
}

/* ============================================================
   Click ripple — global enhancer, attaches to [data-ripple]
   ============================================================ */
export function GlobalRipples() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(
        '[data-ripple], button, a',
      );
      if (!target) return;
      // skip non-interactive anchors with no role
      const cs = window.getComputedStyle(target);
      if (cs.position === 'static') target.style.position = 'relative';
      target.style.overflow = target.style.overflow || 'hidden';
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      const isLight = target.classList.contains('bg-white');
      if (isLight) ripple.style.background = 'rgba(4,66,114,0.28)';
      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  return null;
}

/* ============================================================
   Section dot nav — sticky right rail, morphing pill highlight
   ============================================================ */
type Sections = { id: string; label: string }[];
export function SectionDotNav({ sections }: { sections: Sections }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Page sections"
      className="hidden lg:flex flex-col gap-3 fixed right-6 top-1/2 -translate-y-1/2 z-40 px-2 py-3 rounded-full bg-white/70 dark:bg-card/70 backdrop-blur-md border border-gray-200 dark:border-border shadow-md"
    >
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-label={s.label}
          title={s.label}
          className="group flex items-center justify-center"
        >
          <span
            className={cn('section-dot', active === s.id && 'active')}
          />
        </a>
      ))}
    </nav>
  );
}

/* ============================================================
   Mouse constellation — dots that draw lines toward cursor
   ============================================================ */
type ConstellationProps = {
  density?: number;
  className?: string;
};
export function MouseConstellation({
  density = 36,
  className,
}: ConstellationProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const points = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const mouse = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches
    )
      return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points.current = Array.from({ length: density }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    };

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onLeave = () => {
      mouse.current = null;
    };

    const draw = () => {
      const rect = parent.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      const pts = points.current;
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > rect.width) p.vx *= -1;
        if (p.y < 0 || p.y > rect.height) p.vy *= -1;
      }
      // Lines between near points
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(84, 205, 152, ${0.18 * (1 - dist / 110)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      // Lines from mouse
      if (mouse.current) {
        for (const p of pts) {
          const dx = mouse.current.x - p.x;
          const dy = mouse.current.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180) {
            ctx.strokeStyle = `rgba(4, 66, 114, ${0.5 * (1 - dist / 180)})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(mouse.current.x, mouse.current.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }
      // Dots
      ctx.fillStyle = 'rgba(4, 66, 114, 0.55)';
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    parent.addEventListener('mousemove', onMove);
    parent.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      parent.removeEventListener('mousemove', onMove);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn('absolute inset-0 pointer-events-none', className)}
    />
  );
}

/* ============================================================
   Animated chat preview — typed messages between Parent/Team/Teacher
   ============================================================ */
type ChatLine = {
  from: 'parent' | 'team' | 'teacher';
  name: string;
  emoji: string;
  text: string;
  delay: number;
};
const chatLines: ChatLine[] = [
  {
    from: 'parent',
    name: 'Funmi',
    emoji: '👩🏾',
    text: "Hi! Looking for a Maths teacher for my 11yo. He's anxious about exams.",
    delay: 0.3,
  },
  {
    from: 'team',
    name: 'DoLearn team',
    emoji: '🛟',
    text: 'Got it. Sending you Mr Tobi — he specialises in exam-anxious learners.',
    delay: 1.6,
  },
  {
    from: 'teacher',
    name: 'Mr Tobi',
    emoji: '👨🏾‍🏫',
    text: "Hi Funmi! I'd love to start with a low-pressure session to gauge his baseline.",
    delay: 3.2,
  },
  {
    from: 'parent',
    name: 'Funmi',
    emoji: '👩🏾',
    text: "Perfect. Let's go.",
    delay: 5.0,
  },
];
export function ChatPreview() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState<ChatLine['from'] | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            chatLines.forEach((line, i) => {
              window.setTimeout(() => setTyping(line.from), line.delay * 1000);
              window.setTimeout(
                () => {
                  setVisibleCount(i + 1);
                  setTyping(null);
                },
                line.delay * 1000 + 900,
              );
            });
          }
        });
      },
      { threshold: 0.3 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const sideFor = (from: ChatLine['from']) =>
    from === 'parent' ? 'left' : from === 'teacher' ? 'right' : 'center';

  return (
    <div
      ref={ref}
      className="relative max-w-2xl mx-auto bg-white dark:bg-card border border-gray-200 dark:border-border rounded-3xl p-6 shadow-xl space-y-3 min-h-[440px]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            Pairing thread · live
          </p>
        </div>
        <div className="relative flex items-center gap-1.5 text-[11px] text-accent2-500 font-semibold">
          <span className="relative w-2 h-2 rounded-full bg-accent2-500">
            <span className="absolute inset-0 rounded-full bg-accent2-500 animate-ping" />
          </span>
          encrypted
        </div>
      </div>

      {chatLines.slice(0, visibleCount).map((line, i) => {
        const side = sideFor(line.from);
        const align =
          side === 'left'
            ? 'justify-start'
            : side === 'right'
              ? 'justify-end'
              : 'justify-center';
        const bubble =
          side === 'left'
            ? 'bg-gray-100 dark:bg-secondary text-gray-900 dark:text-foreground rounded-tl-sm'
            : side === 'right'
              ? 'bg-brand text-white rounded-tr-sm'
              : 'bg-accent2-500/15 text-brand dark:text-accent2-300 rounded-md';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn('flex items-end gap-2', align)}
          >
            {side !== 'right' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent2-400 to-brand flex items-center justify-center text-base flex-shrink-0">
                {line.emoji}
              </div>
            )}
            <div className={cn('max-w-[78%] px-4 py-2 rounded-2xl text-sm shadow-sm', bubble)}>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">
                {line.name}
              </p>
              <p>{line.text}</p>
            </div>
            {side === 'right' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-accent2-400 flex items-center justify-center text-base flex-shrink-0">
                {line.emoji}
              </div>
            )}
          </motion.div>
        );
      })}

      {typing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'flex items-center gap-2',
            sideFor(typing) === 'right' ? 'justify-end' : 'justify-start',
          )}
        >
          <div className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-secondary text-gray-500 flex items-center gap-1">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================
   Pinned horizontal showcase — scroll vertically, cards travel sideways
   ============================================================ */
type ShowcaseItem = {
  num: string;
  title: string;
  body: string;
  emoji: string;
};
type ShowcaseProps = {
  items: ShowcaseItem[];
};
export function HorizontalShowcase({ items }: ShowcaseProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  // travel from 0 to -((items-1) * 100%/items) effectively
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ['0%', `-${(items.length - 1) * (100 / items.length)}%`],
  );
  const xs = useSpring(x, { stiffness: 80, damping: 22, mass: 0.5 });

  return (
    <section
      ref={ref}
      className="relative bg-gradient-to-br from-brand to-brand-700 text-white overflow-hidden"
      style={{ height: `${items.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="max-w-7xl w-full mx-auto px-6 mb-8 lg:mb-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent2-400 mb-2">
            How it works
          </p>
          <h2 className="text-3xl lg:text-5xl font-bold leading-tight max-w-2xl">
            Four steps. One team. <span className="text-accent2-400">Zero guesswork.</span>
          </h2>
          <p className="text-white/70 mt-3">
            Scroll to walk through the journey, or jump straight to{' '}
            <a href="#waitlist" className="underline underline-offset-4">
              the waitlist
            </a>
            .
          </p>
        </div>
        <motion.div
          style={{ x: xs, width: `${items.length * 100}%` }}
          className="h-track flex"
        >
          {items.map((it, i) => (
            <div
              key={it.title}
              className="flex-shrink-0 px-6 lg:px-12 flex items-center"
              style={{ width: `${100 / items.length}%` }}
            >
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto w-full">
                <div>
                  <div className="text-[120px] lg:text-[180px] leading-none font-black text-accent2-400/15 select-none">
                    {it.num}
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent2-400/20 text-accent2-300 text-3xl mb-6">
                    {it.emoji}
                  </div>
                  <h3 className="text-2xl lg:text-4xl font-bold mb-3">
                    {it.title}
                  </h3>
                  <p className="text-white/80 max-w-md text-base lg:text-lg leading-relaxed">
                    {it.body}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    {items.map((_, j) => (
                      <span
                        key={j}
                        className={cn(
                          'h-1 rounded-full transition-all',
                          j === i
                            ? 'w-10 bg-accent2-400'
                            : 'w-3 bg-white/20',
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   Vertical journey timeline — gradient line scrubs with scroll
   ============================================================ */
type JourneyStep = {
  num: string;
  title: string;
  body: string;
  emoji: string;
};
type JourneyProps = {
  steps: JourneyStep[];
};
export function JourneyTimeline({ steps }: JourneyProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 70%', 'end 30%'],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    mass: 0.4,
  });
  const lineHeight = useTransform(progress, [0, 1], ['0%', '100%']);
  const dotTop = useTransform(progress, [0, 1], ['0%', '100%']);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative py-24 bg-white dark:bg-card overflow-hidden"
    >
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-accent2-200/40 dark:bg-accent2-500/10 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand/10 blur-3xl animate-blob-slow" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-accent2-500 mb-2">
            How it works
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-brand mb-3 leading-tight">
            From intake to your first session in under 24 hours.
          </h2>
          <p className="text-gray-600 dark:text-muted-foreground">
            Four steps. One team owns every one of them.
          </p>
        </motion.div>

        <div className="relative pl-12 sm:pl-20 lg:pl-0">
          {/* Vertical track */}
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-5 sm:left-10 lg:left-1/2 lg:-translate-x-1/2 w-px"
          >
            {/* Ghost line */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent dark:from-border dark:via-border" />
            {/* Drawn line */}
            <motion.div
              style={{ height: lineHeight }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-brand via-accent2-500 to-accent2-400 shadow-[0_0_10px_rgba(84,205,152,0.6)]"
            />
            {/* Traveling glow dot */}
            <motion.div
              style={{ top: dotTop }}
              className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2"
            >
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 rounded-full bg-accent2-500 shadow-[0_0_18px_rgba(84,205,152,0.9)]" />
                <div className="absolute inset-0 rounded-full bg-accent2-400 animate-ping" />
              </div>
            </motion.div>
          </div>

          {/* Steps */}
          <div className="space-y-12 lg:space-y-16">
            {steps.map((step, i) => (
              <JourneyCard
                key={step.title}
                step={step}
                index={i}
                side={i % 2 === 0 ? 'left' : 'right'}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyCard({
  step,
  index,
  side,
}: {
  step: JourneyStep;
  index: number;
  side: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative grid lg:grid-cols-2 lg:gap-12 items-center',
      )}
    >
      {/* Milestone bullet on the track */}
      <div
        aria-hidden
        className="absolute left-5 sm:left-10 lg:left-1/2 lg:-translate-x-1/2 -translate-x-1/2 top-6 z-10"
      >
        <motion.div
          whileHover={{ scale: 1.15, rotate: 8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
          className="relative w-10 h-10 rounded-full bg-white dark:bg-card border-2 border-accent2-400 flex items-center justify-center text-base shadow-lg"
        >
          {step.emoji}
          <span className="absolute -inset-2 rounded-full border-2 border-accent2-300/50 animate-pulse-ring" />
        </motion.div>
      </div>

      {/* Card — alternates side on desktop, always right on mobile */}
      <div
        className={cn(
          'lg:col-span-1',
          side === 'left'
            ? 'lg:col-start-1 lg:text-right lg:pr-12'
            : 'lg:col-start-2 lg:text-left lg:pl-12',
        )}
      >
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className={cn(
            'relative inline-block rounded-3xl border border-gray-200 dark:border-border bg-white dark:bg-card p-6 shadow-sm hover:shadow-2xl transition-shadow max-w-md',
          )}
        >
          <div
            className={cn(
              'flex items-center gap-3 mb-3',
              side === 'left' && 'lg:flex-row-reverse',
            )}
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-accent2-500">
              Step {step.num}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-accent2-300/60 to-transparent" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">
            {step.body}
          </p>
        </motion.div>
      </div>

      {/* Spacer on the opposite side to balance the grid on desktop */}
      <div className="hidden lg:block" />
    </motion.div>
  );
}

export const journeySteps: JourneyStep[] = [
  {
    num: '01',
    emoji: '📝',
    title: 'Tell us about your child',
    body: 'A short intake — subject, goal, level, availability, budget. Three minutes, once per child.',
  },
  {
    num: '02',
    emoji: '🤝',
    title: 'We hand-pick the right teacher',
    body: 'Our team reads every intake. We pair on goals, schedule, and learning style — usually within 24 hours.',
  },
  {
    num: '03',
    emoji: '🎥',
    title: 'Join live in Classroom',
    body: 'A join button appears in your dashboard before each session. No setup, no extra apps.',
  },
  {
    num: '04',
    emoji: '📈',
    title: 'See progress every session',
    body: 'Teacher notes after every lesson, plus a monthly PDF report. You stop wondering if it’s working.',
  },
];

/* ============================================================
   Konami code party mode — Easter egg
   ============================================================ */
const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];
export function KonamiParty() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      buffer.push(k);
      if (buffer.length > KONAMI.length) buffer.shift();
      if (KONAMI.every((expected, i) => expected === buffer[i])) {
        document.body.classList.toggle('party-mode');
        // Fire confetti from center
        spawnConfetti();
        buffer = [];
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
}
function spawnConfetti() {
  const colors = ['#54CD98', '#044272', '#2FB87F', '#F4D35E', '#EF6F6C'];
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.top = '50%';
  host.style.left = '50%';
  host.style.zIndex = '80';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 400;
    piece.style.setProperty('--cdx', `${Math.cos(angle) * dist}px`);
    piece.style.setProperty('--cdy', `${Math.sin(angle) * dist}px`);
    piece.style.setProperty('--crot', `${Math.random() * 720 - 360}deg`);
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    host.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
  setTimeout(() => host.remove(), 2200);
}

/* ============================================================
   Sample showcase items
   ============================================================ */
export const showcaseSteps: ShowcaseItem[] = [
  {
    num: '01',
    emoji: '📝',
    title: 'Tell us about your child',
    body: 'A short intake — subject, goal, level, availability, and budget. Three minutes max, and you only do this once per child.',
  },
  {
    num: '02',
    emoji: '🤝',
    title: 'We hand-pick the right teacher',
    body: 'Our team reads every intake. We pair on goals, schedule, and learning style — not just the subject name. Usually under 24 hours.',
  },
  {
    num: '03',
    emoji: '🎥',
    title: 'Join live in Classroom',
    body: 'A join button appears in your dashboard before each session. No setup, no extra apps. Just live 1-on-1 with the right person.',
  },
  {
    num: '04',
    emoji: '📈',
    title: 'See progress every session',
    body: 'Teacher notes after every lesson, plus a monthly PDF report. You stop wondering if it’s working — you can see it.',
  },
];

export const navSections: Sections = [
  { id: 'top', label: 'Top' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'pairing', label: 'Pairing' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'parents', label: 'For parents' },
  { id: 'students', label: 'For students' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'voices', label: 'Voices' },
  { id: 'faq', label: 'FAQ' },
];
