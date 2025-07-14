import React from "react";

interface TextListChartProps {
  values: string[];
}

export function TextListChart({ values }: TextListChartProps) {
  if (!values || values.length === 0) return <div>Brak odpowiedzi.</div>;
  return (
    <ul className="bg-background rounded p-4 shadow text-primary max-h-[250px] overflow-y-auto">
      {values.map((val, idx) => (
        <li key={idx} className="border-b py-2 last:border-b-0">
          {val}
        </li>
      ))}
    </ul>
  );
}