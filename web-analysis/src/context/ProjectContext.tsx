'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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

interface ProjectContextValue {
  currentProject: ProjectData | null;
  
  // Project management
  createProject: (name: string, description?: string, data?: ProjectData['data'], dataFilename?: string, audio?: ProjectData['audio'], config?: Config) => void;
  updateProject: (data: ProjectData['data'], dataFilename?: string, audio?: ProjectData['audio'], config?: Config) => void;
  clearProject: () => void;
  
  // Export/Import
  exportToFile: () => void;
  importFromFile: (file: File) => Promise<ProjectData | null>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

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

  const importFromFile = useCallback(async (file: File): Promise<ProjectData | null> => {
    try {
      const text = await file.text();
      const importedProject: ProjectData = JSON.parse(text);
      
      // Validate structure
      if (!importedProject.name || !importedProject.data) {
        throw new Error('Nieprawidłowa struktura pliku projektu');
      }

      setCurrentProject(importedProject);
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
