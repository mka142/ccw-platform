import React, { useEffect, useRef } from "react";

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

  // Send heartbeat to server every 10 seconds
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch(config.api.reRecordForm.heartbeat(token), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
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

