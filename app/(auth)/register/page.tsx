import Link from 'next/link';
import RegisterForm from '@/components/forms/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-8 border border-gray-100 dark:border-border">
      <h1 className="text-2xl font-bold text-brand dark:text-accent2-400 mb-1">
        Create your account
      </h1>
      <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6">
        Sign up as a parent — we&apos;ll pair your child with the right teacher.
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-gray-600 dark:text-muted-foreground">
        Have an account?{' '}
        <Link
          href="/login"
          className="text-brand dark:text-accent2-400 font-semibold hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
