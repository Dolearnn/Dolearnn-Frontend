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
  // For a mixed exam, the name lists every subject ("English + Physics").
  subject: { id: string; name: string };
  // Every subject the attempt covers, in order (one entry unless mixed).
  subjects?: Array<{ id: string; name: string }>;
  examId: string | null;
  studentId: string | null;
  totalQuestions: number;
  timeLimitSecs: number | null;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  // Set when this attempt re-tests the weak topics of an earlier attempt.
  retakeOfAttemptId?: string | null;
}

// Before vs after on the topics a retake targeted.
export interface QuizRetakeComparison {
  originalAttemptId: string;
  originalSubmittedAt: string | null;
  beforePercent: number;
  afterPercent: number;
  changePoints: number;
  topics: Array<{ topicId: string; name: string; beforePercent: number; afterPercent: number }>;
}

export interface QuizTopicResult {
  subjectId?: string;
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
  // Only on a retake: the like-for-like comparison with the original attempt.
  retake?: QuizRetakeComparison | null;
  // Only on a mixed exam: the score in each subject.
  subjects?: QuizSubjectScore[] | null;
}

export interface QuizSubjectScore {
  id: string;
  name: string;
  attempted: number;
  correct: number;
  scorePercent: number;
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
  subjects?: Array<{ id: string; name: string }>;
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

export interface QuizPracticeOverview {
  catalog: QuizCatalog;
  history: { attempts: QuizHistoryItem[]; nextCursor: string | null };
  progress: QuizProgress;
  weak: QuizWeakTopicsResponse;
  actions: QuizNextAction[];
  learningPlan: {
    externalExams: string[];
    unavailableExams: string[];
    subjectIds: string[];
  } | null;
}

export interface StartQuizInput {
  subjectId?: string;
  // A mixed exam: several subjects, questions shared evenly and grouped by subject.
  subjectIds?: string[];
  examId?: string;
  topicIds?: string[];
  count: number;
  mode: QuizMode;
  studentId?: string;
  // Re-test the weak topics of this submitted attempt (the server picks topics and count).
  retakeOfAttemptId?: string;
}

export const quizKeys = {
  catalog: ['quiz', 'catalog'] as const,
  history: ['quiz', 'history'] as const,
  attempt: (attemptId: string) => ['quiz', 'attempt', attemptId] as const,
  diagnosis: (attemptId: string) => ['quiz', 'diagnosis', attemptId] as const,
  weakTopics: (studentId: string | null) =>
    ['quiz', 'weak-topics', studentId ?? 'self'] as const,
  nextActions: (studentId: string | null) =>
    ['quiz', 'next-actions', studentId ?? 'self'] as const,
  overview: (studentId: string | null) =>
    ['quiz', 'overview', studentId ?? 'self'] as const,
  progress: (studentId: string | null) =>
    ['quiz', 'progress', studentId ?? 'self'] as const,
  rewards: (studentId: string | null) =>
    ['quiz', 'rewards', studentId ?? 'self'] as const,
  leaderboard: (studentId: string | null) =>
    ['quiz', 'leaderboard', studentId ?? 'self'] as const,
  achievements: (studentId: string | null) =>
    ['quiz', 'achievements', studentId ?? 'self'] as const,
};

export interface QuizLevel {
  name: string;
  minXp: number;
}

export interface QuizRewards {
  xp: number;
  weekXp: number;
  xpToday: number;
  dailyCapReached: boolean;
  level: QuizLevel;
  nextLevel: QuizLevel | null;
  progressPercent: number;
  streak: { current: number; best: number; activeToday: boolean };
  rules: {
    xpPerCorrect: number;
    xpForCompletion: number;
    dailyXpCap: number;
    levels: QuizLevel[];
  };
}

export interface QuizLeaderboard {
  weekStart: string;
  entries: Array<{ rank: number; name: string; xp: number; isMe: boolean }>;
  me: { rank: number; xp: number } | null;
  /** Whether this learner's name is hidden from everyone else. */
  hidden: boolean;
}

export interface QuizBadge {
  id: string;
  name: string;
  description: string;
  current: number;
  target: number;
  earned: boolean;
}

export interface QuizMission {
  id: string;
  title: string;
  detail: string;
  current: number;
  target: number;
  done: boolean;
  action: 'practice' | 'reassess' | 'arena';
}

export interface QuizAchievements {
  weekStart: string;
  badges: QuizBadge[];
  missions: QuizMission[];
}

export function getQuizAchievements(studentId: string | null) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<QuizAchievements>(`/quiz/achievements${query}`);
}

export function setLeaderboardPrivacy(studentId: string | null, hidden: boolean) {
  return apiFetch<{ hidden: boolean }>('/quiz/leaderboard/privacy', {
    method: 'PATCH',
    body: JSON.stringify(studentId ? { hidden, studentId } : { hidden }),
  });
}

export function getQuizRewards(studentId: string | null) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<QuizRewards>(`/quiz/rewards${query}`);
}

export function getQuizLeaderboard(studentId: string | null) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<QuizLeaderboard>(`/quiz/leaderboard${query}`);
}

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

export function getQuizPracticeOverview(studentId: string | null) {
  const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return apiFetch<QuizPracticeOverview>(`/quiz/overview${query}`);
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
