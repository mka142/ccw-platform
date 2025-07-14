"use client";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { MultiSelectWithOwnField } from "@/components/form/fields";

interface MultiSelectWithOwnFieldProps {
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}

export const SchemaMultiSelectWithOwnField: React.FC<
  MultiSelectWithOwnFieldProps
> = ({ name, options, required }) => {
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
        <MultiSelectWithOwnField
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
