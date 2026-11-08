'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getReminderSetting, setReminderSetting, studentKeys } from '@/lib/api/student';

export default function ReminderToggle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: studentKeys.reminders, queryFn: getReminderSetting });
  const update = useMutation({
    mutationFn: setReminderSetting,
    onSuccess: (setting) => queryClient.setQueryData(studentKeys.reminders, setting),
    onError: () => toast({ title: 'Could not save that. Please try again.', variant: 'destructive' }),
  });

  return (
    <section className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-border dark:bg-card">
      <div>
        <h2 id="reminders-title" className="font-semibold text-gray-900 dark:text-foreground">Email reminders</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-muted-foreground">
          A short email when your streak is about to end or questions are ready to try again. Never more than one a day.
        </p>
      </div>
      <Switch
        aria-labelledby="reminders-title"
        checked={query.data?.enabled ?? false}
        disabled={query.isLoading || update.isPending}
        onCheckedChange={(enabled) => update.mutate(enabled)}
      />
    </section>
  );
}
