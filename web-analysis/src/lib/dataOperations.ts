import { DataRecord, RecordOperation, GlobalOperation, InterpolationMethod } from './types';
import { toDecimal, fromDecimal, decimalMin, decimalMax, safeDivide, decimalMean, decimalStdDev, roundToStep } from './decimalUtils';
import { OPERATION_DEFAULTS } from './operationDefaults';
import Decimal from 'decimal.js';

/**
 * Normalize data to a specific range
 */
export function normalizeData(
  data: Array<{ timestamp: number; value: number }>,
  minRange: number = 0,
  maxRange: number = 100
): Array<{ timestamp: number; value: number }> {
  if (data.length === 0) return data;

  const values = data.map(d => d.value);
  const min = fromDecimal(decimalMin(values));
  const max = fromDecimal(decimalMax(values));
  
  if (min === max) {
    return data.map(d => ({ ...d, value: minRange }));
  }

  // Use Decimal for precise normalization calculations
  const decMinRange = toDecimal(minRange);
  const decMaxRange = toDecimal(maxRange);
  const decMin = toDecimal(min);
  const decMax = toDecimal(max);
  const rangeDiff = decMax.minus(decMin);
  const outputRange = decMaxRange.minus(decMinRange);

  return data.map(d => {
    const decValue = toDecimal(d.value);
    const normalized = safeDivide(decValue.minus(decMin), rangeDiff).times(outputRange).plus(decMinRange);
    return {
      timestamp: d.timestamp,
      value: fromDecimal(normalized)
    };
  });
}

/**
 * Linear interpolation between two points using Decimal precision
 */
function linearInterpolate(
  x: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): number {
  if (x1 === x0) return y0;
  
  // Use Decimal precision for interpolation calculation
  const decX = toDecimal(x);
  const decX0 = toDecimal(x0);
  const decY0 = toDecimal(y0);
  const decX1 = toDecimal(x1);
  const decY1 = toDecimal(y1);
  
  const numerator = decX.minus(decX0).times(decY1.minus(decY0));
  const denominator = decX1.minus(decX0);
  const interpolated = decY0.plus(safeDivide(numerator, denominator));
  
  return fromDecimal(interpolated);
}

/**
 * Step interpolation (zero-order hold) - uses the value from the point with smaller or equal timestamp
 */
function stepInterpolate(y0: number): number {
  return y0;
}

/**
 * Resample data to fixed time windows with interpolation
 * @param data - Input data points
 * @param windowMs - Resampling window in milliseconds
 * @param interpolationMethod - 'linear' or 'step'
 * @param startTime - Optional start time for resampling range
 * @param endTime - Optional end time for resampling range
 * @returns Resampled data
 */
export function resampleData(
  data: Array<{ timestamp: number; value: number }>,
  windowMs: number,
  interpolationMethod: InterpolationMethod,
  startTime?: number,
  endTime?: number
): Array<{ timestamp: number; value: number }> {
  if (data.length === 0 || windowMs <= 0) return data;

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  
  if (sortedData.length === 1) return sortedData;

  // Find data's actual min and max timestamps
  const dataMinTime = sortedData[0].timestamp;
  const dataMaxTime = sortedData[sortedData.length - 1].timestamp;

  // Determine resampling range
  const minTime = startTime !== undefined ? startTime : dataMinTime;
  const maxTime = endTime !== undefined ? endTime : dataMaxTime;

  // Generate resampled timestamps
  const result: Array<{ timestamp: number; value: number }> = [];
  const startBucket = Math.floor(minTime / windowMs) * windowMs;
  const endBucket = Math.ceil(maxTime / windowMs) * windowMs;

  for (let timestamp = startBucket; timestamp <= endBucket; timestamp += windowMs) {
    // Skip if outside requested range
    if (timestamp < minTime || timestamp > maxTime) continue;

    // Find points with smaller/equal and larger/equal timestamp
    let lowerPoint = null;
    let upperPoint = null;

    for (let i = 0; i < sortedData.length; i++) {
      if (sortedData[i].timestamp <= timestamp) {
        lowerPoint = sortedData[i];
      }
      if (sortedData[i].timestamp >= timestamp && !upperPoint) {
        upperPoint = sortedData[i];
        break;
      }
    }

    let value: number;

    if (!lowerPoint && upperPoint) {
      // Before first data point - use NOCB (Next Observation Carried Backward)
      // For musical tension data, we use the first known state
      value = sortedData[0].value;
    } else if (lowerPoint && !upperPoint) {
      // After last data point - use LOCF (Last Observation Carried Forward)
      // For musical tension data, we maintain the last known state
      value = sortedData[sortedData.length - 1].value;
    } else if (lowerPoint && upperPoint) {
      // Between points - interpolate
      if (lowerPoint.timestamp === timestamp) {
        value = lowerPoint.value;
      } else if (upperPoint.timestamp === timestamp) {
        value = upperPoint.value;
      } else {
        if (interpolationMethod === 'linear') {
          value = linearInterpolate(
            timestamp,
            lowerPoint.timestamp,
            lowerPoint.value,
            upperPoint.timestamp,
            upperPoint.value
          );
        } else {
          // step interpolation
          value = stepInterpolate(lowerPoint.value);
        }
      }
    } else {
      continue; // Skip if no points available
    }

    result.push({ timestamp, value });
  }

  return result;
}

