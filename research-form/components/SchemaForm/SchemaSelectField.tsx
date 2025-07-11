import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectField } from "@/components/form/fields";

interface SelectFieldProps {
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}

export const SchemaSelectField: React.FC<SelectFieldProps> = ({
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
        <SelectField
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
