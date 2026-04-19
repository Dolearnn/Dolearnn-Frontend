'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import { SelectWithOther } from '@/components/forms/SelectWithOther';
import { addChild, updateChild } from '@/lib/store/client';
import type { Child, GradeLevel } from '@/lib/types';

const grades: GradeLevel[] = [
  'Primary',
  'JSS',
  'SSS',
  'College Year 1',
  'College Year 2',
  'College Year 3',
  'College Year 4',
  'Other',
];

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your child&apos;s full name'),
    age: z.coerce.number().int().min(5, 'Minimum age 5').max(25, 'Maximum age 25'),
    grade: z.enum([
      'Primary',
      'JSS',
      'SSS',
      'College Year 1',
      'College Year 2',
      'College Year 3',
      'College Year 4',
      'Other',
    ]),
    gradeOther: z.string().optional(),
    school: z.string().optional(),
  })
  .refine(
    (v) => v.grade !== 'Other' || (v.gradeOther?.trim().length ?? 0) >= 2,
    {
      path: ['gradeOther'],
      message: 'Please specify the grade level',
    },
  );

type Values = z.infer<typeof schema>;

export default function ChildProfileForm({
  initial,
  mode,
}: {
  initial?: Child;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: initial?.fullName ?? '',
      age: initial?.age ?? 10,
      grade: initial?.grade ?? 'Primary',
      gradeOther: initial?.gradeOther ?? '',
      school: initial?.school ?? '',
    },
  });

  const onSubmit = (values: Values) => {
    const payload = {
      ...values,
      gradeOther: values.grade === 'Other' ? values.gradeOther?.trim() : undefined,
    };
    if (mode === 'create') {
      const child = addChild(payload);
      router.push(`/family/children/${child.id}/intake`);
    } else if (initial) {
      updateChild(initial.id, payload);
      router.push(`/family/children/${initial.id}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child&apos;s full name</FormLabel>
              <FormControl>
                <Input placeholder="Zara Okafor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input type="number" min={5} max={25} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade level</FormLabel>
                <FormControl>
                  <SelectWithOther
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as GradeLevel)}
                    otherValue={form.watch('gradeOther') ?? ''}
                    onOtherChange={(v) => form.setValue('gradeOther', v, { shouldValidate: true })}
                    options={grades}
                    placeholder="Select grade"
                    otherPlaceholder="e.g. Year 11 (UK), Homeschool"
                  />
                </FormControl>
                <FormMessage />
                <FormField
                  control={form.control}
                  name="gradeOther"
                  render={() => <FormMessage />}
                />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="school"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School name (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Bright Future Academy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-brand hover:bg-brand-600 rounded-full"
        >
          {mode === 'create' ? 'Continue to intake' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}
