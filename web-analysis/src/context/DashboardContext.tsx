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
  DataCache,
  DataCacheEntry,
} from "@/lib/types";
import { useDataProcessor } from "@/hooks/useDataProcessor";
import { OPERATION_DEFAULTS } from "@/lib/operationDefaults";

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

// Generate ObjectId-like change key (timestamp + random string)
function generateChangeKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${random}`;
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

  // Data cache for storing processed data after resampling
  const [dataCache, setDataCache] = useState<DataCache>({});

  // Helper function to generate cache key from operations with all parameters
  const generateCacheKey = (
    resampling: { applied: boolean; windowMs: number },
    globalOperations: GlobalOperation[]
  ): string[] => {
    const operations: string[] = [];
    
    // Include resampling with window time
    if (resampling.applied) {
      operations.push(`resampling-${resampling.windowMs}ms`);
    }
    
    // Include each global operation with its parameters
    globalOperations.forEach((op) => {
      let operationKey : string = op.type
      
      // Add parameters based on operation type
      switch (op.type) {
        case 'movingAverage':
          const windowSize = typeof op.params.windowSize === 'number' 
            ? op.params.windowSize 
            : OPERATION_DEFAULTS.movingAverage.windowSize;
          const algorithm = (op.params.algorithm as string) || OPERATION_DEFAULTS.movingAverage.algorithm;
          operationKey = `${op.type}-window${windowSize}-${algorithm}`;
          break;
          
        case 'quantize':
          const step = typeof op.params.step === 'number' 
            ? op.params.step 
            : OPERATION_DEFAULTS.quantize.step;
          operationKey = `${op.type}-step${step}`;
          break;
          
        case 'spearmanCorrelation':
          const startTime = typeof op.params.startTime === 'number' 
            ? op.params.startTime 
            : OPERATION_DEFAULTS.spearmanCorrelation.startTime;
          // Normalize endTime: use "max" if not provided or if explicitly set to MAX_SAFE_INTEGER
          const endTimeValue = typeof op.params.endTime === 'number' 
            ? op.params.endTime 
            : OPERATION_DEFAULTS.spearmanCorrelation.endTime;
          const endTime = endTimeValue === Number.MAX_SAFE_INTEGER ? 'max' : endTimeValue;
          const resamplingWindowMs = typeof op.params.resamplingWindowMs === 'number' 
            ? op.params.resamplingWindowMs 
            : OPERATION_DEFAULTS.spearmanCorrelation.resamplingWindowMs;
          operationKey = `${op.type}-start${startTime}-end${endTime}-window${resamplingWindowMs}`;
          break;
          
        case 'rollingSpearman':
          const rollingWindow = typeof op.params.windowSize === 'number' 
            ? op.params.windowSize 
            : OPERATION_DEFAULTS.rollingSpearman.windowSize;
          operationKey = `${op.type}-window${rollingWindow}`;
          break;
          
        // Operations without parameters or with default behavior
        case 'mean':
        case 'standardDeviation':
        case 'changes':
        case 'zScore':
        case 'minMaxNormalization':
        case 'custom':
        default:
          // For operations without parameters, just use the type
          // If there are any params, include them as a sorted string
          const paramKeys = Object.keys(op.params).sort();
          if (paramKeys.length > 0) {
            const paramString = paramKeys
              .map(key => `${key}:${op.params[key]}`)
              .join('-');
            operationKey = `${op.type}-${paramString}`;
          }
          break;
      }
      
      operations.push(operationKey);
    });
    
    return operations;
  };

  // Helper function to check if cache is valid for given operations
  const isCacheValid = (
    cacheEntry: DataCacheEntry | undefined,
    operations: string[]
  ): boolean => {
    if (!cacheEntry) return false;
    if (cacheEntry.appliedOperations.length !== operations.length) return false;
    return cacheEntry.appliedOperations.every(
      (op, idx) => op === operations[idx]
    );
  };

  // Get current set configuration
  const currentSetConfig = useMemo(() => {
    if (!currentSet) return null;
    return config.sets.find((s) => s.name === currentSet) || null;
  }, [currentSet, config.sets]);

  // Memoized current set effective config for change detection
  const currentSetEffectiveConfig = useMemo(() => {
    if (!currentSetConfig) return null;
    return {
      resampling: currentSetConfig.resampling,
      recordMetadata: currentSetConfig.recordMetadata,
      globalOperations: currentSetConfig.globalOperations,
      filterByIds: currentSetConfig.filterByIds,
      filterByTags: currentSetConfig.filterByTags || [],
      excludeTags: currentSetConfig.excludeTags || [],
    };
  }, [
    currentSetConfig?.resampling,
    currentSetConfig?.recordMetadata,
    currentSetConfig?.globalOperations,
    currentSetConfig?.filterByIds,
    currentSetConfig?.filterByTags,
    currentSetConfig?.excludeTags,
  ]);

  // Get effective configuration (set-specific or global)
  const effectiveResampling = currentSetConfig?.resampling || config.resampling;
  const effectiveRecordMetadata =
    currentSetConfig?.recordMetadata || config.recordMetadata;
  const effectiveGlobalOperations =
    currentSetConfig?.globalOperations || config.globalOperations;
  const effectiveFilterByIds =
    currentSetConfig?.filterByIds || config.filterByIds;
  const effectiveFilterByTags =
    currentSetConfig?.filterByTags || config.filterByTags;
  const effectiveExcludeTags =
    currentSetConfig?.excludeTags || config.excludeTags;

  // Calculate filtered record IDs based on tag filters only (filterByTags and excludeTags)
  // Respects currentSet (global vs set)
  const filteredRecordIdsByTag = useMemo(() => {
    let ids = Object.keys(effectiveRecordMetadata);

    // Apply tag filter if any tags are selected (AND logic - must have ALL selected tags)
    if (effectiveFilterByTags.length > 0) {
      ids = ids.filter((id) => {
        const metadata = effectiveRecordMetadata[id];
        return (
          metadata &&
          effectiveFilterByTags.every((tag) => metadata.tags.includes(tag))
        );
      });
    }

    // Apply exclude tags filter (OR logic - if record has ANY excluded tag, filter it out)
    if (effectiveExcludeTags && effectiveExcludeTags.length > 0) {
      ids = ids.filter((id) => {
        const metadata = effectiveRecordMetadata[id];
        if (!metadata) return false;
        // Exclude if record has any excluded tag
        return !effectiveExcludeTags.some((tag) => metadata.tags.includes(tag));
      });
    }

    return ids;
  }, [
    effectiveRecordMetadata,
    effectiveFilterByTags,
    effectiveExcludeTags,
  ]);

  // Calculate filtered record IDs based on filterByIds, filterByTags, and excludeTags
  // Respects currentSet (global vs set)
  const filteredRecordIds = useMemo(() => {
    let ids = filteredRecordIdsByTag;

    // Apply ID filter if any IDs are selected
    if (effectiveFilterByIds.length > 0) {
      ids = ids.filter((id) => effectiveFilterByIds.includes(id));
    }

    return ids;
  }, [
    filteredRecordIdsByTag,
    effectiveFilterByIds,
  ]);

  // Create a complete effective config object for easy consumption
  // Includes all properties needed for processing
  const effectiveConfig = useMemo(
    () => ({
      resampling: effectiveResampling,
      recordMetadata: effectiveRecordMetadata,
      globalOperations: effectiveGlobalOperations,
      filterByIds: effectiveFilterByIds,
      filterByTags: effectiveFilterByTags,
      excludeTags: effectiveExcludeTags,
    }),
    [
      effectiveResampling,
      effectiveRecordMetadata,
      effectiveGlobalOperations,
      effectiveFilterByIds,
      effectiveFilterByTags,
      effectiveExcludeTags,
    ]
  );

  // Change state keys for triggering data processing
  const [globalChangeKey, setGlobalChangeKey] = useState<string>(generateChangeKey());
  const [currentSetChangeKey, setCurrentSetChangeKey] = useState<string>(generateChangeKey());
  const [allSetsChangeKey, setAllSetsChangeKey] = useState<string>(generateChangeKey());

  // Update global change key when global config changes
  useEffect(() => {
    setGlobalChangeKey(generateChangeKey());
  }, [
    config.resampling,
    config.recordMetadata,
    config.globalOperations,
    config.filterByIds,
    config.filterByTags,
    config.excludeTags,
  ]);

  // Update current set change key when current set config changes
  useEffect(() => {
    if (!currentSet || !currentSetEffectiveConfig) {
      return;
    }
    setCurrentSetChangeKey(generateChangeKey());
  }, [currentSet, currentSetEffectiveConfig]);

  // Update all sets change key when any set changes
  useEffect(() => {
    setAllSetsChangeKey(generateChangeKey());
  }, [config.sets]);

  // Process global data in Web Worker with caching
  useEffect(() => {
    // Generate cache key
    const cacheKey = "global";
    const operations = generateCacheKey(config.resampling, config.globalOperations);
    const cachedEntry = dataCache[cacheKey];

    // Check if cache is valid
    if (config.resampling.applied && isCacheValid(cachedEntry, operations)) {
      console.log("Using cached data for global");
      setGlobalProcessedData(cachedEntry.data);
      return;
    }

    // Process data
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
      .then((data) => {
        setGlobalProcessedData(data);
        // Store in cache if resampling is applied
        if (config.resampling.applied) {
          setDataCache((prev) => ({
            ...prev,
            [cacheKey]: {
              appliedOperations: operations,
              data,
            },
          }));
        }
      })
      .catch(console.error);
  }, [rawData, globalChangeKey]);

  // Process sets data in Web Worker with caching
  useEffect(() => {
    if (currentSet) {
      // If editing a set, skip processing all sets to avoid duplication
      return;
    }

    const processSets = async () => {
      const allSetsData: ProcessedRecord[] = [];
      for (const set of config.sets) {
        if (set.visible) {
          // Generate cache key
          const cacheKey = set.name;
          const operations = generateCacheKey(set.resampling, set.globalOperations);
          const cachedEntry = dataCache[cacheKey];

          // Check if cache is valid
          if (set.resampling.applied && isCacheValid(cachedEntry, operations)) {
            console.log(`Using cached data for set: ${set.name}`);
            allSetsData.push(...cachedEntry.data);
            continue;
          }

          // Process data
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

          // Store in cache if resampling is applied
          if (set.resampling.applied) {
            setDataCache((prev) => ({
              ...prev,
              [cacheKey]: {
                appliedOperations: operations,
                data: setData,
              },
            }));
          }
        }
      }
      setSetsProcessedData(allSetsData);
    };
    processSets().catch(console.error);
  }, [rawData, allSetsChangeKey, currentSet]);

  // Process current set data in Web Worker with caching
  useEffect(() => {
    if (!currentSet || !currentSetConfig) {
      setCurrentSetProcessedData(null);
      return;
    }

    // Generate cache key
    const cacheKey = currentSetConfig.name;
    const operations = generateCacheKey(
      currentSetConfig.resampling,
      currentSetConfig.globalOperations
    );
    const cachedEntry = dataCache[cacheKey];

    // Check if cache is valid
    if (
      currentSetConfig.resampling.applied &&
      isCacheValid(cachedEntry, operations)
    ) {
      console.log(`Using cached data for current set: ${currentSet}`);
      setCurrentSetProcessedData(cachedEntry.data);
      return;
    }

    // Process data
    processDataWorker({
      rawData,
      recordMetadata: currentSetConfig.recordMetadata,
      resampling: currentSetConfig.resampling,
      globalOperations: currentSetConfig.globalOperations,
      filterByIds: currentSetConfig.filterByIds,
      filterByTags: currentSetConfig.filterByTags || [], // Fallback for existing sets without filterByTags
      excludeTags: currentSetConfig.excludeTags || [], // Fallback for existing sets without excludeTags
      idPrefix: currentSetConfig.name,
    })
      .then((data) => {
        setCurrentSetProcessedData(data);
        // Store in cache if resampling is applied
        if (currentSetConfig.resampling.applied) {
          setDataCache((prev) => ({
            ...prev,
            [cacheKey]: {
              appliedOperations: operations,
              data,
            },
          }));
        }
      })
      .catch(console.error);
  }, [rawData, currentSetChangeKey, currentSet, currentSetConfig]);

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

  // Filter processedData based on current mode (global vs set) and filteredRecordIds
  const currentModeProcessData = useMemo(() => {
    return processedData.filter((record) => {
      const parsedId = parseRecordId(record.id);
      
      // Check if record matches current operation mode
      // If currentSet is null (global mode), only show global records
      // If currentSet is set (set mode), only show records from that set
      const matchesMode = currentSet === null 
        ? !parsedId.isSet  // Global mode: only show global records
        : parsedId.setName === currentSet; // Set mode: only show records from current set
      
      // Check if the base ID is in filteredRecordIds
      const matchesFilter = filteredRecordIds.includes(parsedId.originalId);
      
      return matchesMode && matchesFilter;
    });
  }, [processedData, currentSet, filteredRecordIds]);

  // Determine if left panel should be disabled
  // Disabled when resampling is applied (only statistical operations allowed)
  const isLeftPanelDisabled = useMemo(() => {
    return effectiveResampling.applied;
  }, [effectiveResampling.applied]);

  // Update record metadata (applies to current set or global)
  // Disabled when resampling is applied (except for label and tags which don't affect data)
  const updateRecordMetadata = (
    id: string,
    metadata: Partial<RecordMetadata>
  ) => {
    // Disable data-affecting operations when resampling is applied
    if (effectiveResampling.applied) {
      // Only allow label and tags updates (non-data-affecting)
      const allowedKeys = ["label", "tags"];
      const hasDataAffectingChanges = Object.keys(metadata).some(
        (key) => !allowedKeys.includes(key)
      );
      if (hasDataAffectingChanges) {
        console.warn(
          "Cannot update data-affecting metadata when resampling is applied"
        );
        return;
      }
    }

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
  // Disabled when resampling is applied
  const applyOperationToRecord = (id: string, operation: RecordOperation) => {
    // Disable when resampling is applied
    if (effectiveResampling.applied) {
      console.warn("Cannot apply record operations when resampling is applied");
      return;
    }

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
  // Also clears cache when resampling is disabled
  const clearResampling = () => {
    setConfig((prev) => {
      if (currentSet) {
        // Clear cache for this set
        setDataCache((prevCache) => {
          const newCache = { ...prevCache };
          delete newCache[currentSet];
          return newCache;
        });

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
      // Clear cache for global
      setDataCache((prevCache) => {
        const newCache = { ...prevCache };
        delete newCache["global"];
        return newCache;
      });

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
  // Uses filteredRecordIds which already respects context (currentSet) and all filters
  const createSet = (name: string, description: string) => {
    setConfig((prev) => {
      // Check for duplicate name
      if (prev.sets.some((s) => s.name === name)) {
        throw new Error(`Set with name "${name}" already exists`);
      }

      // Use filteredRecordIds which already respects currentSet and all filters
      const effectiveMetadata = prev.recordMetadata;

      // Create record metadata for set (copy from effective metadata source)
      const setRecordMetadata: Record<string, RecordMetadata> = {};
      filteredRecordIds.forEach((id) => {
        if (effectiveMetadata[id]) {
          setRecordMetadata[id] = { ...effectiveMetadata[id] };
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
  // Disabled when resampling is applied
  const addRecords = (
    records: DataRecord[],
    label: string,
    tags: string[]
  ) => {
    // Disable when resampling is applied
    if (effectiveResampling.applied) {
      console.warn("Cannot add records when resampling is applied");
      return;
    }

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

  // Get global processed data for download
  const getGlobalProcessedData = (): ProcessedRecord[] => {
    return globalProcessedData;
  };

  // Get set processed data for download
  const getSetProcessedData = (setName: string): ProcessedRecord[] => {
    const set = config.sets.find((s) => s.name === setName);
    if (!set) {
      console.warn(`Set "${setName}" not found`);
      return [];
    }

    // If this is the current set being edited, return currentSetProcessedData
    if (currentSet === setName && currentSetProcessedData) {
      return currentSetProcessedData;
    }

    // Otherwise, check cache or return empty (data might not be loaded if set is not visible)
    const cacheKey = setName;
    const cachedEntry = dataCache[cacheKey];
    if (cachedEntry) {
      return cachedEntry.data;
    }

    // If not in cache and not current set, check setsProcessedData
    // Filter for records matching this set
    const setRecords = setsProcessedData.filter((record) => {
      const parsedId = parseRecordId(record.id);
      return parsedId.setName === setName;
    });

    return setRecords;
  };

  const value: DashboardContextValue = {
    config,
    mode,
    selectedRecordId,
    highlightedRecordId,
    processedData,
    currentModeProcessData,
    isLeftPanelDisabled,
    chartVisualizationMode,
    currentSet,
    filteredRecordIds,
    filteredRecordIdsByTag,
    effectiveConfig,
    isProcessing,
    dataCache,
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
    getGlobalProcessedData,
    getSetProcessedData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