/**
 * Calculate common time range for multiple datasets
 * Strategy 1: Cut to shortest record series start and end
 */
export function calculateCommonTimeRange(
  datasets: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }>
): { startTime: number; endTime: number } | null {
  if (datasets.length === 0) return null;

  let maxStart = -Infinity;
  let minEnd = Infinity;

  datasets.forEach(ds => {
    if (ds.data.length === 0) return;
    const sortedData = [...ds.data].sort((a, b) => a.timestamp - b.timestamp);
    const start = sortedData[0].timestamp;
    const end = sortedData[sortedData.length - 1].timestamp;
    
    if (start > maxStart) maxStart = start;
    if (end < minEnd) minEnd = end;
  });

  if (maxStart === -Infinity || minEnd === Infinity || maxStart > minEnd) {
    return null;
  }

  return { startTime: maxStart, endTime: minEnd };
}

/**
 * Apply offset transformations to data
 */
export function applyOffsets(
  data: Array<{ timestamp: number; value: number }>,
  xMove: number,
  yMove: number
): Array<{ timestamp: number; value: number }> {
  return data.map(d => ({
    timestamp: d.timestamp + xMove,
    value: d.value + yMove
  }));
}

/**
 * Apply a single operation to record data
 */
export function applyOperation(
  data: Array<{ timestamp: number; value: number }>,
  operation: RecordOperation
): Array<{ timestamp: number; value: number }> {
  switch (operation.type) {
    case 'normalize':
      return normalizeData(
        data,
        typeof operation.params.minRange === 'number' 
          ? operation.params.minRange 
          : OPERATION_DEFAULTS.normalize.minRange,
        typeof operation.params.maxRange === 'number' 
          ? operation.params.maxRange 
          : OPERATION_DEFAULTS.normalize.maxRange
      );
    case 'quantize':
      return quantizeData(
        data,
        typeof operation.params.step === 'number' 
          ? operation.params.step 
          : OPERATION_DEFAULTS.quantize.step
      );
    case 'movingAverage':
      return calculateMovingAverage(
        data,
        typeof operation.params.windowSize === 'number' 
          ? operation.params.windowSize 
          : OPERATION_DEFAULTS.recordMovingAverage.windowSize,
        (operation.params.algorithm as 'SMA' | 'WMA' | 'RMA') || OPERATION_DEFAULTS.recordMovingAverage.algorithm
      );
    default:
      return data;
  }
}

/**
 * Calculate mean across multiple record datasets
 */
export function calculateMean(
  datasets: Array<Array<{ timestamp: number; value: number }>>
): Array<{ timestamp: number; value: number }> {
  if (datasets.length === 0) return [];

  // Collect all unique timestamps
  const timestampSet = new Set<number>();
  datasets.forEach(dataset => {
    dataset.forEach(d => timestampSet.add(d.timestamp));
  });

  const timestamps = Array.from(timestampSet).sort((a, b) => a - b);

  // For each timestamp, calculate mean of available values using Decimal precision
  return timestamps.map(timestamp => {
    const values: number[] = [];
    datasets.forEach(dataset => {
      const point = dataset.find(d => d.timestamp === timestamp);
      if (point) values.push(point.value);
    });

    const mean = values.length > 0
      ? fromDecimal(decimalMean(values))
      : 0;

    return { timestamp, value: mean };
  });
}

/**
 * Calculate standard deviation across multiple record datasets
 */
