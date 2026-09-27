import Link from 'next/link';
import RegisterForm from '@/components/forms/RegisterForm';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const fromPractice = from === 'practice';

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-border dark:bg-card">
      <h1 className="mb-1 text-2xl font-bold text-brand dark:text-accent2-400">
        {fromPractice ? 'Keep practising' : 'Create your account'}
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-muted-foreground">
        {fromPractice
          ? 'Create a free learner account to use the full question bank and track progress over time.'
          : 'Create a learner account for yourself, or a parent account to support someone else.'}
      </p>
      <RegisterForm nextPath="/family/children/new" />
      <p className="mt-6 text-sm text-gray-600 dark:text-muted-foreground">
        Have an account?{' '}
        <Link
          href={fromPractice ? '/login?next=practice' : '/login'}
          className="font-semibold text-brand hover:underline dark:text-accent2-400"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
