'use client';

import { motion, useInView, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

/* ============================================================
   Cursor glow — blends behind everything, follows the pointer
   ============================================================ */
export function CursorGlow() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setEnabled(true);

    const el = document.createElement('div');
    el.className = 'cursor-glow';
    el.style.opacity = '0';
    document.body.appendChild(el);

    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;

    const move = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = '1';
    };
    const leave = () => {
      el.style.opacity = '0';
    };
    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.setProperty('--cx', `${cx}px`);
      el.style.setProperty('--cy', `${cy}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseleave', leave);
    tick();

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
      el.remove();
    };
  }, []);

  return enabled ? null : null;
}

/* ============================================================
   Aurora backdrop — animated mesh of color blobs
   ============================================================ */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <div className="absolute -top-1/3 -left-1/4 w-[60%] h-[80%] rounded-full bg-accent2-400/40 blur-[120px] aurora-blob-1" />
      <div className="absolute top-1/4 -right-1/4 w-[55%] h-[70%] rounded-full bg-brand/30 blur-[120px] aurora-blob-2" />
      <div className="absolute -bottom-1/3 left-1/4 w-[55%] h-[70%] rounded-full bg-accent2-300/35 blur-[110px] aurora-blob-3" />
    </div>
  );
}

/* ============================================================
   Orbiting teacher avatars (or icons) around a center node
   ============================================================ */
type OrbitItem = {
  label: string;
  emoji?: string;
  color?: string;
};
type OrbitProps = {
  items: OrbitItem[];
  radiusPct?: number;
  maxRadius?: number;
  speed?: number;
  reverse?: boolean;
  className?: string;
};
export function OrbitAvatars({
  items,
  radiusPct = 0.45,
  maxRadius = 200,
  speed = 22,
  reverse = false,
  className,
}: OrbitProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [radius, setRadius] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const r = Math.min(Math.min(w, h) * radiusPct, maxRadius);
      setRadius(Math.max(0, r));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [radiusPct, maxRadius]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        'relative pointer-events-none w-full h-full max-w-full max-h-full',
        className,
      )}
    >
      {radius > 0 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-accent2-400/40"
          style={{ width: radius * 2, height: radius * 2 }}
        />
      )}
      {radius > 0 &&
        items.map((item, i) => (
          <div
            key={item.label}
            className={cn('orbit-item', reverse && 'orbit-reverse')}
            style={
              {
                '--orbit-r': `${radius}px`,
                '--orbit-speed': `${speed}s`,
                '--orbit-delay': `${(-speed / items.length) * i}s`,
              } as CSSProperties
            }
          >
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg shadow-lg"
              style={{
                background:
                  item.color ?? 'linear-gradient(135deg, #54CD98, #044272)',
                color: 'white',
              }}
              title={item.label}
            >
              {item.emoji ?? item.label[0]}
            </div>
          </div>
        ))}
      <span className="sr-only">{items.map((i) => i.label).join(', ')}</span>
    </div>
  );
}

/* ============================================================
   Live matching visualizer — animated SVG curves with pulses
   ============================================================ */
export function MatchingVisualizer() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div ref={ref} className="w-full max-w-4xl mx-auto" aria-hidden>
      {/* Mobile: stacked vertical flow */}
      <div className="md:hidden flex flex-col items-center gap-4 py-6">
        <NodeBubbleStacked
          label="Parent"
          sub="fills intake"
          accent="brand"
          delay={0.1}
        />
        <ConnectingLine direction="down" inView={inView} delay={0.3} />
        <NodeBubbleStacked
          label="DoLearn"
          sub="hand-picks match"
          accent="center"
          delay={0.4}
          big
        />
        <ConnectingLine direction="down" inView={inView} delay={0.7} />
        <NodeBubbleStacked
          label="Teacher"
          sub="meets student"
          accent="accent"
          delay={0.8}
        />
      </div>

      {/* md+: animated SVG curve diagram */}
      <div className="hidden md:block relative h-[300px] lg:h-[360px]">
      <svg
        viewBox="0 0 800 360"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="link-1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#044272" stopOpacity="0.0" />
            <stop offset="20%" stopColor="#044272" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#54CD98" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#54CD98" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="link-2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#54CD98" stopOpacity="0.0" />
            <stop offset="20%" stopColor="#54CD98" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#044272" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#044272" stopOpacity="0.0" />
          </linearGradient>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            <feColorMatrix
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -8"
            />
          </filter>
        </defs>

        {/* Curve paths */}
        <path
          id="curve-1"
          d="M 110 180 C 250 60, 400 60, 400 180"
          stroke="url(#link-1)"
          strokeWidth="2.5"
          fill="none"
          className={inView ? 'draw-on-view' : ''}
          style={{ '--draw-len': '500' } as CSSProperties}
        />
        <path
          id="curve-2"
          d="M 400 180 C 400 300, 550 300, 690 180"
          stroke="url(#link-2)"
          strokeWidth="2.5"
          fill="none"
          className={inView ? 'draw-on-view' : ''}
          style={{ '--draw-len': '500', animationDelay: '0.6s' } as CSSProperties}
        />

        {/* Static dotted secondary route */}
        <path
          d="M 110 220 C 260 320, 540 320, 690 220"
          stroke="#54CD98"
          strokeOpacity="0.25"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 8"
        />
      </svg>

      {/* Traveling pulses on the curves */}
      {inView && (
        <>
          <span
            className="absolute w-3 h-3 rounded-full bg-accent2-400 shadow-[0_0_18px_rgba(84,205,152,0.9)] pulse-travel"
            style={{
              offsetPath: 'path("M 110 180 C 250 60, 400 60, 400 180")',
              animationDelay: '1s',
            } as CSSProperties}
          />
          <span
            className="absolute w-3 h-3 rounded-full bg-brand shadow-[0_0_18px_rgba(4,66,114,0.9)] pulse-travel"
            style={{
              offsetPath: 'path("M 400 180 C 400 300, 550 300, 690 180")',
              animationDelay: '1.6s',
            } as CSSProperties}
          />
          <span
            className="absolute w-2 h-2 rounded-full bg-accent2-300 shadow-[0_0_12px_rgba(84,205,152,0.7)] pulse-travel"
            style={{
              offsetPath: 'path("M 110 180 C 250 60, 400 60, 400 180")',
              animationDelay: '2.2s',
            } as CSSProperties}
          />
        </>
      )}

      {/* Three nodes overlaid on the SVG */}
      <NodeBubble
        label="Parent"
        sub="fills intake"
        accent="brand"
        style={{ left: '6%', top: '40%' }}
        delay={0.1}
      />
      <NodeBubble
        label="DoLearn"
        sub="hand-picks match"
        accent="center"
        style={{ left: '46%', top: '40%' }}
        delay={0.4}
        big
      />
      <NodeBubble
        label="Teacher"
        sub="meets student"
        accent="accent"
        style={{ left: '82%', top: '40%' }}
        delay={0.8}
      />
      </div>
    </div>
  );
}

function NodeBubbleStacked({
  label,
  sub,
  accent,
  delay = 0,
  big = false,
}: {
  label: string;
  sub: string;
  accent: 'brand' | 'accent' | 'center';
  delay?: number;
  big?: boolean;
}) {
  const palette =
    accent === 'brand'
      ? 'bg-white border-brand/30 text-brand'
      : accent === 'accent'
        ? 'bg-white border-accent2-400/50 text-brand'
        : 'bg-brand text-white border-brand';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 16 }}
      className={cn(
        'relative rounded-2xl border shadow-xl px-4 py-3 text-center min-w-[180px] backdrop-blur-sm',
        palette,
        big && 'animate-pulse-ring',
      )}
    >
      <p className="text-sm font-bold leading-tight">{label}</p>
      <p
        className={cn(
          'text-[11px] leading-tight mt-0.5',
          accent === 'center' ? 'text-white/80' : 'text-gray-500',
        )}
      >
        {sub}
      </p>
    </motion.div>
  );
}

function ConnectingLine({
  inView,
  delay = 0,
}: {
  direction?: 'down';
  inView: boolean;
  delay?: number;
}) {
  return (
    <div
      aria-hidden
      className="relative h-12 w-px bg-gradient-to-b from-brand/40 via-accent2-400/60 to-accent2-400/40 overflow-hidden"
    >
      {inView && (
        <span
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent2-400 shadow-[0_0_10px_rgba(84,205,152,0.9)]"
          style={{
            animation: `pulse-down 2.6s linear ${delay}s infinite`,
          }}
        />
      )}
      <style>{`
        @keyframes pulse-down {
          0%   { top: -10%;  opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 110%;  opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function NodeBubble({
  label,
  sub,
  accent,
  style,
  delay = 0,
  big = false,
}: {
  label: string;
  sub: string;
  accent: 'brand' | 'accent' | 'center';
  style: CSSProperties;
  delay?: number;
  big?: boolean;
}) {
  const palette =
    accent === 'brand'
      ? 'bg-white border-brand/30 text-brand'
      : accent === 'accent'
        ? 'bg-white border-accent2-400/50 text-brand'
        : 'bg-brand text-white border-brand';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 16 }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={style}
    >
      <div
        className={cn(
          'relative rounded-2xl border shadow-xl px-4 py-3 backdrop-blur-sm',
          palette,
          big && 'animate-pulse-ring',
        )}
      >
        <p className="text-sm font-bold leading-tight">{label}</p>
        <p
          className={cn(
            'text-[11px] leading-tight mt-0.5',
            accent === 'center' ? 'text-white/80' : 'text-gray-500',
          )}
        >
          {sub}
        </p>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Testimonials marquee — two columns, opposite directions
   ============================================================ */
type Testimonial = { name: string; role: string; quote: string; emoji: string };
type TestimonialsMarqueeProps = {
  items: Testimonial[];
};
export function TestimonialsMarquee({ items }: TestimonialsMarqueeProps) {
  const colA = items.filter((_, i) => i % 2 === 0);
  const colB = items.filter((_, i) => i % 2 === 1);
  return (
    <div className="grid sm:grid-cols-2 gap-4 marquee-mask-y h-[520px] overflow-hidden">
      <div className="relative">
        <div className="flex flex-col gap-4 animate-marquee-up">
          {[...colA, ...colA].map((t, i) => (
            <TestimonialCard key={`a-${i}`} t={t} />
          ))}
        </div>
      </div>
      <div className="relative hidden sm:block">
        <div className="flex flex-col gap-4 animate-marquee-down">
          {[...colB, ...colB].map((t, i) => (
            <TestimonialCard key={`b-${i}`} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="testimonial-tilt rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5 shadow-sm hover:shadow-2xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent2-400 to-brand flex items-center justify-center text-lg">
          {t.emoji}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground">
            {t.name}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-muted-foreground">
            {t.role}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-foreground/90 leading-relaxed">
        &ldquo;{t.quote}&rdquo;
      </p>
    </div>
  );
}

/* ============================================================
   Rolling digit ticker — counts up by sliding stacked digits
   ============================================================ */
type RollingNumberProps = {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};
export function RollingNumber({
  to,
  duration = 1.6,
  prefix = '',
  suffix = '',
  className,
}: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  const digits = String(value).padStart(String(to).length, '0').split('');

  return (
    <span ref={ref} className={cn('inline-flex items-baseline tabular-nums', className)}>
      {prefix && <span>{prefix}</span>}
      {digits.map((d, i) => (
        <Digit key={i} digit={Number.parseInt(d, 10)} />
      ))}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
function Digit({ digit }: { digit: number }) {
  return (
    <span className="digit-roll">
      <span
        className="digit-roll-inner"
        style={{ transform: `translateY(-${digit}em)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i}>{i}</span>
        ))}
      </span>
    </span>
  );
}

/* ============================================================
   Wave divider — animated SVG wave at top/bottom of a section
   ============================================================ */
export function WaveDivider({
  flip = false,
  fill = '#fff',
  className,
}: {
  flip?: boolean;
  fill?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-0 right-0 overflow-hidden leading-none',
        flip ? 'top-0' : 'bottom-0',
        className,
      )}
      style={{ transform: flip ? 'rotate(180deg)' : undefined }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block w-[200%] h-[100px] wave-shift"
      >
        <path
          d="M0,80 C240,140 480,20 720,60 C960,100 1200,140 1440,60 L1440,120 L0,120 Z M1440,80 C1680,140 1920,20 2160,60 C2400,100 2640,140 2880,60 L2880,120 L1440,120 Z"
          fill={fill}
          opacity="0.85"
        />
      </svg>
    </div>
  );
}

/* ============================================================
   Confetti burst — fires from button on click
   ============================================================ */
type ConfettiButtonProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};
export function ConfettiBurst({
  children,
  className,
  onClick,
}: ConfettiButtonProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  const fire = () => {
    onClick?.();
    const host = ref.current;
    if (!host) return;
    const colors = ['#54CD98', '#044272', '#2FB87F', '#F4D35E', '#EF6F6C'];
    for (let i = 0; i < 22; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      const angle = Math.random() * Math.PI - Math.PI / 2;
      const dist = 80 + Math.random() * 140;
      piece.style.setProperty('--cdx', `${Math.cos(angle) * dist}px`);
      piece.style.setProperty('--cdy', `${Math.sin(angle) * dist}px`);
      piece.style.setProperty('--crot', `${Math.random() * 720 - 360}deg`);
      piece.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.left = '50%';
      piece.style.top = '50%';
      piece.style.transform = 'translate(-50%, -50%)';
      piece.addEventListener('animationend', () => piece.remove());
      host.appendChild(piece);
    }
  };

  return (
    <span
      ref={ref}
      onClick={fire}
      className={cn('relative inline-block', className)}
    >
      {children}
    </span>
  );
}

/* ============================================================
   Mouse-tracking spotlight wrapper
   ============================================================ */
export function PointerSpotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const sx = useSpring(mx, { stiffness: 150, damping: 20 });
  const sy = useSpring(my, { stiffness: 150, damping: 20 });
  const bg = useMotionTemplate`radial-gradient(360px circle at ${sx}% ${sy}%, rgba(84,205,152,0.18), transparent 45%)`;
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
      className={cn('relative overflow-hidden', className)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: bg }}
      />
      {children}
    </div>
  );
}

/* ============================================================
   Drawn underline — SVG squiggle that draws under headings
   ============================================================ */
export function DrawnUnderline({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 220 14"
      className={cn('block w-full h-auto', className)}
    >
      <path
        d="M2 8 C 40 14, 80 2, 120 8 S 200 14, 218 6"
        stroke="#54CD98"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        className={inView ? 'draw-on-view' : ''}
        style={{ '--draw-len': '260' } as CSSProperties}
      />
    </svg>
  );
}

/* ============================================================
   Useful test data
   ============================================================ */
export const sampleTestimonials: Testimonial[] = [
  {
    name: 'Adaeze O.',
    role: 'Mum of 2',
    quote:
      "Within 24 hours we were paired with a Maths teacher who totally got my son. He looks forward to sessions now.",
    emoji: '👩🏾',
  },
  {
    name: 'Emeka K.',
    role: 'Dad in Lagos',
    quote:
      "I was tired of scrolling profiles. They just sent us the right person. First session was already on point.",
    emoji: '👨🏾',
  },
  {
    name: 'Funmi A.',
    role: 'Mum of 3',
    quote:
      'The progress reports are gold. I actually know what my daughter is improving on now.',
    emoji: '👩🏾‍🦱',
  },
  {
    name: 'Tomi B.',
    role: 'Teen learner, 14',
    quote:
      "My streak is at 22 sessions. The dashboard is honestly fun, the badges keep me going.",
    emoji: '🧑🏾‍🎓',
  },
  {
    name: 'Chiamaka N.',
    role: 'Mum of twins',
    quote:
      "One account, two kids, two teachers, no chaos. Family Hub is the killer feature.",
    emoji: '👩🏾‍🦰',
  },
  {
    name: 'David O.',
    role: 'Dad, SAT prep',
    quote:
      "He went from a 1180 to a 1390. Worth every naira. The pairing made the difference.",
    emoji: '👨🏿',
  },
];

export const orbitTeachers: OrbitItem[] = [
  { label: 'Maths', emoji: '📐', color: 'linear-gradient(135deg, #044272, #235F9B)' },
  { label: 'English', emoji: '📚', color: 'linear-gradient(135deg, #54CD98, #2FB87F)' },
  { label: 'Coding', emoji: '💻', color: 'linear-gradient(135deg, #235F9B, #54CD98)' },
  { label: 'Music', emoji: '🎵', color: 'linear-gradient(135deg, #F4D35E, #EF6F6C)' },
  { label: 'Science', emoji: '🧪', color: 'linear-gradient(135deg, #2FB87F, #044272)' },
  { label: 'French', emoji: '🇫🇷', color: 'linear-gradient(135deg, #5987B4, #75D6A9)' },
];
