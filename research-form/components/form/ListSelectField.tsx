import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ListSelectFieldProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  [key: string]: unknown;
}

export const ListSelectField: React.FC<ListSelectFieldProps> = ({
  options,
  value = "",
  onChange,
  error,
  ...rest
}) => {
  return (
    <>
      <Select value={value} onValueChange={onChange} {...rest}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Wybierz..." />
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
    </>
  );
};
