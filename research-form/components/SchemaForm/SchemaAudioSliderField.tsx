"use client";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { AudioSliderField } from "@/components/form/fields";

interface AudioSliderFieldProps {
  name: string;
  label?: string;
  audioSrc: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

export const SchemaAudioSliderField: React.FC<AudioSliderFieldProps> = ({
  name,
  label,
  audioSrc,
  min = 0,
  max = 1000,
  step = 10,
  required,
}) => {
  const {
    control,
    // formState: { errors, touchedFields },
  } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field }) => (
        <AudioSliderField
          {...field}
          audioSrc={audioSrc}
          min={min}
          max={max}
          step={step}
          label={label}
          required={required}
          // error prop removed, AudioSliderField does not accept it
        />
      )}
      rules={required ? { required: "Pole jest wymagane" } : {}}
    />
  );
};
