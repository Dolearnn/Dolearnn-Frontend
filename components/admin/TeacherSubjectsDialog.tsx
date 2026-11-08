'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateAdminTeacherSubjects } from '@/lib/api/admin';
import { TEACHER_SUBJECTS } from '@/lib/catalog';

/** Change which subjects an existing teacher can be matched to. */
export default function TeacherSubjectsDialog({
  teacherId,
  name,
  subjects,
}: {
  teacherId: string;
  name: string;
  subjects: string[];
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(subjects);
  // Keeps any older subject on this teacher that is no longer in the main list.
  const options = [...new Set<string>([...TEACHER_SUBJECTS, ...subjects])];

  useEffect(() => {
    if (open) setSelected(subjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useMutation({
    mutationFn: () => updateAdminTeacherSubjects(teacherId, selected),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
      toast({ title: 'Subjects updated' });
      setOpen(false);
    },
    onError: (error) =>
      toast({
        title: 'Could not save subjects',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        Subjects
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{name}&apos;s subjects</DialogTitle>
            <DialogDescription>This teacher can be matched to learners for the subjects ticked here.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {options.map((subject) => (
              <label key={subject} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-border">
                <Checkbox
                  checked={selected.includes(subject)}
                  onCheckedChange={(checked) =>
                    setSelected((current) => (checked ? [...current, subject] : current.filter((item) => item !== subject)))
                  }
                />
                <span className="text-gray-800 dark:text-foreground">{subject}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button className="rounded-full" disabled={selected.length === 0 || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Saving…' : 'Save subjects'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
