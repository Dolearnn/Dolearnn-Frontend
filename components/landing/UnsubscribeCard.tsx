'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { turnOffReminders } from '@/lib/api/public';

// Asks for one tap: email scanners open links automatically, and that must not unsubscribe anyone.
export default function UnsubscribeCard({ userId, code }: { userId: string; code: string }) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const validLink = Boolean(userId && code);

  const stop = async () => {
    setStatus('pending');
    try {
      await turnOffReminders({ userId, code });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <>
        <h1 className="text-2xl font-bold text-brand">Reminders are off</h1>
        <p className="mt-2 text-gray-600">
          We won&apos;t send you any more reminder emails. You can turn them back on under Notifications.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/student">Go to DoLearnn</Link>
        </Button>
      </>
    );
  }

  if (!validLink || status === 'error') {
    return (
      <>
        <h1 className="text-2xl font-bold text-brand">This link isn&apos;t working</h1>
        <p className="mt-2 text-gray-600">
          Log in and go to Notifications to turn off email reminders.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/login">Log in</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-brand">Stop reminder emails?</h1>
      <p className="mt-2 text-gray-600">
        You will stop getting emails about your streak and questions to try again. Your account and progress stay the same.
      </p>
      <Button className="mt-6 rounded-full" disabled={status === 'pending'} onClick={stop}>
        {status === 'pending' ? 'Saving…' : 'Stop reminders'}
      </Button>
    </>
  );
}
