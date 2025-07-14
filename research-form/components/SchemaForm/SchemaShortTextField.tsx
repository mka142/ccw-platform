"use client";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ShortTextField } from "@/components/form/fields";

interface ShortTextFieldProps {
  name: string;
  label?: string;
  required?: boolean;
}

export const SchemaShortTextField: React.FC<ShortTextFieldProps> = ({
  name,
  // label,
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
        <ShortTextField
          {...field}
          required={required}
          error={touchedFields[name] && errors[name]?.message}
        />
      )}
      rules={required ? { required: "Pole jest wymagane" } : {}}
    />
  );
};
