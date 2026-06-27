import { cn } from "@/lib/utils";

interface DebitNotePageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function DebitNotePageHeader({
  title,
  description,
  className,
}: DebitNotePageHeaderProps) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
