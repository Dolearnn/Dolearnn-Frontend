import type { Metadata } from 'next';
import { Logo } from '@/components/brand/Logo';
import UnsubscribeCard from '@/components/landing/UnsubscribeCard';

export const metadata: Metadata = {
  title: 'Email reminders',
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; c?: string }>;
}) {
  const { u = '', c = '' } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f8fb] px-4 py-12">
      <Logo size="md" />
      <div className="mt-6 w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <UnsubscribeCard userId={u} code={c} />
      </div>
    </main>
  );
}
