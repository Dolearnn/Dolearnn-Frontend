import ChangePasswordForm from '@/components/forms/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
      <h1 className="mb-1 font-display text-[26px] font-bold tracking-tight text-gray-950 dark:text-foreground">
        Change your password
      </h1>
      <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6">
        Use a private password before continuing to your dashboard.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
