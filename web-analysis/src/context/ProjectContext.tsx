'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Config } from '@/lib/types';

export interface ProjectData {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  dataFilename?: string;
  data: Array<{ id: string; timestamp: number; value: number }>;
  config?: Config;
  audio?: {
    url: string; // Base64
    filename: string;
  };
}

type ApplyStep = 'data' | 'audio' | 'config';

interface PendingImportData {
  data?: ProjectData['data'];
  dataFilename?: string;
  audioUrl?: string;
  audioFilename?: string;
  config?: Config;
}

interface ApplyProcess {
  startApply: boolean;
  toApply: ApplyStep[];
  pendingData?: PendingImportData;
  onComplete?: () => void;
}

interface ProjectContextValue {
  currentProject: ProjectData | null;
  
  // Project management
  createProject: (name: string, description?: string, data?: ProjectData['data'], dataFilename?: string, audio?: ProjectData['audio'], config?: Config) => void;
  updateProject: (data: ProjectData['data'], dataFilename?: string, audio?: ProjectData['audio'], config?: Config) => void;
  clearProject: () => void;
  
  // Export/Import
  exportToFile: () => void;
  importFromFile: (file: File, onComplete?: () => void) => Promise<ProjectData | null>;
  
  // Apply process - for external context consumers
  applyProcess: ApplyProcess;
  
  // Register context setters from other contexts
  registerContextSetters: (setters: {
    setCustomData?: (data: ProjectData['data']) => void;
    setDataFile?: (file: File | null) => void;
    setAudioFile?: (file: File | null) => void;
  }) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  
  // State-driven apply process
  const [applyProcess, setApplyProcess] = useState<ApplyProcess>({
    startApply: false,
    toApply: [],
  });

  // Refs to hold the context setters that will be called during apply process
  const [contextSetters, setContextSetters] = useState<{
    setCustomData?: (data: ProjectData['data']) => void;
    setDataFile?: (file: File | null) => void;
    setAudioFile?: (file: File | null) => void;
  }>({});

  const registerContextSetters = useCallback((setters: {
    setCustomData?: (data: ProjectData['data']) => void;
    setDataFile?: (file: File | null) => void;
    setAudioFile?: (file: File | null) => void;
  }) => {
    setContextSetters(prev => ({ ...prev, ...setters }));
  }, []);

  // useEffect to handle sequential application of data, audio, and config
  useEffect(() => {
    if (!applyProcess.startApply || applyProcess.toApply.length === 0) {
      return;
    }

    const currentStep = applyProcess.toApply[0];
    const remainingSteps = applyProcess.toApply.slice(1);

    console.log(`[ProjectContext] Applying step: ${currentStep}`);

    const processNextStep = () => {
      if (remainingSteps.length === 0) {
        // All steps complete
        console.log('[ProjectContext] All import steps completed');
        const onComplete = applyProcess.onComplete;
        setApplyProcess({
          startApply: false,
          toApply: [],
        });
        
        if (onComplete) {
          onComplete();
        }
      } else {
        // Move to next step
        setApplyProcess(prev => ({
          ...prev,
          toApply: remainingSteps,
        }));
      }
    };

    if (currentStep === 'data' && applyProcess.pendingData?.data) {
      // Apply data
      if (contextSetters.setCustomData) {
        contextSetters.setCustomData(applyProcess.pendingData.data);
        console.log('[ProjectContext] Data applied with', applyProcess.pendingData.data.length, 'records');
        
        // Create a File object for the data if we have a filename
        if (applyProcess.pendingData.dataFilename && contextSetters.setDataFile) {
          const dataJson = JSON.stringify(applyProcess.pendingData.data, null, 2);
          const dataBlob = new Blob([dataJson], { type: 'application/json' });
          const newDataFile = new File([dataBlob], applyProcess.pendingData.dataFilename, { type: 'application/json' });
          contextSetters.setDataFile(newDataFile);
        }
      }

      processNextStep();
    } else if (currentStep === 'audio' && applyProcess.pendingData?.audioUrl) {
      // Apply audio
      const loadAudio = async () => {
        try {
          const response = await fetch(applyProcess.pendingData!.audioUrl!);
          const blob = await response.blob();
          const loadedAudioFile = new File(
            [blob], 
            applyProcess.pendingData!.audioFilename || 'audio.mp3', 
            { type: blob.type }
          );
          
          if (contextSetters.setAudioFile) {
            contextSetters.setAudioFile(loadedAudioFile);
          }
          console.log('[ProjectContext] Audio file loaded:', loadedAudioFile.name);

          processNextStep();
        } catch (error) {
          console.error('[ProjectContext] Failed to load audio:', error);
          alert('Nie udało się załadować pliku audio, ale dane projektu zostały zaimportowane.');
          
          processNextStep();
        }
      };

      loadAudio();
    } else if (currentStep === 'config' && applyProcess.pendingData?.config) {
      // Apply config (if needed in the future)
      console.log('[ProjectContext] Config would be applied here:', applyProcess.pendingData.config);
      
      processNextStep();
    } else {
      // Skip this step if no data
      processNextStep();
    }
  }, [applyProcess, contextSetters]);

