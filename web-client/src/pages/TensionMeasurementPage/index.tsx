import React from "react";

import {
  TENSION_RECORDER_CONTAINER_CLASSES,
  TensionRecorder,
} from "@/components/TensionRecorder";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import FadeInWrapper from "@/components/FadeInWrapper";
import { useUserId } from "@/providers/UserProvider";
import config from "@/config";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";

export default function TensionMeasurementPage({
  shouldTransitionBegin,
  setTransitionFinished,
  payload,
}: StateNavigationComponentProps) {
  const userId = useUserId();

  useBackgroundColor(
    config.constants.pagesBackgroundColor.TENSION_MEASUREMENT,
    0
  );

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
            t: point.t,
            v: point.v,
          })),
          pieceId: payload.pieceId ?? "unknown",
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
