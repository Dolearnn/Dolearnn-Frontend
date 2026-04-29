'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import AuthDivider from '@/components/forms/AuthDivider';
import GoogleAuthButton from '@/components/forms/GoogleAuthButton';
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
import { dashboardPathForRole, login } from '@/lib/api/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});

type Values = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ user }) => {
      toast({
        title: 'Welcome back',
        description: `Signed in as ${user.name}.`,
      });
      if (user.mustChangePassword) {
        router.push('/change-password');
        router.refresh();
        return;
      }
      router.push(dashboardPathForRole(user.role));
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Login failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: Values) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-4">
      <GoogleAuthButton mode="login" />
      <AuthDivider />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-brand hover:bg-brand-600 rounded-full"
          >
            {mutation.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