export function calculateStandardDeviation(
  datasets: Array<Array<{ timestamp: number; value: number }>>
): Array<{ timestamp: number; value: number }> {
  if (datasets.length === 0) return [];

  // Collect all unique timestamps
  const timestampSet = new Set<number>();
  datasets.forEach(dataset => {
    dataset.forEach(d => timestampSet.add(d.timestamp));
  });

  const timestamps = Array.from(timestampSet).sort((a, b) => a - b);

  // For each timestamp, calculate standard deviation of available values using Decimal precision
  return timestamps.map(timestamp => {
    const values: number[] = [];
    datasets.forEach(dataset => {
      const point = dataset.find(d => d.timestamp === timestamp);
      if (point) values.push(point.value);
    });

    if (values.length === 0) {
      return { timestamp, value: 0 };
    }

    // Use Decimal precision for standard deviation calculation
    const stdDev = fromDecimal(decimalStdDev(values));

    return { timestamp, value: stdDev };
  });
}

/**
 * Calculate Z-score standardization across multiple record datasets
 * Z-score transforms each dataset to have mean=0 and standard deviation=1
 * Each dataset is normalized independently using its own mean and std dev
 */
export function calculateZScore(
  datasets: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }>
): Array<{ id: string; data: Array<{ timestamp: number; value: number }> }> {
  if (datasets.length === 0) return [];

  return datasets.map(dataset => {
    if (dataset.data.length === 0) {
      return { id: dataset.id, data: [] };
    }

    // Calculate mean and standard deviation for this dataset using Decimal precision
    const values = dataset.data.map(d => d.value);
    const mean = fromDecimal(decimalMean(values));
    const stdDev = fromDecimal(decimalStdDev(values));

    // If standard deviation is 0, all values are the same, return zeros
    if (stdDev === 0) {
      return {
        id: dataset.id,
        data: dataset.data.map(d => ({ timestamp: d.timestamp, value: 0 }))
      };
    }

    // Calculate Z-score using Decimal precision: z = (x - mean) / stdDev
    const decMean = toDecimal(mean);
    const decStdDev = toDecimal(stdDev);
    const zScoreData = dataset.data.map(d => {
      const decValue = toDecimal(d.value);
      const zScore = safeDivide(decValue.minus(decMean), decStdDev);
      return {
        timestamp: d.timestamp,
        value: fromDecimal(zScore)
      };
    });

    return {
      id: dataset.id,
      data: zScoreData
    };
  });
}

/**
 * Calculate Min-Max normalization across multiple record datasets
 * Normalizes each dataset independently to [0, 1] range
 */
export function calculateMinMaxNormalization(
  datasets: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }>
): Array<{ id: string; data: Array<{ timestamp: number; value: number }> }> {
  if (datasets.length === 0) return [];

  return datasets.map(dataset => {
    if (dataset.data.length === 0) {
      return { id: dataset.id, data: [] };
    }

    // Find min and max values in this dataset using Decimal precision
    const values = dataset.data.map(d => d.value);
    const decMin = decimalMin(values);
    const decMax = decimalMax(values);
    const min = fromDecimal(decMin);
    const max = fromDecimal(decMax);

    // If all values are the same (min === max), return 0.5 for all values
    if (min === max) {
      return {
        id: dataset.id,
        data: dataset.data.map(d => ({ timestamp: d.timestamp, value: 0.5 }))
      };
    }

    // Normalize to [0, 1] range using Decimal precision: normalized = (x - min) / (max - min)
    const rangeDiff = decMax.minus(decMin);
    const normalizedData = dataset.data.map(d => {
      const decValue = toDecimal(d.value);
      const normalized = safeDivide(decValue.minus(decMin), rangeDiff);
      return {
        timestamp: d.timestamp,
        value: fromDecimal(normalized)
      };
    });

    return {
      id: dataset.id,
      data: normalizedData
    };
  });
}

/**
 * Calculate changes (derivative/diff) between consecutive values
 * Returns the difference between each value and the previous value
 * First value is omitted since there's no previous value to compare
 */
export function calculateChanges(
  data: Array<{ timestamp: number; value: number }>
): Array<{ timestamp: number; value: number }> {
  if (data.length <= 1) return [];

  const result: Array<{ timestamp: number; value: number }> = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i].value - data[i - 1].value;
    result.push({
      timestamp: data[i].timestamp,
      value: change
    });
  }

  return result;
}

