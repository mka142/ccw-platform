'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { useAudio } from '@/context/AudioContext';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Upload, Clock, Download, FileUp, Music, X, Type, Moon, Sun, Database } from 'lucide-react';
import { DataRecord } from '@/lib/types';

export default function SettingsTab() {
  const { config, setConfig, setRecordingStartTimestamp, downloadConfig, importConfig } = useDashboard();
  const { audioFile, setAudioFile, setAudioUrl, clearAudio } = useAudio();
  const { theme, toggleTheme } = useTheme();
  const { dataFile, setDataFile, setCustomData, clearData } = useData();
  
  const [recordingTimestamp, setRecordingTimestamp] = useState(
    config.recordingStartTimestamp?.toString() ?? ''
  );
  const [configTitle, setConfigTitle] = useState(config.title ?? '');

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const handleClearAudio = () => {
    clearAudio();
    const fileInput = document.getElementById('audio-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSetRecordingTimestamp = () => {
    const ts = parseInt(recordingTimestamp, 10);
    if (isNaN(ts) || ts < 0) {
      alert('Proszę wprowadzić prawidłowy nieujemny znacznik czasu');
      return;
    }
    setRecordingStartTimestamp(ts);
  };

  const handleClearRecordingTimestamp = () => {
    setRecordingStartTimestamp(undefined);
    setRecordingTimestamp('');
  };

  const handleUpdateConfigTitle = () => {
    setConfig({
      ...config,
      title: configTitle.trim() || undefined
    });
  };

  const handleDataFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content) as DataRecord[];
          
          // Validate data structure
          if (!Array.isArray(data)) {
            alert('Nieprawidłowy format danych. Oczekiwano tablicy.');
            return;
          }
          
          // Check if data has required fields
          const isValid = data.every(record => 
            typeof record.id === 'string' &&
            typeof record.timestamp === 'number' &&
            typeof record.value === 'number'
          );
          
          if (!isValid) {
            alert('Nieprawidłowa struktura danych. Każdy rekord musi zawierać: id (string), timestamp (number), value (number).');
            return;
          }
          
          setDataFile(file);
          setCustomData(data);
          alert(`Załadowano ${data.length} rekordów danych.`);
        } catch (error) {
          alert('Błąd podczas parsowania pliku JSON: ' + (error as Error).message);
        }
      };
      reader.readAsText(file);
      // Clear the input
      e.target.value = '';
    }
  };

  const handleClearData = () => {
    if (confirm('Czy na pewno chcesz wyczyścić załadowane dane? Aplikacja wróci do danych przykładowych.')) {
      clearData();
      const fileInput = document.getElementById('data-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      // Reload page to reset to sample data
      window.location.reload();
    }
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          importConfig(content);
        }
      };
      reader.readAsText(file);
      // Clear the input so the same file can be re-imported if needed
      e.target.value = '';
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {/* Dark Mode Toggle */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Ciemny Tryb
          </Label>
          <div className="flex items-center justify-between mt-2 p-3 border rounded-lg">
            <span className="text-sm text-muted-foreground">
              {theme === 'dark' ? 'Włączony' : 'Wyłączony'}
            </span>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Przełącz między jasnym a ciemnym motywem interfejsu
          </p>
        </div>

        <Separator />

        {/* Configuration Title */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Tytuł Konfiguracji
          </Label>
          <div className="space-y-3 mt-2">
            <div>
              <Input
                type="text"
                value={configTitle}
                onChange={e => setConfigTitle(e.target.value)}
                placeholder="np. Julia Łabowska Kwartet 28.10"
                className="text-sm"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleUpdateConfigTitle}
              disabled={configTitle === (config.title ?? '')}
            >
              Zapisz Tytuł
            </Button>
            {config.title && (
              <div className="bg-secondary p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Aktualny Tytuł</p>
                <p className="text-sm font-medium">{config.title}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Tytuł będzie wyświetlany na wykresie
            </p>
          </div>
        </div>

        <Separator />

        {/* Upload Data */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Prześlij Dane
          </Label>
          <div className="space-y-3 mt-2">
            {!dataFile ? (
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  id="data-upload"
                  type="file"
                  accept=".json"
                  onChange={handleDataFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="data-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Kliknij, aby przesłać plik JSON z danymi
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Format: {'[{id, timestamp, value}, ...]'}
                  </span>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-3 bg-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {dataFile.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearData}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(dataFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Prześlij własne dane w formacie JSON, aby zastąpić dane przykładowe
            </p>
          </div>
        </div>

        <Separator />

        {/* Upload Audio */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Music className="h-4 w-4" />
            Prześlij Nagranie Audio
          </Label>
          <div className="space-y-3 mt-2">
            {!audioFile ? (
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="audio-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Kliknij, aby przesłać plik audio
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    MP3, WAV lub inne formaty audio
                  </span>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-3 bg-secondary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Music className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {audioFile.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClearAudio}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Prześlij plik audio aby zsynchronizować z osią czasu wykresu
            </p>
          </div>
        </div>

        <Separator />

        {/* Recording Start Timestamp */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Znacznik Czasu Rozpoczęcia Nagrania
          </Label>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Znacznik Czasu Unix (sekundy)</Label>
              <Input
                type="number"
                value={recordingTimestamp}
                onChange={e => setRecordingTimestamp(e.target.value)}
                placeholder="np. 1234567890"
                className="text-sm mt-1"
                disabled={config.recordingStartTimestamp !== undefined}
              />
            </div>
            {config.recordingStartTimestamp === undefined ? (
              <Button
                className="w-full"
                onClick={handleSetRecordingTimestamp}
              >
                Ustaw Znacznik Czasu
              </Button>
            ) : (
              <>
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Aktualny Znacznik Czasu</p>
                  <p className="text-sm font-medium">{config.recordingStartTimestamp}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(config.recordingStartTimestamp * 1000).toLocaleString()}
                  </p>
                </div>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleClearRecordingTimestamp}
                >
                  Wyczyść Znacznik Czasu
                </Button>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              Ustaw czas rozpoczęcia nagrania aby wyrównać dane wykresu z czasem bezwzględnym
            </p>
          </div>
        </div>

        <Separator />

        {/* Export/Import Config */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4" />
            Zarządzanie Konfiguracją
          </Label>
          <div className="space-y-2 mt-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={downloadConfig}
            >
              <Download className="h-4 w-4 mr-2" />
              Eksportuj Konfigurację
            </Button>
            
            <div className="relative">
              <input
                id="config-upload"
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
              <label htmlFor="config-upload" className="w-full">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  asChild
                >
                  <div>
                    <FileUp className="h-4 w-4 mr-2" />
                    Importuj Konfigurację
                  </div>
                </Button>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Zapisz lub załaduj swoją konfigurację wraz z operacjami i ustawieniami
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
