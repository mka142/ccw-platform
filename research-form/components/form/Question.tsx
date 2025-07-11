import React from "react";

interface QuestionProps {
  title: string;
  description?: string;
  label?: string;
  field: React.ReactNode;
}

export const Question = ({
  title,
  description,
  label,
  field,
}: QuestionProps) => {
  return (
    <div className="mb-8 p-4 border rounded-lg bg-card  shadow">
      <div className="mb-2">
        <span className="font-semibold text-gray-800 dark:text-primary/80 text-lg">
          {title}
        </span>
      </div>
      {description && (
        <div className="mb-2 text-gray-600 dark:text-gray-700 text-sm">
          {description}
        </div>
      )}
      {label && (
        <label className="block font-medium mb-2 dark:text-primary/90">
          {label}
        </label>
      )}
      {field}
    </div>
  );
};
