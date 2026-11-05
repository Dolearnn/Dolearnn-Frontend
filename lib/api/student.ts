import { apiFetch } from '@/lib/api/client';

export type LearnerStage = 'SS2' | 'SS3' | 'RECENT_SCHOOL_LEAVER' | 'OTHER';

export interface GuestBaseline {
  score: number;
  correct: number;
  total: number;
  weakTopics: string[];
  completedAt?: string;
}

export interface LearnerProfile {
  id: string;
  userId: string;
  stage: LearnerStage | null;
  externalExams: string[];
  subjectIds: string[];
  subjects: Array<{ id: string; slug: string; name: string }>;
  examDate: string | null;
  onboardingCompleted: boolean;
  guestBaseline: GuestBaseline | null;
}

export interface UpdateLearnerProfileInput {
  stage: LearnerStage;
  externalExams: string[];
  subjectIds: string[];
  examDate?: string | null;
  guestBaseline?: GuestBaseline | null;
}

export const studentKeys = {
  profile: ['student', 'profile'] as const,
};

export function getLearnerProfile() {
  return apiFetch<{ profile: LearnerProfile }>('/student/me').then((response) => response.profile);
}

export function updateLearnerProfile(input: UpdateLearnerProfileInput) {
  return apiFetch<{ profile: LearnerProfile }>('/student/onboarding', {
    method: 'PUT',
    body: JSON.stringify(input),
  }).then((response) => response.profile);
}

export function saveGuestBaseline(guestBaseline: GuestBaseline) {
  return apiFetch<null>('/student/guest-baseline', {
    method: 'PUT',
    body: JSON.stringify({ guestBaseline }),
  });
}
