export default function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200 dark:bg-border" />
      <span className="text-xs font-medium text-gray-400 dark:text-muted-foreground">
        or
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-border" />
    </div>
  );
}
