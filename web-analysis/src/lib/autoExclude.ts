/**
 * Auto Exclude Utilities
 * 
 * This module provides utilities for automatically excluding records based on
 * length statistics after resampling. Records are excluded by adding the
 * 'AUTO_EXCLUDED' tag to their metadata.
 */

export interface RecordLengthInfo {
  id: string;
  length: number;
  displayName: string;
}

export interface LengthStatistics {
  average: number;
  standardDeviation: number;
  median: number;
  lengths: RecordLengthInfo[];
}

export type ThresholdType = 'average-std' | 'median-std' | 'manual';

/**
 * Calculate length statistics for a collection of records
 */
export function calculateLengthStatistics(recordLengths: RecordLengthInfo[]): LengthStatistics | null {
  if (recordLengths.length === 0) return null;
  
  const lengthValues = recordLengths.map(r => r.length);
  lengthValues.sort((a, b) => a - b);
  
  const sum = lengthValues.reduce((acc, val) => acc + val, 0);
  const average = sum / lengthValues.length;
  
  // Calculate standard deviation
  const variance = lengthValues.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / lengthValues.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate median
  const middle = Math.floor(lengthValues.length / 2);
  const median = lengthValues.length % 2 === 0 
    ? (lengthValues[middle - 1] + lengthValues[middle]) / 2 
    : lengthValues[middle];
  
  return {
    average,
    standardDeviation,
    median,
    lengths: recordLengths
  };
}

/**
 * Calculate threshold based on type and statistics
 */
export function calculateThreshold(
  thresholdType: ThresholdType, 
  stats: LengthStatistics, 
  manualThreshold?: number
): number | null {
  switch (thresholdType) {
    case 'manual':
      if (typeof manualThreshold !== 'number' || isNaN(manualThreshold) || manualThreshold < 0) {
        return null;
      }
      return manualThreshold;
      
    case 'average-std':
      return stats.average - stats.standardDeviation;
      
    case 'median-std':
      return stats.median - stats.standardDeviation;
      
    default:
      return null;
  }
}

/**
 * Filter records that should be excluded based on threshold
 */
export function getRecordsToExclude(stats: LengthStatistics, threshold: number): RecordLengthInfo[] {
  return stats.lengths.filter(record => record.length < threshold);
}

/**
 * Extract clean record ID by removing prefix if present
 */
export function extractCleanRecordId(prefixedId: string): string {
  return prefixedId.replace(/^[^:]*:/, '');
}

/**
 * Check if a record has the AUTO_EXCLUDED tag
 */
export function hasAutoExcludedTag(tags: string[]): boolean {
  return tags.includes('AUTO_EXCLUDED');
}

/**
 * Add AUTO_EXCLUDED tag to tags array if not already present
 */
export function addAutoExcludedTag(tags: string[]): string[] {
  if (hasAutoExcludedTag(tags)) {
    return tags;
  }
  return [...tags, 'AUTO_EXCLUDED'];
}

/**
 * Remove AUTO_EXCLUDED tag from tags array
 */
export function removeAutoExcludedTag(tags: string[]): string[] {
  return tags.filter(tag => tag !== 'AUTO_EXCLUDED');
}

/**
 * Constants for auto exclude operations
 */
export const AUTO_EXCLUDE_CONSTANTS = {
  TAG_NAME: 'AUTO_EXCLUDED' as const,
  THRESHOLD_TYPES: {
    AVERAGE_STD: 'average-std' as const,
    MEDIAN_STD: 'median-std' as const,
    MANUAL: 'manual' as const,
  }
} as const;