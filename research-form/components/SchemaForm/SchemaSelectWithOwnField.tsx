import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectWithOwnField } from "@/components/form/fields";

interface SelectWithOwnFieldProps {
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}

export const SchemaSelectWithOwnField: React.FC<SelectWithOwnFieldProps> = ({
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
      defaultValue=""
      render={({ field }) => (
        <SelectWithOwnField
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
