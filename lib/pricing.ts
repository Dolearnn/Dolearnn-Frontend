/*
 * The prices shown on the public site, in one place. Only offers people can
 * actually buy today belong here; when the paid learner plans launch, add them
 * here and the landing page picks them up.
 */
export const PRICING = {
  // One-to-one tutoring, 60 minutes, matched to the learner's weak topics.
  tutoringSession: 10_000,
  // A school licence: class diagnostics, dashboards and reports for a year.
  schoolYear: 900_000,
} as const;

// Facts about the question bank shown on the public site. Keep them true:
// recount (scripts/data) before raising them.
export const BANK_FACTS = {
  questions: '4,000+',
  subjects: 20,
  exams: 6,
  utmeQuestions: 180,
  utmeHours: 2,
} as const;
