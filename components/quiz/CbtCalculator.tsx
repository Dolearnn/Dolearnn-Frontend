'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Op = '+' | '−' | '×' | '÷';

const MAX_DIGITS = 12;

function apply(a: number, b: number, op: Op) {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

/** Fits a result on the display: trims float noise and switches to exponent form when long. */
function format(value: number) {
  if (!Number.isFinite(value)) return 'Error';
  const rounded = Number.parseFloat(value.toPrecision(10));
  const text = String(rounded);
  return text.length > MAX_DIGITS + 2 ? rounded.toExponential(6) : text;
}

/**
 * A basic calculator like the one on the exam computer: one operation at a
 * time, no memory, no scientific functions beyond square root and percent.
 */
export default function CbtCalculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  // True right after an operator or "=", so the next digit starts a new number.
  const [fresh, setFresh] = useState(true);

  const current = () => Number.parseFloat(display);

  const digit = (d: string) => {
    if (display === 'Error') {
      setDisplay(d === '.' ? '0.' : d);
      setFresh(false);
      return;
    }
    if (fresh) {
      setDisplay(d === '.' ? '0.' : d);
      setFresh(false);
      return;
    }
    if (d === '.' && display.includes('.')) return;
    if (display.replace(/[-.]/g, '').length >= MAX_DIGITS) return;
    setDisplay(display === '0' && d !== '.' ? d : display + d);
  };

  const operator = (next: Op) => {
    if (display === 'Error') return;
    if (stored !== null && op && !fresh) {
      const result = apply(stored, current(), op);
      setDisplay(format(result));
      setStored(Number.isFinite(result) ? result : null);
    } else {
      setStored(current());
    }
    setOp(next);
    setFresh(true);
  };

  const equals = () => {
    if (stored === null || !op || display === 'Error') return;
    setDisplay(format(apply(stored, current(), op)));
    setStored(null);
    setOp(null);
    setFresh(true);
  };

  const clear = () => {
    setDisplay('0');
    setStored(null);
    setOp(null);
    setFresh(true);
  };

  const unary = (fn: (n: number) => number) => {
    if (display === 'Error') return;
    setDisplay(format(fn(current())));
    setFresh(true);
  };

  const backspace = () => {
    if (fresh || display === 'Error') return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const keys: Array<{ label: string; press: () => void; kind?: 'op' | 'eq' | 'fn' }> = [
    { label: 'C', press: clear, kind: 'fn' },
    { label: '√', press: () => unary((n) => (n < 0 ? NaN : Math.sqrt(n))), kind: 'fn' },
    { label: '%', press: () => unary((n) => n / 100), kind: 'fn' },
    { label: '÷', press: () => operator('÷'), kind: 'op' },
    { label: '7', press: () => digit('7') },
    { label: '8', press: () => digit('8') },
    { label: '9', press: () => digit('9') },
    { label: '×', press: () => operator('×'), kind: 'op' },
    { label: '4', press: () => digit('4') },
    { label: '5', press: () => digit('5') },
    { label: '6', press: () => digit('6') },
    { label: '−', press: () => operator('−'), kind: 'op' },
    { label: '1', press: () => digit('1') },
    { label: '2', press: () => digit('2') },
    { label: '3', press: () => digit('3') },
    { label: '+', press: () => operator('+'), kind: 'op' },
    { label: '±', press: () => unary((n) => -n), kind: 'fn' },
    { label: '0', press: () => digit('0') },
    { label: '.', press: () => digit('.') },
    { label: '=', press: equals, kind: 'eq' },
  ];

  return (
    <div
      role="dialog"
      aria-label="Calculator"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-[75] w-[17rem] rounded-3xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-border dark:bg-card lg:bottom-6 lg:left-6 lg:right-auto"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-foreground">Calculator</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close calculator"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={backspace}
        title="Tap to delete the last digit"
        className="mb-2 block w-full truncate rounded-2xl bg-gray-950 px-3 py-3 text-right font-display text-3xl font-bold tabular-nums text-white dark:bg-black/40"
        aria-live="polite"
      >
        {display}
      </button>
      <div className="grid grid-cols-4 gap-1.5">
        {keys.map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={key.press}
            className={cn(
              'h-12 rounded-xl text-lg font-semibold transition-colors active:scale-95',
              key.kind === 'eq'
                ? 'bg-accent2-400 text-brand-700 hover:bg-accent2-300'
                : key.kind === 'op'
                  ? cn(
                      'bg-brand-50 text-brand hover:bg-brand-100 dark:bg-white/10 dark:text-accent2-300',
                      // Shows which operation is waiting for its second number.
                      op === key.label && fresh && 'ring-2 ring-brand dark:ring-accent2-400',
                    )
                  : key.kind === 'fn'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-foreground'
                    : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-white/5 dark:text-foreground dark:ring-border',
            )}
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
}
