'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminKeys, listAdminTeacherHours, saveAdminTeacherHours } from '@/lib/api/admin';
import { cn } from '@/lib/utils';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TIMES = ['MORNING', 'AFTERNOON', 'EVENING'];
const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

/** Admin only: when a teacher is usually free. Learners and teachers never see this. */
export default function TeacherHoursDialog({ teacherId, name }: { teacherId: string; name: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const query = useQuery({ queryKey: adminKeys.teacherHours, queryFn: listAdminTeacherHours });
  const saved = query.data?.[teacherId];

  useEffect(() => {
    if (open) setSelected(new Set((saved ?? []).map((slot) => `${slot.day}:${slot.time}`)));
  }, [open, saved]);

  const save = useMutation({
    mutationFn: () =>
      saveAdminTeacherHours(
        teacherId,
        [...selected].map((key) => {
          const [day, time] = key.split(':');
          return { day, time };
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.teacherHours });
      toast({ title: 'Teacher hours saved' });
      setOpen(false);
    },
    onError: (error) =>
      toast({
        title: 'Could not save hours',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const toggle = (key: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        Hours
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{name}&apos;s hours</DialogTitle>
            <DialogDescription>
              When this teacher is usually free. Only admins can see this, to help when confirming lessons.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-[3rem_repeat(3,1fr)] items-center gap-1.5 text-xs">
            <span />
            {TIMES.map((time) => (
              <span key={time} className="text-center font-medium text-gray-600 dark:text-muted-foreground">
                {label(time)}
              </span>
            ))}
            {DAYS.map((day) => (
              <div key={day} className="contents">
                <span className="font-medium text-gray-700 dark:text-foreground">{label(day)}</span>
                {TIMES.map((time) => {
                  const key = `${day}:${time}`;
                  const on = selected.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${label(day)} ${label(time)}`}
                      onClick={() => toggle(key)}
                      className={cn(
                        'h-9 rounded-lg border transition-colors',
                        on
                          ? 'border-brand bg-brand dark:border-accent2-500 dark:bg-accent2-500'
                          : 'border-gray-200 bg-white hover:border-brand/50 dark:border-border dark:bg-card',
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button className="rounded-full" disabled={save.isPending || query.isLoading} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
