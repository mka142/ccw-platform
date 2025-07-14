"use client";
import React from "react";

import { SchemaFormViewer } from "@/components/SchemaForm/SchemaFormViewer";
import type { SchemaFormViewerProps } from "@/components/SchemaForm/SchemaFormViewer";
import { Field } from "@/lib/formSchema";
import { defaultFieldRenderer } from "@/components/SchemaForm/SchemaFormPage";
import { MusicSliderChart } from "@/components/charts/MusicSliderChart";
import { useFormContext } from "react-hook-form";

export const SchemaMusicSliderFieldViewer = ({ field }: { field: Field }) => {
  const { formState } = useFormContext();

  const defaultData = formState.defaultValues
    ? [formState.defaultValues[field.id as string]]
    : null;

  return (
    <MusicSliderChart
      formId={""}
      fieldId={field.id as string}
      audioSrc={field.audioSrc as string}
      height={350}
      width={100}
      defaultData={defaultData}
      defaultMaxValue={field.max ? field.max : null}
    />
  );
};
// Custom field renderer
const renderField = (field: Field, fieldIdx: string) => {
  if (field.type === "musicSlider") {
    // Use MusicSliderChart for musicSlider type
    return <SchemaMusicSliderFieldViewer field={field} />;
  }
  // Fallback to default field renderer
  return defaultFieldRenderer(field, fieldIdx);
};

type SchemaFormViewerWithMusicChart = Omit<
  SchemaFormViewerProps,
  "renderField"
>;

const SchemaFormViewerWithMusicChart: React.FC<
  SchemaFormViewerWithMusicChart
> = ({ schema, responseData }) => {
  return (
    <SchemaFormViewer
      schema={schema}
      responseData={responseData}
      renderField={renderField}
    />
  );
};

export { SchemaFormViewerWithMusicChart };
