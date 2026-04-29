'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { forgotPassword } from '@/lib/api/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const { toast } = useToast();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast({
        title: 'Reset link sent',
        description:
          'If that email exists in DoLearn, a password reset link is on the way.',
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Could not send reset link',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-full bg-brand hover:bg-brand-600"
        >
          {mutation.isPending ? 'Sending...' : 'Send reset link'}
        </Button>
        <p className="text-center text-sm text-gray-600 dark:text-muted-foreground">
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </Form>
  );
}
