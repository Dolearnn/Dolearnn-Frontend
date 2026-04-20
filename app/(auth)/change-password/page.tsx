import ChangePasswordForm from '@/components/forms/ChangePasswordForm';

export default function ChangePasswordPage() {
  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-border">
      <h1 className="text-2xl font-bold text-brand dark:text-accent2-400 mb-1">
        Change your password
      </h1>
      <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6">
        Use a private password before continuing to your dashboard.
      </p>
      <ChangePasswordForm />
    </div>
  );
}
