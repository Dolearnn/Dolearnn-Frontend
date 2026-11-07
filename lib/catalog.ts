/*
 * Options offered in DoLearnn forms, in one place.
 *
 * They follow the product focus: Nigerian SS2/SS3 students and recent school
 * leavers preparing for WAEC and JAMB UTME, Mathematics first plus selected
 * high-demand subjects, priced in naira. Change a list here and every form
 * (family intake, admin intake, teacher setup) follows.
 */
import type { BudgetTier, GradeLevel, LearningGoal } from '@/lib/types';

// SS1 is included so early starters are not turned away.
export const GRADE_LEVELS: GradeLevel[] = ['SS1', 'SS2', 'SS3', 'School leaver', 'Other'];

// Subjects a tutor can be requested for. The sciences are listed separately so
// a weak Physics topic asks for a Physics tutor, not a general "Science" one.
export const TUTORING_SUBJECTS = [
  'Maths',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Further Maths',
  'Other',
] as const;
export type TutoringSubject = (typeof TUTORING_SUBJECTS)[number];

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
