import React from "react";

import {
  TENSION_RECORDER_CONTAINER_CLASSES,
  TensionRecorderConference,
} from "@/components/TensionRecorderConference";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import FadeInWrapper from "@/components/FadeInWrapper";
import { useUserId } from "@/providers/UserProvider";
import config from "@/config";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";

export default function TensionMeasurementConferencePage({
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
          pieceId: payload.pieceId ?? "conference-demo",
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
        <TensionRecorderConference
          currentTimeMs={() => Date.now()}
          onComplete={(points) => {
            sendData(points);
          }}
        />
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}