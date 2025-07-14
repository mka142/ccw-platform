import React from "react";
import { FormProvider } from "@/components/form/FormProvider";
import { SchemaFormPages } from "./SchemaFormPages";
import { FormSchema } from "@/lib/formSchema";
import { FormLocalSaver } from "../form/FormLocalSaver";

interface SchemaFormProps {
  schema: FormSchema;
  onFinish?: (data: object) => Promise<boolean> | boolean;
}

export const SchemaForm: React.FC<SchemaFormProps> = ({ schema, onFinish }) => {
  return (
    <FormProvider>
      <FormLocalSaver storageKey="schema-form-data" />
      <SchemaFormPages schema={schema} onFinish={onFinish} />
    </FormProvider>
  );
};
