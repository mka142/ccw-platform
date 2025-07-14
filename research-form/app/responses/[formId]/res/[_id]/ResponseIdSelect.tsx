"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useRouter } from "next/navigation";
import React from "react";

export default function ResponseIdSelect({
  formId,
  responseIds,
  currentId,
}: {
  formId: string;
  responseIds: string[];
  currentId: string;
}) {
  const router = useRouter();
  return (
    <Select
      value={currentId}
      onValueChange={(newId) => {
        if (newId) {
          router.push(`/responses/${formId}/res/${newId}`);
        }
      }}
    >
      <SelectTrigger className="w-full my-4">
        <SelectValue placeholder="Wybierz odpowiedź" />
      </SelectTrigger>
      <SelectContent>
        {responseIds.map((id, index) => (
          <SelectItem key={id} value={id}>
            Odpowiedź {index + 1}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
