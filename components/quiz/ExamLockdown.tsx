'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock, Expand, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';

/*
 * Exam mode: the timed mock runs full screen and discourages cheating.
 *
 * - It starts from a rules screen; "Start exam" switches the browser to full
 *   screen and the exam covers the whole app (no sidebar or navigation).
 * - Leaving the tab or window, or leaving full screen, counts as a warning and
 *   shows a blocking notice. At MAX_WARNINGS the exam is submitted.
 * - Copy, cut, paste, right-click, text selection and common shortcuts
 *   (copy/paste/print/save/view-source/dev tools) are blocked.
 * - Closing or reloading the tab asks for confirmation; a reload during the
 *   exam is itself recorded as a warning.
 * Warnings are kept on the device per attempt, and shown with the results.
 * A browser cannot stop a second device; this blocks the easy routes and makes
 * the rest visible. The time limit itself is enforced by the server.
 */
export const MAX_WARNINGS = 3;

export type ExamRecord = {
  started: boolean;
  warnings: number;
  events: { type: 'left-tab' | 'left-fullscreen' | 'reloaded'; at: string }[];
};

const key = (attemptId: string) => `dolearn.exam.${attemptId}`;

export function readExamRecord(attemptId: string): ExamRecord | null {
  try {
    const raw = window.localStorage.getItem(key(attemptId));
    return raw ? (JSON.parse(raw) as ExamRecord) : null;
  } catch {
    return null;
  }
}

function writeExamRecord(attemptId: string, record: ExamRecord) {
  try {
    window.localStorage.setItem(key(attemptId), JSON.stringify(record));
  } catch {
    // Storage unavailable: warnings still work for this page view.
  }
}

const fullscreenSupported = () =>
  typeof document !== 'undefined' && typeof document.documentElement.requestFullscreen === 'function';

async function enterFullscreen() {
  if (!fullscreenSupported() || document.fullscreenElement) return;
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    // Refused (e.g. not from a click): the full-page overlay still applies.
  }
}

export function exitFullscreen() {
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    void document.exitFullscreen().catch(() => undefined);
  }
}

const BLOCKED_KEYS = new Set(['c', 'v', 'x', 'a', 'p', 's', 'u', 'f']);

/** Tracks the exam's state and enforces the lockdown while `active`. */
export function useExamLockdown({
  attemptId,
  active,
  onLimitReached,
}: {
  attemptId: string;
  active: boolean;
  onLimitReached: () => void;
}) {
  const [record, setRecord] = useState<ExamRecord>({ started: false, warnings: 0, events: [] });
  const [notice, setNotice] = useState<null | 'left-tab' | 'left-fullscreen'>(null);
  const lastWarning = useRef(0);
  const limitHandled = useRef(false);

  // Restore after a reload. Reloading mid-exam counts as a warning.
  useEffect(() => {
    const saved = readExamRecord(attemptId);
    if (!saved) return;
    if (saved.started) {
      const next: ExamRecord = {
        ...saved,
        warnings: saved.warnings + 1,
        events: [...saved.events, { type: 'reloaded', at: new Date().toISOString() }],
      };
      writeExamRecord(attemptId, next);
      setRecord(next);
      setNotice('left-fullscreen');
    } else {
      setRecord(saved);
    }
  }, [attemptId]);

  const warn = useCallback(
    (type: 'left-tab' | 'left-fullscreen') => {
      // A tab switch fires both "blur" and "hidden": count it once.
      const now = Date.now();
      if (now - lastWarning.current < 1500) return;
      lastWarning.current = now;
      setRecord((current) => {
        const next: ExamRecord = {
          ...current,
          warnings: current.warnings + 1,
          events: [...current.events, { type, at: new Date().toISOString() }],
        };
        writeExamRecord(attemptId, next);
        return next;
      });
      setNotice(type);
    },
    [attemptId],
  );

  const start = useCallback(async () => {
    await enterFullscreen();
    setRecord((current) => {
      const next = { ...current, started: true };
      writeExamRecord(attemptId, next);
      return next;
    });
  }, [attemptId]);

  const resume = useCallback(async () => {
    await enterFullscreen();
    setNotice(null);
  }, []);

  const running = active && record.started;

  useEffect(() => {
    if (!running) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') warn('left-tab');
    };
    const onBlur = () => warn('left-tab');
    const onFullscreen = () => {
      if (fullscreenSupported() && !document.fullscreenElement) warn('left-fullscreen');
    };
    const block = (event: Event) => event.preventDefault();
    const onKey = (event: KeyboardEvent) => {
      const k = event.key.toLowerCase();
      const combo = (event.ctrlKey || event.metaKey) && (BLOCKED_KEYS.has(k) || (event.shiftKey && ['i', 'j', 'c'].includes(k)));
      if (combo || k === 'f12' || k === 'printscreen' || k === 'contextmenu') {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreen);
    for (const name of ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart']) {
      document.addEventListener(name, block);
    }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreen);
      for (const name of ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart']) {
        document.removeEventListener(name, block);
      }
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [running, warn]);

  useEffect(() => {
    if (running && record.warnings >= MAX_WARNINGS && !limitHandled.current) {
      limitHandled.current = true;
      setNotice(null);
      onLimitReached();
    }
  }, [running, record.warnings, onLimitReached]);

  return { record, notice, start, resume, running };
}

