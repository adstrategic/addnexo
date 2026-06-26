import { CircleHelp, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { KPIMetric } from "../schemas/InventorySchemas";

interface InventoryKpiCardProps {
  metric: KPIMetric;
  delay?: number;
}

export function InventoryKpiCard({ metric, delay = 0 }: InventoryKpiCardProps) {
  const isPositive = metric.delta > 0;
  const isNegative = metric.delta < 0;

  return (
    <Card
      className={cn(
        "relative overflow-visible rounded-xl border-l-4 border-l-primary bg-card",
        "shadow-sm transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary hover:shadow-md",
        "animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex h-full flex-col justify-between p-4 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-2">
          <span className="pr-1 text-sm font-semibold leading-snug text-muted-foreground">
            {metric.title}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    aria-label={`About ${metric.title}`}
                  >
                    <CircleHelp size={16} strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="end"
                  sideOffset={12}
                  collisionPadding={12}
                  className="z-[100] max-w-[260px] rounded-lg border-none bg-primary px-3 py-2.5 text-xs leading-relaxed text-primary-foreground shadow-xl"
                >
                  {metric.tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="p-1 text-primary">
              <metric.icon size={20} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
              {metric.value}
            </span>
            {metric.unit && (
              <span className="text-sm font-medium text-muted-foreground">
                {metric.unit}
              </span>
            )}
          </div>

          <div
            className={cn(
              "mt-2 flex items-center text-xs font-medium",
              isPositive
                ? "text-primary"
                : isNegative
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {isPositive ? (
              <TrendingUp size={14} className="mr-1" />
            ) : isNegative ? (
              <TrendingDown size={14} className="mr-1" />
            ) : (
              <Minus size={14} className="mr-1" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {metric.delta}%
            </span>
            <span className="ml-1 font-normal text-muted-foreground/70">
              vs last period
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
