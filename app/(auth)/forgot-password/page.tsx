import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
      <h1 className="mb-1 font-display text-[26px] font-bold tracking-tight text-gray-950 dark:text-foreground">
        Forgot password
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-muted-foreground">
        Enter your email and we&apos;ll send you a secure reset link.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
