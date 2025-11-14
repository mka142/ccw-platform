'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  DataRecord,
  Config,
  DashboardContextValue,
  OperationMode,
  ProcessedRecord,
  RecordMetadata,
  GlobalOperation,
  RecordOperation,
  InterpolationMethod,
  ChartVisualizationMode,
  DataSet,
  ResamplingConfig
} from '@/lib/types';
import {
  groupRecordsById,
  applyOperation,
  applyOffsets,
  applyGlobalOperation,
  resampleData
} from '@/lib/dataOperations';

// Utility function to parse prefixed record IDs
export interface ParsedRecordId {
  isSet: boolean;
  setName: string | null;
  originalId: string;
  fullId: string;
}

export function parseRecordId(prefixedId: string): ParsedRecordId {
  const colonIndex = prefixedId.indexOf(':');
  
  if (colonIndex === -1) {
    // No prefix, it's a raw ID
    return {
      isSet: false,
      setName: null,
      originalId: prefixedId,
      fullId: prefixedId,
    };
  }
  
  const prefix = prefixedId.substring(0, colonIndex);
  const originalId = prefixedId.substring(colonIndex + 1);
  
  // Check if it's a global prefix or a set name
  const isGlobal = prefix === 'global';
  
  return {
    isSet: !isGlobal,
    setName: isGlobal ? null : prefix,
    originalId,
    fullId: prefixedId,
  };
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}

interface DashboardProviderProps {
  children: React.ReactNode;
  initialData: DataRecord[];
  initialConfig: Config;
}

