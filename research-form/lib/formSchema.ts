// This file was generated from formSchema.json
// TypeScript type for the form schema

export interface FormSchema {
  formId: string;
  formTitle: string;
  formDescription: string;
  formPages: FormPage[];
}

export interface FormPage {
  title?: string;
  description?: string;
  fields: Field[];
}

export interface Field {
  title: string;
  description?: string;
  label?: string;
  type:
    | "text"
    | "longText"
    | "choices"
    | "select"
    | "listSelect"
    | "selectWithCustom"
    | "choicesWithCustom"
    | "musicSlider";
  audioSrc?: string;
  options?: Array<
    | string
    | {
        key: string;
        value: string;
      }
  >;
  required?: boolean;
  id?: number | string; // Optional ID for fields that need it
  defaultValue?: string | number | boolean | Array<string | number>;
}

export function validateUniqueId(form: FormSchema) {
  const ids = new Set<Field["id"]>();
  form.formPages.forEach((page) => {
    page.fields.forEach((field) => {
      if (field.id !== undefined) {
        if (ids.has(field.id)) {
          throw new Error(`Duplicate field ID found: ${field.id}`);
        }
        ids.add(field.id);
      }
    });
  });
}

export function validateEachFieldHasId(form: FormSchema) {
  form.formPages.forEach((page) => {
    page.fields.forEach((field) => {
      if (field.id === undefined) {
        throw new Error(
          `Field "${field.title}" is missing an ID. All fields must have a unique ID.`
        );
      }
    });
  });
}

export function setEachFieldRequired(form: FormSchema, required: boolean) {
  form.formPages.forEach((page) => {
    page.fields.forEach((field) => {
      field.required = required;
    });
  });
}
