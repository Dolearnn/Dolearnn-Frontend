import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-border dark:bg-card">
      <h1 className="mb-1 text-2xl font-bold text-brand dark:text-accent2-400">
        Forgot password
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-muted-foreground">
        Enter your email and we&apos;ll send you a secure reset link.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
