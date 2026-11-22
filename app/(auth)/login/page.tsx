import Link from 'next/link';
import LoginForm from '@/components/forms/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next === 'practice' ? '/student/practice' : undefined;

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
      <h1 className="mb-1 font-display text-[26px] font-bold tracking-tight text-gray-950 dark:text-foreground">
        Welcome back
      </h1>
      <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6">
        {nextPath
          ? 'Log in to continue with the full practice experience.'
          : 'Log in to continue your DoLearnn journey.'}
      </p>
      <LoginForm nextPath={nextPath} />
      <p className="mt-6 text-sm text-gray-600 dark:text-muted-foreground">
        No account?{' '}
        <Link
          href={nextPath ? '/register?from=practice' : '/register'}
          className="text-brand dark:text-accent2-400 font-semibold hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
