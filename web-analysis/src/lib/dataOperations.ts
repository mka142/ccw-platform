import { DataRecord, RecordOperation, GlobalOperation, InterpolationMethod } from './types';

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
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (min === max) {
    return data.map(d => ({ ...d, value: minRange }));
  }

  return data.map(d => ({
    timestamp: d.timestamp,
    value: minRange + ((d.value - min) / (max - min)) * (maxRange - minRange)
  }));
}

/**
 * Linear interpolation between two points
 */
function linearInterpolate(
  x: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
): number {
  if (x1 === x0) return y0;
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

/**
 * Step interpolation (zero-order hold) - uses the value from the point with smaller or equal timestamp
 */
function stepInterpolate(y0: number): number {
  return y0;
}

/**
 * Resample data to fixed time windows with interpolation
 */
export function resampleData(
  data: Array<{ timestamp: number; value: number }>,
  windowMs: number,
  interpolationMethod: InterpolationMethod
): Array<{ timestamp: number; value: number }> {
  if (data.length === 0 || windowMs <= 0) return data;

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  
  if (sortedData.length === 1) return sortedData;

  // Find min and max timestamps
  const minTime = sortedData[0].timestamp;
  const maxTime = sortedData[sortedData.length - 1].timestamp;

  // Generate resampled timestamps
  const result: Array<{ timestamp: number; value: number }> = [];
  const startBucket = Math.floor(minTime / windowMs) * windowMs;
  const endBucket = Math.ceil(maxTime / windowMs) * windowMs;

  for (let timestamp = startBucket; timestamp <= endBucket; timestamp += windowMs) {
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
      // Before first point - use first value
      value = upperPoint.value;
    } else if (lowerPoint && !upperPoint) {
      // After last point - use last value
      value = lowerPoint.value;
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
        typeof operation.params.minRange === 'number' ? operation.params.minRange : 0,
        typeof operation.params.maxRange === 'number' ? operation.params.maxRange : 100
      );
    case 'quantize':
      return quantizeData(
        data,
        typeof operation.params.step === 'number' ? operation.params.step : 1
      );
    case 'movingAverage':
      return calculateMovingAverage(
        data,
        typeof operation.params.windowSize === 'number' ? operation.params.windowSize : 3,
        (operation.params.algorithm as 'SMA' | 'WMA' | 'RMA') || 'SMA'
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

  // For each timestamp, calculate mean of available values
  return timestamps.map(timestamp => {
    const values: number[] = [];
    datasets.forEach(dataset => {
      const point = dataset.find(d => d.timestamp === timestamp);
      if (point) values.push(point.value);
    });

    const mean = values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
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

  // For each timestamp, calculate standard deviation of available values
  return timestamps.map(timestamp => {
    const values: number[] = [];
    datasets.forEach(dataset => {
      const point = dataset.find(d => d.timestamp === timestamp);
      if (point) values.push(point.value);
    });

    if (values.length === 0) {
      return { timestamp, value: 0 };
    }

    // Calculate mean
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Calculate variance
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    // Standard deviation is square root of variance
    const stdDev = Math.sqrt(variance);

    return { timestamp, value: stdDev };
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
 * Rounds values to the nearest multiple of the step
 */
export function quantizeData(
  data: Array<{ timestamp: number; value: number }>,
  step: number
): Array<{ timestamp: number; value: number }> {
  if (data.length === 0 || step <= 0) return data;

  return data.map(d => ({
    timestamp: d.timestamp,
    value: Math.round(d.value / step) * step
  }));
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
      // Simple Moving Average - arithmetic mean of last N values
      for (let i = windowSize - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = i - windowSize + 1; j <= i; j++) {
          sum += data[j].value;
        }
        result.push({
          timestamp: data[i].timestamp,
          value: sum / windowSize
        });
      }
      break;
    }
    
    case 'WMA': {
      // Weighted Moving Average - more recent values have higher weight
      const weights = Array.from({ length: windowSize }, (_, i) => i + 1);
      const weightSum = weights.reduce((sum, w) => sum + w, 0);
      
      for (let i = windowSize - 1; i < data.length; i++) {
        let weightedSum = 0;
        for (let j = 0; j < windowSize; j++) {
          weightedSum += data[i - windowSize + 1 + j].value * weights[j];
        }
        result.push({
          timestamp: data[i].timestamp,
          value: weightedSum / weightSum
        });
      }
      break;
    }
    
    case 'RMA': {
      // Running Moving Average (Smoothed Moving Average)
      // Formula: RMA[i] = (RMA[i-1] * (N-1) + value[i]) / N
      // First value is SMA of first N values
      let rma = 0;
      
      // Calculate initial SMA for first window
      for (let i = 0; i < windowSize; i++) {
        rma += data[i].value;
      }
      rma = rma / windowSize;
      
      result.push({
        timestamp: data[windowSize - 1].timestamp,
        value: rma
      });
      
      // Apply RMA formula for remaining values
      for (let i = windowSize; i < data.length; i++) {
        rma = (rma * (windowSize - 1) + data[i].value) / windowSize;
        result.push({
          timestamp: data[i].timestamp,
          value: rma
        });
      }
      break;
    }
  }
  
  return result;
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
        : 1;
      return datasets.map(dataset => ({
        id: dataset.id,
        data: quantizeData(dataset.data, step)
      }));
    }
    case 'movingAverage': {
      const windowSize = typeof operation.params.windowSize === 'number' 
        ? operation.params.windowSize 
        : 5;
      const algorithm = (operation.params.algorithm as 'SMA' | 'WMA' | 'RMA') || 'SMA';
      return datasets.map(dataset => ({
        id: dataset.id,
        data: calculateMovingAverage(dataset.data, windowSize, algorithm)
      }));
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