/**
 * Quantize data values to a specific precision step
 * Rounds values to the nearest multiple of the step using Decimal precision
 */
export function quantizeData(
  data: Array<{ timestamp: number; value: number }>,
  step: number
): Array<{ timestamp: number; value: number }> {
  if (data.length === 0 || step <= 0) return data;

  return data.map(d => {
    const quantized = roundToStep(d.value, step);
    return {
      timestamp: d.timestamp,
      value: fromDecimal(quantized)
    };
  });
}

/**
 * Calculate moving average with different algorithms
 * @param data - Input data array
 * @param windowSize - Number of points to include in the moving average
 * @param algorithm - Algorithm type: 'SMA' (Simple), 'WMA' (Weighted), 'RMA' (Running/Smoothed)
 * @returns Data array starting from the point where calculation is possible
 */
export function calculateMovingAverage(
  data: Array<{ timestamp: number; value: number }>,
  windowSize: number,
  algorithm: 'SMA' | 'WMA' | 'RMA' = 'SMA'
): Array<{ timestamp: number; value: number }> {
  if (data.length === 0 || windowSize <= 0) return [];
  if (windowSize === 1) return data;
  
  // If window size is larger than data length, return empty array or the data as-is
  if (windowSize > data.length) {
    console.warn(`Moving average window size (${windowSize}) is larger than data length (${data.length}). Returning original data.`);
    return data;
  }
  
  const result: Array<{ timestamp: number; value: number }> = [];
  
  switch (algorithm) {
    case 'SMA': {
      // Simple Moving Average - arithmetic mean of last N values using Decimal precision
      for (let i = windowSize - 1; i < data.length; i++) {
        const windowValues: number[] = [];
        for (let j = i - windowSize + 1; j <= i; j++) {
          windowValues.push(data[j].value);
        }
        const mean = fromDecimal(decimalMean(windowValues));
        result.push({
          timestamp: data[i].timestamp,
          value: mean
        });
      }
      break;
    }
    
    case 'WMA': {
      // Weighted Moving Average - more recent values have higher weight using Decimal precision
      const weights = Array.from({ length: windowSize }, (_, i) => i + 1);
      const weightSum = weights.reduce((sum, w) => sum + w, 0);
      const decWeightSum = toDecimal(weightSum);
      
      for (let i = windowSize - 1; i < data.length; i++) {
        let weightedSum = new Decimal(0);
        for (let j = 0; j < windowSize; j++) {
          const value = toDecimal(data[i - windowSize + 1 + j].value);
          const weight = toDecimal(weights[j]);
          weightedSum = weightedSum.plus(value.times(weight));
        }
        const avg = weightedSum.dividedBy(decWeightSum);
        result.push({
          timestamp: data[i].timestamp,
          value: fromDecimal(avg)
        });
      }
      break;
    }
    
    case 'RMA': {
      // Running Moving Average (Smoothed Moving Average) using Decimal precision
      // Formula: RMA[i] = (RMA[i-1] * (N-1) + value[i]) / N
      // First value is SMA of first N values
      const initialValues: number[] = [];
      for (let i = 0; i < windowSize; i++) {
        initialValues.push(data[i].value);
      }
      let rma = decimalMean(initialValues);
      const decWindowSize = toDecimal(windowSize);
      const decWindowSizeMinusOne = toDecimal(windowSize - 1);
      
      result.push({
        timestamp: data[windowSize - 1].timestamp,
        value: fromDecimal(rma)
      });
      
      // Apply RMA formula for remaining values
      for (let i = windowSize; i < data.length; i++) {
        const decValue = toDecimal(data[i].value);
        rma = rma.times(decWindowSizeMinusOne).plus(decValue).dividedBy(decWindowSize);
        result.push({
          timestamp: data[i].timestamp,
          value: fromDecimal(rma)
        });
      }
      break;
    }
  }
  
  return result;
}

/**
 * Calculate Spearman's rank correlation coefficient between two datasets
 */
