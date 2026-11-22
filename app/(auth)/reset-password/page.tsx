import { Suspense } from 'react';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
      <h1 className="mb-1 font-display text-[26px] font-bold tracking-tight text-gray-950 dark:text-foreground">
        Reset password
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-muted-foreground">
        Choose a new password for your account.
      </p>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-muted" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
