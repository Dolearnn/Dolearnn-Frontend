import PageHeader from '@/components/dashboard/PageHeader';

export default function NewChildPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Student profiles are created by admin"
        description="Families can update student details after admin creates the profile."
      />
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-6 text-sm text-gray-600 dark:text-muted-foreground">
        Please contact the admin team after payment confirmation. Once the
        student appears in your dashboard, you can update their profile and
        intake details.
      </div>
    </div>
  );
}
