'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex bg-accent2-50 dark:bg-background">
      <aside className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/auth-welcome.png"
          alt="Welcome to DoLearn"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand/30 dark:to-black/60" />
      </aside>
      <section className="flex-1 flex flex-col">
        <header className="w-full px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-brand dark:text-accent2-400 font-bold text-xl"
          >
            DoLearn
          </Link>
          <ThemeToggle />
        </header>
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
