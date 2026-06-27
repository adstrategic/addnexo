"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearMoneda } from "@/lib/utils";
import type { MethodDatum, MonthlyRevenue } from "../schemas/BillingSchemas";

const STATUS_COLORS = {
  paid: "var(--chart-1)",
  pending: "var(--chart-3)",
  overdue: "var(--destructive)",
} as const;

// 1. Revenue Over Time (Composed Chart)
function RevenueChart({ data }: { data: MonthlyRevenue[] }) {
  return (
    <Card className="flex h-[260px] flex-col rounded-xl bg-card pt-2 shadow-sm transition-all hover:border-primary hover:shadow-md">
      <CardHeader className="z-10 flex-row items-center justify-between pb-0">
        <CardTitle className="text-[13px] font-semibold text-foreground">
          Revenue Over Time
        </CardTitle>
        <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            Revenue
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-2.5"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            Paid
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-2 flex-1 px-0 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickFormatter={(val: number) => `$${String(val / 1000)}k`}
            />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              content={({ active, payload, label }) => {
                const revenue = payload?.[0];
                if (!active || !revenue) return null;
                return (
                  <div className="rounded-lg border bg-popover p-3 text-[12px] text-popover-foreground shadow-xl">
                    <div className="mb-1 font-medium uppercase tracking-wider text-primary">
                      {label}
                    </div>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between gap-4">
                        <span>Revenue:</span>
                        <span>{formatearMoneda(Number(revenue.value))}</span>
                      </div>
                      <div className="flex justify-between gap-4 font-bold text-primary">
                        <span>Paid:</span>
                        <span>
                          {formatearMoneda(Number(payload?.[1]?.value ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="revenue"
              fill="var(--chart-1)"
              radius={[2, 2, 0, 0]}
              maxBarSize={30}
            />
            <Line
              type="monotone"
              dataKey="paid"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--chart-2)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// 2. Status Distribution (Donut)
function StatusDonut({
  stats,
}: {
  stats: { paid: number; pending: number; overdue: number };
}) {
  const data = [
    { name: "Paid", value: stats.paid, color: STATUS_COLORS.paid },
    { name: "Pending", value: stats.pending, color: STATUS_COLORS.pending },
    { name: "Overdue", value: stats.overdue, color: STATUS_COLORS.overdue },
  ].filter((d) => d.value > 0);
  const total = data.reduce((a, c) => a + c.value, 0);

  return (
    <Card className="flex h-[260px] flex-col rounded-xl bg-card pt-2 shadow-sm transition-all hover:border-primary hover:shadow-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-[13px] font-semibold text-foreground">
          Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="relative mt-0 flex flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 bottom-[30px] top-0 z-10 flex flex-col items-center justify-center">
          <span className="font-mono text-[20px] font-bold text-foreground">
            {total}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            invoices
          </span>
        </div>
        <div className="relative min-h-[160px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  const slice = payload?.[0];
                  if (!active || !slice) return null;
                  const value = Number(slice.value);
                  return (
                    <div className="rounded border bg-popover px-3 py-2 text-[12px] text-popover-foreground shadow-xl">
                      <div className="mb-1 font-medium uppercase tracking-wider text-primary">
                        {slice.name}
                      </div>
                      <div className="font-mono font-bold">
                        {value}{" "}
                        <span className="ml-1 font-sans text-[10px] text-muted-foreground">
                          ({total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="mb-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
          {data.map((entry, index) => (
            <li key={`legend-${index}`} className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-muted-foreground">
                {entry.name}{" "}
                <span className="ml-0.5 font-mono text-foreground/60">
                  {entry.value}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// 3. Payment Method (Horizontal Bar)
function PaymentMethodBar({ data }: { data: MethodDatum[] }) {
  const sorted = [...data].sort((a, b) => a.amount - b.amount).filter(
    (d) => d.amount > 0,
  );
  return (
    <Card className="flex h-[260px] flex-col rounded-xl bg-card pt-2 shadow-sm transition-all hover:border-primary hover:shadow-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-[13px] font-semibold text-foreground">
          Revenue by Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="relative mt-2 flex-1 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="method"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 500 }}
              width={80}
            />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              content={({ active, payload }) => {
                const bar = payload?.[0];
                if (!active || !bar) return null;
                const datum = bar.payload as MethodDatum;
                return (
                  <div className="rounded-lg border bg-popover p-2 text-[11px] text-popover-foreground shadow-xl">
                    <div className="mb-1 font-medium uppercase tracking-wider text-primary">
                      {datum.method}
                    </div>
                    <div className="font-mono font-bold">
                      {formatearMoneda(Number(bar.value))}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={16}>
              {sorted.map((_, index) => (
                <Cell key={`cell-${index}`} fill="var(--chart-1)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AnalyticsPanelProps {
  monthlyData: MonthlyRevenue[];
  statusStats: { paid: number; pending: number; overdue: number };
  methodData: MethodDatum[];
}

export function AnalyticsPanel({
  monthlyData,
  statusStats,
  methodData,
}: AnalyticsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-top-4 duration-300 md:grid-cols-3">
      <RevenueChart data={monthlyData} />
      <StatusDonut stats={statusStats} />
      <PaymentMethodBar data={methodData} />
    </div>
  );
}
