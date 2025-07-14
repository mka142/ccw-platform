import React from "react";
import { BarChart as ReBarChart, Bar, XAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

export interface BarChartInteractiveProps {
  data: { label: string; value: number }[];
}

// Use CSS variables for chart colors as defined in globals.css
const CHART_COLOR = "var(--color-chart-1)";

function getChartData(data: { label: string; value: number }[]) {
  // Map to { label, value } format
  return data.map((entry) => ({
    label: entry.label,
    value: entry.value,
  }));
}

export function BarChartInteractive({ data }: BarChartInteractiveProps) {
  if (!data || data.length === 0) return <div>Brak odpowiedzi.</div>;
  const chartData = getChartData(data);
  const chartConfig = {
    value: { label: "Wartość" },
  };
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
      <ReBarChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[150px]"
              nameKey="value"
              labelFormatter={(value) => value}
            />
          }
        />
        <Bar dataKey="value" fill={CHART_COLOR} radius={5} />
      </ReBarChart>
    </ChartContainer>
  );
}