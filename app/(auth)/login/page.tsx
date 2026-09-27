import Link from 'next/link';
import LoginForm from '@/components/forms/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next === 'practice' ? '/family/quiz' : undefined;

  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-border">
      <h1 className="text-2xl font-bold text-brand dark:text-accent2-400 mb-1">
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
