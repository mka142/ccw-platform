import React from "react";

interface SelectListFieldProps {
  label: string;
  name: string;
  items: string[];
  values: Record<string, string>;
  onChange: (itemName: string, value: string) => void;
  options: string[];
  required?: boolean;
}

export default function SelectListField({
  label,
  name,
  items,
  values,
  onChange,
  options,
  required = false,
}: SelectListFieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label} {required && <span className="text-red-500">*</span>}{" "}
        <p className="text-xs text-gray-600">
          ({options.map((item) => item).join(", ")})
        </p>
      </label>
      <p className="text-xs text-gray-500 mb-4">
        To pole wymaga wybrania jednej opcji dla każdego z poniższych elementów.
      </p>

      <div className="flex gap-4">
        {/* Fixed field names column */}
        <div className="flex-shrink-0 w-32 sm:w-40">
          {/* Empty space for header */}
          <div className="h-6 mb-3"></div>
          {/* Item names */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="h-5 flex items-center">
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable options and radio buttons area */}
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header with option labels */}
            <div className="flex gap-3 mb-4">
              {options.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className="text-xs font-medium text-gray-600 w-16 text-center flex-shrink-0"
                >
                  {option}
                </div>
              ))}
            </div>

            {/* Radio button rows */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3">
                  {options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className="w-16 flex justify-center flex-shrink-0"
                    >
                      <label className="relative cursor-pointer">
                        <input
                          type="radio"
                          name={`${name}_${index}`}
                          value={option}
                          checked={values[item] === option}
                          onChange={(e) => onChange(item, e.target.value)}
                          className="sr-only"
                          required={required}
                        />
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center transition-all duration-200 hover:border-orange-400">
                          <div
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                              values[item] === option
                                ? "bg-orange-500 scale-100"
                                : "bg-transparent scale-0"
                            }`}
                          ></div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
