import { apiFetch } from '@/lib/api/client';

export type ReportKind = 'bank' | 'daily';
export type ReportReason = 'wrong_answer' | 'typo' | 'unclear' | 'wrong_topic' | 'other';

export const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'wrong_answer', label: 'The answer is wrong' },
  { value: 'typo', label: 'There is a typing or spelling mistake' },
  { value: 'unclear', label: 'The question is unclear' },
  { value: 'wrong_topic', label: 'It is in the wrong subject or topic' },
  { value: 'other', label: 'Something else' },
];

export interface OpenQuestionReport {
  kind: ReportKind;
  questionId: string;
  text: string;
  answer: string | null;
  count: number;
  latestAt: string;
  reasons: Array<{ reason: ReportReason; note: string | null }>;
}

export const reportKeys = { open: ['admin', 'question-reports'] as const };

export function reportQuestion(input: { kind: ReportKind; questionId: string; reason: ReportReason; note?: string }) {
  return apiFetch<{ ok: boolean }>('/question-reports', { method: 'POST', body: JSON.stringify(input) });
}

export async function listQuestionReports() {
  const response = await apiFetch<{ reports: OpenQuestionReport[] }>('/question-reports');
  return response.reports;
}

export function resolveQuestionReport(kind: ReportKind, questionId: string) {
  return apiFetch<{ ok: boolean }>('/question-reports/resolve', {
    method: 'POST',
    body: JSON.stringify({ kind, questionId }),
  });
}
