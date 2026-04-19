'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/dashboard/PageHeader';
import ChildProfileForm from '@/components/forms/ChildProfileForm';
import { activateChild, deactivateChild, getChildById } from '@/lib/store/client';
import {
  displayGrade,
  displaySchedule,
  displaySubject,
  type Child,
} from '@/lib/types';

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [child, setChild] = useState<Child | null | undefined>(undefined);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');

  useEffect(() => {
    setChild(getChildById(params.id) ?? null);
  }, [params.id]);

  if (child === undefined) {
    return <p className="text-sm text-gray-400 dark:text-muted-foreground">Loading…</p>;
  }
  if (child === null) {
    return (
      <div>
        <p className="text-sm text-gray-700 dark:text-foreground/90">Child not found.</p>
        <Button
          onClick={() => router.push('/family/children')}
          className="mt-4"
          variant="outline"
        >
          Back to children
        </Button>
      </div>
    );
  }

  const isDeactivated = child.status === 'Deactivated';

  const handleDeactivate = () => {
    const updated = deactivateChild(child.id, deactivationReason);
    if (!updated) return;
    setChild(updated);
    setDeactivationReason('');
    setDeactivateOpen(false);
  };

  const handleActivate = () => {
    const updated = activateChild(child.id);
    if (!updated) return;
    setChild(updated);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={child.fullName}
        description={`Age ${child.age} · ${displayGrade(child)}${child.school ? ` · ${child.school}` : ''}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/family/children/${child.id}/intake`}>
              <Button variant="outline" className="rounded-full">
                {child.intake ? 'Update intake' : 'Fill intake'}
              </Button>
            </Link>
            <Button
              variant="outline"
              className={
                isDeactivated
                  ? 'rounded-full text-accent2-700 border-accent2-200 hover:bg-accent2-50'
                  : 'rounded-full text-amber-700 border-amber-200 hover:bg-amber-50'
              }
              onClick={isDeactivated ? handleActivate : () => setDeactivateOpen(true)}
            >
              {isDeactivated ? (
                <PlayCircle className="w-4 h-4 mr-2" />
              ) : (
                <PauseCircle className="w-4 h-4 mr-2" />
              )}
              {isDeactivated ? 'Activate' : 'Deactivate'}
            </Button>
          </div>
        }
      />

      {isDeactivated && (
        <section className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Lessons are paused for this student.
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Reason: {child.deactivationReason}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-4">
          Profile details
        </h2>
        <ChildProfileForm mode="edit" initial={child} />
      </section>

      <section className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90 mb-4">
          Intake summary
        </h2>
        {child.intake ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Row label="Subject" value={displaySubject(child.intake)} />
            <Row label="Goal" value={child.intake.learningGoal} />
            <Row label="Level" value={child.intake.currentLevel} />
            <Row label="Availability" value={displaySchedule(child.intake)} />
            <Row
              label="Sessions / week"
              value={String(child.intake.sessionsPerWeek)}
            />
            <Row label="Budget" value={child.intake.budget} />
            <Row
              label="Teacher gender"
              value={child.intake.teacherGenderPref}
            />
          </dl>
        ) : (
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            No intake submitted yet.{' '}
            <Link
              href={`/family/children/${child.id}/intake`}
              className="text-brand font-medium"
            >
              Fill it now
            </Link>
            .
          </p>
        )}
      </section>

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate student</DialogTitle>
            <DialogDescription>
              Pause lessons for now. Admin and the assigned teacher will be
              notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              placeholder="Reason for pausing lessons"
              rows={4}
            />
            <p className="text-xs text-gray-500 dark:text-muted-foreground">
              This reason is required so the team can follow up properly.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeactivateOpen(false);
                setDeactivationReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!deactivationReason.trim()}
              onClick={handleDeactivate}
            >
              Deactivate student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 dark:text-muted-foreground">{label}</dt>
      <dd className="text-sm text-gray-900 dark:text-foreground font-medium">{value}</dd>
    </div>
  );
}
