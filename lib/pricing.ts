/*
 * The prices shown on the public site, in one place. Only offers people can
 * actually buy today belong here. The learner plans must match the backend
 * (Dolearnn-Backend/src/features/billing/plans.ts), which sets what Paystack charges.
 */
export const PRICING = {
  // One-to-one tutoring, 60 minutes, matched to the learner's weak topics.
  tutoringSession: 10_000,
  // A school licence: class diagnostics, dashboards and reports for a year.
  schoolYear: 900_000,
  // Pro, one month.
  proMonth: 4_500,
  // The Exam Season Pass: three months of Pro for one payment.
  examPass: 12_000,
  examPassMonths: 3,
  // Founding price, for payments before 1 January 2027 (Lagos time).
  examPassFounding: 8_000,
  foundingEndsAt: '2027-01-01T00:00:00+01:00',
} as const;

// What the free plan includes each day / month (the backend enforces it).
export const FREE_LIMITS = {
  quizzesPerDay: 5,
  utmePapersPerMonth: 1,
} as const;

/** Today's Exam Season Pass price, and the usual price while the founding offer runs. */
export function examPassPrice(now = new Date()) {
  const founding = now < new Date(PRICING.foundingEndsAt);
  return { price: founding ? PRICING.examPassFounding : PRICING.examPass, was: founding ? PRICING.examPass : null };
}

// Facts about the question bank shown on the public site. Keep them true:
// recount (scripts/data) before raising them.
export const BANK_FACTS = {
  questions: '4,000+',
  subjects: 20,
  exams: 6,
  utmeQuestions: 180,
  utmeHours: 2,
} as const;
