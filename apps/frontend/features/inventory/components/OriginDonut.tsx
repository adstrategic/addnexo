"use client";

import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { OriginBreakdownItem } from "../schemas/InventorySchemas";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const colorForIndex = (index: number) =>
  CHART_COLORS[index % CHART_COLORS.length];

interface OriginDonutProps {
  originBreakdown: OriginBreakdownItem[];
  onCountryClick: (country: string) => void;
}

interface DonutDatum {
  name: string;
  value: number;
  percentage: number;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: DonutDatum & { fill?: string };
  }>;
}

export function OriginDonut({
  originBreakdown,
  onCountryClick,
}: OriginDonutProps) {
  const chartData = useMemo(
    () =>
      originBreakdown.map((entry) => ({
        name: entry.country,
        value: entry.stock,
        percentage: entry.percentage,
      })),
    [originBreakdown],
  );

  const totalStock = chartData.reduce((sum, entry) => sum + entry.value, 0);

  const CustomTooltip = ({ active, payload }: DonutTooltipProps) => {
    const data = payload?.[0];
    if (!active || !data) return null;
    const percentage =
      totalStock > 0 ? ((data.value / totalStock) * 100).toFixed(1) : 0;
    return (
      <div className="rounded-lg border bg-popover p-3 text-sm shadow-sm">
        <p className="flex items-center gap-2 font-bold text-popover-foreground">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.payload.fill }}
          />
          {data.name}
        </p>
        <p className="mt-1 text-muted-foreground">
          <span className="font-mono font-semibold text-primary">
            {data.value.toLocaleString()}
          </span>{" "}
          ({percentage}%)
        </p>
      </div>
    );
  };

  const renderLegend = (props: {
    payload?: Array<{
      value: string;
      color: string;
      payload: DonutDatum;
    }>;
  }) => {
    const { payload } = props;
    if (!payload) return null;
    return (
      <ul className="mt-4 flex justify-center gap-4 text-sm">
        {payload.map((entry, index) => {
          const percentage =
            totalStock > 0
              ? ((entry.payload.value / totalStock) * 100).toFixed(1)
              : 0;
          return (
            <li
              key={`item-${index}`}
              className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
              onClick={() => onCountryClick(entry.value)}
            >
              <span
                className="block h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-foreground">{entry.value}</span>
              <span className="font-medium text-primary">
                {entry.payload.value.toLocaleString()}
              </span>
              <span className="text-muted-foreground">({percentage}%)</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Card className="flex h-[380px] flex-col rounded-xl bg-card pt-2 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold text-foreground">
          Inventario por país
        </CardTitle>
      </CardHeader>
      <CardContent className="relative mt-4 flex-1">
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
          <span className="font-mono text-2xl font-bold text-foreground">
            {totalStock.toLocaleString()}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            total
          </span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              onClick={(entry) => onCountryClick(entry.name as string)}
              className="cursor-pointer outline-none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colorForIndex(index)} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend
              content={renderLegend as React.ComponentProps<typeof Legend>["content"]}
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
