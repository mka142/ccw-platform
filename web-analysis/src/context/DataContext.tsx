'use client';

import React, { createContext, useContext, useState } from 'react';
import { DataRecord } from '@/lib/types';

interface DataContextValue {
  dataFile: File | null;
  setDataFile: (file: File | null) => void;
  customData: DataRecord[] | null;
  setCustomData: (data: DataRecord[] | null) => void;
  clearData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [customData, setCustomData] = useState<DataRecord[] | null>(null);

  const clearData = () => {
    setDataFile(null);
    setCustomData(null);
  };

  const value: DataContextValue = {
    dataFile,
    setDataFile,
    customData,
    setCustomData,
    clearData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
