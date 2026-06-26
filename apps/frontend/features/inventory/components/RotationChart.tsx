"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { InventoryLotRow } from "../schemas/InventorySchemas";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface RotationChartProps {
  data: InventoryLotRow[];
}

type RotationPoint = {
  date: string;
  displayDate: string;
} & Record<string, string | number>;

interface RotationTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: RotationPoint;
  }>;
}

export function RotationChart({ data }: RotationChartProps) {
  const chartData = useMemo(() => {
    const dateMap: Record<string, RotationPoint> = {};
    const sortedData = [...data]
      .filter((item) => item.purchaseDate)
      .sort(
        (a, b) =>
          new Date(a.purchaseDate).getTime() -
          new Date(b.purchaseDate).getTime(),
      );

    sortedData.forEach((item) => {
      const point = dateMap[item.purchaseDate] ?? {
        date: item.purchaseDate,
        displayDate: format(parseISO(item.purchaseDate), "MMM yyyy"),
      };
      if (!(item.product in point)) {
        point[item.product] = item.dio;
        point[`${item.product}_stock`] = item.stock;
      }
      dateMap[item.purchaseDate] = point;
    });

    return Object.values(dateMap);
  }, [data]);

  const existingProducts = useMemo(() => {
    const products = new Set<string>();
    data.forEach((d) => products.add(d.product));
    return Array.from(products);
  }, [data]);

  const colorForProduct = (product: string) =>
    CHART_COLORS[existingProducts.indexOf(product) % CHART_COLORS.length];

  const CustomTooltip = ({ active, payload }: RotationTooltipProps) => {
    const first = payload?.[0];
    if (!active || !first) return null;
    return (
      <div className="min-w-[200px] rounded-lg border bg-popover p-3 text-sm shadow-sm">
        <p className="mb-2 border-b pb-1 font-bold text-popover-foreground">
          {first.payload.displayDate}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="mb-2 flex flex-col last:mb-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-foreground">{entry.name}</span>
            </div>
            <div className="mt-1 flex justify-between gap-4 pl-4">
              <span className="text-muted-foreground">
                DIO:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {entry.value}
                </span>{" "}
                d
              </span>
              <span className="text-muted-foreground">
                Stock:{" "}
                <span className="font-mono text-primary">
                  {entry.payload[`${entry.name}_stock`]}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="flex h-[380px] flex-col rounded-xl bg-card pt-2 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold text-foreground">
          Rotación de producto (DIO)
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              dx={-10}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{
                fontSize: "12px",
                color: "var(--muted-foreground)",
                paddingTop: "10px",
              }}
            />

            {existingProducts.map((product) => (
              <Area
                key={product}
                type="monotone"
                dataKey={product}
                stroke={colorForProduct(product)}
                fill={colorForProduct(product)}
                fillOpacity={0.08}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