function calculateSpearmanCorrelation(
  data1: Array<{ timestamp: number; value: number }>,
  data2: Array<{ timestamp: number; value: number }>
): number {
  if (data1.length === 0 || data2.length === 0 || data1.length !== data2.length) {
    return 0;
  }

  const n = data1.length;

  // Assign ranks to data1
  const ranks1 = assignRanks(data1.map(d => d.value));
  // Assign ranks to data2
  const ranks2 = assignRanks(data2.map(d => d.value));

  // Calculate sum of squared differences
  let sumSquaredDiff = 0;
  for (let i = 0; i < n; i++) {
    const diff = ranks1[i] - ranks2[i];
    sumSquaredDiff += diff * diff;
  }

  // Spearman's rank correlation coefficient formula
  const rho = 1 - (6 * sumSquaredDiff) / (n * (n * n - 1));

  return rho;
}

/**
 * Assign ranks to values (handling ties with average ranks)
 */
function assignRanks(values: number[]): number[] {
  const n = values.length;
  
  // Create array of indices sorted by values
  const indices = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  
  const ranks = new Array(n);
  
  let i = 0;
  while (i < n) {
    let j = i;
    // Find all tied values
    while (j < n && values[indices[j]] === values[indices[i]]) {
      j++;
    }
    
    // Assign average rank to all tied values
    const avgRank = (i + j + 1) / 2; // Ranks are 1-based
    for (let k = i; k < j; k++) {
      ranks[indices[k]] = avgRank;
    }
    
    i = j;
  }
  
  return ranks;
}

/**
 * Calculate Spearman correlation matrix for multiple datasets within a time range
 * Returns upper triangle of correlation matrix as constant-value lines
 */
function calculateSpearmanCorrelationMatrix(
  datasets: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }>,
  startTime: number,
  endTime: number,
  resamplingWindowMs: number
): Array<{ id: string; data: Array<{ timestamp: number; value: number }> }> {
  if (datasets.length < 2) {
    console.warn('Spearman correlation requires at least 2 datasets');
    return [];
  }

  // Filter datasets to time range
  const filteredDatasets = datasets.map(ds => ({
    id: ds.id,
    data: ds.data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime)
  })).filter(ds => ds.data.length > 0);

  if (filteredDatasets.length < 2) {
    console.warn('Not enough data in specified time range');
    return [];
  }

  // Calculate correlations for upper triangle of matrix
  const correlationResults: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }> = [];
  
  for (let i = 0; i < filteredDatasets.length; i++) {
    for (let j = i + 1; j < filteredDatasets.length; j++) {
      const correlation = calculateSpearmanCorrelation(
        filteredDatasets[i].data,
        filteredDatasets[j].data
      );

      // Create constant-value line for this correlation
      const correlationData: Array<{ timestamp: number; value: number }> = [];
      
      // Generate timestamps across the range with resampling window spacing
      for (let t = startTime; t <= endTime; t += resamplingWindowMs) {
        correlationData.push({
          timestamp: t,
          value: correlation
        });
      }
      
      // Ensure we include the end time
      if (correlationData.length === 0 || correlationData[correlationData.length - 1].timestamp < endTime) {
        correlationData.push({
          timestamp: endTime,
          value: correlation
        });
      }

      const label = `ρ(${filteredDatasets[i].id}, ${filteredDatasets[j].id})`;
      correlationResults.push({
        id: label,
        data: correlationData
      });
    }
  }

  return correlationResults;
}

/**
 * Calculate rolling Spearman correlation for multiple datasets
 * Returns time series where each point represents correlation within a sliding window
 */
function calculateRollingSpearmanCorrelation(
  datasets: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }>,
  windowSize: number
): Array<{ id: string; data: Array<{ timestamp: number; value: number }> }> {


  
  if (datasets.length < 2) {
    console.warn('Rolling Spearman correlation requires at least 2 datasets');
    return [];
  }

  if (windowSize < 2) {
    console.warn('Window size must be at least 2');
    return [];
  }

  // All datasets should have same length and timestamps after resampling
  const dataLength = datasets[0].data.length;
  
  // Verify all datasets have the same length
  if (!datasets.every(ds => ds.data.length === dataLength)) {
    console.warn('All datasets must have the same length for rolling correlation');
    console.log(datasets.map(ds => ({ id: ds.id, length: ds.data.length })));
    return [];
  }

  if (dataLength < windowSize) {
    console.warn('Data length is smaller than window size');
    return [];
  }

  const correlationResults: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }> = [];
  
  // Calculate rolling correlations for each pair (upper triangle)
  for (let i = 0; i < datasets.length; i++) {
    for (let j = i + 1; j < datasets.length; j++) {
      const rollingCorrelationData: Array<{ timestamp: number; value: number }> = [];
      
      // Calculate correlation for each window position
      for (let windowStart = 0; windowStart <= dataLength - windowSize; windowStart++) {
        const windowEnd = windowStart + windowSize;
        
        // Extract window data for both datasets
        const window1 = datasets[i].data.slice(windowStart, windowEnd);
        const window2 = datasets[j].data.slice(windowStart, windowEnd);
        
        // Calculate correlation for this window
        const correlation = calculateSpearmanCorrelation(window1, window2);
        
        // Use the timestamp of the last point in the window
        const timestamp = datasets[i].data[windowEnd - 1].timestamp;
        
        rollingCorrelationData.push({
          timestamp,
          value: correlation
        });
      }
      
      const label = `Rolling ρ(${datasets[i].id}, ${datasets[j].id}) [w=${windowSize}]`;
      correlationResults.push({
        id: label,
        data: rollingCorrelationData
      });
    }
  }

  return correlationResults;
}

