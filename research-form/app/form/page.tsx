"use client";
import { motion } from "framer-motion";
import { SchemaForm } from "@/components/SchemaForm/SchemaForm";
import { getCurrentFormSchema } from "@/config/form";

export default function Page() {
  const formStartDate = new Date();

  const currentForm = getCurrentFormSchema();
  if (!currentForm) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">
          Formularz jest już niedostępny
        </h1>
      </div>
    );
  }

  const handleFormSubmit = async (data: object) => {
    const formEndDate = new Date();
    const formDuration = formEndDate.getTime() - formStartDate.getTime();
    console.log("Form submitted:", data);
    console.log("Form duration (minutes):", formDuration / 60000);
    await fetch("/api/submit-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formData: data,
        formStartDate: formStartDate.toISOString(),
        formEndDate: formEndDate.toISOString(),
        formId: currentForm.formId,
      }),
    });
    return true; // Indicate successful submission
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="max-w-2xl mx-auto py-10 px-4"
    >
      <SchemaForm schema={currentForm} onFinish={handleFormSubmit} />
    </motion.div>
  );
}
