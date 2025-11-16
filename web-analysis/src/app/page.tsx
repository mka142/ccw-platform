"use client";

import AnalysisDashboard from "@/components/AnalysisDashboard";
import { DashboardProvider } from "@/context/DashboardContext";
import { AudioProvider } from "@/context/AudioContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DataProvider, useData } from "@/context/DataContext";
import { ProjectProvider, useProject } from "@/context/ProjectContext";
import { createEmptyConfig } from "@/lib/sampleData";
import { useMemo, useEffect } from "react";

function DashboardContent() {
  const { customData, setCustomData } = useData();
  const { currentProject } = useProject();

  // Use project data if available, otherwise use custom data or empty array
  const activeData = customData || [];

  const initialConfig = useMemo(() => {
    // Use project config if available
    if (currentProject?.config) {
      return currentProject.config;
    }
    // Otherwise create empty config from active data
    const uniqueIds = Array.from(new Set(activeData.map((r) => r.id)));
    return createEmptyConfig(uniqueIds);
  }, [currentProject, activeData]);

  // Update customData when project is loaded
  useEffect(() => {
    if (currentProject?.data && currentProject.data.length > 0) {
      // Only update if the data is different
      if (JSON.stringify(customData) !== JSON.stringify(currentProject.data)) {
        setCustomData(currentProject.data);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.name]); // Only trigger when project changes

  return (
    <AudioProvider>
      <DashboardProvider
        initialData={activeData}
        initialConfig={initialConfig}
        key={currentProject?.name || activeData.length}
      >
        <AnalysisDashboard />
      </DashboardProvider>
    </AudioProvider>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <DataProvider>
          <DashboardContent />
        </DataProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
}
