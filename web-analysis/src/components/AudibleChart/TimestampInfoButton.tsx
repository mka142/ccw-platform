"use client";

import React from "react";
import { Clock } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";

interface TimestampInfoButtonProps {
  recordingStartTimestamp?: number;
  audioDuration: number; // Duration in seconds
  disabled?: boolean;
}

export default function TimestampInfoButton({
  recordingStartTimestamp,
  audioDuration,
  disabled = false,
}: TimestampInfoButtonProps) {
  // Calculate timestamp info
  const getTimestampInfo = (): string => {
    if (!isFinite(audioDuration) || audioDuration <= 0) {
      return "";
    }

    const durationMs = Math.round(audioDuration * 1000);
    // recordingStartTimestamp is stored in seconds (Unix timestamp), convert to milliseconds
    const timestampMs = recordingStartTimestamp 
      ? recordingStartTimestamp * 1000 
      : Date.now();

    return `recordingStartTimestamp: ${timestampMs}\naudioDurationMs: ${durationMs}`;
  };

  const infoText = getTimestampInfo();
  const isDisabled = disabled || !isFinite(audioDuration) || audioDuration <= 0;

  if (isDisabled) {
    return null;
  }

  return (
    <CopyButton
      textToCopy={infoText}
      disabled={isDisabled}
      size="icon"
      variant="outline"
      className="h-8 w-8"
      showIconOnly={true}
      title="Pobierz znacznik czasu rozpoczęcia nagrania i długość audio"
    >
      {<Clock className="h-4 w-4" />}
    </CopyButton>
  );
}

