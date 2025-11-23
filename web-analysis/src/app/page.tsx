"use client";

import AnalysisDashboard from "@/components/AnalysisDashboard";
import { DashboardProvider } from "@/context/DashboardContext";
import { AudioProvider } from "@/context/AudioContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DataProvider, useData } from "@/context/DataContext";
import { ProjectProvider, useProject } from "@/context/ProjectContext";
import { createEmptyConfig } from "@/lib/sampleData";
import { useMemo } from "react";

function DashboardContent() {
  const { customData } = useData();
  const { currentProject } = useProject();

  // Use project data if available, otherwise use custom data or empty array
  const activeData = useMemo(() => {
    return customData || [];
  }, [customData]);

  const initialConfig = useMemo(() => {
    // Otherwise create empty config from active data
    const uniqueIds = Array.from(new Set(activeData.map((r) => r.id)));
    return createEmptyConfig(uniqueIds);
  }, [activeData]);

  const activeConfig = currentProject?.config || initialConfig;

  return (
    <DashboardProvider
      initialData={activeData}
      initialConfig={activeConfig}
      key={`${currentProject?.name}
        ${activeData.length}${JSON.stringify(activeConfig)}`}
    >
      {/* <ConfigSetter /> */}
      <AnalysisDashboard />
    </DashboardProvider>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <DataProvider>
          <AudioProvider>
            <DashboardContent />
          </AudioProvider>
        </DataProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
}
