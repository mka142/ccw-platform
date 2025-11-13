"use client";

import AnalysisDashboard from "@/components/AnalysisDashboard";
import { DashboardProvider } from "@/context/DashboardContext";
import { AudioProvider } from "@/context/AudioContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DataProvider, useData } from "@/context/DataContext";
import { createEmptyConfig } from "@/lib/sampleData";
import { useMemo } from "react";

function DashboardContent() {
  const { customData } = useData();
  const sampleData: never[] = [];

  // Use custom data if available, otherwise use sample data
  const activeData = customData || sampleData;

  const initialConfig = useMemo(() => {
    const uniqueIds = Array.from(new Set(activeData.map((r) => r.id)));
    return createEmptyConfig(uniqueIds);
  }, [activeData]);

  return (
    <DashboardProvider
      initialData={activeData}
      initialConfig={initialConfig}
      key={activeData.length}
    >
      <AudioProvider>
        <AnalysisDashboard />
      </AudioProvider>
    </DashboardProvider>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <DataProvider>
        <DashboardContent />
      </DataProvider>
    </ThemeProvider>
  );
}
