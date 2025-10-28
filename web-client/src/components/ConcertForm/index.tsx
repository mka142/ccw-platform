import React from "react";
import config from "@/config";
import { useUserId } from "@/providers/UserProvider";

interface ConcertFormProps {
  onFormSubmitted: () => void;
  onCancel: () => void;
  formComponent: React.ComponentType<any>;
  formId: string;
}

export default function ConcertForm({
  onFormSubmitted,
  onCancel,
  formComponent,
  formId,
}: ConcertFormProps) {
  const userId = useUserId();

  const handleFormSubmit = async (data: any) => {
    // use fetch with formExamination endpoint from config to send data
    const res = {
      userId: userId, // Replace with actual user ID
      formId: formId,
      answers: data,
    };
    try {
      const response = await fetch(config.api.examinationForm.submit, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(res),
      });
      if (response.ok) {
        onFormSubmitted();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      onFormSubmitted();
    }
  };

  const Component = formComponent;

  return (
    <div className="relative w-full h-full p-6 box-border touch-manipulation overflow-y-auto">
      <Component onSubmit={handleFormSubmit} onCancel={onCancel} />
      <div className="h-4"></div>
    </div>
  );
}
