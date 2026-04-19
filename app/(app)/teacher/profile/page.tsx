'use client';

import { useState } from 'react';
import { Check, GraduationCap, Star, Users } from 'lucide-react';
import PageHeader from '@/components/dashboard/PageHeader';
import StatTile from '@/components/dashboard/StatTile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { teacherMe } from '@/lib/store/teacher';
import { useMounted } from '@/lib/use-mounted';
import type { DayOfWeek, TimeBlock } from '@/lib/types';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BLOCKS: TimeBlock[] = ['Morning', 'Afternoon', 'Evening'];

export default function TeacherProfilePage() {
  const mounted = useMounted();
  const me = teacherMe();
  const [bio, setBio] = useState(me.bio);
  const [subjects, setSubjects] = useState(me.subjects.join(', '));
  const [days, setDays] = useState<Set<DayOfWeek>>(
    new Set<DayOfWeek>(['Mon', 'Wed', 'Fri']),
  );
  const [blocks, setBlocks] = useState<Set<TimeBlock>>(
    new Set<TimeBlock>(['Evening']),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const toggle = <T extends DayOfWeek | TimeBlock>(
    set: Set<T>,
    setter: (s: Set<T>) => void,
    value: T,
  ) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const save = () => {
    setSavedAt(new Date().toISOString());
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" description="" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Keep your subjects, bio and availability up to date."
      />

      <section className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold">
          {me.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold text-gray-900 dark:text-foreground">{me.name}</p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            Joined{' '}
            {new Date(me.joinedAt).toLocaleDateString(undefined, {
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500" />
              {me.rating.toFixed(1)}
            </span>
            <span>·</span>
            <span>{me.totalSessions} sessions</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatTile
          icon={GraduationCap}
          label="Qualifications"
          value={me.qualifications.length}
        />
        <StatTile icon={Users} label="Subjects" value={me.subjects.length} />
        <StatTile
          icon={Star}
          label="Hourly rate"
          value={`$${me.hourlyRate}`}
        />
      </div>

      <section className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">About you</h2>
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-xs">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="subjects" className="text-xs">
              Subjects (comma separated)
            </Label>
            <Input
              id="subjects"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate" className="text-xs">
              Hourly rate (set by admin)
            </Label>
            <div
              id="rate"
              className="h-10 rounded-md border border-gray-200 dark:border-border bg-gray-50 dark:bg-background px-3 flex items-center text-sm font-semibold text-gray-900 dark:text-foreground"
            >
              ${me.hourlyRate}/hr
            </div>
          </div>
        </div>
        <div className="pt-2">
          <p className="text-xs text-gray-500 dark:text-muted-foreground mb-2">Qualifications</p>
          <ul className="flex flex-wrap gap-2">
            {me.qualifications.map((q) => (
              <li
                key={q}
                className="text-xs bg-accent2-50 text-accent2-700 px-3 py-1 rounded-full"
              >
                {q}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-foreground/90">Availability</h2>
        <div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mb-2">Days you teach</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => toggle(days, setDays, d)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs transition border',
                  days.has(d)
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-card border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground hover:border-brand',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground mb-2">Time blocks</p>
          <div className="flex flex-wrap gap-2">
            {BLOCKS.map((b) => (
              <button
                key={b}
                onClick={() => toggle(blocks, setBlocks, b)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs transition border',
                  blocks.has(b)
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white dark:bg-card border-gray-200 dark:border-border text-gray-600 dark:text-muted-foreground hover:border-brand',
                )}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        {savedAt && (
          <span className="text-xs text-accent2-700 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
        <Button className="bg-brand hover:bg-brand-600 rounded-full" onClick={save}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
