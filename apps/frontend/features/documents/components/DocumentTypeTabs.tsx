"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FileText, Package, Truck } from "lucide-react";
import type { DocumentTab } from "../hooks/useDocumentListParams";

const TAB_CONFIG: {
  value: DocumentTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    value: "dispatch-order",
    label: "Dispatch Orders",
    icon: Truck,
    activeClass:
      "data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-950/50 dark:data-[state=active]:text-blue-300",
  },
  {
    value: "purchase-order",
    label: "Purchase Orders",
    icon: Package,
    activeClass:
      "data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-950/50 dark:data-[state=active]:text-emerald-300",
  },
  {
    value: "invoice",
    label: "Invoices",
    icon: FileText,
    activeClass:
      "data-[state=active]:bg-violet-50 data-[state=active]:text-violet-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-violet-950/50 dark:data-[state=active]:text-violet-300",
  },
];

const triggerBaseClass =
  "group flex-none cursor-pointer gap-1.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground shadow-none transition-all duration-200 after:hidden hover:text-foreground data-[state=active]:border-transparent";

export function DocumentTypeTabs() {
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
