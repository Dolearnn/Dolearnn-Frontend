import { apiFetch } from '@/lib/api/client';

export type QuizMode = 'PRACTICE' | 'MOCK';
export type QuizAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
export type ApiCurrentLevel = 'STRUGGLING' | 'AVERAGE' | 'ABOVE_AVERAGE';

export interface QuizCatalogTopic {
  id: string;
  slug: string;
  name: string;
}

export interface QuizCatalogSubject {
  id: string;
  slug: string;
  name: string;
  topics: QuizCatalogTopic[];
}

export interface QuizCatalogExam {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface QuizCatalog {
  exams: QuizCatalogExam[];
  subjects: QuizCatalogSubject[];
  availability: Array<{
    examId: string | null;
    subjectId: string;
    questionCount: number;
  }>;
  // Which AI features the server has switched on.
  ai?: { explanations: boolean };
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  text: string;
  imageUrl: string | null;
  options: QuizOption[];
}

export interface QuizReviewQuestion extends QuizQuestion {
  correctOptionId: string;
  explanation: string | null;
  yourAnswer: string | null;
  isCorrect: boolean;
}

export interface QuizAttemptSummary {
  id: string;
  mode: QuizMode;
  status: QuizAttemptStatus;
  subject: { id: string; name: string };
  examId: string | null;
  studentId: string | null;
  totalQuestions: number;
  timeLimitSecs: number | null;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
}

export interface QuizTopicResult {
  topicId: string;
  name: string;
  attempted: number;
  correct: number;
  accuracyPercent: number;
}

export interface QuizTutoringPrefill {
  studentId: string | null;
  subject: string;
  specificTopics: string;
  currentLevel: ApiCurrentLevel;
}

export interface QuizTutoringSuggestion {
  weakTopics: Array<{ topicId: string; name: string; accuracyPercent: number }>;
  prefill: QuizTutoringPrefill;
}

export interface QuizComparison {
  previousScorePercent: number;
  previousSubmittedAt: string | null;
  changePoints: number;
}

export interface QuizResult {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  timedOut: boolean;
  topics: QuizTopicResult[];
  tutoring: QuizTutoringSuggestion | null;
  // Versus the learner's previous attempt in this subject; null on a first attempt.
  comparison: QuizComparison | null;
}

export interface QuizInProgressView {
  attempt: QuizAttemptSummary;
  questions: QuizQuestion[];
}

export interface QuizSubmittedView {
  attempt: QuizAttemptSummary;
  result: QuizResult;
  review: QuizReviewQuestion[];
}

export type QuizAttemptView = QuizInProgressView | QuizSubmittedView;

export function isSubmittedView(view: QuizAttemptView): view is QuizSubmittedView {
  return 'result' in view;
}

export interface QuizHistoryItem {
  id: string;
  mode: QuizMode;
  status: QuizAttemptStatus;
  studentId: string | null;
  totalQuestions: number;
  correctCount: number | null;
  scorePercent: number | null;
  startedAt: string;
  submittedAt: string | null;
  subject: { id: string; name: string };
}

export interface QuizWeakTopic {
  topicId: string;
  name: string;
  subject: { id: string; name: string };
  attempted: number;
  correct: number;
  accuracyPercent: number;
  isWeak: boolean;
  lastAttemptAt: string;
}

export interface QuizWeakTopicsResponse {
  topics: QuizWeakTopic[];
  tutoring: Array<{
    subject: { id: string; name: string };
    weakTopics: Array<{ topicId: string; name: string; accuracyPercent: number }>;
    prefill: QuizTutoringPrefill;
  }>;
}

export type QuizTopicChange = 'improved' | 'declined' | 'steady';

export interface QuizProgressTopic {
  topicId: string;
  name: string;
  attempts: number;
  baselinePercent: number;
  latestPercent: number;
  changePoints: number;
  change: QuizTopicChange;
}

export interface QuizProgressSubject {
  subject: { id: string; name: string };
  attempts: number;
  baselinePercent: number;
  latestPercent: number;
  // null until there are two attempts to compare.
  changePoints: number | null;
  trend: Array<{ attemptId: string; submittedAt: string | null; scorePercent: number }>;
  topics: QuizProgressTopic[];
}

export interface QuizProgress {
  totalAttempts: number;
  subjects: QuizProgressSubject[];
  summary: {
    subjectsCompared: number;
    subjectsImproved: number;
    topicsImproved: number;
  };
}

export interface QuizNextAction {
  id: string;
  type: 'DIAGNOSTIC' | 'PRACTISE_TOPIC' | 'TUTOR' | 'REASSESS';
  title: string;
  reason: string;
  start: { subjectId: string; topicIds?: string[]; count: number; mode: QuizMode } | null;
  tutoring: {
    weakTopics: Array<{ topicId: string; name: string; accuracyPercent: number }>;
    prefill: QuizTutoringPrefill;
  } | null;
}

export interface StartQuizInput {
  subjectId: string;
  examId?: string;
  topicIds?: string[];
  count: number;
  mode: QuizMode;
  studentId?: string;
}

export const quizKeys = {
  catalog: ['quiz', 'catalog'] as const,
  history: ['quiz', 'history'] as const,
  attempt: (attemptId: string) => ['quiz', 'attempt', attemptId] as const,
  weakTopics: (studentId: string | null) =>
    ['quiz', 'weak-topics', studentId ?? 'self'] as const,
  nextActions: (studentId: string | null) =>
    ['quiz', 'next-actions', studentId ?? 'self'] as const,
  progress: (studentId: string | null) =>
    ['quiz', 'progress', studentId ?? 'self'] as const,
};

export function getQuizCatalog() {
  return apiFetch<QuizCatalog>('/quiz/catalog');
}

export function startQuizAttempt(input: StartQuizInput) {
  return apiFetch<QuizInProgressView>('/quiz/attempts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getQuizAttempt(attemptId: string) {
  return apiFetch<QuizAttemptView>(`/quiz/attempts/${attemptId}`);
}

export function submitQuizAttempt(
  attemptId: string,
  answers: Record<string, string>,
) {
  return apiFetch<QuizSubmittedView>(`/quiz/attempts/${attemptId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export function explainQuizQuestion(attemptId: string, questionId: string) {
  return apiFetch<{ explanation: string; cached: boolean }>(
    `/quiz/attempts/${attemptId}/questions/${questionId}/explain`,
    { method: 'POST' },
  );
}

export function listQuizAttempts(limit = 6) {
  return apiFetch<{ attempts: QuizHistoryItem[]; nextCursor: string | null }>(
    `/quiz/attempts?limit=${limit}`,
  );
}

export function getQuizWeakTopics(studentId: string | null) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<QuizWeakTopicsResponse>(`/quiz/weak-topics${query}`);
}

export function getQuizProgress(studentId: string | null) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<QuizProgress>(`/quiz/progress${query}`);
}

export function getQuizNextActions(studentId: string | null) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<{ actions: QuizNextAction[] }>(`/quiz/next-actions${query}`);
}

export interface QuizDiagnosis {
  diagnosis: string;
  // AI when the model wrote it; RULES for the built-in wording.
  source: 'AI' | 'RULES';
  cached: boolean;
}

export function getQuizDiagnosis(attemptId: string) {
  return apiFetch<QuizDiagnosis>(`/quiz/attempts/${attemptId}/diagnosis`, {
    method: 'POST',
  });
}
