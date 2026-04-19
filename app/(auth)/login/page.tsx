import Link from 'next/link';
import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-border">
      <h1 className="text-2xl font-bold text-brand dark:text-accent2-400 mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6">
        Log in to manage your child&apos;s learning journey.
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-gray-600 dark:text-muted-foreground">
        No account?{' '}
        <Link
          href="/register"
          className="text-brand dark:text-accent2-400 font-semibold hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
