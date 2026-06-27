import { cn } from "@/lib/utils";

interface CreditNotePageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function CreditNotePageHeader({
  title,
  description,
  className,
}: CreditNotePageHeaderProps) {
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
