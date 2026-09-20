'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BookOpenCheck,
  CircleDollarSign,
  GraduationCap,
  Repeat,
  TrendingUp,
  Users,
} from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageShellSkeleton } from '@/components/dashboard/Skeletons';
import StatTile from '@/components/dashboard/StatTile';
import { getImpactReport, impactKeys } from '@/lib/api/reports';

const numberFormat = new Intl.NumberFormat();
const n = (value: number) => numberFormat.format(value);

function signed(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">{title}</h2>
      {note && (
        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5 mb-3">{note}</p>
      )}
      {!note && <div className="mb-3" />}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

export default function AdminImpactPage() {
  const impactQuery = useQuery({
    queryKey: impactKeys.admin,
    queryFn: getImpactReport,
    staleTime: 60_000,
  });

  if (impactQuery.isLoading) return <PageShellSkeleton />;

  if (impactQuery.isError || !impactQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Impact" description="" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          We could not load the impact numbers right now. Please try again.
        </div>
      </div>
    );
  }

  const { people, practice, learning, tutoring, revenue, generatedAt } = impactQuery.data;
  const hasComparison = learning.comparablePairs > 0;
  const hasTutoringComparison = tutoring.matchedLearners > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Impact"
        description={`Live numbers from the database, for the grant pitch. Updated ${new Date(
          generatedAt,
        ).toLocaleTimeString()}. Nothing here is estimated or projected.`}
      />

      <Section title="Reach">
        <StatTile icon={Users} label="Families registered" value={n(people.families)} />
        <StatTile icon={Users} label="Learner profiles" value={n(people.learnerProfiles)} />
        <StatTile icon={GraduationCap} label="Active teachers" value={n(people.activeTeachers)} />
        <StatTile
          icon={BookOpenCheck}
          label="Published questions"
          value={n(practice.publishedQuestions)}
        />
      </Section>

      <Section
        title="Engagement"
        note="A learner is a child profile a parent quizzed for, or the account itself."
      >
        <StatTile
          icon={BookOpenCheck}
          label="Quizzes submitted"
          value={n(practice.attemptsSubmitted)}
          sub={`${n(practice.attemptsStarted)} started`}
          accent
        />
        <StatTile
          icon={Users}
          label="Learners who practised"
          value={n(practice.learnersWhoPractised)}
        />
        <StatTile
          icon={Users}
          label="Active, last 30 days"
          value={n(practice.activeLearners30Days)}
          sub={`${n(practice.activeLearners7Days)} in the last 7 days`}
        />
        <StatTile
          icon={Repeat}
          label="Came back on another day"
          value={`${practice.repeatRatePercent}%`}
          sub={`${n(practice.repeatLearners)} of ${n(practice.learnersWhoPractised)} learners`}
        />
      </Section>

      <Section
        title="Learning improvement"
        note="First quiz score vs latest quiz score, for every learner and subject with at least two quizzes."
      >
        <StatTile
          icon={TrendingUp}
          label="Learner-subjects compared"
          value={n(learning.comparablePairs)}
        />
        <StatTile
          icon={TrendingUp}
          label="Improved"
          value={hasComparison ? `${learning.improvedPercent}%` : '-'}
          sub={hasComparison ? `${n(learning.improvedPairs)} of ${n(learning.comparablePairs)}` : 'Not enough repeat quizzes yet'}
          accent={hasComparison}
        />
        <StatTile
          icon={TrendingUp}
          label="Average change"
          value={
            learning.averageChangePoints === null ? '-' : `${signed(learning.averageChangePoints)} pts`
          }
          sub={
            learning.averageFirstScore === null || learning.averageLatestScore === null
              ? undefined
              : `${learning.averageFirstScore}% → ${learning.averageLatestScore}%`
          }
        />
      </Section>

      <Section
        title="Tutoring and outcomes"
        note="Quiz scores before vs after each learner's first completed tutoring session. Subjects are not matched, so treat this as indicative, not proof."
      >
        <StatTile
          icon={GraduationCap}
          label="Completed tutor sessions"
          value={n(tutoring.completedSessions)}
          sub={`${n(tutoring.bookingRequests)} booking requests`}
        />
        <StatTile
          icon={GraduationCap}
          label="Practised, then tutored"
          value={n(tutoring.practisedBeforeTutoring)}
          sub={`${n(tutoring.practisedAfterTutoring)} practised after tutoring`}
        />
        <StatTile
          icon={TrendingUp}
          label="Avg score before tutoring"
          value={
            hasTutoringComparison && tutoring.averageScoreBeforeTutoring !== null
              ? `${tutoring.averageScoreBeforeTutoring}%`
              : '-'
          }
          sub={`${n(tutoring.matchedLearners)} learners with both`}
        />
        <StatTile
          icon={TrendingUp}
          label="Avg score after tutoring"
          value={
            hasTutoringComparison && tutoring.averageScoreAfterTutoring !== null
              ? `${tutoring.averageScoreAfterTutoring}%`
              : '-'
          }
          accent={hasTutoringComparison}
        />
      </Section>

      <Section title="Revenue">
        <StatTile
          icon={CircleDollarSign}
          label="Total payments recorded"
          value={n(revenue.totalRevenue)}
          sub={`${n(revenue.paymentCount)} payments`}
          accent
        />
        <StatTile
          icon={CircleDollarSign}
          label="Teacher payouts paid"
          value={n(revenue.teacherPayoutsPaid)}
        />
      </Section>
    </div>
  );
}
