'use client';

import React, { useState, useRef } from 'react';
import { useProject } from '@/context/ProjectContext';
import { useData } from '@/context/DataContext';
import { useAudio } from '@/context/AudioContext';
import { useDashboard } from '@/context/DashboardContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Upload, 
  Plus,
  X,
  Trash2,
  Save
} from 'lucide-react';

interface ProjectManagerProps {
  onClose?: () => void;
}

export default function ProjectManager({ onClose }: ProjectManagerProps) {
  const {
    currentProject,
    createProject,
    updateProject,
    clearProject,
    exportToFile,
    importFromFile,
  } = useProject();

  const { customData, dataFile, clearData, setCustomData } = useData();
  const { audioFile, clearAudio } = useAudio();
  const { config, getRawData } = useDashboard();

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert('Proszę podać nazwę projektu');
      return;
    }

    // Prepare audio data if exists
    let audioData;
    if (audioFile) {
      try {
        const reader = new FileReader();
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioFile);
        });

        audioData = {
          url: audioBase64,
          filename: audioFile.name,
        };
      } catch (error) {
        console.error('Failed to encode audio:', error);
      }
    }

    // Create project with all data (including re-records)
    const allData = getRawData();
    createProject(
      projectName, 
      projectDescription, 
      allData.length > 0 ? allData : (customData || []), 
      dataFile?.name,
      audioData,
      config
    );
    
    // Sync customData with rawData to keep UI in sync
    if (allData.length > 0) {
      setCustomData(allData);
    }
    
    setProjectName('');
    setProjectDescription('');
    setShowNewProjectForm(false);
    alert(`Projekt "${projectName}" utworzony pomyślnie!`);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ProjectContext will handle the sequential application of data, audio, and config
      await importFromFile(file, onClose);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearProject = () => {
    if (confirm('Czy na pewno chcesz zamknąć bieżący projekt? Dane i audio zostaną wyczyszczone.')) {
      clearProject();
      clearData();
      clearAudio();
      if (onClose) {
        onClose();
      }
    }
  };

  const handleSaveProject = async () => {
    if (!currentProject) {
      alert('Brak aktywnego projektu do zapisania');
      return;
    }

    // Prepare audio data if exists
    let audioData;
    if (audioFile) {
      try {
        const reader = new FileReader();
        const audioBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioFile);
        });

        audioData = {
          url: audioBase64,
          filename: audioFile.name,
        };
      } catch (error) {
        console.error('Failed to encode audio:', error);
      }
    }

    // Update project with current workspace state (including re-records)
    const allData = getRawData();
    updateProject(allData.length > 0 ? allData : (customData || []), dataFile?.name, audioData, config);
    
    // Sync customData with rawData to keep UI in sync
    if (allData.length > 0) {
      setCustomData(allData);
    }
    
    alert('Projekt zapisany pomyślnie!');
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Zarządzanie Projektem</h2>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Current Project Info */}
        {currentProject ? (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{currentProject.name}</h3>
                  {currentProject.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentProject.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Utworzono: {new Date(currentProject.createdAt).toLocaleString('pl-PL')}</p>
                <p>Zaktualizowano: {new Date(currentProject.updatedAt).toLocaleString('pl-PL')}</p>
                <p>Rekordy: {currentProject.data.length}</p>
                {currentProject.dataFilename && (
                  <p>Dane: {currentProject.dataFilename}</p>
                )}
                {currentProject.audio && (
                  <p>Audio: {currentProject.audio.filename}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="default"
                onClick={handleSaveProject}
              >
                <Save className="h-4 w-4 mr-2" />
                Zapisz
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={exportToFile}
              >
                <Download className="h-4 w-4 mr-2" />
                Eksportuj
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleClearProject}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Zamknij
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">Brak aktywnego projektu</p>
            <p className="text-sm">Utwórz nowy projekt lub zaimportuj istniejący</p>
          </div>
        )}

        {/* New Project Form */}
        {showNewProjectForm ? (
          <div className="p-4 border rounded-lg space-y-3">
            <h3 className="font-semibold">Nowy Projekt</h3>
            <div>
              <Label className="text-sm">Nazwa projektu *</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="np. Analiza nagrania 2024-11-16"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Opis (opcjonalnie)</Label>
              <Input
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Krótki opis projektu"
                className="mt-1"
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Projekt zostanie utworzony z aktualnie załadowanymi danymi, konfiguracją i plikiem audio.
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleCreateProject}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Utwórz Projekt
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setShowNewProjectForm(false);
                  setProjectName('');
                  setProjectDescription('');
                }}
              >
                Anuluj
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => setShowNewProjectForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Utwórz Nowy Projekt
          </Button>
        )}

        {/* Import Project */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importuj Projekt z Pliku
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Wczytaj wcześniej wyeksportowany projekt (.json)
          </p>
        </div>
      </div>
    </Card>
  );
}
