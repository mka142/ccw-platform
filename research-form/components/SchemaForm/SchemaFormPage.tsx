import React from "react";
import { FormPage, Field } from "@/lib/formSchema";
import { Question } from "@/components/form/Question";
import { SchemaShortTextField } from "./SchemaShortTextField";
import { SchemaLongTextField } from "./SchemaLongTextField";
import { SchemaMultiSelectField } from "./SchemaMultiSelectField";
import { SchemaSelectField } from "./SchemaSelectField";
import { SchemaSelectWithOwnField } from "./SchemaSelectWithOwnField";
import { SchemaMultiSelectWithOwnField } from "./SchemaMultiSelectWithOwnField";
import { SchemaAudioSliderField } from "./SchemaAudioSliderField";
import { SchemaListSelectField } from "./SchemaListSelectField";
import FormPages from "../form/FormPages";

export type renderFieldType = (field: Field, name: string) => React.ReactNode;

export function defaultFieldRenderer(field: Field, name: string) {
  switch (field.type) {
    case "text":
      return (
        <SchemaShortTextField
          name={name}
          label={field.label}
          required={field.required}
        />
      );
    case "longText":
      return (
        <SchemaLongTextField
          name={name}
          label={field.label}
          required={field.required}
        />
      );
    case "choices":
      return (
        <SchemaMultiSelectField
          name={name}
          label={field.label}
          options={(field.options as string[]) || []}
          required={field.required}
        />
      );
    case "select":
      return (
        <SchemaSelectField
          name={name}
          label={field.label}
          options={(field.options as string[]) || []}
          required={field.required}
        />
      );
    case "listSelect":
      return (
        <SchemaListSelectField
          name={name}
          label={field.label}
          options={(field.options as string[]) || []}
          required={field.required}
        />
      );
    case "selectWithCustom":
      return (
        <SchemaSelectWithOwnField
          name={name}
          label={field.label}
          options={(field.options as string[]) || []}
          required={field.required}
        />
      );
    case "choicesWithCustom":
      return (
        <SchemaMultiSelectWithOwnField
          name={name}
          label={field.label}
          options={(field.options as string[]) || []}
          required={field.required}
        />
      );
    case "musicSlider":
      return (
        <SchemaAudioSliderField
          name={name}
          label={field.label}
          audioSrc={field.audioSrc || ""}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      );
    default:
      return null;
  }
}

export const SchemaFormPage: React.FC<{
  page: FormPage;
  pageIndex: number;
  renderField: renderFieldType;
}> = ({ page, pageIndex, renderField = defaultFieldRenderer }) => {
  return (
    <FormPages.Page title={page.title} description={page.description}>
      {page.fields.map((field, idx) => (
        <Question
          key={idx}
          title={field.title}
          label={field.label}
          field={renderField(field, `page${pageIndex}_field${idx}`)}
        />
      ))}
    </FormPages.Page>
  );
};

export const renderSchemaFormPage = (
  page: FormPage,
  pageIndex: number,
  renderField: renderFieldType = defaultFieldRenderer
) => {
  const fieldId = (field: Field, idx: number) => {
    if (field.id !== undefined) {
      return String(field.id);
    }
    return `page${pageIndex}_field${idx}`;
  };
  return (
    <FormPages.Page title={page.title} description={page.description}>
      {page.fields.map((field, idx) => (
        <Question
          key={idx}
          title={field.title}
          label={field.label}
          field={renderField(field, fieldId(field, idx))}
        />
      ))}
    </FormPages.Page>
  );
};
