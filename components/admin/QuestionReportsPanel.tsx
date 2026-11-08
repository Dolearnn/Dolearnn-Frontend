'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { REPORT_REASONS, listQuestionReports, reportKeys, resolveQuestionReport, type OpenQuestionReport } from '@/lib/api/question-reports';

const reasonLabel = (reason: string) => REPORT_REASONS.find((item) => item.value === reason)?.label ?? reason;

/** Questions learners have reported. Shows nothing when there are none. */
export default function QuestionReportsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const query = useQuery({ queryKey: reportKeys.open, queryFn: listQuestionReports });
  const resolve = useMutation({
    mutationFn: (report: OpenQuestionReport) => resolveQuestionReport(report.kind, report.questionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: reportKeys.open });
      toast({ title: 'Report closed' });
    },
    onError: () => toast({ title: 'Could not close that report', variant: 'destructive' }),
  });

  const reports = query.data ?? [];
  if (reports.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-500/30 dark:bg-card" aria-labelledby="reports-title">
      <div>
        <h2 id="reports-title" className="font-semibold text-gray-900 dark:text-foreground">
          Reported questions ({reports.length})
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
          Check each one and correct it if it is wrong, then mark it as done.
        </p>
      </div>
      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={`${report.kind}:${report.questionId}`} className="rounded-xl bg-amber-50 p-3 text-sm dark:bg-amber-500/10">
            <p className="font-medium text-gray-900 dark:text-foreground">{report.text}</p>
            {report.answer && <p className="mt-1 text-xs text-gray-700 dark:text-foreground/80">Answer on file: {report.answer}</p>}
            <p className="mt-1 text-xs text-gray-500 dark:text-muted-foreground">
              {report.kind === 'daily' ? 'Daily quiz' : 'Question bank'} · {report.count} {report.count === 1 ? 'report' : 'reports'}
            </p>
            <ul className="mt-2 space-y-0.5 text-xs text-gray-700 dark:text-foreground/80">
              {report.reasons.slice(0, 5).map((item, index) => (
                <li key={index}>
                  {reasonLabel(item.reason)}
                  {item.note ? `: ${item.note}` : ''}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              {report.kind === 'daily' && (
                <Button asChild size="sm" className="rounded-full">
                  <Link href={`/admin/daily?edit=${report.questionId}`}>Fix this question</Link>
                </Button>
              )}
              <Button size="sm" variant="outline" className="rounded-full" disabled={resolve.isPending} onClick={() => resolve.mutate(report)}>
                Mark as done
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
