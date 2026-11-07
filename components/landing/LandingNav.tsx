'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { subscribeNewsletter } from '@/lib/api/public';
import { cn } from '@/lib/utils';

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#exams', label: 'Exams' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

/** Landing page header: sticky, with a simple mobile menu. */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-colors',
        scrolled || open ? 'border-b border-slate-200/80 bg-white/85 backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="DoLearnn home">
          <Logo size="md" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-brand">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-brand">
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#022a49]"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-slate-200 bg-white px-4 pb-6 pt-2 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-b border-slate-100 py-3 text-base font-medium text-slate-700"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/login" className="rounded-full border border-slate-300 py-2.5 text-center text-sm font-semibold text-slate-700">
              Log in
            </Link>
            <Link href="/register" className="rounded-full bg-brand py-2.5 text-center text-sm font-semibold text-white">
              Start free
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

/** Footer newsletter sign-up. */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  return (
    <form
      className="mt-3 flex max-w-sm gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!email.trim()) return;
        setStatus('pending');
        try {
          await subscribeNewsletter({ email: email.trim() });
          setStatus('success');
          setEmail('');
        } catch {
          setStatus('error');
        }
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-accent2-400 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === 'pending'}
        className="rounded-full bg-accent2-400 px-4 py-2 text-sm font-semibold text-[#022a49] transition hover:bg-accent2-300 disabled:opacity-60"
      >
        {status === 'success' ? 'Subscribed' : status === 'pending' ? '…' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <span role="alert" className="sr-only">
          Could not subscribe. Please try again.
        </span>
      )}
    </form>
  );
}
