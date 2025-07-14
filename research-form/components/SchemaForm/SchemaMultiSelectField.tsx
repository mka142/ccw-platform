"use client";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { MultiSelectField } from "@/components/form/fields";

interface MultiSelectFieldProps {
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}

export const SchemaMultiSelectField: React.FC<MultiSelectFieldProps> = ({
  name,
  options,
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
      defaultValue={[]}
      render={({ field }) => (
        <MultiSelectField
          {...field}
          options={options}
          required={required}
          error={touchedFields[name] && errors[name]?.message}
        />
      )}
      rules={required ? { required: "Pole jest wymagane" } : {}}
    />
  );
};
