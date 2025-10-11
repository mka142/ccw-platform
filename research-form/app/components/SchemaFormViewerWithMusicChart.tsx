"use client";
import React from "react";

import { SchemaFormViewer } from "@/components/SchemaForm/SchemaFormViewer";
import type { SchemaFormViewerProps } from "@/components/SchemaForm/SchemaFormViewer";
import { Field } from "@/lib/formSchema";
import { defaultFieldRenderer } from "@/components/SchemaForm/SchemaFormPage";
import { MusicSliderChart } from "@/components/charts/MusicSliderChart";

export const SchemaMusicSliderFieldViewer = ({
  field,
  responseId,
  formId,
}: {
  field: Field;
  responseId: string;
  formId: string;
}) => {
  return (
    <MusicSliderChart
      formId={formId}
      fieldId={field.id as string}
      audioSrc={field.audioSrc as string}
      height={350}
      width={100}
      defaultMaxValue={field.max ? field.max : null}
      documentId={responseId} // Pass the document ID from form state
    />
  );
};
// Custom field renderer
const renderField = (
  field: Field,
  fieldIdx: string,
  responseId: string,
  formId: string
) => {
  if (field.type === "musicSlider") {
    // Use MusicSliderChart for musicSlider type
    return (
      <SchemaMusicSliderFieldViewer
        field={field}
        responseId={responseId}
        formId={formId}
      />
    );
  }
  // Fallback to default field renderer
  return defaultFieldRenderer(field, fieldIdx);
};

interface SchemaFormViewerWithMusicChart
  extends Omit<SchemaFormViewerProps, "renderField"> {
  responseId: string; // Optional response ID for fetching specific data
}

const SchemaFormViewerWithMusicChart: React.FC<
  SchemaFormViewerWithMusicChart
> = ({ schema, responseData, responseId }) => {
  return (
    <SchemaFormViewer
      schema={schema}
      responseData={responseData}
      renderField={(field, fieldIdx) =>
        renderField(field, fieldIdx, responseId, schema.formId)
      }
    />
  );
};

export { SchemaFormViewerWithMusicChart };
