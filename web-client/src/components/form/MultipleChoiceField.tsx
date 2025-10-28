import React from "react";

interface MultipleChoiceFieldProps {
  label: string;
  name: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  allowOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  required?: boolean;
}

export default function MultipleChoiceField({
  label,
  name,
  options,
  values,
  onChange,
  allowOther = false,
  otherValue = "",
  onOtherChange,
  required = false,
}: MultipleChoiceFieldProps) {
  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange([...values, option]);
    } else {
      onChange(values.filter((v) => v !== option));
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <label key={index} className="flex items-center">
            <input
              type="checkbox"
              name={`${name}_${index}`}
              checked={values.includes(option)}
              onChange={(e) => handleCheckboxChange(option, e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">{option}</span>
          </label>
        ))}
        {allowOther && (
          <div className="flex items-center">
            <input
              type="checkbox"
              name={`${name}_other`}
              checked={!!otherValue}
              onChange={(e) => {
                if (!e.target.checked && onOtherChange) {
                  onOtherChange("");
                }
              }}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 mr-2">Other:</span>
            <input
              type="text"
              value={otherValue}
              onChange={(e) => onOtherChange?.(e.target.value)}
              placeholder="Podaj inną opcję..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}