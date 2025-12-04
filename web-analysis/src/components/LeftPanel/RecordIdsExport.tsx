"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";

interface RecordIdsExportProps {
  recordIds: string[];
  disabled?: boolean;
  fileNamePrefix?: string;
}

export default function RecordIdsExport({
  recordIds,
  disabled = false,
  fileNamePrefix = "record-ids",
}: RecordIdsExportProps) {
  const handleExportIds = () => {
    if (recordIds.length === 0) return;
    
    const idsText = recordIds.join("\n");
    const blob = new Blob([idsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    a.download = `${fileNamePrefix}-${dateStr}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (recordIds.length === 0) {
    return null;
  }

  const idsText = recordIds.join("\n");

  return (
    <div className="flex gap-2">
      <CopyButton
        textToCopy={idsText}
        disabled={disabled}
        size="sm"
        variant="outline"
        className="flex-1"
        title={`Kopiuj ${recordIds.length} ID rekordów do schowka`}
      >
        Kopiuj ID ({recordIds.length})
      </CopyButton>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExportIds}
        className="flex-1"
        disabled={disabled}
      >
        <Download className="h-3 w-3 mr-2" />
        Eksportuj
      </Button>
    </div>
  );
}

