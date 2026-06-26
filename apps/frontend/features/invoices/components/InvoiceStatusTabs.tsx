"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ClipboardList,
  CircleDot,
} from "lucide-react";
import type { InvoiceTab } from "../hooks/useInvoiceListParams";

const TAB_CONFIG: {
  value: InvoiceTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    value: "all",
    label: "All",
    icon: ClipboardList,
    activeClass:
      "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm",
  },
  {
    value: "active",
    label: "Active",
    icon: CircleDot,
    activeClass:
      "data-[state=active]:bg-amber-50 data-[state=active]:text-amber-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-amber-950/50 dark:data-[state=active]:text-amber-300",
  },
  {
    value: "paid",
    label: "Paid",
    icon: CheckCircle2,
    activeClass:
      "data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300",
  },
  {
    value: "overdue",
    label: "Overdue",
    icon: AlertCircle,
    activeClass:
      "data-[state=active]:bg-red-50 data-[state=active]:text-red-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-red-950/50 dark:data-[state=active]:text-red-300",
  },
  {
    value: "anulated",
    label: "Anulated",
    icon: Ban,
    activeClass:
      "data-[state=active]:bg-muted data-[state=active]:text-muted-foreground data-[state=active]:shadow-sm",
  },
];

const triggerBaseClass =
  "group flex-none cursor-pointer gap-1.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground shadow-none transition-all duration-200 after:hidden hover:text-foreground data-[state=active]:border-transparent";

export function InvoiceStatusTabs() {
  return (
    <TabsList
      variant="default"
      className="inline-flex h-auto w-max min-w-full gap-1 rounded-xl border border-border/60 bg-muted/50 p-1 sm:min-w-0"
    >
      {TAB_CONFIG.map(({ value, label, icon: Icon, activeClass }) => (
        <TabsTrigger
          key={value}
          value={value}
          className={cn(triggerBaseClass, activeClass)}
        >
          <Icon className="size-4 shrink-0 opacity-60 transition-opacity group-data-[state=active]:opacity-100" />
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
