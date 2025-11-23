import { applyOperation, applyGlobalOperation, resampleData } from '../lib/dataOperations';
import type { RecordMetadata, GlobalOperation, ResamplingConfig, ProcessedRecord } from '../lib/types';

interface ProcessDataMessage {
  type: 'PROCESS_DATA';
  requestId: string;
  payload: {
    rawData: Array<{ id: string; timestamp: number; value: number }>;
    recordMetadata: Record<string, RecordMetadata>;
    resampling: ResamplingConfig;
    globalOperations: GlobalOperation[];
    filterByIds: string[];
    filterByTags: string[];
    idPrefix: string;
  };
}

type WorkerMessage = ProcessDataMessage;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, requestId, payload } = e.data;

  if (type === 'PROCESS_DATA') {
    try {
      const result = processData(payload);
      self.postMessage({ type: 'RESULT', requestId, payload: result });
    } catch (error) {
      self.postMessage({ 
        type: 'ERROR',
        requestId,
        payload: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
};

function processData(params: ProcessDataMessage['payload']): ProcessedRecord[] {
  const { rawData, recordMetadata, resampling, globalOperations, filterByIds, filterByTags, idPrefix } = params;

  // Group raw data by ID
  const groupedData = new Map<string, typeof rawData>();
  rawData.forEach(record => {
    if (!groupedData.has(record.id)) {
      groupedData.set(record.id, []);
    }
    groupedData.get(record.id)!.push(record);
  });

  // Step 1: Apply individual record operations
  const individuallyProcessed: ProcessedRecord[] = [];

  groupedData.forEach((records, id) => {
    const metadata = recordMetadata[id];
    if (!metadata) return;

    // Convert to data points
    let data = records.map((r) => ({
      timestamp: r.timestamp,
      value: r.value,
    }));
    const originalData = [...data];

    // Apply xMove (horizontal shift)
    if (metadata.xMove !== 0) {
      data = data.map((d) => ({
        ...d,
        timestamp: d.timestamp + metadata.xMove,
      }));
    }

    // Apply yMove (vertical shift)
    if (metadata.yMove !== 0) {
      data = data.map((d) => ({
        ...d,
        value: d.value + metadata.yMove,
      }));
    }

    // Apply operations in order
    metadata.operations.forEach((operation) => {
      data = applyOperation(data, operation);
    });

    individuallyProcessed.push({
      id: `${idPrefix}:${id}`,
      data,
      originalData,
      label: metadata.label,
    });
  });

  // Step 2: Filter by IDs and tags
  let filtered = individuallyProcessed.filter((record) => {
    const rawId = record.id.split(':').pop() || '';
    const metadata = recordMetadata[rawId];
    if (!metadata) return false;

    // Apply ID filter
    if (filterByIds.length > 0 && !filterByIds.includes(rawId)) {
      return false;
    }

    // Apply tag filter (AND logic)
    if (filterByTags.length > 0) {
      if (!filterByTags.every((tag) => metadata.tags.includes(tag))) {
        return false;
      }
    }

    return true;
  });

  // Step 3: Apply resampling if enabled
  if (resampling.applied) {
    filtered = filtered.map((record) => ({
      ...record,
      data: resampleData(
        record.data,
        resampling.windowMs,
        resampling.interpolationMethod
      ),
    }));
  }

  // Step 4: Apply global operations (only if resampling is applied)
  if (globalOperations.length > 0) {
    if (!resampling.applied) {
      console.warn('Global operations require resampling to be applied first');
      return applyDownsampling(filtered);
    }

    let result = filtered;
    globalOperations.forEach((operation) => {
      result = applyGlobalOperation(
        result.map((p) => ({ id: p.id, data: p.data })),
        operation
      ).map((r) => ({
        id: `${idPrefix}:${r.id}`,
        data: r.data,
        originalData: filtered.find((p) => p.id === r.id)?.originalData || [],
        label: operation.label,
      }));
    });
    return applyDownsampling(result);
  }

  return applyDownsampling(filtered);
}

// Downsample data if there are too many points
function downsampleData(
  data: Array<{ timestamp: number; value: number }>,
  maxPoints: number
): Array<{ timestamp: number; value: number }> {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const downsampled: Array<{ timestamp: number; value: number }> = [];

  for (let i = 0; i < data.length; i += step) {
    downsampled.push(data[i]);
  }

  // Always include the last point
  if (downsampled[downsampled.length - 1] !== data[data.length - 1]) {
    downsampled.push(data[data.length - 1]);
  }

  console.log(`Downsampled ${data.length} points to ${downsampled.length} (step: ${step})`);
  return downsampled;
}

// Apply downsampling to processed records
export function applyDownsampling(
  records: ProcessedRecord[],
  maxPointsPerSeries: number = 200000
): ProcessedRecord[] {
  return records.map(record => {
    if (record.data.length > maxPointsPerSeries) {
      return {
        ...record,
        data: downsampleData(record.data, maxPointsPerSeries)
      };
    }
    return record;
  });
}

export {};

