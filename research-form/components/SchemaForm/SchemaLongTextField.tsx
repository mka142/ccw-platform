"use client";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { LongTextField } from "@/components/form/fields";

interface LongTextFieldProps {
  name: string;
  label?: string;
  required?: boolean;
}

export const SchemaLongTextField: React.FC<LongTextFieldProps> = ({
  name,
  required,
}) => {
  const {
    control,
    formState: { errors, touchedFields },
  } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field }) => (
        <LongTextField
          {...field}
          required={required}
          error={touchedFields[name] && errors[name]?.message}
        />
      )}
      rules={required ? { required: "Pole jest wymagane" } : {}}
    />
  );
};