/**
 * Apply global operation across datasets
 */
export function applyGlobalOperation(
  datasets: Array<{ id: string; data: Array<{ timestamp: number; value: number }> }>,
  operation: GlobalOperation
): Array<{ id: string; data: Array<{ timestamp: number; value: number }> }> {
  switch (operation.type) {
    case 'mean': {
      const meanData = calculateMean(datasets.map(d => d.data));
      return [{ id: 'mean', data: meanData }];
    }
    case 'standardDeviation': {
      const stdDevData = calculateStandardDeviation(datasets.map(d => d.data));
      return [{ id: 'standardDeviation', data: stdDevData }];
    }
    case 'changes': {
      // Apply changes to each dataset individually
      return datasets.map(dataset => ({
        id: dataset.id,
        data: calculateChanges(dataset.data)
      }));
    }
    case 'quantize': {
      const step = typeof operation.params.step === 'number' 
        ? operation.params.step 
        : OPERATION_DEFAULTS.quantize.step;
      return datasets.map(dataset => ({
        id: dataset.id,
        data: quantizeData(dataset.data, step)
      }));
    }
    case 'movingAverage': {
      const windowSize = typeof operation.params.windowSize === 'number' 
        ? operation.params.windowSize 
        : OPERATION_DEFAULTS.movingAverage.windowSize;
      const algorithm = (operation.params.algorithm as 'SMA' | 'WMA' | 'RMA') || OPERATION_DEFAULTS.movingAverage.algorithm;
      return datasets.map(dataset => ({
        id: dataset.id,
        data: calculateMovingAverage(dataset.data, windowSize, algorithm)
      }));
    }
    case 'spearmanCorrelation': {
      const startTime = typeof operation.params.startTime === 'number' 
        ? operation.params.startTime 
        : OPERATION_DEFAULTS.spearmanCorrelation.startTime;
      const endTime = typeof operation.params.endTime === 'number' 
        ? operation.params.endTime 
        : Number.MAX_SAFE_INTEGER;
      const resamplingWindowMs = typeof operation.params.resamplingWindowMs === 'number' 
        ? operation.params.resamplingWindowMs 
        : OPERATION_DEFAULTS.spearmanCorrelation.resamplingWindowMs;
      
      return calculateSpearmanCorrelationMatrix(
        datasets,
        startTime,
        endTime,
        resamplingWindowMs
      );
    }
    case 'rollingSpearman': {
      const windowSize = typeof operation.params.windowSize === 'number' 
        ? operation.params.windowSize 
        : OPERATION_DEFAULTS.rollingSpearman.windowSize;
      
      return calculateRollingSpearmanCorrelation(
        datasets,
        windowSize
      );
    }
    case 'zScore': {
      return calculateZScore(datasets);
    }
    case 'minMaxNormalization': {
      return calculateMinMaxNormalization(datasets);
    }
    default:
      return datasets;
  }
}

/**
 * Group raw records by ID
 */
export function groupRecordsById(records: DataRecord[]): Map<string, DataRecord[]> {
  const grouped = new Map<string, DataRecord[]>();
  
  records.forEach(record => {
    if (!grouped.has(record.id)) {
      grouped.set(record.id, []);
    }
    grouped.get(record.id)!.push(record);
  });

  // Sort each group by timestamp
  grouped.forEach((records) => {
    records.sort((a, b) => a.timestamp - b.timestamp);
  });

  return grouped;
}
