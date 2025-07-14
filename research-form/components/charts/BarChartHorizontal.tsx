import React from "react";
import { BarChart as ReBarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

export interface BarChartHorizontalProps {
  data: { label: string; value: number }[];
}

// Map your data to the docs format
function getChartData(data: { label: string; value: number }[]) {
  return data.map((entry, idx) => ({
    browser: entry.label,
    visitors: entry.value,
    fill: `var(--color-chart-${(idx % 5) + 1})`,
  }));
}

// Build config for shadcn chart
function getChartConfig(data: { label: string; value: number }[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: any = {
    visitors: { label: "Wartość" },
  };
  data.forEach((entry, idx) => {
    config[entry.label] = {
      label: entry.label,
      color: `var(--color-chart-${(idx % 5) + 1})`,
    };
  });
  return config;
}

export function BarChartHorizontal({ data }: BarChartHorizontalProps) {
  if (!data || data.length === 0) return <div>Brak odpowiedzi.</div>;
  const chartData = getChartData(data);
  const chartConfig = getChartConfig(data);
  // Calculate dynamic width based on longest label
  const longestLabelLength = Math.max(...data.map((d) => d.label.length));
  const yAxisWidth = Math.ceil(Math.log10(longestLabelLength) * 153.136);
  return (
    <ChartContainer config={chartConfig} className="mx-auto max-h-[250px] pb-0">
      <ReBarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 0, right: 32 }}
      >
        <YAxis
          dataKey="browser"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => chartConfig[value]?.label || value}
          interval={0}
          width={yAxisWidth}
        />
        <XAxis dataKey="visitors" type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar
          dataKey="visitors"
          layout="vertical"
          radius={5}
          label={{
            position: "right",
            fill: "var(--color-foreground)",
            fontSize: 14,
            formatter: (value: number) => value,
          }}
        />
      </ReBarChart>
    </ChartContainer>
  );
}