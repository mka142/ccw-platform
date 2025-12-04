/**
 * Default values for data operations
 * These values are used consistently across the application
 * when operation parameters are not provided or need default values.
 */
export const OPERATION_DEFAULTS = {
  // Moving Average defaults
  movingAverage: {
    windowSize: 5,
    algorithm: 'SMA' as const,
  },
  
  // Quantize defaults
  quantize: {
    step: 1,
  },
  
  // Spearman Correlation defaults
  spearmanCorrelation: {
    startTime: 0,
    endTime: Number.MAX_SAFE_INTEGER, // Used when endTime is not explicitly provided
    resamplingWindowMs: 1000,
  },
  
  // Rolling Spearman defaults
  rollingSpearman: {
    windowSize: 10,
  },
  
  // Normalize defaults (for record operations)
  normalize: {
    minRange: 0,
    maxRange: 100,
  },
  
  // Moving Average for record operations (different default)
  recordMovingAverage: {
    windowSize: 3,
    algorithm: 'SMA' as const,
  },
} as const;

