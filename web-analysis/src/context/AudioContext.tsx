"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useProject } from './ProjectContext';

interface AudioContextValue {
  audioFile: File | null;
  audioUrl: string | null;
  audioDuration: number | null; // Duration in seconds
  audioDurationMs: number | null; // Duration in milliseconds
  setAudioFile: (file: File | null) => void;
  setAudioUrl: (url: string | null) => void;
  setAudioDuration: (duration: number | null) => void;
  clearAudio: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
}

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [audioFile, setAudioFileState] = useState<File | null>(null);
  const [audioUrl, setAudioUrlState] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const { registerContextSetters } = useProject();


  const setAudioFile = useCallback((file: File | null) => {
    console.log("Setting audio file:", file);
    // Clean up old URL if exists
    setAudioUrlState(prevUrl => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });

    setAudioFileState(file);

    // Automatically create URL for the new file
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrlState(url);
    }
  }, []);

  // Register setters with ProjectContext on mount
  useEffect(() => {
    registerContextSetters({
      setAudioFile,
    });
  }, [registerContextSetters, setAudioFile]);

  const setAudioUrl = (url: string | null) => {
    setAudioUrlState(url);
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFileState(null);
    setAudioUrlState(null);
    setAudioDuration(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const value: AudioContextValue = {
    audioFile,
    audioUrl,
    audioDuration,
    audioDurationMs: audioDuration !== null ? Math.round(audioDuration * 1000) : null,
    setAudioFile,
    setAudioUrl,
    setAudioDuration,
    clearAudio,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
