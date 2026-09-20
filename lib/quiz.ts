import type { ApiCurrentLevel, QuizTutoringPrefill } from '@/lib/api/quiz';
import type { CurrentLevel } from '@/lib/types';

// The intake wizard only accepts this fixed list of subjects.
export type IntakeSubject = 'Maths' | 'English' | 'Science' | 'Other';

export interface IntakePrefill {
  subject: IntakeSubject;
  subjectOther?: string;
  topics: string;
  level: CurrentLevel;
}

const levelFromApi: Record<ApiCurrentLevel, CurrentLevel> = {
  STRUGGLING: 'Struggling',
  AVERAGE: 'Average',
  ABOVE_AVERAGE: 'Above average',
};

const SCIENCE_SUBJECTS = ['physics', 'chemistry', 'biology', 'science'];

// Maps a quiz subject (e.g. "Physics") onto the intake wizard's subject list.
export function intakeSubjectFor(quizSubject: string): {
  subject: IntakeSubject;
  subjectOther?: string;
} {
  const name = quizSubject.trim().toLowerCase();
  if (name.includes('math')) return { subject: 'Maths' };
  if (name.includes('english')) return { subject: 'English' };
  if (SCIENCE_SUBJECTS.some((science) => name.includes(science))) {
    return { subject: 'Science' };
  }
  return { subject: 'Other', subjectOther: quizSubject };
}

export function toIntakePrefill(prefill: QuizTutoringPrefill): IntakePrefill {
  const { subject, subjectOther } = intakeSubjectFor(prefill.subject);
  // Science covers several quiz subjects, so keep the specific one in the topics.
  const topics =
    subject === 'Science'
      ? `${prefill.subject}: ${prefill.specificTopics}`
      : prefill.specificTopics;

  return {
    subject,
    subjectOther,
    topics,
    level: levelFromApi[prefill.currentLevel] ?? 'Average',
  };
}

export function intakeHref(childId: string, prefill: QuizTutoringPrefill) {
  const mapped = toIntakePrefill(prefill);
  const params = new URLSearchParams({
    from: 'quiz',
    subject: mapped.subject,
    topics: mapped.topics,
    level: mapped.level,
  });
  if (mapped.subjectOther) params.set('other', mapped.subjectOther);
  return `/family/children/${childId}/intake?${params.toString()}`;
}

// Families cannot create student profiles themselves (admin does), so a learner
// with no profile is sent to admin with the quiz findings already written out.
export function adminRequestMessage(prefill: QuizTutoringPrefill) {
  return [
    'Hello DoLearn, I would like a tutor.',
    `Subject: ${prefill.subject}`,
    `Weak topics from my practice quiz: ${prefill.specificTopics}`,
  ].join('\n');
}

export function scoreTone(percent: number) {
  if (percent >= 75) return 'good' as const;
  if (percent >= 50) return 'fair' as const;
  return 'weak' as const;
}

export const toneClasses = {
  good: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  fair: {
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    soft: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  weak: {
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    soft: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
} as const;

export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function scoreMessage(percent: number) {
  if (percent >= 75) return 'Excellent work! You are well prepared here.';
  if (percent >= 50) return 'Good effort. A little more practice will lift this.';
  return 'Keep going. Your results show exactly where to focus next.';
}
