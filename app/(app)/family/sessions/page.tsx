'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, CalendarX2 } from 'lucide-react';
import ChildSwitcher from '@/components/dashboard/ChildSwitcher';
import FeedbackCard from '@/components/dashboard/FeedbackCard';
import PageHeader from '@/components/dashboard/PageHeader';
import SessionRow from '@/components/dashboard/SessionRow';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getSessionProposals,
  updateSessionProposalStatus,
} from '@/lib/store/client';
import {
  familyChildren,
  familySessionsForChild,
  familyTeacher,
} from '@/lib/store/family';
import type { Child, Session, SessionProposal, SessionStatus } from '@/lib/types';

const TAB_ORDER: SessionStatus[] = ['Upcoming', 'Completed', 'Cancelled'];

export default function FamilySessionsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<SessionProposal[]>([]);

  useEffect(() => {
    const list = familyChildren();
    setChildren(list);
    setActiveId(list[0]?.id ?? null);
    setProposals(getSessionProposals());
  }, []);

  const active = useMemo(
    () => children.find((c) => c.id === activeId) ?? children[0],
    [children, activeId],
  );

  const acceptedProposalCount = proposals.filter(
    (proposal) => proposal.status === 'Accepted',
  ).length;

  const sessions: Session[] = useMemo(() => {
    if (!active || acceptedProposalCount < 0) return [];
    return familySessionsForChild(active.id);
  }, [active, acceptedProposalCount]);

  const pendingProposals = useMemo(
    () =>
      active
        ? proposals.filter(
            (proposal) =>
              proposal.childId === active.id && proposal.status === 'Pending',
          )
        : [],
    [active, proposals],
  );

  const resolveProposal = (
    proposalId: string,
    status: 'Accepted' | 'Declined',
  ) => {
    const updated = updateSessionProposalStatus(proposalId, status);
    if (!updated) return;
    setProposals(getSessionProposals());
  };

  const grouped = useMemo(() => {
    const bucket: Record<SessionStatus, Session[]> = {
      Upcoming: [],
      Completed: [],
      Cancelled: [],
    };
    for (const s of sessions) bucket[s.status].push(s);
    bucket.Upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    bucket.Completed.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    bucket.Cancelled.sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return bucket;
  }, [sessions]);

  if (!active) {
    return <p className="text-sm text-gray-400 dark:text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Every lesson for your family — past, present and upcoming."
      />

      <ChildSwitcher
        students={children}
        activeId={active.id}
        onChange={setActiveId}
      />

      {pendingProposals.length > 0 && (
        <div className="space-y-3">
          {pendingProposals.map((proposal) => (
            <SessionProposalCard
              key={proposal.id}
              proposal={proposal}
              onAccept={() => resolveProposal(proposal.id, 'Accepted')}
              onDecline={() => resolveProposal(proposal.id, 'Declined')}
            />
          ))}
        </div>
      )}

      <Tabs defaultValue="Upcoming" className="space-y-4">
        <TabsList className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-full p-1 w-fit">
          {TAB_ORDER.map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="rounded-full px-4 text-sm data-[state=active]:bg-brand data-[state=active]:text-white"
            >
              {status}
              <span className="ml-2 text-xs opacity-70">
                {grouped[status].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Upcoming" className="space-y-3">
          {grouped.Upcoming.length === 0 ? (
            <EmptyState
              title="Nothing scheduled"
              hint="New sessions will appear here once booked."
            />
          ) : (
            grouped.Upcoming.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </TabsContent>

        <TabsContent value="Completed" className="space-y-4">
          {grouped.Completed.length === 0 ? (
            <EmptyState
              title="No completed sessions yet"
              hint="Feedback from teachers will appear here after each session."
            />
          ) : (
            grouped.Completed.map((s) => (
              <div key={s.id} className="space-y-3">
                <SessionRow session={s} />
                <FeedbackCard session={s} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="Cancelled" className="space-y-3">
          {grouped.Cancelled.length === 0 ? (
            <EmptyState
              title="No cancellations"
              hint="Any cancelled sessions will appear here."
            />
          ) : (
            grouped.Cancelled.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionProposalCard({
  proposal,
  onAccept,
  onDecline,
}: {
  proposal: SessionProposal;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const teacher = familyTeacher(proposal.teacherId);
  return (
    <div className="bg-white dark:bg-card border border-brand/20 dark:border-accent2-400/30 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand dark:bg-accent2-500/15 dark:text-accent2-400 flex items-center justify-center shrink-0">
        <CalendarCheck2 className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-medium text-brand dark:text-accent2-400 bg-brand/10 dark:bg-accent2-500/10 px-2 py-0.5 rounded-full">
            Proposed session
          </span>
          <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
            {proposal.subject}
          </span>
        </div>
        <p className="font-semibold text-gray-900 dark:text-foreground">
          {teacher.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
          {new Date(proposal.startsAt).toLocaleString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          - {proposal.durationMins} min - {proposal.timeBlock}
        </p>
        {proposal.note && (
          <p className="text-xs text-gray-600 dark:text-foreground/80 mt-2">
            {proposal.note}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="rounded-full" onClick={onDecline}>
          Decline
        </Button>
        <Button className="rounded-full bg-brand hover:bg-brand-600" onClick={onAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-white dark:bg-card border border-dashed border-gray-300 dark:border-border rounded-2xl p-10 text-center">
      <CalendarX2 className="w-6 h-6 text-gray-400 dark:text-muted-foreground mx-auto mb-2" />
      <p className="text-sm font-semibold text-gray-700 dark:text-foreground/90">{title}</p>
      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
