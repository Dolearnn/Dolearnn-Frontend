'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Check, Copy, Crown, Send } from 'lucide-react';
import { useBilling } from '@/components/billing/useBilling';
import { Button } from '@/components/ui/button';
import { getAuthUser } from '@/lib/api/auth-storage';
import {
  getQuizPracticeOverview,
  getQuizRewards,
  listQuizAttempts,
  quizKeys,
} from '@/lib/api/quiz';
import { getLearnerProfile, studentKeys } from '@/lib/api/student';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dolearnn.com';
const WEEK_MS = 7 * 86_400_000;
// The most history the server returns in one page; plenty for one week.
const HISTORY_LIMIT = 50;

function shortDate(date: Date) {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function plural(count: number, word: string, many = `${word}s`) {
  return `${count} ${count === 1 ? word : many}`;
}

/**
 * A short weekly report the learner sends to a parent on WhatsApp. Every line
 * comes from the learner's own results, so a parent sees real progress, not a
 * sales message.
 */
export default function ParentReportCard() {
  const [copied, setCopied] = useState(false);
  const billing = useBilling();
  const [firstName, setFirstName] = useState('');
  useEffect(() => setFirstName(getAuthUser()?.name?.split(' ')[0] ?? ''), []);

  const overview = useQuery({ queryKey: quizKeys.overview(null), queryFn: () => getQuizPracticeOverview(null), staleTime: 30_000 });
  const rewards = useQuery({ queryKey: quizKeys.rewards(null), queryFn: () => getQuizRewards(null), staleTime: 30_000 });
  const profile = useQuery({ queryKey: studentKeys.profile, queryFn: getLearnerProfile, staleTime: 5 * 60_000 });
  const history = useQuery({
    queryKey: [...quizKeys.history, 'week'],
    queryFn: () => listQuizAttempts(HISTORY_LIMIT),
    staleTime: 60_000,
  });

  const report = useMemo(() => {
    if (!overview.data || !history.data) return null;
    const now = Date.now();
    const weekStart = new Date(now - WEEK_MS + 86_400_000);
    const week = history.data.attempts.filter(
      (attempt) =>
        attempt.status === 'SUBMITTED' &&
        attempt.submittedAt &&
        now - new Date(attempt.submittedAt).getTime() < WEEK_MS,
    );
    const questions = week.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
    const correct = week.reduce((sum, attempt) => sum + (attempt.correctCount ?? 0), 0);
    const gains = overview.data.progress.subjects
      .flatMap((subject) => subject.topics)
      .filter((topic) => topic.change === 'improved')
      .sort((a, b) => b.changePoints - a.changePoints)
      .slice(0, 3);
    const focus = overview.data.weak.topics
      .filter((topic) => topic.isWeak)
      .sort((a, b) => a.accuracyPercent - b.accuracyPercent)
      .slice(0, 2);
    const examDays = profile.data?.examDate
      ? Math.max(0, Math.ceil((new Date(profile.data.examDate).getTime() - now) / 86_400_000))
      : null;
    const exam = profile.data?.externalExams.join(' and ') || 'the exam';
    const streak = rewards.data?.streak.current ?? 0;

    const lines = [
      `${firstName ? `${firstName}'s` : 'My'} DoLearnn report, ${shortDate(weekStart)} to ${shortDate(new Date(now))}`,
      '',
      week.length > 0
        ? `• Practised ${plural(week.length, 'time')} this week: ${plural(questions, 'question')}, ${questions > 0 ? Math.round((correct / questions) * 100) : 0}% right`
        : '• No practice yet this week',
      streak > 0 ? `• Practice streak: ${plural(streak, 'day')} in a row` : null,
      gains.length > 0
        ? `• Most improved: ${gains.map((topic) => `${topic.name} ${topic.baselinePercent}% → ${topic.latestPercent}%`).join(', ')}`
        : null,
      focus.length > 0
        ? `• Working on next: ${focus.map((topic) => `${topic.name} (${topic.accuracyPercent}%)`).join(', ')}`
        : null,
      examDays !== null ? `• ${examDays === 0 ? `${exam} is today` : `${plural(examDays, 'day')} to ${exam}`}` : null,
      '',
      `Scores are from practice questions on DoLearnn: ${SITE_URL}`,
    ].filter((line): line is string => line !== null);

    return { text: lines.join('\n'), sessions: week.length, questions };
  }, [overview.data, history.data, rewards.data, profile.data, firstName]);

  if (!report || !billing.data) return null;

  // A Pro feature: free learners see what it is and how to get it.
  if (billing.data.limited) {
    return (
      <section
        aria-labelledby="parent-report-heading"
        className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="parent-report-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
            Weekly report for a parent
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand dark:bg-accent2-500/15 dark:text-accent2-300">
            <Crown className="h-3.5 w-3.5" aria-hidden /> Pro
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-muted-foreground">
          A short WhatsApp report from your real results: what you practised this week, your most improved topics and what
          comes next.{report.sessions > 0 ? ` So far this week: ${plural(report.sessions, 'quiz', 'quizzes')}.` : ''}
        </p>
        <Button asChild className="mt-4 h-12 w-full rounded-2xl text-[15px] sm:w-auto sm:px-6">
          <Link href="/student/plan">See Pro plans</Link>
        </Button>
      </section>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-labelledby="parent-report-heading"
      className="rounded-3xl border border-gray-200/80 bg-white p-4 dark:border-border dark:bg-card sm:p-6"
    >
      <h2 id="parent-report-heading" className="font-display text-lg font-bold text-gray-950 dark:text-foreground">
        Send this week to a parent
      </h2>
      <p className="mt-0.5 text-sm text-gray-500 dark:text-muted-foreground">
        A short report from your real results. Check it, then send it on WhatsApp.
      </p>
      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#e7fbe9] p-4 font-sans text-sm leading-6 text-gray-900 dark:bg-emerald-500/10 dark:text-foreground">
        {report.text}
      </pre>
      <div className="mt-4 grid gap-2 sm:flex">
        <Button asChild className="h-12 rounded-2xl bg-[#25D366] px-6 text-[15px] text-white hover:bg-[#1fb857]">
          <a href={`https://wa.me/?text=${encodeURIComponent(report.text)}`} target="_blank" rel="noreferrer">
            <Send className="mr-2 h-4 w-4" /> Send on WhatsApp
          </a>
        </Button>
        <Button variant="outline" className="h-12 rounded-2xl px-6" onClick={copy}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? 'Copied' : 'Copy report'}
        </Button>
      </div>
    </section>
  );
}
