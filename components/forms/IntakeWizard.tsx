'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { saveIntake } from '@/lib/store/client';
import type { DayOfWeek, IntakeForm, PreferredSchedule, TimeBlock } from '@/lib/types';

const SUBJECTS = [
  'Maths',
  'English',
  'Science',
  'Coding',
  'Music',
  'French',
  'SAT',
  'Other',
] as const;

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_BLOCKS: TimeBlock[] = ['Morning', 'Afternoon', 'Evening'];
const TIMEZONES = [
  'UTC',
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
] as const;

const daySchema = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
const timeBlockSchema = z.enum(['Morning', 'Afternoon', 'Evening']);

const schema = z
  .object({
    subjects: z
      .array(
        z.enum([
          'Maths',
          'English',
          'Science',
          'Coding',
          'Music',
          'French',
          'SAT',
          'Other',
        ]),
      )
      .min(1, 'Pick at least one subject or skill'),
    subjectOther: z.string().optional(),
    learningGoal: z.enum([
      'Exam prep',
      'Catch up with school',
      'Learn a new skill',
      'General improvement',
    ]),
    currentLevel: z.enum(['Struggling', 'Average', 'Above average']),
    specificTopics: z.string().optional(),
    teacherGenderPref: z.enum(['No preference', 'Male', 'Female']),
    specialNotes: z.string().optional(),
    preferredSchedule: z
      .record(daySchema, timeBlockSchema)
      .refine((schedule) => Object.keys(schedule).length > 0, {
        message: 'Pick at least one day and time',
      }),
    timezone: z.enum(TIMEZONES),
    sessionsPerWeek: z.enum(['1', '2', '3', 'Flexible']),
    budget: z.enum(['Under $20', '$20–$35', '$35–$50', '$50+']),
  })
  .refine(
    (v) =>
      !v.subjects.includes('Other') ||
      (v.subjectOther?.trim().length ?? 0) >= 2,
    {
      path: ['subjectOther'],
      message: 'Please specify the subject',
    },
  );

type Values = z.infer<typeof schema>;

const steps = [
  { key: 'about', label: 'Learning needs' },
  { key: 'pref', label: 'Preferences' },
  { key: 'time', label: 'Availability & budget' },
] as const;

export default function IntakeWizard({ childId }: { childId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      subjects: [],
      subjectOther: '',
      learningGoal: 'Exam prep',
      currentLevel: 'Average',
      specificTopics: '',
      teacherGenderPref: 'No preference',
      specialNotes: '',
      preferredSchedule: {},
      timezone: 'UTC',
      sessionsPerWeek: '1',
      budget: '$20–$35',
    },
  });

  const fieldsPerStep: Record<number, (keyof Values)[]> = {
    0: ['subjects', 'subjectOther', 'learningGoal', 'currentLevel', 'specificTopics'],
    1: ['teacherGenderPref', 'specialNotes'],
    2: ['preferredSchedule', 'timezone', 'sessionsPerWeek', 'budget'],
  };

  const next = async () => {
    const ok = await form.trigger(fieldsPerStep[step]);
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = (values: Values) => {
    const firstPreferredDay =
      DAYS.find((day) => values.preferredSchedule[day]) ?? 'Mon';
    const intake: IntakeForm = {
      subject:
        values.subjects[0] === 'Other' && values.subjectOther?.trim()
          ? values.subjectOther.trim()
          : values.subjects[0],
      subjects: values.subjects,
      subjectOther:
        values.subjects.includes('Other') ? values.subjectOther?.trim() : undefined,
      learningGoal: values.learningGoal,
      currentLevel: values.currentLevel,
      specificTopics: values.specificTopics || undefined,
      teacherGenderPref: values.teacherGenderPref,
      specialNotes: values.specialNotes || undefined,
      preferredSchedule: values.preferredSchedule,
      preferredDays: DAYS.filter((day) => values.preferredSchedule[day]),
      preferredTime: values.preferredSchedule[firstPreferredDay] ?? 'Evening',
      timezone: values.timezone,
      sessionsPerWeek:
        values.sessionsPerWeek === 'Flexible'
          ? 'Flexible'
          : (Number(values.sessionsPerWeek) as 1 | 2 | 3),
      budget: values.budget,
    };
    saveIntake(childId, intake);
    router.push('/family');
  };

  return (
    <div className="space-y-6">
      <Stepper current={step} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && <StepA form={form} />}
          {step === 1 && <StepB form={form} />}
          {step === 2 && <StepAvailability form={form} />}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={next}
                className="bg-brand hover:bg-brand-600 rounded-full"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-brand hover:bg-brand-600 rounded-full"
              >
                Submit intake
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
              i <= current
                ? 'bg-brand text-white'
                : 'bg-gray-200 text-gray-500',
            )}
          >
            {i + 1}
          </span>
          <span
            className={cn(
              'text-sm hidden sm:inline',
              i === current ? 'text-brand font-medium' : 'text-gray-500',
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="w-6 sm:w-12 h-px bg-gray-200" />
          )}
        </li>
      ))}
    </ol>
  );
}

type FormApi = ReturnType<typeof useForm<Values>>;

