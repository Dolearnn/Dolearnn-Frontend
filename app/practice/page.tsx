import type { Metadata } from 'next';
import Link from 'next/link';
import { frauncesPractice as display, manrope as body } from '@/lib/fonts';
import { ArrowLeft } from 'lucide-react';
import GuestPractice from '@/components/practice/GuestPractice';
import styles from './practice.module.css';
import { Logo } from '@/components/brand/Logo';


export const metadata: Metadata = {
  title: 'Try Mathematics practice — DoLearnn',
  description:
    'Try a short external-examination Mathematics warm-up, see the topics to revisit, and choose your next learning move.',
};

export default function PracticePage() {
  return (
    <main className={`${styles.page} ${display.variable} ${body.variable}`}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.wordmark} aria-label="DoLearnn home">
            <Logo size="md" />
          </Link>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to DoLearnn
          </Link>
        </div>
      </header>
      <GuestPractice />
    </main>
  );
}
