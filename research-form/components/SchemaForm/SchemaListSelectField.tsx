import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ListSelectField } from "@/components/form/ListSelectField";

interface SchemaListSelectFieldProps {
  name: string;
  label?: string;
  options: string[];
  required?: boolean;
}

export const SchemaListSelectField: React.FC<SchemaListSelectFieldProps> = ({
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
        <ListSelectField
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
