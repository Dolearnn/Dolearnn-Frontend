import { apiFetch } from '@/lib/api/client';
import type { QuizInProgressView } from '@/lib/api/quiz';

export interface ArenaEntryView {
  slot: number;
  playerName: string;
  isMine: boolean;
  status: 'PLAYING' | 'FINISHED';
  // Only set for your own game.
  attemptId: string | null;
  // Hidden until you have finished your own game.
  scorePercent: number | null;
  correctCount: number | null;
  secondsTaken: number | null;
}

export interface ArenaBattle {
  challenge: {
    code: string;
    subject: { id: string; name: string };
    totalQuestions: number;
    createdAt: string;
    expiresAt: string;
    isExpired: boolean;
    isFull: boolean;
  };
  viewerIsPlayer: boolean;
  entries: ArenaEntryView[];
  outcome: { winnerSlot: number | null; isDraw: boolean } | null;
}

export type ArenaResult = 'PLAYING' | 'WAITING' | 'OPEN' | 'WON' | 'LOST' | 'DRAW';

export interface ArenaBattleListItem {
  code: string;
  subject: { id: string; name: string };
  totalQuestions: number;
  joinedAt: string;
  isExpired: boolean;
  myName: string;
  myScorePercent: number | null;
  opponentName: string | null;
  opponentScorePercent: number | null;
  result: ArenaResult;
}

export interface CreateBattleInput {
  subjectId: string;
  examId?: string;
  count: number;
  studentId?: string;
}

export interface BattleStartView extends QuizInProgressView {
  code: string;
}

export const arenaKeys = {
  mine: ['arena', 'mine'] as const,
  battle: (code: string) => ['arena', 'battle', code] as const,
};

export function createBattle(input: CreateBattleInput) {
  return apiFetch<BattleStartView>('/arena/challenges', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function joinBattle(code: string, studentId?: string) {
  return apiFetch<BattleStartView>(`/arena/challenges/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    body: JSON.stringify(studentId ? { studentId } : {}),
  });
}

export function getBattle(code: string) {
  return apiFetch<ArenaBattle>(`/arena/challenges/${encodeURIComponent(code)}`);
}

export function listMyBattles() {
  return apiFetch<{ battles: ArenaBattleListItem[] }>('/arena/challenges');
}

// Codes skip look-alike characters (0/O, 1/I/L), so tidy what people paste in.
export function cleanBattleCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
