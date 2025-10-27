import React from "react";

import {
  TENSION_RECORDER_CONTAINER_CLASSES,
  TensionRecorder,
} from "../../components/TensionRecorder";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/lib/StateNavigationContext";
import FadeInWrapper from "@/components/FadeInWrapper";
import { useUserId } from "@/providers/UserProvider";
import config from "@/config";

export default function TensionRecorderPage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  const userId = useUserId();

  const sendData = async (data: any) => {
    try {
      await fetch(config.api.form.submitBatch, {
        // <- Use correct endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: userId,
          data: data.map((point: any) => ({
            timestamp: point.t,
            value: point.v,
          })),
          pieceId: "tension_recorder_piece_001",
        }),
      });
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };
  return (
    <FadeOutWrapper
      className={TENSION_RECORDER_CONTAINER_CLASSES}
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className={TENSION_RECORDER_CONTAINER_CLASSES}>
        <TensionRecorder
          currentTimeMs={() => Date.now()}
          onComplete={(points) => {
            sendData(points);
          }}
        />
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
