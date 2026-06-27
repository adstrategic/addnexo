"use client";

import { AlertCircle, CheckCircle, DollarSign, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatearMoneda } from "@/lib/utils";

interface BillingKpiStripProps {
  totalInvoices: number;
  totalRevenue: number;
  paidAmount: number;
  outstandingAmount: number;
}

interface KpiItem {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  valueColor: string;
  tooltip: string;
}

export function BillingKpiStrip({
  totalInvoices,
  totalRevenue,
  paidAmount,
  outstandingAmount,
}: BillingKpiStripProps) {
  const kpis: KpiItem[] = [
    {
      id: "total-inv",
      title: "Total Invoices",
      value: totalInvoices.toLocaleString(),
      subtext: "All time invoices",
      icon: FileText,
      valueColor: "text-foreground",
      tooltip: "Total number of invoices issued in the system.",
    },
    {
      id: "total-rev",
      title: "Total Revenue",
      value: formatearMoneda(totalRevenue),
      subtext: "Total billed amount",
      icon: DollarSign,
      valueColor: "text-primary",
      tooltip: "Sum of all invoice amounts before tax.",
    },
    {
      id: "paid-amt",
      title: "Paid Amount",
      value: formatearMoneda(paidAmount),
      subtext: "Collected payments",
      icon: CheckCircle,
      valueColor: "text-primary",
      tooltip: "Total amount actually collected from all invoices.",
    },
    {
      id: "out-amt",
      title: "Outstanding",
      value: formatearMoneda(outstandingAmount),
      subtext: "Pending + Overdue",
      icon: AlertCircle,
      valueColor: "text-destructive",
      tooltip:
        "Total Revenue minus Paid Amount. Includes pending and overdue invoices.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <TooltipProvider delayDuration={200}>
        {kpis.map((kpi) => (
          <Tooltip key={kpi.id}>
            <TooltipTrigger asChild>
              <div className="flex min-h-[120px] cursor-default flex-col justify-between rounded-xl border border-l-4 border-l-primary bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                    {kpi.title}
                  </span>
                  <kpi.icon size={20} className={kpi.valueColor} />
                </div>

                <div>
                  <div
                    className={cn(
                      "mb-1 font-mono text-[28px] font-bold leading-none",
                      kpi.valueColor,
                    )}
                  >
                    {kpi.value}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {kpi.subtext}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent
              sideOffset={5}
              className="z-[100] border-none bg-primary px-3 py-2 text-xs text-primary-foreground"
            >
              {kpi.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
