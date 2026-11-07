/*
 * Every account is a learner account, so all learner pages live under /student.
 * Pages read the workspace from here so it is defined in one place.
 */
export type LearnerBase = '/student';

export function useLearnerBase(): LearnerBase {
  return '/student';
}

/** Where a learner reviews one submitted attempt. */
export function attemptReviewPath(base: LearnerBase, attemptId: string) {
  return `${base}/practice/attempt/${attemptId}`;
}
