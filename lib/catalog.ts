/*
 * Options offered in DoLearnn forms, in one place.
 *
 * Change a list here and every form (tutor request, admin intake, teacher
 * setup) follows. Prices are in naira.
 */
import type { BudgetTier, GradeLevel, LearningGoal } from '@/lib/types';

// SS1 is included so early starters are not turned away.
export const GRADE_LEVELS: GradeLevel[] = ['SS1', 'SS2', 'SS3', 'School leaver', 'Other'];

// Subjects a tutor can be requested for: every subject in the question bank.
// "Maths", "English" and "Further Maths" keep their short names because existing
// tutor requests and teacher profiles are saved with them.
export const TUTORING_SUBJECTS = [
  'Maths',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Further Maths',
  'Economics',
  'Government',
  'Commerce',
  'Financial Accounting',
  'Literature in English',
  'Geography',
  'Christian Religious Studies',
  'Islamic Religious Studies',
  'Agricultural Science',
  'Civic Education',
  'Computer Studies and Coding',
  'Music',
  'French',
  'Yoruba',
  'Other',
] as const;
export type TutoringSubject = (typeof TUTORING_SUBJECTS)[number];

// The question bank's name for a subject, where it differs from the tutoring list.
const QUIZ_SUBJECT_NAMES: Record<string, TutoringSubject> = {
  Mathematics: 'Maths',
  'Use of English': 'English',
  'Further Mathematics': 'Further Maths',
};

/** Turns a subject name from a quiz into the name the tutor request form uses. */
export function tutoringSubjectFor(name: string | null) {
  return name ? (QUIZ_SUBJECT_NAMES[name] ?? name) : null;
}

// Teachers are set up with real subjects only (no "Other").
export const TEACHER_SUBJECTS = TUTORING_SUBJECTS.filter(
  (subject): subject is Exclude<TutoringSubject, 'Other'> => subject !== 'Other',
);

export const LEARNING_GOALS: LearningGoal[] = [
  'Exam prep',
  'Catch up with school',
  'General improvement',
];

// What the learner can spend per session, in naira (their budget, not our price list).
export const BUDGET_TIERS: BudgetTier[] = [
  'Under ₦5,000',
  '₦5,000–₦10,000',
  '₦10,000–₦20,000',
  '₦20,000+',
];
export const DEFAULT_BUDGET: BudgetTier = '₦5,000–₦10,000';
