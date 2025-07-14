import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import React, { useMemo } from "react";

const DISABLED_CLASS = "disabled:cursor-not-allowed disabled:opacity-50";

// Short text field (validation handled by React Hook Form)
export const ShortTextField: React.FC<
  React.ComponentProps<typeof Input> & { error?: string }
> = ({ error, ...rest }) => {
  return (
    <>
      <Input {...rest} aria-invalid={!!error} />
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </>
  );
};

// Long text field (validation handled by React Hook Form)
export const LongTextField: React.FC<
  React.ComponentProps<typeof Textarea> & { error?: string }
> = ({ error, ...rest }) => {
  return (
    <>
      <Textarea {...rest} aria-invalid={!!error} />
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </>
  );
};

interface SelectFieldProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  [key: string]: unknown; // Allow any other props to be passed
}
export const SelectField: React.FC<SelectFieldProps> = ({
  options,
  value,
  onChange,
  error,
  ...rest
}) => {
  return (
    <>
      <div className={`flex flex-wrap gap-2`}>
        {options.map((opt) => (
          <SelectButton
            key={opt}
            selected={value === opt}
            onClick={() => onChange(opt)}
            onBlur={rest.onBlur as React.FocusEventHandler<HTMLButtonElement>}
            {...rest}
          >
            {opt}
          </SelectButton>
        ))}
      </div>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </>
  );
};

interface MultiSelectFieldProps {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  [key: string]: unknown; // Allow any other props to be passed
}
export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  options,
  value = [],
  onChange,
  error,
  ...rest
}) => {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <SelectButton
            key={opt}
            selected={value.includes(opt)}
            onClick={() => toggle(opt)}
            rounded={false}
            onBlur={rest.onBlur as React.FocusEventHandler<HTMLButtonElement>}
            {...rest}
          >
            {opt}
          </SelectButton>
        ))}
      </div>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </>
  );
};

interface SelectWithOwnFieldProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  [key: string]: unknown; // Allow any other props to be passed
}
export const SelectWithOwnField: React.FC<SelectWithOwnFieldProps> = ({
  options,
  value,
  onChange,
  error,
  ...rest
}) => {
  const [custom, setCustom] = React.useState(false);
  return (
    <>
      <div className="flex flex-wrap gap-2 items-center">
        {options.map((opt) => (
          <SelectButton
            key={opt}
            selected={value === opt}
            onClick={() => {
              onChange(opt);
              setCustom(false);
            }}
            {...rest}
          >
            {opt}
          </SelectButton>
        ))}
        <SelectButton
          selected={value === "__own__"}
          onClick={() => {
            onChange("");
            setCustom(true);
          }}
          {...rest}
        >
          Inne...
        </SelectButton>
        {custom && (
          <div className="w-full mt-2">
            <Input
              className="w-full"
              placeholder="Wpisz własną odpowiedź"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              {...rest}
            />
          </div>
        )}
      </div>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </>
  );
};

interface MultiSelectWithOwnFieldProps {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  [key: string]: unknown; // Allow any other props to be passed
}
export const MultiSelectWithOwnField: React.FC<
  MultiSelectWithOwnFieldProps
> = ({ options, value, onChange, error, ...rest }) => {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  const customValue = useMemo(() => {
    if (!value || value.length === 0) return "";
    // remove options from value and check if custom is set
    const filtered = value.filter((v) => !options.includes(v));
    if (filtered.length === 1) {
      return filtered[0];
    }
    return "";
  }, [options, value]);

  const onChangeCustom = (custom: string) => {
    const filtered = value.filter((v) => options.includes(v));
    if (custom) {
      // add custom value if not empty
      onChange([...filtered, custom]);
    } else {
      // remove custom value if empty
      onChange(filtered);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <SelectButton
              key={opt}
              selected={value.includes(opt)}
              onClick={() => toggle(opt)}
              rounded={false}
              {...rest}
            >
              {opt}
            </SelectButton>
          ))}
        </div>
        <div className="flex flex-col mt-2 w-full">
          <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
            Inne
          </label>
          <Input
            {...rest}
            placeholder="Wpisz własną odpowiedź"
            value={customValue}
            onChange={(e) => onChangeCustom(e.target.value)}
          />
        </div>
      </div>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </>
  );
};

// Shared button for select/multiselect fields
interface SelectButtonProps {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  rounded?: boolean;
  className?: string;
  disabled?: boolean;
}
const SelectButton = ({
  selected,
  children,
  onClick,
  onBlur,
  rounded = true,
  className = "",
  disabled = false,
}: SelectButtonProps) => {
  return (
    <button
      type="button"
      className={
        `px-3 py-1 border transition-colors duration-150 focus:outline-none focus:ring-2 ` +
        `${rounded ? "rounded-full" : "rounded"} ` +
        `${
          selected
            ? "bg-field-selected text-field-text-selected border-field-selected hover:bg-field-selected-hover dark:hover:bg-field-selected-hover"
            : "bg-field-bg text-field-text border-field-border hover:bg-field-selected-hover/30 dark:hover:bg-field-selected-hover/30"
        } ` +
        `focus:ring-field-ring ` +
        `
        ${disabled ? DISABLED_CLASS : ""}` +
        className
      }
      onClick={onClick}
      onBlur={onBlur}
      aria-pressed={selected}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export { AudioSliderField } from "./AudioSliderField";
