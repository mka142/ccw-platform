"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AudioContextValue {
  audioFile: File | null;
  audioUrl: string | null;
  setAudioFile: (file: File | null) => void;
  setAudioUrl: (url: string | null) => void;
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

  console.log("AUDIO FILE:", audioFile);

  const setAudioFile = (file: File | null) => {
    console.log("Setting audio file:", file);
    // Clean up old URL if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrlState(null);
    }

    setAudioFileState(file);

    // Automatically create URL for the new file
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrlState(url);
    }
  };

  const setAudioUrl = (url: string | null) => {
    setAudioUrlState(url);
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioFileState(null);
    setAudioUrlState(null);
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
    setAudioFile,
    setAudioUrl,
    clearAudio,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}
