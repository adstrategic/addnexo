"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ClipboardList, FilePen, Send, Truck } from "lucide-react";
import type { DispatchOrderTab } from "../hooks/useDispatchOrderListParams";

const TAB_CONFIG: {
  value: DispatchOrderTab;
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
    value: "unissued",
    label: "Unissued",
    icon: FilePen,
    activeClass:
      "data-[state=active]:bg-amber-50 data-[state=active]:text-amber-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-amber-950/50 dark:data-[state=active]:text-amber-300",
  },
  {
    value: "issued",
    label: "Issued",
    icon: Send,
    activeClass:
      "data-[state=active]:bg-violet-50 data-[state=active]:text-violet-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-violet-950/50 dark:data-[state=active]:text-violet-300",
  },
  {
    value: "dispatched",
    label: "Dispatched",
    icon: Truck,
    activeClass:
      "data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800 data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-950/50 dark:data-[state=active]:text-blue-300",
  },
];

const triggerBaseClass =
  "group flex-none cursor-pointer gap-1.5 rounded-lg border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground shadow-none transition-all duration-200 after:hidden hover:text-foreground data-[state=active]:border-transparent";

export function DispatchOrderStatusTabs() {
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
