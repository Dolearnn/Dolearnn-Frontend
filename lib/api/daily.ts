import { apiFetch } from '@/lib/api/client';
import { getAuthToken } from '@/lib/api/auth-storage';

export interface DailyQuestion {
  id: string;
  index: number;
  total: number;
  category: 'english' | 'maths' | 'history';
  text: string;
  options: Array<{ id: string; text: string }>;
  secondsLeft: number;
}

export interface DailyResult {
  score: number;
  total: number;
  seconds: number;
  flagged: boolean;
  ranked: boolean;
  rank: number;
  players: number;
  aheadPercent: number;
  review: Array<{
    id: string;
    category: string;
    text: string;
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
    explanation: string | null;
    yourAnswer: string | null;
  }>;
}

export type DailyState = {
  day: string;
  number: number;
  total: number;
  guestKey: string | null;
} & (
  | { status: 'new' }
  | { status: 'playing'; question: DailyQuestion }
  | { status: 'finished'; result: DailyResult }
);

export interface DailyBoardRow {
  rank: number;
  name: string;
  score: number;
  seconds: number;
  days: number;
  isMe: boolean;
}

export interface DailyBoard {
  players: number;
  top: DailyBoardRow[];
  me: DailyBoardRow | null;
}

export interface DailyLeaderboard {
  today: DailyBoard;
  week: DailyBoard;
  yesterday: DailyBoardRow[];
  hidden: boolean;
  canHide: boolean;
}

export const dailyKeys = {
  state: ['daily', 'state'] as const,
  leaderboard: ['daily', 'leaderboard'] as const,
};

const GUEST_KEY = 'dolearn.daily.guest';

function readGuestKey() {
  try {
    return localStorage.getItem(GUEST_KEY);
  } catch {
    return null;
  }
}

/** Remembers a visitor's key so they can resume, and claim the score after signing up. */
export function rememberGuestKey(guestKey: string | null) {
  if (!guestKey) return;
  try {
    localStorage.setItem(GUEST_KEY, guestKey);
  } catch {
    // Private browsing: the quiz still works, it just can't be resumed.
  }
}

function forgetGuestKey() {
  try {
    localStorage.removeItem(GUEST_KEY);
  } catch {
    // Nothing to clean up.
  }
}

export function getDailyState() {
  const key = readGuestKey();
  return apiFetch<DailyState>(`/daily${key ? `?guestKey=${encodeURIComponent(key)}` : ''}`);
}

export function startDaily() {
  return apiFetch<DailyState>('/daily/start', {
    method: 'POST',
    body: JSON.stringify({ guestKey: readGuestKey() ?? undefined }),
  });
}

export function answerDaily(questionId: string, optionId: string | null) {
  return apiFetch<DailyState>('/daily/answer', {
    method: 'POST',
    body: JSON.stringify({ guestKey: readGuestKey() ?? undefined, questionId, optionId }),
  });
}

export function getDailyLeaderboard() {
  return apiFetch<DailyLeaderboard>('/daily/leaderboard');
}

/** After signing up or logging in: moves today's guest score onto the account. */
export async function claimGuestDaily() {
  const key = readGuestKey();
  if (!key || !getAuthToken()) return;
  try {
    await apiFetch('/daily/claim', { method: 'POST', body: JSON.stringify({ guestKey: key }) });
    forgetGuestKey();
  } catch {
    // Not critical: the key stays and it is tried again next time.
  }
}
