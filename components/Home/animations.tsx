'use client';

import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

// Sticky scroll progress bar
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-gradient-to-r from-brand via-accent2-400 to-accent2-500"
    />
  );
}

// Animated number counter that fires when in view
type CounterProps = {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};
export function AnimatedCounter({
  to,
  duration = 1.6,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: CounterProps) {
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
      setValue(eased * to);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Mouse-aware 3D tilt wrapper
type TiltProps = {
  children: ReactNode;
  className?: string;
  max?: number;
  spotlight?: boolean;
};
export function TiltCard({
  children,
  className,
  max = 10,
  spotlight = true,
}: TiltProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * (max * 2);
    const rx = (0.5 - y) * (max * 2);
    el.style.setProperty('--rx', `${rx}deg`);
    el.style.setProperty('--ry', `${ry}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(
        'tilt-card gradient-border rounded-2xl',
        spotlight && 'spotlight',
        className,
      )}
    >
      {children}
    </div>
  );
}

// Magnetic button — content drifts toward cursor on hover
type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};
export function Magnetic({ children, className, strength = 0.35 }: MagneticProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn('inline-block', className)}
    >
      {children}
    </motion.div>
  );
}

// Word-by-word reveal heading
type WordsProps = {
  text: string;
  className?: string;
  highlight?: Record<string, string>;
  delay?: number;
};
export function WordsReveal({ text, className, highlight, delay = 0 }: WordsProps) {
  const words = text.split(' ');
  return (
    <span className={cn('inline-block', className)}>
      {words.map((w, i) => {
        const cleaned = w.replace(/[.,]/g, '');
        const colorClass = highlight?.[cleaned];
        return (
          <motion.span
            key={`${w}-${i}`}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: delay + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn('inline-block mr-[0.25em]', colorClass)}
          >
            {w}
          </motion.span>
        );
      })}
    </span>
  );
}

// Continuous left-scrolling marquee
type MarqueeProps = {
  items: ReactNode[];
  className?: string;
};
export function Marquee({ items, className }: MarqueeProps) {
  const doubled = [...items, ...items];
  return (
    <div className={cn('marquee-mask overflow-hidden', className)}>
      <div className="flex gap-8 w-max animate-marquee">
        {doubled.map((node, i) => (
          <div key={i} className="flex-shrink-0">
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}

// Floating sparkles for hero backgrounds
type SparkleField = {
  count?: number;
  className?: string;
};
export function SparkleField({ count = 18, className }: SparkleField) {
  const sparks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 4 + Math.random() * 6,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3,
      })),
    [count],
  );
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {sparks.map((s) => (
        <span
          key={s.id}
          className="absolute animate-sparkle text-accent2-400/80"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          } as CSSProperties}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
            <path d="M12 2l1.8 6.4L20 10l-6.2 1.6L12 18l-1.8-6.4L4 10l6.2-1.6z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

// Parallax y-shift driven by scroll progress
export function useParallaxY(progress: MotionValue<number>, distance = 80) {
  return useTransform(progress, [0, 1], [-distance, distance]);
}
