// /config/form.ts

import { FormSchema } from "@/lib/formSchema";

import form1 from "./form1";

const formSchemas = [form1];

export function getFormSchemaForId(formId: string): FormSchema | undefined {
  return formSchemas.find((form) => form.formId === formId);
}

export function getCustomFormSchema(): FormSchema {
  // Implement your custom logic to retrieve the form schema
  return form1;
}
