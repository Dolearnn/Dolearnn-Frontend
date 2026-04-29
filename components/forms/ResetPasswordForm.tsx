'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { dashboardPathForRole, resetPassword } from '@/lib/api/auth';

const schema = z
  .object({
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { toast } = useToast();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: ({ user }) => {
      toast({
        title: 'Password reset',
        description: 'You can continue to your dashboard now.',
      });
      router.push(dashboardPathForRole(user.role));
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Could not reset password',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">
          This reset link is incomplete. Request a new one.
        </p>
        <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          mutation.mutate({
            token,
            newPassword: values.newPassword,
          }),
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
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
          {mutation.isPending ? 'Resetting...' : 'Reset password'}
        </Button>
      </form>
    </Form>
  );
}
