import React from "react";
import { useForm, FormProvider as RHFProvider } from "react-hook-form";

export function FormProvider({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}) {
  const methods = useForm({ mode: "onChange", defaultValues });
  return <RHFProvider {...methods}>{children}</RHFProvider>;
}

export { useFormContext } from "react-hook-form";