  const createProject = useCallback((name: string, description?: string, data?: ProjectData['data'], dataFilename?: string, audio?: ProjectData['audio'], config?: Config) => {
    const newProject: ProjectData = {
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataFilename,
      data: data || [],
      config,
      audio,
    };
    
    setCurrentProject(newProject);
  }, []);

  const updateProject = useCallback((data: ProjectData['data'], dataFilename?: string, audio?: ProjectData['audio'], config?: Config) => {
    setCurrentProject(prev => {
      if (!prev) {
        console.warn('No current project to update');
        return prev;
      }
      
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        data,
        dataFilename: dataFilename || prev.dataFilename,
        config: config !== undefined ? config : prev.config,
        audio: audio !== undefined ? audio : prev.audio,
      };
    });
  }, []);

  const clearProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  const exportToFile = useCallback(() => {
    if (!currentProject) {
      alert('Brak projektu do eksportu');
      return;
    }

    const dataStr = JSON.stringify(currentProject, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [currentProject]);

  const importFromFile = useCallback(async (file: File, onComplete?: () => void): Promise<ProjectData | null> => {
    try {
      const text = await file.text();
      const importedProject: ProjectData = JSON.parse(text);
      
      // Validate structure
      if (!importedProject.name || !importedProject.data) {
        throw new Error('Nieprawidłowa struktura pliku projektu');
      }

      setCurrentProject(importedProject);
      
      // Prepare the apply sequence: data -> audio -> config
      const toApply: ApplyStep[] = [];
      const pendingData: PendingImportData = {};

      if (importedProject.data) {
        toApply.push('data');
        pendingData.data = importedProject.data;
        pendingData.dataFilename = importedProject.dataFilename;
      }

      if (importedProject.audio) {
        toApply.push('audio');
        pendingData.audioUrl = importedProject.audio.url;
        pendingData.audioFilename = importedProject.audio.filename;
      }

      if (importedProject.config) {
        toApply.push('config');
        pendingData.config = importedProject.config;
      }

      // Start the state-driven apply process
      if (toApply.length > 0) {
        console.log('[ProjectContext] Starting import process with steps:', toApply);
        setApplyProcess({
          startApply: true,
          toApply,
          pendingData,
          onComplete,
        });
      } else if (onComplete) {
        onComplete();
      }
      
      alert(`Projekt "${importedProject.name}" zaimportowany pomyślnie!`);
      return importedProject;
    } catch (error) {
      console.error('Failed to import project:', error);
      alert('Nie udało się zaimportować projektu. Sprawdź format pliku.');
      return null;
    }
  }, []);

  const value: ProjectContextValue = {
    currentProject,
    createProject,
    updateProject,
    clearProject,
    exportToFile,
    importFromFile,
    applyProcess,
    registerContextSetters,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
