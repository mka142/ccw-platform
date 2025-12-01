import React, { useEffect, useRef, useState } from "react";

import {
  TENSION_RECORDER_CONTAINER_CLASSES,
  TensionRecorder,
  TensionPoint,
} from "@/components/TensionRecorder";
import config from "@/config";

const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds

interface ReRecordPageProps {
  token: string;
}

export default function ReRecordPage({ token }: ReRecordPageProps) {
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Send heartbeat to server every 10 seconds
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const response = await fetch(config.api.reRecordForm.heartbeat(token), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.isFinished) {
            setIsFinished(true);
            // Clear interval when finished
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current);
              heartbeatIntervalRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error("Error sending heartbeat:", error);
      }
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Set up interval for subsequent heartbeats
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [token]);

  // Send data to re-record batch endpoint
  const sendData = async (data: TensionPoint[]) => {
    try {
      await fetch(config.api.reRecordForm.submitBatch(token), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: data.map((point) => ({
            t: point.t,
            v: point.v,
          })),
        }),
      });
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  // Show finished screen when recording is finished
  if (isFinished) {
    return (
      <div className={TENSION_RECORDER_CONTAINER_CLASSES}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white mb-4">Nagrywanie zakończone</h1>
            <p className="text-xl text-white/90">Dziękujemy!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={TENSION_RECORDER_CONTAINER_CLASSES}>
      <TensionRecorder
        currentTimeMs={() => Date.now()}
        onComplete={(points) => {
          sendData(points);
        }}
      />
    </div>
  );
}

