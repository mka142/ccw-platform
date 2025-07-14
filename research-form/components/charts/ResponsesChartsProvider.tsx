"use client";
import React from "react";
import { TextListChart } from "./TextListChart";
import { BarChartHorizontal } from "./BarChartHorizontal";
import { PieChart } from "./PieChart";
import { BarChartInteractive } from "./BarChartInteractive";
import { Question } from "../form/Question";
import { FormSchema } from "@/lib/formSchema";
import { useInView } from "react-intersection-observer";
import { MusicSliderChart } from "./MusicSliderChart";

interface ResponsesChartsProviderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: Record<string, any>;
  formSchema: FormSchema;
}

function ChartQuestionInView({
  field,
  chart,
}: {
  field: FormSchema["formPages"][number]["fields"][number];
  chart: React.ReactNode;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  return (
    <div ref={ref}>
      <Question
        title={field.title}
        description={field.description}
        label={field.label}
        field={inView ? chart : null}
      />
    </div>
  );
}

export function ResponsesChartsProvider({
  formData,
  formSchema,
}: ResponsesChartsProviderProps) {
  return (
    <div className="flex flex-col gap-8">
      {formSchema.formPages.map((page, pageIdx) => (
        <React.Fragment key={pageIdx}>
          <div data-title="page container" className="space-y-4">
            <h2 className="text-2xl font-semibold">{page.title}</h2>
            <p
              className="text-gray-600"
              dangerouslySetInnerHTML={{ __html: page.description || "" }}
            />
            {/* Render charts for each field in the page */}
            {page.fields.map((field, fieldIdx) => {
              const values = formData[`formData${field.id}`] || [];
              let chart = null;
              if (field.type === "text" || field.type === "longText") {
                chart = <TextListChart values={values} />;
              } else if (
                field.type === "choices" ||
                field.type === "choicesWithCustom"
              ) {
                chart = (
                  <BarChartHorizontal
                    data={countValues(values, field.options as string[])}
                  />
                );
              } else if (
                field.type === "select" ||
                field.type === "selectWithCustom"
              ) {
                chart = (
                  <PieChart
                    data={countValues(values, field.options as string[])}
                  />
                );
              } else if (field.type === "listSelect") {
                chart = (
                  <BarChartInteractive
                    data={countValues(values, field.options as string[])}
                  />
                );
              } else if (field.type === "musicSlider") {
                chart = (
                  <MusicSliderChart
                    formId={formSchema.formId}
                    fieldId={field.id as string}
                    audioSrc={field.audioSrc as string}
                    defaultMaxValue={field.max ? field.max : null}
                  />
                );
              } else {
                chart = (
                  <div className="text-red-600">
                    Nieobsługiwany typ pola: {field.type}
                  </div>
                );
              }
              return (
                <ChartQuestionInView
                  key={fieldIdx}
                  field={field}
                  chart={chart}
                />
              );
            })}
          </div>
          <div role="divider" className="my-4 border-t border-gray-300" />
        </React.Fragment>
      ))}
    </div>
  );
}

function countValues(
  values: string[] | number[] | string[][] | number[][],
  options: string[]
): { label: string; value: number }[] {
  // Only support flat array options
  if (!Array.isArray(options))
    throw new Error("Field options must be a flat array.");
  const counts: Record<string, number> = {};
  options.forEach((opt) => {
    counts[opt] = 0;
  });
  values.forEach((val) => {
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (counts[v] !== undefined) counts[v]++;
      });
    } else {
      if (counts[val] !== undefined) counts[val]++;
    }
  });
  return options.map((opt) => ({ label: opt, value: counts[opt] }));
}
