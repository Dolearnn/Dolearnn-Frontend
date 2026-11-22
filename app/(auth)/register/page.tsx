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
    <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
      <h1 className="mb-1 font-display text-[26px] font-bold tracking-tight text-gray-950 dark:text-foreground">
        {fromPractice ? 'Keep practising' : 'Create your account'}
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-muted-foreground">
        {fromPractice
          ? 'Create a free learner account to use the full question bank and track progress over time.'
          : 'One account for practice, the Arena, tutoring and progress.'}
      </p>
      <RegisterForm />
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
