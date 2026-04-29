import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-border dark:bg-card">
      <h1 className="mb-1 text-2xl font-bold text-brand dark:text-accent2-400">
        Reset password
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-muted-foreground">
        Choose a new password for your account.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
