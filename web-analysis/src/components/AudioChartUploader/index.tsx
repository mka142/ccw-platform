"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { useAudio } from "@/context/AudioContext";
import Chart from "@/components/Chart";
import AudibleChart from "@/components/AudibleChart";

export default function AudioChartUploader() {
  const { config } = useDashboard();
  const { audioUrl } = useAudio();

  // If audio is loaded, show AudibleChart, otherwise show regular Chart
  if (audioUrl) {
    return (
      <div className="h-full">
        <AudibleChart
          audioUrl={audioUrl}
          recordingStartTimestamp={config.recordingStartTimestamp}
        />
      </div>
    );
  }

  // Show regular chart (audio upload/clear managed in Settings tab)
  return (
    <div className="h-full">
      <Chart recordingStartTimestamp={config.recordingStartTimestamp} />
    </div>
  );
}