function StepA({ form }: { form: FormApi }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="subjects"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subjects / skills needed</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUBJECTS.map((subject) => {
                  const checked = field.value?.includes(subject);
                  return (
                    <label
                      key={subject}
                      className={cn(
                        'flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm',
                        checked
                          ? 'border-brand bg-accent2-50 text-brand'
                          : 'border-gray-200',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const set = new Set(field.value ?? []);
                          if (value) set.add(subject);
                          else set.delete(subject);
                          field.onChange(Array.from(set));
                        }}
                      />
                      {subject}
                    </label>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
            {form.watch('subjects').includes('Other') && (
              <FormField
                control={form.control}
                name="subjectOther"
                render={({ field: otherField }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="e.g. Chess, Spanish, Guitar"
                        {...otherField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="learningGoal"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Learning goal</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Exam prep">Exam prep</SelectItem>
                <SelectItem value="Catch up with school">
                  Catch up with school
                </SelectItem>
                <SelectItem value="Learn a new skill">
                  Learn a new skill
                </SelectItem>
                <SelectItem value="General improvement">
                  General improvement
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="currentLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Current level</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                {(['Struggling', 'Average', 'Above average'] as const).map((v) => (
                  <label
                    key={v}
                    className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer has-[input:checked]:border-brand has-[input:checked]:bg-accent2-50"
                  >
                    <RadioGroupItem value={v} />
                    <span className="text-sm">{v}</span>
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="specificTopics"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specific topics (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g. struggles with algebra and word problems"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepB({ form }: { form: FormApi }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="teacherGenderPref"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teacher gender preference</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                {(['No preference', 'Male', 'Female'] as const).map((v) => (
                  <label
                    key={v}
                    className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer has-[input:checked]:border-brand has-[input:checked]:bg-accent2-50"
                  >
                    <RadioGroupItem value={v} />
                    <span className="text-sm">{v}</span>
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="specialNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special notes (optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g. shy, short attention span, needs extra patience"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepAvailability({ form }: { form: FormApi }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="preferredSchedule"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred days and times</FormLabel>
            <FormControl>
              <div className="space-y-2">
                {DAYS.map((d) => {
                  const schedule = (field.value ?? {}) as PreferredSchedule;
                  const checked = !!schedule[d];
                  return (
                    <div
                      key={d}
                      className={cn(
                        'grid grid-cols-[auto_1fr] sm:grid-cols-[120px_1fr] gap-3 items-center border rounded-lg px-3 py-3',
                        checked
                          ? 'border-brand bg-accent2-50'
                          : 'border-gray-200',
                      )}
                    >
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            const next: PreferredSchedule = { ...schedule };
                            if (c) next[d] = next[d] ?? 'Evening';
                            else delete next[d];
                            field.onChange(next);
                          }}
                        />
                        {d}
                      </label>
                      <Select
                        value={schedule[d]}
                        disabled={!checked}
                        onValueChange={(time) => {
                          field.onChange({
                            ...schedule,
                            [d]: time as TimeBlock,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_BLOCKS.map((block) => (
                            <SelectItem key={block} value={block}>
                              {block}
                              {block === 'Morning' && ' (6am-12pm)'}
                              {block === 'Afternoon' && ' (12pm-5pm)'}
                              {block === 'Evening' && ' (5pm-10pm)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TIMEZONES.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="sessionsPerWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sessions per week</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget per session</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Under $20">Under $20</SelectItem>
                  <SelectItem value="$20â€“$35">$20â€“$35</SelectItem>
                  <SelectItem value="$35â€“$50">$35â€“$50</SelectItem>
                  <SelectItem value="$50+">$50+</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function StepC({ form }: { form: FormApi }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="preferredSchedule"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preferred days and times</FormLabel>
            <FormControl>
              <div className="space-y-2">
                {DAYS.map((d) => {
                  const schedule = (field.value ?? {}) as PreferredSchedule;
                  const checked = !!schedule[d];
                  return (
                    <div
                      key={d}
                      className={cn(
                        'grid grid-cols-[auto_1fr] sm:grid-cols-[120px_1fr] gap-3 items-center border rounded-lg px-3 py-3',
                        checked
                          ? 'border-brand bg-accent2-50'
                          : 'border-gray-200',
                      )}
                    >
                      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(c) => {
                            const next: PreferredSchedule = { ...schedule };
                            if (c) next[d] = next[d] ?? 'Evening';
                            else delete next[d];
                            field.onChange(next);
                          }}
                        />
                        {d}
                      </label>
                      <Select
                        value={schedule[d]}
                        disabled={!checked}
                        onValueChange={(time) => {
                          field.onChange({
                            ...schedule,
                            [d]: time as TimeBlock,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_BLOCKS.map((block) => (
                            <SelectItem key={block} value={block}>
                              {block}
                              {block === 'Morning' && ' (6am-12pm)'}
                              {block === 'Afternoon' && ' (12pm-5pm)'}
                              {block === 'Evening' && ' (5pm-10pm)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TIMEZONES.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="sessionsPerWeek"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormLabel>Sessions per week</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Morning">Morning (6am–12pm)</SelectItem>
                  <SelectItem value="Afternoon">
                    Afternoon (12pm–5pm)
                  </SelectItem>
                  <SelectItem value="Evening">Evening (5pm–10pm)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sessionsPerWeek"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sessions per week</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="Flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="budget"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Budget per session</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Under $20">Under $20</SelectItem>
                <SelectItem value="$20–$35">$20–$35</SelectItem>
                <SelectItem value="$35–$50">$35–$50</SelectItem>
                <SelectItem value="$50+">$50+</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
