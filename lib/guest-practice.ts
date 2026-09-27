import type { GuestBaseline } from '@/lib/api/student';

const STORAGE_KEY = 'dolearn.guest-practice.v1';
const ANSWERS: Record<string, { answer: number; topic: string }> = {
  'algebra-equation': { answer: 1, topic: 'Algebra' },
  'number-standard-form': { answer: 1, topic: 'Number & Numeration' },
  'geometry-hexagon': { answer: 2, topic: 'Geometry' },
  'trigonometry-values': { answer: 1, topic: 'Trigonometry' },
  'probability-die': { answer: 2, topic: 'Probability' },
  'calculus-differentiate': { answer: 0, topic: 'Calculus' },
};

export function readGuestBaseline(): GuestBaseline | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as {
      answers?: Record<string, number>;
      submitted?: boolean;
    };
    if (!saved.submitted || !saved.answers) return null;

    const entries = Object.entries(ANSWERS);
    const correct = entries.filter(([id, item]) => saved.answers?.[id] === item.answer).length;
    return {
      correct,
      total: entries.length,
      score: Math.round((correct / entries.length) * 100),
      weakTopics: entries
        .filter(([id, item]) => saved.answers?.[id] !== item.answer)
        .map(([, item]) => item.topic),
      completedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
