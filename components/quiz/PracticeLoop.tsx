import { cn } from '@/lib/utils';

const STEPS = ['Assess', 'Diagnose', 'Practise', 'Compete', 'Support', 'Reassess'] as const;

export type PracticeLoopStep = (typeof STEPS)[number];

export default function PracticeLoop({ active }: { active: PracticeLoopStep }) {
  const activeIndex = STEPS.indexOf(active);

  return (
    <section className="mb-9 border-y border-gray-200 py-5 dark:border-border" aria-label="DoLearnn learning loop">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-muted-foreground">
            The learning loop
          </p>
          <p className="mt-1 text-sm text-gray-700 dark:text-foreground/80">
            Every result should lead to a useful next step.
          </p>
        </div>
        <span className="hidden text-xs text-gray-500 dark:text-muted-foreground sm:block">
          You are at <strong className="text-gray-900 dark:text-foreground">{active}</strong>
        </span>
      </div>

      <ol className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6">
        {STEPS.map((step, index) => {
          const current = index === activeIndex;
          return (
            <li key={step} className="relative">
              <div className="mb-2 flex items-center">
                <span
                  className={cn(
                    'relative z-10 flex h-7 w-7 items-center justify-center border text-xs font-bold',
                    current && 'border-brand bg-brand text-white dark:border-accent2-500 dark:bg-accent2-500 dark:text-brand',
                    !current && 'border-gray-300 bg-white text-gray-500 dark:border-border dark:bg-card',
                  )}
                  aria-current={current ? 'step' : undefined}
                >
                  {index + 1}
                </span>
                {index < STEPS.length - 1 && (
                  <span className="h-px flex-1 bg-gray-200 dark:bg-border" aria-hidden="true" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  current ? 'text-brand dark:text-accent2-400' : 'text-gray-600 dark:text-muted-foreground',
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
