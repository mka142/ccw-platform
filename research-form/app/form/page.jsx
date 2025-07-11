"use client";
import { motion } from "framer-motion";
import { SchemaForm } from "@/components/SchemaForm/SchemaForm";
import form1 from "./form1";
import { form } from "motion/react-client";

export default function Page() {
  const formStartDate = new Date();

  const handleFormSubmit = async (data) => {
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
        formId: form1.formId,
      }),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="max-w-2xl mx-auto py-10 px-4"
    >
      <SchemaForm schema={form1} onFinish={handleFormSubmit} />
    </motion.div>
  );
}
