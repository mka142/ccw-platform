// Core data types
export interface DataRecord {
  id: string;
  timestamp: number;
  value: number;
}

// Config types
export interface RecordMetadata {
  id: string;
  label?: string;
  tags: string[];
  xMove: number; // Horizontal offset in milliseconds
  yMove: number; // Vertical offset
  operations: RecordOperation[];
}

export interface RecordOperation {
  type: 'normalize' | 'quantize' | 'movingAverage' | 'custom';
  params: Record<string, number | string | boolean>;
}

export type MovingAverageAlgorithm = 'SMA' | 'WMA' | 'RMA';

export type InterpolationMethod = 'linear' | 'step';

// CanvasJS compatible line styles
export type LineDashType = 'solid' | 'shortDash' | 'shortDot' | 'shortDashDot' | 'shortDashDotDot' | 'dot' | 'dash' | 'dashDot' | 'longDash' | 'longDashDot' | 'longDashDotDot';

export interface LineStyle {
  color?: string; // Hex color (e.g., "#FF5733")
  lineThickness?: number; // Line width in pixels (1-10)
  lineDashType?: LineDashType; // Line dash pattern
}

export interface ResamplingConfig {
  applied: boolean;
  windowMs: number;
  interpolationMethod: InterpolationMethod;
  strategy?: 'shortest' | 'audio'; // Strategy for handling different data lengths
  startTime?: number; // Optional explicit start time (for 'audio' strategy)
  endTime?: number; // Optional explicit end time (for 'audio' strategy)
}

export interface GlobalOperation {
  type: 'mean' | 'standardDeviation' | 'changes' | 'movingAverage' | 'quantize' | 'spearmanCorrelation' | 'rollingSpearman' | 'zScore' | 'minMaxNormalization' | 'custom';
  params: Record<string, number | string | boolean>;
  label?: string; // Optional label for the operation result
}

export interface DataSet {
  name: string; // Unique identifier
  description: string;
  recordMetadata: Record<string, RecordMetadata>; // Keyed by id
  resampling: ResamplingConfig;
  globalOperations: GlobalOperation[];
  visible: boolean; // Whether to show this set's data on the chart
  filterByIds: string[]; // Active filter for selected IDs within this set
  filterByTags?: string[]; // Active filter for selected tags within this set (optional for backward compatibility)
  excludeTags?: string[]; // Tags to exclude from filtering (records with these tags are hidden)
  lineStyle?: LineStyle; // Optional: Custom line styling for this set
}

export interface Config {
  version: string;
  title?: string; // Optional: Title for the configuration/chart
  resampling: ResamplingConfig;
  recordMetadata: Record<string, RecordMetadata>; // Keyed by id (global set)
  globalOperations: GlobalOperation[];
  filterByIds: string[]; // Active filter for selected IDs
  filterByTags: string[]; // Active filter for tags
  excludeTags: string[]; // Tags to exclude from filtering (records with these tags are hidden)
  recordingStartTimestamp?: number; // Optional: Recording start timestamp for audio sync
  sets: DataSet[]; // User-defined sets
  visible: {
    records: boolean; // Show global records on chart
    sets: boolean; // Show sets data on chart
  };
  yAxisRange?: {
    enabled: boolean;
    min: number;
    max: number;
  };
}

// Dashboard state types
export type OperationMode = 'global' | 'individual';
export type ChartVisualizationMode = 'linear' | 'step';

export interface ProcessedRecord {
  id: string;
  data: Array<{ timestamp: number; value: number }>;
  originalData: Array<{ timestamp: number; value: number }>;
  label?: string; // Optional label (for global operations or set display names)
}

export interface DashboardState {
  config: Config;
  mode: OperationMode;
  selectedRecordId: string | null;
  highlightedRecordId: string | null;
  processedData: ProcessedRecord[];
  currentModeProcessData: ProcessedRecord[]; // Filtered processedData based on current mode and filteredRecordIds
  isLeftPanelDisabled: boolean;
  chartVisualizationMode: ChartVisualizationMode;
  currentSet: string | null; // null = global, string = set name
  filteredRecordIds: string[]; // Filtered record IDs respecting filterByIds, filterByTags, excludeTags, and currentSet
  filteredRecordIdsByTag: string[]; // Filtered record IDs respecting only filterByTags and excludeTags (ignores filterByIds)
  effectiveConfig: {
    resampling: ResamplingConfig;
    recordMetadata: Record<string, RecordMetadata>;
    globalOperations: GlobalOperation[];
    filterByIds: string[];
  };
  isProcessing: boolean;
}

export interface DashboardContextValue extends DashboardState {
  setConfig: (config: Config) => void;
  updateRecordMetadata: (id: string, metadata: Partial<RecordMetadata>) => void;
  addGlobalOperation: (operation: GlobalOperation) => void;
  removeGlobalOperation: (index: number) => void;
  setMode: (mode: OperationMode) => void;
  setSelectedRecordId: (id: string | null) => void;
  setHighlightedRecordId: (id: string | null) => void;
  toggleIdFilter: (id: string) => void;
  toggleTagFilter: (tag: string) => void;
  toggleExcludeTag: (tag: string) => void;
  exportConfig: () => string;
  downloadConfig: () => void;
  importConfig: (configJson: string) => void;
  applyOperationToRecord: (id: string, operation: RecordOperation) => void;
  removeOperationFromRecord: (id: string, operationIndex: number) => void;
  setResampling: (
    windowMs: number, 
    interpolationMethod: InterpolationMethod,
    strategy?: 'shortest' | 'audio',
    startTime?: number,
    endTime?: number
  ) => void;
  clearResampling: () => void;
  setChartVisualizationMode: (mode: ChartVisualizationMode) => void;
  setRecordingStartTimestamp: (timestamp: number | undefined) => void;
  // Set management
  createSet: (name: string, description: string) => void;
  updateSet: (name: string, updates: Partial<Omit<DataSet, 'name'>>) => void;
  deleteSet: (name: string) => void;
  setCurrentSet: (setName: string | null) => void;
  toggleSetVisibility: (name: string) => void;
  toggleGlobalVisibility: (type: 'records' | 'sets') => void;
  // Y-axis range control
  setYAxisRange: (min: number, max: number) => void;
  clearYAxisRange: () => void;
  // Add records from re-record data
  addRecords: (records: DataRecord[], label: string, tags: string[]) => void;
}

// Helper type for chart data
export interface ChartDataPoint {
  timestamp: number;
  [key: string]: number; // Dynamic keys for each record ID
}
