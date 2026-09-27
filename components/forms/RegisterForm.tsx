'use client';

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
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/hooks/use-toast';
import { register } from '@/lib/api/auth';
import { saveGuestBaseline } from '@/lib/api/student';
import { readGuestBaseline } from '@/lib/guest-practice';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    name: z.string().min(2, 'Enter your full name'),
    accountType: z.enum(['STUDENT', 'PARENT']),
    email: z.string().email('Enter a valid email'),
    whatsapp: z
      .string()
      .refine((value) => value.length === 0 || value.length >= 7, 'Enter a valid phone number'),
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });

type Values = z.infer<typeof schema>;

export default function RegisterForm({ nextPath = '/family/children/new' }: { nextPath?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      accountType: 'STUDENT',
      email: '',
      whatsapp: '',
      password: '',
      confirm: '',
    },
  });

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: async ({ user }) => {
      toast({
        title: 'Account created',
        description: `Welcome to DoLearn, ${user.name}.`,
      });
      if (user.role === 'STUDENT') {
        const baseline = readGuestBaseline();
        if (baseline) await saveGuestBaseline(baseline).catch(() => null);
        router.push('/student/onboarding');
      } else {
        router.push(nextPath);
      }
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Registration failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: Values) => {
    mutation.mutate({
      name: values.name,
      accountType: values.accountType,
      email: values.email,
      whatsapp: values.whatsapp || undefined,
      password: values.password,
    });
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['STUDENT', 'A learner', 'I want to practise'],
                    ['PARENT', 'A parent', 'I support a learner'],
                  ] as const).map(([value, title, hint]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={field.value === value}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        'min-h-20 rounded-xl border p-3 text-left transition-colors',
                        field.value === value
                          ? 'border-brand bg-accent2-50 dark:border-accent2-400 dark:bg-accent2-500/10'
                          : 'border-gray-200 bg-white hover:border-brand/50 dark:border-border dark:bg-card',
                      )}
                    >
                      <span className="block text-sm font-semibold text-gray-950 dark:text-foreground">{title}</span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-muted-foreground">{hint}</span>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
      <GoogleAuthButton mode="register" nextPath={nextPath} accountType={form.watch('accountType')} />
      <AuthDivider />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input placeholder="Amara Okafor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch('accountType') === 'PARENT' && (
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone number <span className="font-normal text-gray-500">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+234 800 000 0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-brand hover:bg-brand-600 rounded-full"
          >
            {mutation.isPending ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
