"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
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
} from "@/lib/types";
import { useDataProcessor } from "@/hooks/useDataProcessor";

// Utility function to parse prefixed record IDs
export interface ParsedRecordId {
  isSet: boolean;
  setName: string | null;
  originalId: string;
  fullId: string;
}

// Used in all chart display contexts for records
export function parseRecordId(prefixedId: string): ParsedRecordId {
  const colonIndex = prefixedId.indexOf(":");

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
  const isGlobal = prefix === "global";

  return {
    isSet: !isGlobal,
    setName: isGlobal ? null : prefix,
    originalId,
    fullId: prefixedId,
  };
}

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined
);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
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
  initialConfig,
}: DashboardProviderProps) {
  const [rawData, setRawData] = useState<DataRecord[]>(initialData);
  const [config, setConfig] = useState<Config>(initialConfig);
  const [mode, setMode] = useState<OperationMode>("global");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(
    null
  );
  const [chartVisualizationMode, setChartVisualizationMode] =
    useState<ChartVisualizationMode>("linear");
  const [currentSet, setCurrentSetState] = useState<string | null>(null);

  // Sync rawData with initialData when it changes (e.g., on project import)
  useEffect(() => {
    setRawData(initialData);
  }, [initialData]);

  // Sync config with initialConfig when it changes (e.g., on project import)
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Web Worker for background processing
  const { processData: processDataWorker, isProcessing } = useDataProcessor();

  // State for processed data (will be updated asynchronously by worker)
  const [globalProcessedData, setGlobalProcessedData] = useState<
    ProcessedRecord[]
  >([]);
  const [setsProcessedData, setSetsProcessedData] = useState<ProcessedRecord[]>(
    []
  );
  const [currentSetProcessedData, setCurrentSetProcessedData] = useState<
    ProcessedRecord[] | null
  >(null);

  // Get current set configuration
  const currentSetConfig = useMemo(() => {
    if (!currentSet) return null;
    return config.sets.find((s) => s.name === currentSet) || null;
  }, [currentSet, config.sets]);

  // Get effective configuration (set-specific or global)
  const effectiveResampling = currentSetConfig?.resampling || config.resampling;
  const effectiveRecordMetadata =
    currentSetConfig?.recordMetadata || config.recordMetadata;
  const effectiveGlobalOperations =
    currentSetConfig?.globalOperations || config.globalOperations;
  const effectiveFilterByIds =
    currentSetConfig?.filterByIds || config.filterByIds;

  // Calculate filtered record IDs based on both filterByIds and filterByTags
  const filteredRecordIds = useMemo(() => {
    let ids = Object.keys(config.recordMetadata);

    // Apply ID filter if any IDs are selected
    if (config.filterByIds.length > 0) {
      ids = ids.filter((id) => config.filterByIds.includes(id));
    }

    // Apply tag filter if any tags are selected (AND logic - must have ALL selected tags)
    if (config.filterByTags.length > 0) {
      ids = ids.filter((id) => {
        const metadata = config.recordMetadata[id];
        return (
          metadata &&
          config.filterByTags.every((tag) => metadata.tags.includes(tag))
        );
      });
    }

    return ids;
  }, [config.recordMetadata, config.filterByIds, config.filterByTags]);

  // Create a complete effective config object for easy consumption
  const effectiveConfig = useMemo(
    () => ({
      resampling: effectiveResampling,
      recordMetadata: effectiveRecordMetadata,
      globalOperations: effectiveGlobalOperations,
      filterByIds: effectiveFilterByIds,
    }),
    [
      effectiveResampling,
      effectiveRecordMetadata,
      effectiveGlobalOperations,
      effectiveFilterByIds,
    ]
  );

  // Process global data in Web Worker
  const recordMetadataStr = JSON.stringify(config.recordMetadata);
  const resamplingStr = JSON.stringify(config.resampling);
  const globalOperationsStr = JSON.stringify(config.globalOperations);
  const filterByIdsStr = JSON.stringify(config.filterByIds);
  const filterByTagsStr = JSON.stringify(config.filterByTags);
  const excludeTagsStr = JSON.stringify(config.excludeTags);

  useEffect(() => {
    processDataWorker({
      rawData,
      recordMetadata: config.recordMetadata,
      resampling: config.resampling,
      globalOperations: config.globalOperations,
      filterByIds: config.filterByIds,
      filterByTags: config.filterByTags,
      excludeTags: config.excludeTags,
      idPrefix: "global",
    })
      .then(setGlobalProcessedData)
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rawData,
    recordMetadataStr,
    resamplingStr,
    globalOperationsStr,
    filterByIdsStr,
    filterByTagsStr,
    excludeTagsStr,
  ]);

  // Process sets data in Web Worker
  const setsStr = JSON.stringify(config.sets);

  useEffect(() => {
    if (currentSet) {
      // If editing a set, skip processing all sets to avoid duplication
      return;
    }

    const processSets = async () => {
      const allSetsData: ProcessedRecord[] = [];
      for (const set of config.sets) {
        if (set.visible) {
          const setData = await processDataWorker({
            rawData,
            recordMetadata: set.recordMetadata,
            resampling: set.resampling,
            globalOperations: set.globalOperations,
            filterByIds: set.filterByIds,
            filterByTags: set.filterByTags || [], // Fallback for existing sets without filterByTags
            excludeTags: set.excludeTags || [], // Fallback for existing sets without excludeTags
            idPrefix: set.name,
          });
          allSetsData.push(...setData);
        }
      }
      setSetsProcessedData(allSetsData);
    };
    processSets().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.sets, currentSet, rawData]);

  // Process current set data in Web Worker
  useEffect(() => {
    if (!currentSet) {
      setCurrentSetProcessedData(null);
      return;
    }

    const currentSetData = config.sets.find((s) => s.name === currentSet);
    if (!currentSetData) {
      setCurrentSetProcessedData(null);
      return;
    }

    processDataWorker({
      rawData,
      recordMetadata: currentSetData.recordMetadata,
      resampling: currentSetData.resampling,
      globalOperations: currentSetData.globalOperations,
      filterByIds: currentSetData.filterByIds,
      filterByTags: currentSetData.filterByTags || [], // Fallback for existing sets without filterByTags
      excludeTags: currentSetData.excludeTags || [], // Fallback for existing sets without excludeTags
      idPrefix: currentSetData.name,
    })
      .then(setCurrentSetProcessedData)
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSet, rawData, setsStr]);

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
  }, [
    currentSet,
    currentSetProcessedData,
    globalProcessedData,
    setsProcessedData,
    config.visible.records,
    config.visible.sets,
  ]);

  // Determine if left panel should be disabled
  const isLeftPanelDisabled = useMemo(() => {
    // Check if any global operation changes the dataset structure (like mean)
    return effectiveGlobalOperations.some((op) => op.type === "mean");
  }, [effectiveGlobalOperations]);

  // Update record metadata (applies to current set or global)
  const updateRecordMetadata = (
    id: string,
    metadata: Partial<RecordMetadata>
  ) => {
    setConfig((prev) => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map((s) =>
            s.name === currentSet
              ? {
                  ...s,
                  recordMetadata: {
                    ...s.recordMetadata,
                    [id]: {
                      ...s.recordMetadata[id],
                      ...metadata,
                      id,
                    },
                  },
                }
              : s
          ),
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
            id,
          },
        },
      };
    });
  };

  // Add global operation (applies to current set or global)
  const addGlobalOperation = (operation: GlobalOperation) => {
    setConfig((prev) => {
      if (currentSet) {
        // Add to set with label
        const label = `${currentSet} - ${operation.type}`;

        const enrichedOperation: GlobalOperation = {
          ...operation,
          label,
        };

        return {
          ...prev,
          sets: prev.sets.map((s) =>
            s.name === currentSet
              ? {
                  ...s,
                  globalOperations: [...s.globalOperations, enrichedOperation],
                }
              : s
          ),
        };
      }
      // Add to global with just the type as label
      const enrichedOperation: GlobalOperation = {
        ...operation,
        label: operation.type,
      };

      return {
        ...prev,
        globalOperations: [...prev.globalOperations, enrichedOperation],
      };
    });
  };

  // Remove global operation (applies to current set or global)
  const removeGlobalOperation = (index: number) => {
    setConfig((prev) => {
      if (currentSet) {
        // Remove from set
        return {
          ...prev,
          sets: prev.sets.map((s) =>
            s.name === currentSet
              ? {
                  ...s,
                  globalOperations: s.globalOperations.filter(
                    (_, i) => i !== index
                  ),
                }
              : s
          ),
        };
      }
      // Remove from global
      return {
        ...prev,
        globalOperations: prev.globalOperations.filter((_, i) => i !== index),
      };
    });
  };

  // Toggle ID filter
  const toggleIdFilter = (id: string) => {
    setConfig((prev) => {
      if (currentSet) {
        // Update set-specific filter
        const updatedSets = prev.sets.map((set) => {
          if (set.name === currentSet) {
            const isFiltered = set.filterByIds.includes(id);
            return {
              ...set,
              filterByIds: isFiltered
                ? set.filterByIds.filter((fid) => fid !== id)
                : [...set.filterByIds, id],
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
            ? prev.filterByIds.filter((fid) => fid !== id)
            : [...prev.filterByIds, id],
        };
      }
    });
  };

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    setConfig((prev) => {
      const isFiltered = prev.filterByTags.includes(tag);
      return {
        ...prev,
        filterByTags: isFiltered
          ? prev.filterByTags.filter((t) => t !== tag)
          : [...prev.filterByTags, tag],
      };
    });
  };

  // Toggle exclude tag filter
  const toggleExcludeTag = (tag: string) => {
    setConfig((prev) => {
      const isExcluded = prev.excludeTags.includes(tag);
      const filterByTags = isExcluded
        ? prev.filterByTags
        : prev.filterByTags.filter((t) => t !== tag);
      return {
        ...prev,
        filterByTags,
        excludeTags: isExcluded
          ? prev.excludeTags.filter((t) => t !== tag)
          : [...prev.excludeTags, tag],
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
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import config
  const importConfig = (configJson: string) => {
    try {
      const parsed = JSON.parse(configJson);
      setConfig(parsed);
    } catch (error) {
      console.error("Failed to import config:", error);
    }
  };

  // Apply operation to specific record (applies to current set or global)
  const applyOperationToRecord = (id: string, operation: RecordOperation) => {
    setConfig((prev) => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map((s) => {
            if (s.name !== currentSet) return s;
            const metadata = s.recordMetadata[id];
            if (!metadata) return s;
            return {
              ...s,
              recordMetadata: {
                ...s.recordMetadata,
                [id]: {
                  ...metadata,
                  operations: [...metadata.operations, operation],
                },
              },
            };
          }),
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
            operations: [...metadata.operations, operation],
          },
        },
      };
    });
  };

  // Remove operation from record (applies to current set or global)
  const removeOperationFromRecord = (id: string, operationIndex: number) => {
    setConfig((prev) => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map((s) => {
            if (s.name !== currentSet) return s;
            const metadata = s.recordMetadata[id];
            if (!metadata) return s;
            return {
              ...s,
              recordMetadata: {
                ...s.recordMetadata,
                [id]: {
                  ...metadata,
                  operations: metadata.operations.filter(
                    (_, i) => i !== operationIndex
                  ),
                },
              },
            };
          }),
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
            operations: metadata.operations.filter(
              (_, i) => i !== operationIndex
            ),
          },
        },
      };
    });
  };

  // Set resampling configuration (applies to current set or global)
  const setResampling = (
    windowMs: number,
    interpolationMethod: InterpolationMethod,
    strategy?: "shortest" | "audio",
    startTime?: number,
    endTime?: number
  ) => {
    setConfig((prev) => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map((s) =>
            s.name === currentSet
              ? {
                  ...s,
                  resampling: {
                    applied: true,
                    windowMs,
                    interpolationMethod,
                    strategy,
                    startTime,
                    endTime,
                  },
                }
              : s
          ),
        };
      }
      // Update in global
      return {
        ...prev,
        resampling: {
          applied: true,
          windowMs,
          interpolationMethod,
          strategy,
          startTime,
          endTime,
        },
      };
    });
  };

  // Clear resampling and global operations (applies to current set or global)
  const clearResampling = () => {
    setConfig((prev) => {
      if (currentSet) {
        // Update in set
        return {
          ...prev,
          sets: prev.sets.map((s) =>
            s.name === currentSet
              ? {
                  ...s,
                  resampling: {
                    applied: false,
                    windowMs: s.resampling.windowMs,
                    interpolationMethod: s.resampling.interpolationMethod,
                  },
                  globalOperations: [], // Clear global ops when removing resampling
                }
              : s
          ),
        };
      }
      // Update in global
      return {
        ...prev,
        resampling: {
          applied: false,
          windowMs: prev.resampling.windowMs,
          interpolationMethod: prev.resampling.interpolationMethod,
        },
        globalOperations: [], // Clear global ops when removing resampling
      };
    });
  };

  // Set recording start timestamp
  const setRecordingStartTimestamp = (timestamp: number | undefined) => {
    setConfig((prev) => ({
      ...prev,
      recordingStartTimestamp: timestamp,
    }));
  };

  // Create a new set from filtered records
  const createSet = (
    name: string,
    description: string,
    fromFiltered: boolean
  ) => {
    setConfig((prev) => {
      // Check for duplicate name
      if (prev.sets.some((s) => s.name === name)) {
        throw new Error(`Set with name "${name}" already exists`);
      }

      // Use filteredRecordIds if creating from filtered, otherwise all records
      const recordIds = fromFiltered
        ? filteredRecordIds
        : Object.keys(prev.recordMetadata);

      // Create record metadata for set (copy from global)
      const setRecordMetadata: Record<string, RecordMetadata> = {};
      recordIds.forEach((id) => {
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
          interpolationMethod: "linear",
        },
        globalOperations: [],
        visible: true,
        filterByIds: [], // Initialize with empty array to show all records (no active filter)
        filterByTags: [], // Initialize with empty array to show all records (no active filter)
        excludeTags: [], // Initialize with empty array (no tags excluded)
      };

      return {
        ...prev,
        sets: [...prev.sets, newSet],
      };
    });
  };

  // Update set properties
  const updateSet = (name: string, updates: Partial<Omit<DataSet, "name">>) => {
    setConfig((prev) => ({
      ...prev,
      sets: prev.sets.map((s) => (s.name === name ? { ...s, ...updates } : s)),
    }));
  };

  // Delete a set
  const deleteSet = (name: string) => {
    setConfig((prev) => ({
      ...prev,
      sets: prev.sets.filter((s) => s.name !== name),
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
    setMode("global");
    setSelectedRecordId(null);
  };

  // Toggle set visibility
  const toggleSetVisibility = (name: string) => {
    setConfig((prev) => ({
      ...prev,
      sets: prev.sets.map((s) =>
        s.name === name ? { ...s, visible: !s.visible } : s
      ),
    }));
  };

  // Toggle global visibility (records or sets)
  const toggleGlobalVisibility = (type: "records" | "sets") => {
    setConfig((prev) => ({
      ...prev,
      visible: {
        ...prev.visible,
        [type]: !prev.visible[type],
      },
    }));
  };

  // Set Y-axis range
  const setYAxisRange = (min: number, max: number) => {
    setConfig((prev) => ({
      ...prev,
      yAxisRange: {
        enabled: true,
        min,
        max,
      },
    }));
  };

  // Clear Y-axis range (reset to auto)
  const clearYAxisRange = () => {
    setConfig((prev) => ({
      ...prev,
      yAxisRange: undefined,
    }));
  };

  // Add new records from re-record data
  const addRecords = (
    records: DataRecord[],
    label: string,
    tags: string[]
  ) => {
    if (records.length === 0) return;

    // Get unique record ID from the first record
    const recordId = records[0].id;

    // Add records to rawData
    setRawData((prev) => {
      // Check if records with this ID already exist
      const existingIds = new Set(prev.map((r) => r.id));
      if (existingIds.has(recordId)) {
        // Remove old records with this ID
        const filtered = prev.filter((r) => r.id !== recordId);
        return [...filtered, ...records];
      }
      return [...prev, ...records];
    });

    // Add metadata to config
    setConfig((prev) => {
      if (currentSet) {
        // Add to set
        return {
          ...prev,
          sets: prev.sets.map((s) =>
            s.name === currentSet
              ? {
                  ...s,
                  recordMetadata: {
                    ...s.recordMetadata,
                    [recordId]: {
                      id: recordId,
                      label,
                      tags,
                      xMove: 0,
                      yMove: 0,
                      operations: [],
                    },
                  },
                }
              : s
          ),
        };
      }
      // Add to global
      return {
        ...prev,
        recordMetadata: {
          ...prev.recordMetadata,
          [recordId]: {
            id: recordId,
            label,
            tags,
            xMove: 0,
            yMove: 0,
            operations: [],
          },
        },
      };
    });
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
    filteredRecordIds,
    effectiveConfig,
    isProcessing,
    setConfig,
    updateRecordMetadata,
    addGlobalOperation,
    removeGlobalOperation,
    setMode,
    setSelectedRecordId,
    setHighlightedRecordId,
    toggleIdFilter,
    toggleTagFilter,
    toggleExcludeTag,
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
    clearYAxisRange,
    addRecords,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
