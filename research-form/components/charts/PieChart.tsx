import React from "react";
import { Pie, PieChart as RePieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

export interface PieChartProps {
  data: { label: string; value: number }[];
}

// Use CSS variables for chart colors as defined in globals.css
const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function PieChart({ data }: PieChartProps) {
  if (!data || data.length === 0) return <div>Brak odpowiedzi.</div>;
  const chartConfig = Object.fromEntries(
    data.map((entry, idx) => [
      entry.label,
      { color: CHART_COLORS[idx % CHART_COLORS.length], label: entry.label },
    ])
  );
  return (
    <div>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[250px] pb-0"
      >
        <RePieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            label
            animationDuration={400}
          >
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
              />
            ))}
          </Pie>
        </RePieChart>
      </ChartContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
        {data.map((entry, idx) => (
          <div key={entry.label} className="flex items-center gap-2">
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                background: CHART_COLORS[idx % CHART_COLORS.length],
                borderRadius: "4px",
              }}
            />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
