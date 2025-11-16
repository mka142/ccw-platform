import { useEffect, useRef, useCallback, useState } from 'react';
import type { RecordMetadata, GlobalOperation, ResamplingConfig, ProcessedRecord } from '@/lib/types';

interface ProcessDataParams {
  rawData: Array<{ id: string; timestamp: number; value: number }>;
  recordMetadata: Record<string, RecordMetadata>;
  resampling: ResamplingConfig;
  globalOperations: GlobalOperation[];
  filterByIds: string[];
  filterByTags: string[];
  idPrefix: string;
}

interface UseDataProcessorReturn {
  processData: (params: ProcessDataParams) => Promise<ProcessedRecord[]>;
  isProcessing: boolean;
}

export function useDataProcessor(): UseDataProcessorReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingResolveRef = useRef<((result: ProcessedRecord[]) => void) | null>(null);
  const pendingRejectRef = useRef<((error: Error) => void) | null>(null);

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/dataProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;

      if (type === 'RESULT') {
        setIsProcessing(false);
        if (pendingResolveRef.current) {
          pendingResolveRef.current(payload);
          pendingResolveRef.current = null;
          pendingRejectRef.current = null;
        }
      } else if (type === 'ERROR') {
        setIsProcessing(false);
        if (pendingRejectRef.current) {
          pendingRejectRef.current(new Error(payload));
          pendingResolveRef.current = null;
          pendingRejectRef.current = null;
        }
      }
    };

    // Handle worker errors
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      setIsProcessing(false);
      if (pendingRejectRef.current) {
        pendingRejectRef.current(new Error('Worker error'));
        pendingResolveRef.current = null;
        pendingRejectRef.current = null;
      }
    };

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const processData = useCallback((params: ProcessDataParams): Promise<ProcessedRecord[]> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      setIsProcessing(true);
      pendingResolveRef.current = resolve;
      pendingRejectRef.current = reject;

      workerRef.current.postMessage({
        type: 'PROCESS_DATA',
        payload: params,
      });
    });
  }, []);

  return { processData, isProcessing };
}
