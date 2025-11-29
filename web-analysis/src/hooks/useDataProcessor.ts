import { useEffect, useRef, useCallback, useState } from "react";
import type {
  RecordMetadata,
  GlobalOperation,
  ResamplingConfig,
  ProcessedRecord,
} from "@/lib/types";

interface ProcessDataParams {
  rawData: Array<{ id: string; timestamp: number; value: number }>;
  recordMetadata: Record<string, RecordMetadata>;
  resampling: ResamplingConfig;
  globalOperations: GlobalOperation[];
  filterByIds: string[];
  filterByTags: string[];
  excludeTags: string[];
  idPrefix: string;
}

interface UseDataProcessorReturn {
  processData: (params: ProcessDataParams) => Promise<ProcessedRecord[]>;
  isProcessing: boolean;
}

interface PendingRequest {
  resolve: (result: ProcessedRecord[]) => void;
  reject: (error: Error) => void;
}

export function useDataProcessor(): UseDataProcessorReturn {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
  const requestIdCounterRef = useRef<number>(0);

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL("../workers/dataProcessor.worker.ts", import.meta.url),
      { type: "module" }
    );

    const worker = workerRef.current;
    const pendingRequests = pendingRequestsRef.current;

    // Handle messages from worker
    worker.onmessage = (e: MessageEvent) => {
      const { type, payload, requestId } = e.data;

      if (type === "RESULT") {
        const pendingRequest = pendingRequests.get(requestId);
        if (pendingRequest) {
          pendingRequest.resolve(payload);
          pendingRequests.delete(requestId);
          
          // Update isProcessing if no more pending requests
          if (pendingRequests.size === 0) {
            setIsProcessing(false);
          }
        }
      } else if (type === "ERROR") {
        const pendingRequest = pendingRequests.get(requestId);
        if (pendingRequest) {
          pendingRequest.reject(new Error(payload));
          pendingRequests.delete(requestId);
          
          // Update isProcessing if no more pending requests
          if (pendingRequests.size === 0) {
            setIsProcessing(false);
          }
        }
      }
    };

    // Handle worker errors
    worker.onerror = (error) => {
      console.error("Worker error:", error);
      
      // Reject all pending requests
      pendingRequests.forEach((request) => {
        request.reject(new Error("Worker error"));
      });
      pendingRequests.clear();
      setIsProcessing(false);
    };

    // Cleanup
    return () => {
      worker.terminate();
      workerRef.current = null;
      
      // Clear all pending requests
      pendingRequests.clear();
    };
  }, []);

  const processData = useCallback(
    (params: ProcessDataParams): Promise<ProcessedRecord[]> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error("Worker not initialized"));
          return;
        }

        // Generate unique request ID
        const requestId = `req_${++requestIdCounterRef.current}_${Date.now()}`;
        
        // Store the promise handlers
        pendingRequestsRef.current.set(requestId, { resolve, reject });
        setIsProcessing(true);

        // Send message to worker with request ID
        workerRef.current.postMessage({
          type: "PROCESS_DATA",
          requestId,
          payload: params,
        });
      });
    },
    []
  );

  return { processData, isProcessing };
}
