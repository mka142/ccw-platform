import React, { createContext, useContext, useState, ReactNode } from "react";

interface FormContextType {
  questionIndex: number;
  nextIndex: () => number;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useFormContext = () => {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useFormContext must be used within FormProvider");
  return ctx;
};

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [index, setIndex] = useState(1);
  const nextIndex = () => {
    setIndex((i) => i + 1);
    return index;
  };
  return (
    <FormContext.Provider value={{ questionIndex: index, nextIndex }}>
      {children}
    </FormContext.Provider>
  );
};
