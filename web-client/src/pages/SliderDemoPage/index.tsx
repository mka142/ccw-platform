import FadeInWrapper from "@/components/FadeInWrapper";
import FadeOutWrapper from "@/components/FadeOutWrapper";
import {
  TENSION_RECORDER_CONTAINER_CLASSES,
  TensionRecorder,
} from "@/components/TensionRecorder";
import config from "@/config";
import { useBackgroundColor } from "@/hooks/useBackgroundColor";
import { StateNavigationComponentProps } from "@/providers/StateNavigationProvider";
import { useState } from "react";
import Confetti from "react-confetti";

export default function SliderDemoPage({
  shouldTransitionBegin,
  setTransitionFinished,
}: StateNavigationComponentProps) {
  const [confettiActive, setConfettiActive] = useState(false);

  useBackgroundColor(config.constants.pagesBackgroundColor.SLIDER_DEMO, 0);

  return (
    <FadeOutWrapper
      className={TENSION_RECORDER_CONTAINER_CLASSES}
      shouldTransitionBegin={shouldTransitionBegin}
      setTransitionFinished={setTransitionFinished}
    >
      <FadeInWrapper className={TENSION_RECORDER_CONTAINER_CLASSES}>
        <TensionRecorder
          currentTimeMs={() => Date.now()}
          onComplete={(points) => {}}
          onSample={(s) => (s.v >= 90 ? setConfettiActive(true) : null)}
        />
        {confettiActive && <Confetti recycle={false} numberOfPieces={300} />}
      </FadeInWrapper>
    </FadeOutWrapper>
  );
}
