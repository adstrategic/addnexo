import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Construction } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  title: string;
  description?: string;
  section?: string;
  icon?: LucideIcon;
  className?: string;
}

export function ComingSoon({
  title,
  description = "This module is under development. Check back soon for updates.",
  section,
  icon: Icon = Construction,
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 md:py-16",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-full overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-8 text-center shadow-lg backdrop-blur-sm md:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#1ECAD3]/10 blur-3xl motion-safe:animate-pulse"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 size-56 rounded-full bg-[#1ECAD3]/5 blur-3xl"
        />

        <div className="relative flex flex-col items-center gap-6">
          {section ? (
            <Badge
              variant="secondary"
              className="border border-[#1ECAD3]/20 bg-[#1ECAD3]/10 text-[#0F766E]"
            >
              {section}
            </Badge>
          ) : null}

          <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1ECAD3]/20 to-[#1ECAD3]/5 ring-1 ring-[#1ECAD3]/20 motion-safe:animate-[pulse_3s_ease-in-out_infinite]">
            <Icon className="size-10 text-[#0D9488]" aria-hidden />
          </div>

          <div className="space-y-3">
            <Badge
              variant="outline"
              className="border-[#1ECAD3]/30 text-[#0F766E]"
            >
              Coming soon
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          <Button asChild variant="outline" className="mt-2 cursor-pointer">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden />
              Back to shortcuts
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