/** The screen shown before an exam starts. */
export function ExamGate({
  examName,
  subject,
  questions,
  minutes,
  onStart,
}: {
  examName: string | null;
  subject: string;
  questions: number;
  minutes: number | null;
  onStart: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-brand text-white dark:bg-[hsl(208,70%,12%)]">
      <div aria-hidden className="pointer-events-none fixed -right-24 -top-24 h-80 w-80 rounded-full bg-accent2-400/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-full max-w-lg flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:justify-center">
        <Logo tone="light" size="sm" />
        <p className="mt-8 text-sm font-medium text-accent2-300">{examName ? `${examName}, exam mode` : 'Exam mode'}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">{subject}</h1>

        <dl className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <dd className="font-display text-4xl font-extrabold leading-none tabular-nums">{questions}</dd>
            <dt className="mt-1.5 text-sm text-white/70">questions</dt>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <dd className="font-display text-4xl font-extrabold leading-none tabular-nums">{minutes ?? '–'}</dd>
            <dt className="mt-1.5 text-sm text-white/70">{minutes ? 'minutes' : 'no time limit'}</dt>
          </div>
        </dl>

        <h2 className="mt-8 text-sm font-semibold text-white/90">Exam rules</h2>
        <ul className="mt-3 space-y-3.5 text-sm leading-6 text-white/80">
          <li className="flex gap-3"><Expand className="mt-1 h-4 w-4 flex-none text-accent2-300" /> The exam opens full screen and stays there until you submit.</li>
          <li className="flex gap-3"><AlertTriangle className="mt-1 h-4 w-4 flex-none text-amber-300" /> Leaving full screen or switching tabs or apps counts as a warning. After {MAX_WARNINGS} warnings your exam is submitted automatically.</li>
          <li className="flex gap-3"><ShieldCheck className="mt-1 h-4 w-4 flex-none text-accent2-300" /> Copying, pasting and right-clicking are turned off. Warnings appear on your results.</li>
          {minutes && <li className="flex gap-3"><Clock className="mt-1 h-4 w-4 flex-none text-accent2-300" /> The timer is already running and cannot be paused.</li>}
        </ul>

        <div className="mt-auto pt-8 sm:mt-10">
          <Button
            className="h-14 w-full rounded-2xl bg-accent2-400 text-base font-semibold text-brand-700 hover:bg-accent2-300"
            onClick={onStart}
          >
            Start exam
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Blocks the exam after the learner leaves the tab or full screen. */
export function ExamWarning({
  kind,
  warnings,
  onResume,
}: {
  kind: 'left-tab' | 'left-fullscreen';
  warnings: number;
  onResume: () => void;
}) {
  const left = Math.max(0, MAX_WARNINGS - warnings);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#022a49]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="exam-warning-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-card sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h2 id="exam-warning-title" className="mt-4 font-display text-xl font-bold text-gray-950 dark:text-foreground">
          {kind === 'left-tab' ? 'You left the exam' : 'You left full screen'}
        </h2>
        {/* One pip per allowed warning, filled as they are used. */}
        <div className="mt-4 flex justify-center gap-2" aria-hidden>
          {Array.from({ length: MAX_WARNINGS }, (_, i) => (
            <span key={i} className={i < warnings ? 'h-2 w-8 rounded-full bg-amber-500' : 'h-2 w-8 rounded-full bg-gray-200 dark:bg-white/10'} />
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-muted-foreground">
          Warning {warnings} of {MAX_WARNINGS}.{' '}
          {left > 0
            ? `${left} more and your exam will be submitted automatically.`
            : 'Your exam is being submitted.'}
        </p>
        <Button className="mt-6 h-12 w-full rounded-2xl text-[15px]" onClick={onResume}>
          Return to the exam
        </Button>
      </div>
    </div>
  );
}
