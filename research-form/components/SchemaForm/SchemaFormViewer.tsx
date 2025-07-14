"use client";
import React from "react";
import { FormSchema } from "@/lib/formSchema";
import { renderSchemaFormPage, defaultFieldRenderer } from "./SchemaFormPage";
import type { renderFieldType } from "./SchemaFormPage";
import { FormProvider } from "@/components/form/FormProvider";

export interface SchemaFormViewerProps {
  schema: FormSchema;
  responseData: Record<string, unknown>;
  renderField: renderFieldType;
}

export const SchemaFormViewer: React.FC<SchemaFormViewerProps> = ({
  schema,
  responseData,
  renderField = defaultFieldRenderer,
}) => {
  return (
    <FormProvider defaultValues={responseData} disabled>
      <div>
        <h1
          className="font-bold font-serif text-2xl mb-2"
          dangerouslySetInnerHTML={{ __html: schema.formTitle }}
        />
        <div
          className="mb-4 text-gray-600"
          dangerouslySetInnerHTML={{ __html: schema.formDescription }}
        />
        <div role="divider" className="my-4 border-t border-gray-300" />
        {schema.formPages.map((page, idx) => (
          <React.Fragment key={idx}>
            {renderSchemaFormPage(page, idx, renderField)}
          </React.Fragment>
        ))}
      </div>
    </FormProvider>
  );
};
