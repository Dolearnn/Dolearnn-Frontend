import { apiFetch } from '@/lib/api/client';

export type AdminQuestionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AdminQuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AdminExam {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminSubject {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  topics: Array<{ id: string; slug: string; name: string; sortOrder: number }>;
}

export interface AdminQuizOverview {
  exams: AdminExam[];
  subjects: AdminSubject[];
  questionCounts: Array<{ subjectId: string; status: AdminQuestionStatus; count: number }>;
  coverage: Array<{
    examId: string | null;
    subjectId: string;
    topicId: string;
    status: AdminQuestionStatus;
    count: number;
  }>;
  quality: {
    byStatus: Partial<Record<AdminQuestionStatus, number>>;
    missingExplanations: number;
    unassignedExam: number;
  };
}

export interface AdminQuestion {
  id: string;
  sourceKey: string | null;
  year: number | null;
  text: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string | null;
  difficulty: AdminQuestionDifficulty;
  status: AdminQuestionStatus;
  exam: { id: string; name: string; slug: string } | null;
  subject: { id: string; name: string; slug: string };
  topic: { id: string; name: string; slug: string };
  createdAt: string;
}

export const adminQuizKeys = {
  overview: ['admin', 'quiz', 'overview'] as const,
  questions: (filters: Record<string, string | undefined>) =>
    ['admin', 'quiz', 'questions', filters] as const,
};

export function getAdminQuizOverview() {
  return apiFetch<AdminQuizOverview>('/admin/quiz/overview');
}

export function listAdminQuestions(filters: {
  status?: AdminQuestionStatus;
  examId?: string;
  subjectId?: string;
  topicId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return apiFetch<{ questions: AdminQuestion[]; nextCursor: string | null }>(
    `/admin/quiz/questions?${params.toString()}`,
  );
}

export function setAdminQuestionStatus(questionIds: string[], status: AdminQuestionStatus) {
  return apiFetch<{ updated: number }>('/admin/quiz/questions/status', {
    method: 'POST',
    body: JSON.stringify({ questionIds, status }),
  });
}

export function importAdminQuestions(questions: unknown[]) {
  return apiFetch<{
    received: number;
    inserted: number;
    skippedDuplicates: number;
    errors: Array<{ index: number; message: string }>;
  }>('/admin/quiz/questions/import', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  });
}

export function createAdminExam(input: {
  slug: string;
  name: string;
  description?: string;
}) {
  return apiFetch<{ exam: AdminExam }>('/admin/quiz/exams', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((response) => response.exam);
}