export function DashboardProvider({
  children,
  initialData,
  initialConfig
}: DashboardProviderProps) {
  const [rawData] = useState<DataRecord[]>(initialData);
  const [config, setConfig] = useState<Config>(initialConfig);
  const [mode, setMode] = useState<OperationMode>('global');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const [chartVisualizationMode, setChartVisualizationMode] = useState<ChartVisualizationMode>('linear');
  const [currentSet, setCurrentSetState] = useState<string | null>(null);

  // Get current set configuration
  const currentSetConfig = useMemo(() => {
    if (!currentSet) return null;
    return config.sets.find(s => s.name === currentSet) || null;
  }, [currentSet, config.sets]);

  // Get effective configuration (set-specific or global)
  const effectiveResampling = currentSetConfig?.resampling || config.resampling;
  const effectiveRecordMetadata = currentSetConfig?.recordMetadata || config.recordMetadata;
  const effectiveGlobalOperations = currentSetConfig?.globalOperations || config.globalOperations;
  const effectiveFilterByIds = currentSetConfig?.filterByIds || config.filterByIds;

  // Create a complete effective config object for easy consumption
  const effectiveConfig = useMemo(() => ({
    resampling: effectiveResampling,
    recordMetadata: effectiveRecordMetadata,
    globalOperations: effectiveGlobalOperations,
    filterByIds: effectiveFilterByIds
  }), [effectiveResampling, effectiveRecordMetadata, effectiveGlobalOperations, effectiveFilterByIds]);

  // Helper function to process data for a specific configuration
  const processDataForConfig = useCallback(
    (
      recordMetadata: Record<string, RecordMetadata>,
      resampling: ResamplingConfig,
      globalOperations: GlobalOperation[],
      filterByIds: string[],
      filterByTags: string[],
      idPrefix: string = '' // Prefix to make IDs unique across sets
    ): ProcessedRecord[] => {
      // Group raw data by ID
      const groupedData = groupRecordsById(rawData);
      
      // Step 1: Apply individual record operations
      const individuallyProcessed: ProcessedRecord[] = [];
      
      groupedData.forEach((records, id) => {
        const metadata = recordMetadata[id];
        if (!metadata) return;

        // Convert to data points
        let data = records.map(r => ({ timestamp: r.timestamp, value: r.value }));
        const originalData = [...data];

        // Apply individual operations
        metadata.operations.forEach(operation => {
          data = applyOperation(data, operation);
        });

        // Apply offsets
        if (metadata.xMove !== 0 || metadata.yMove !== 0) {
          data = applyOffsets(data, metadata.xMove, metadata.yMove);
        }

        // Add prefix to ID to ensure uniqueness
        const prefixedId = idPrefix ? `${idPrefix}:${id}` : id;
        individuallyProcessed.push({ id: prefixedId, data, originalData });
      });

      // Step 2: Apply filters
      let filtered = individuallyProcessed;

      // Filter by IDs (need to check with prefix)
      if (filterByIds.length > 0) {
        filtered = filtered.filter(p => {
          // Extract original ID (remove prefix if present)
          const originalId = idPrefix ? p.id.replace(`${idPrefix}:`, '') : p.id;
          return filterByIds.includes(originalId);
        });
      }

      // Filter by tags
      if (filterByTags.length > 0) {
        filtered = filtered.filter(p => {
          const originalId = idPrefix ? p.id.replace(`${idPrefix}:`, '') : p.id;
          const metadata = recordMetadata[originalId];
          return metadata && metadata.tags.some(tag => filterByTags.includes(tag));
        });
      }

      // Step 3: Apply resampling if enabled
      if (resampling.applied) {
        filtered = filtered.map(record => ({
          ...record,
          data: resampleData(
            record.data,
            resampling.windowMs,
            resampling.interpolationMethod
          )
        }));
      }

      // Step 4: Apply global operations (only if resampling is applied)
      if (globalOperations.length > 0) {
        if (!resampling.applied) {
          // Don't apply global operations without resampling
          console.warn('Global operations require resampling to be applied first');
          return filtered;
        }
        
        let result = filtered;
        globalOperations.forEach(operation => {
          result = applyGlobalOperation(
            result.map(p => ({ id: p.id, data: p.data })),
            operation
          ).map(r => ({
            id: `${idPrefix}:${r.id}`,
            data: r.data,
            originalData: filtered.find(p => p.id === r.id)?.originalData || [],
            label: operation.label // Attach operation label
          }));
        });
        return result;
      }

      return filtered;
    },
    [rawData]
  );

  // Process data based on config and current set
  // Memoize global data separately
  const globalProcessedData = useMemo(() => {
    if (!config.visible.records) return [];
    
    return processDataForConfig(
      config.recordMetadata,
      config.resampling,
      config.globalOperations,
      config.filterByIds,
      config.filterByTags,
      'global'
    );
  }, [
    config.visible.records,
    config.recordMetadata,
    config.resampling,
    config.globalOperations,
    config.filterByIds,
    config.filterByTags,
    processDataForConfig
  ]);

  // Memoize sets data separately
  const setsProcessedData = useMemo(() => {
    const allSetsData: ProcessedRecord[] = [];
    config.sets.forEach(set => {
      if (set.visible) {
        const setData = processDataForConfig(
          set.recordMetadata,
          set.resampling,
          set.globalOperations,
          set.filterByIds,
          [],
          set.name
        );
        allSetsData.push(...setData);
      }
    });
    return allSetsData;
  }, [
    config.sets,
    processDataForConfig
  ]);

  // Memoize current set data separately
  const currentSetProcessedData = useMemo(() => {
    if (!currentSet) return null;
    
    const currentSetData = config.sets.find(s => s.name === currentSet);
    if (!currentSetData) return null;
    
    return processDataForConfig(
      currentSetData.recordMetadata,
      currentSetData.resampling,
      currentSetData.globalOperations,
      currentSetData.filterByIds,
      [],
      currentSetData.name
    );
  }, [
    currentSet,
    config.sets,
    processDataForConfig
  ]);

  // Combine processed data based on current context
  const processedData = useMemo(() => {
    console.log("Combining processed data - currentSet:", currentSet);
    
    // If we're in a specific set context (editing), show only that set's data
    if (currentSet && currentSetProcessedData) {
      return currentSetProcessedData;
    }

    // Otherwise, combine global and sets data based on visibility
    const result: ProcessedRecord[] = [];
    
    if (config.visible.records) {
      result.push(...globalProcessedData);
    }
    
    if (config.visible.sets) {
      result.push(...setsProcessedData);
    }
    
    return result;
  }, [currentSet, currentSetProcessedData, globalProcessedData, setsProcessedData, config.visible.records, config.visible.sets]);

  // Determine if left panel should be disabled
  const isLeftPanelDisabled = useMemo(() => {
    // Check if any global operation changes the dataset structure (like mean)
    return effectiveGlobalOperations.some(op => op.type === 'mean');
  }, [effectiveGlobalOperations]);

  // Update record metadata (applies to current set or global)
  const updateRecordMetadata = (id: string, metadata: Partial<RecordMetadata>) => {
    setConfig(prev => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map(s => 
            s.name === currentSet 
              ? {
                  ...s,
                  recordMetadata: {
                    ...s.recordMetadata,
                    [id]: {
                      ...s.recordMetadata[id],
                      ...metadata,
                      id
                    }
                  }
                }
              : s
          )
        };
      }
      // Update in global
      return {
        ...prev,
        recordMetadata: {
          ...prev.recordMetadata,
          [id]: {
            ...prev.recordMetadata[id],
            ...metadata,
            id
          }
        }
      };
    });
  };

  // Add global operation (applies to current set or global)
  const addGlobalOperation = (operation: GlobalOperation) => {
    setConfig(prev => {
      if (currentSet) {
        // Add to set with label
        const label = `${currentSet} - ${operation.type}`;
        
        const enrichedOperation: GlobalOperation = {
          ...operation,
          label
        };
        
        return {
          ...prev,
          sets: prev.sets.map(s =>
            s.name === currentSet
              ? { ...s, globalOperations: [...s.globalOperations, enrichedOperation] }
              : s
          )
        };
      }
      // Add to global with just the type as label
      const enrichedOperation: GlobalOperation = {
        ...operation,
        label: operation.type
      };
      
      return {
        ...prev,
        globalOperations: [...prev.globalOperations, enrichedOperation]
      };
    });
  };

  // Remove global operation (applies to current set or global)
  const removeGlobalOperation = (index: number) => {
    setConfig(prev => {
      if (currentSet) {
        // Remove from set
        return {
          ...prev,
          sets: prev.sets.map(s =>
            s.name === currentSet
              ? { ...s, globalOperations: s.globalOperations.filter((_, i) => i !== index) }
              : s
          )
        };
      }
      // Remove from global
      return {
        ...prev,
        globalOperations: prev.globalOperations.filter((_, i) => i !== index)
      };
    });
  };

  // Toggle ID filter
  const toggleIdFilter = (id: string) => {
    setConfig(prev => {
      if (currentSet) {
        // Update set-specific filter
        const updatedSets = prev.sets.map(set => {
          if (set.name === currentSet) {
            const isFiltered = set.filterByIds.includes(id);
            return {
              ...set,
              filterByIds: isFiltered
                ? set.filterByIds.filter(fid => fid !== id)
                : [...set.filterByIds, id]
            };
          }
          return set;
        });
        return { ...prev, sets: updatedSets };
      } else {
        // Update global filter
        const isFiltered = prev.filterByIds.includes(id);
        return {
          ...prev,
          filterByIds: isFiltered
            ? prev.filterByIds.filter(fid => fid !== id)
            : [...prev.filterByIds, id]
        };
      }
    });
  };

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    setConfig(prev => {
      const isFiltered = prev.filterByTags.includes(tag);
      return {
        ...prev,
        filterByTags: isFiltered
          ? prev.filterByTags.filter(t => t !== tag)
          : [...prev.filterByTags, tag]
      };
    });
  };

  // Export config
  const exportConfig = () => {
    return JSON.stringify(config, null, 2);
  };

  // Download config as JSON file
  const downloadConfig = () => {
    const configJson = exportConfig();
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import config
  const importConfig = (configJson: string) => {
    try {
      const parsed = JSON.parse(configJson);
      setConfig(parsed);
    } catch (error) {
      console.error('Failed to import config:', error);
    }
  };

  // Apply operation to specific record (applies to current set or global)
  const applyOperationToRecord = (id: string, operation: RecordOperation) => {
    setConfig(prev => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map(s => {
            if (s.name !== currentSet) return s;
            const metadata = s.recordMetadata[id];
            if (!metadata) return s;
            return {
              ...s,
              recordMetadata: {
                ...s.recordMetadata,
                [id]: {
                  ...metadata,
                  operations: [...metadata.operations, operation]
                }
              }
            };
          })
        };
      }
      // Update in global
      const metadata = prev.recordMetadata[id];
      if (!metadata) return prev;

      return {
        ...prev,
        recordMetadata: {
          ...prev.recordMetadata,
          [id]: {
            ...metadata,
            operations: [...metadata.operations, operation]
          }
        }
      };
    });
  };

  // Remove operation from record (applies to current set or global)
  const removeOperationFromRecord = (id: string, operationIndex: number) => {
    setConfig(prev => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map(s => {
            if (s.name !== currentSet) return s;
            const metadata = s.recordMetadata[id];
            if (!metadata) return s;
            return {
              ...s,
              recordMetadata: {
                ...s.recordMetadata,
                [id]: {
                  ...metadata,
                  operations: metadata.operations.filter((_, i) => i !== operationIndex)
                }
              }
            };
          })
        };
      }
      // Update in global
      const metadata = prev.recordMetadata[id];
      if (!metadata) return prev;

      return {
        ...prev,
        recordMetadata: {
          ...prev.recordMetadata,
          [id]: {
            ...metadata,
            operations: metadata.operations.filter((_, i) => i !== operationIndex)
          }
        }
      };
    });
  };

  // Set resampling configuration (applies to current set or global)
  const setResampling = (windowMs: number, interpolationMethod: InterpolationMethod) => {
    setConfig(prev => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map(s =>
            s.name === currentSet
              ? {
                  ...s,
                  resampling: {
                    applied: true,
                    windowMs,
                    interpolationMethod
                  }
                }
              : s
          )
        };
      }
      // Update in global
      return {
        ...prev,
        resampling: {
          applied: true,
          windowMs,
          interpolationMethod
        }
      };
    });
  };

  // Clear resampling and global operations (applies to current set or global)
  const clearResampling = () => {
    setConfig(prev => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map(s =>
            s.name === currentSet
              ? {
                  ...s,
                  resampling: {
                    applied: false,
                    windowMs: s.resampling.windowMs,
                    interpolationMethod: s.resampling.interpolationMethod
                  },
                  globalOperations: [] // Clear global ops when removing resampling
                }
              : s
          )
        };
      }
      // Update in global
      return {
        ...prev,
        resampling: {
          applied: false,
          windowMs: prev.resampling.windowMs,
          interpolationMethod: prev.resampling.interpolationMethod
        },
        globalOperations: [] // Clear global ops when removing resampling
      };
    });
  };

  // Set recording start timestamp
  const setRecordingStartTimestamp = (timestamp: number | undefined) => {
    setConfig(prev => ({
      ...prev,
      recordingStartTimestamp: timestamp
    }));
  };

  // Create a new set from filtered records
  const createSet = (name: string, description: string, fromFiltered: boolean) => {
    setConfig(prev => {
      // Check for duplicate name
      if (prev.sets.some(s => s.name === name)) {
        throw new Error(`Set with name "${name}" already exists`);
      }

      let recordIds: string[];
      
      if (fromFiltered) {
        // Start with all records
        let filteredIds = Object.keys(prev.recordMetadata);
        
        // Apply ID filter if any IDs are selected
        if (prev.filterByIds.length > 0) {
          filteredIds = filteredIds.filter(id => prev.filterByIds.includes(id));
        }
        
        // Apply tag filter if any tags are selected
        if (prev.filterByTags.length > 0) {
          filteredIds = filteredIds.filter(id => {
            const metadata = prev.recordMetadata[id];
            return metadata && metadata.tags.some(tag => prev.filterByTags.includes(tag));
          });
        }
        
        recordIds = filteredIds;
      } else {
        // Use all records if not filtering
        recordIds = Object.keys(prev.recordMetadata);
      }

      // Create record metadata for set (copy from global)
      const setRecordMetadata: Record<string, RecordMetadata> = {};
      recordIds.forEach(id => {
        if (prev.recordMetadata[id]) {
          setRecordMetadata[id] = { ...prev.recordMetadata[id] };
        }
      });

      const newSet: DataSet = {
        name,
        description,
        recordMetadata: setRecordMetadata,
        resampling: {
          applied: false,
          windowMs: 1000,
          interpolationMethod: 'linear'
        },
        globalOperations: [],
        visible: true,
        filterByIds: recordIds // Initialize with all records in the set
      };

      return {
        ...prev,
        sets: [...prev.sets, newSet]
      };
    });
  };

  // Update set properties
  const updateSet = (name: string, updates: Partial<Omit<DataSet, 'name'>>) => {
    setConfig(prev => ({
      ...prev,
      sets: prev.sets.map(s =>
        s.name === name ? { ...s, ...updates } : s
      )
    }));
  };

  // Delete a set
  const deleteSet = (name: string) => {
    setConfig(prev => ({
      ...prev,
      sets: prev.sets.filter(s => s.name !== name)
    }));
    // If deleting current set, reset to global
    if (currentSet === name) {
      setCurrentSetState(null);
    }
  };

  // Set current set (null = global)
  const setCurrentSet = (setName: string | null) => {
    setCurrentSetState(setName);
    // Reset individual mode when switching sets
    setMode('global');
    setSelectedRecordId(null);
  };

  // Toggle set visibility
  const toggleSetVisibility = (name: string) => {
    setConfig(prev => ({
      ...prev,
      sets: prev.sets.map(s =>
        s.name === name ? { ...s, visible: !s.visible } : s
      )
    }));
  };

  // Toggle global visibility (records or sets)
  const toggleGlobalVisibility = (type: 'records' | 'sets') => {
    setConfig(prev => ({
      ...prev,
      visible: {
        ...prev.visible,
        [type]: !prev.visible[type]
      }
    }));
  };

  // Set Y-axis range
  const setYAxisRange = (min: number, max: number) => {
    setConfig(prev => ({
      ...prev,
      yAxisRange: {
        enabled: true,
        min,
        max
      }
    }));
  };

  // Clear Y-axis range (reset to auto)
  const clearYAxisRange = () => {
    setConfig(prev => ({
      ...prev,
      yAxisRange: undefined
    }));
  };

  const value: DashboardContextValue = {
    config,
    mode,
    selectedRecordId,
    highlightedRecordId,
    processedData,
    isLeftPanelDisabled,
    chartVisualizationMode,
    currentSet,
    effectiveConfig,
    setConfig,
    updateRecordMetadata,
    addGlobalOperation,
    removeGlobalOperation,
    setMode,
    setSelectedRecordId,
    setHighlightedRecordId,
    toggleIdFilter,
    toggleTagFilter,
    exportConfig,
    downloadConfig,
    importConfig,
    applyOperationToRecord,
    removeOperationFromRecord,
    setResampling,
    clearResampling,
    setChartVisualizationMode,
    setRecordingStartTimestamp,
    createSet,
    updateSet,
    deleteSet,
    setCurrentSet,
    toggleSetVisibility,
    toggleGlobalVisibility,
    setYAxisRange,
    clearYAxisRange
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
