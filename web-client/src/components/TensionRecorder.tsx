import { useState, useEffect, useRef } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "react-spring";

import clsx from "clsx";

export interface TensionPoint {
  t: number; // timestamp in ms
  v: number; // 0-100 value
}

interface TensionRecorderProps {
  currentTimeMs: () => number;
  onSample?: (point: TensionPoint) => void;
  onBufferFull?: (points: TensionPoint[]) => void;
  onComplete?: (points: TensionPoint[]) => void;
}

const SAMPLE_INTERVAL_MS = 100;

const SEND_IF_VALUE_NOT_CHANGED = false;

const VALUE_DECIMALS = 1;

const UP_SCRREN_MARGIN = 5; // vh or %

const HISTORY_BUFFER_SIZE = 100;

const scrrenHeight = window.innerHeight;
const goldenRatio = (1 + Math.sqrt(5)) / 2;
const tensionFactor = scrrenHeight / Math.pow(goldenRatio, 10); // or 9

const SRPING_TENSION = 170; // or 300
const SPRING_FRICTION = 26;

// Spring configuration for smooth movement
const scaleNumber = (
  num: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => {
  return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

const getBorderRadius = (tensionValue: number) => {
  if (tensionValue < 90) {
    return 120 - (tensionValue / 90) * (120 - 16);
  } else {
    return 16 - ((tensionValue - 90) / 10) * (16 - 8);
  }
};

export const TENSION_RECORDER_CONTAINER_CLASSES =
  "relative w-full h-full bg-black touch-none select-none overflow-hidden";

export const TensionRecorder: React.FC<TensionRecorderProps> = ({
  currentTimeMs,
  onSample,
  onComplete,
}) => {
  const [recordingStart, setRecordingStart] = useState(false);

  const [tension, setTension] = useState(0);
  const tensionHistory = useRef<TensionPoint[]>([]);

  const springProps = useSpring({
    height: scaleNumber(tension, 0, 100, 10, 100 - UP_SCRREN_MARGIN),
    config: {
      tension: SRPING_TENSION,
      friction: SPRING_FRICTION,
    },
  });

  // Sampling interval - record every 50ms
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentValue = springProps.height.get();
      const point: TensionPoint = {
        t: currentTimeMs(),
        v:
          currentValue === null
            ? 0
            : parseFloat(currentValue.toFixed(VALUE_DECIMALS)),
      };

      const lastValue =
        tensionHistory.current.length > 0
          ? tensionHistory.current[tensionHistory.current.length - 1].v
          : null;

      const isSameValue = lastValue === point.v;

      if ((!SEND_IF_VALUE_NOT_CHANGED && isSameValue) || point.v === null) {
        return;
      }
      tensionHistory.current.push(point);
      if (onSample) {
        onSample(point);
      }
    }, SAMPLE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [currentTimeMs, onSample, springProps.height]);

  useEffect(() => {
    if (tensionHistory.current.length >= HISTORY_BUFFER_SIZE) {
      if (onComplete) {
        onComplete([...tensionHistory.current]);
      }
      tensionHistory.current = [];
    }
  }, [tensionHistory?.current.length, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (onComplete && tensionHistory.current.length > 0) {
        onComplete([...tensionHistory.current]);
      }
    };
  }, [onComplete]);

  // Drag handler - track vertical movement delta
  const bind = useDrag(
    ({ delta: [, dy], down }) => {
      if (!recordingStart) {
        setRecordingStart(true);
      }
      if (!down) {
        return;
      }
      const tensionDelta = -dy / tensionFactor;
      setTension((prev) => Math.max(0, Math.min(100, prev + tensionDelta)));
    },
    {
      filterTaps: true,
      pointer: { touch: true },
      from: () => [0, 0],
    }
  );

  return (
    <div className="relative w-full h-full bg-black touch-none select-none overflow-hidden">
      <animated.div
        {...bind()}
        className="relative w-full h-full bg-black touch-none select-none overflow-hidden border rounded-4xl"
      >
        <DisplayNumberedScale springProps={springProps} tension={tension} />

        <DisplaySideGlowAccents springProps={springProps} />
        <DisplayGrayCoveredArea springProps={springProps} tension={tension} />
        <DisplayFaderHolder springProps={springProps} />
        <HandIndicator show={!recordingStart} />
      </animated.div>
      <div role="bottomaligned content" className="absolute bottom-2 left-5">
        <RecordingIndicator recordingStart={recordingStart} />
      </div>
    </div>
  );
};

function DisplaySideGlowAccents({ springProps }: { springProps: any }) {
  // Corner glow parameters (blue) derived from the same spring
  const glowSize = springProps.height.to((h: number) => `${40 + h * 0.5}px`);
  const glowOpacity = springProps.height.to(
    (h: number) => 0.06 + (h / 100) * 0.6
  );
  const glowBlur = springProps.height.to(
    (h: number) => `blur(${6 + h * 0.12}px)`
  );
  return (
    <>
      <animated.div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: 0,
          width: glowSize,
          height: "100%",
          borderRadius: "0 9999px 9999px 0",
          background: "linear-gradient(90deg, #42b2c2, rgba(66,178,194,0))",
          opacity: glowOpacity,
          filter: glowBlur,
          transform: "translate(-25%,-50%)",
        }}
      />

      <animated.div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          right: 0,
          width: glowSize,
          height: "100%",
          borderRadius: "9999px 0 0 9999px",
          background: "linear-gradient(270deg, #42b2c2, rgba(66,178,194,0))",
          opacity: glowOpacity,
          filter: glowBlur,
          transform: "translate(25%,-50%)",
        }}
      />
    </>
  );
}

function DisplayGrayCoveredArea({
  springProps,
  tension,
}: {
  springProps: any;
  tension: number;
}) {
  return (
    <>
      <animated.div
        className={`absolute inset-x-0 bottom-0 pointer-events-none border`}
        style={{
          borderTopLeftRadius: springProps.height.to(
            (h: number) =>
              `${getBorderRadius(scaleNumber(h, 10, 95, 0, 100))}px`
          ),
          borderTopRightRadius: springProps.height.to(
            (h: number) =>
              `${getBorderRadius(scaleNumber(h, 10, 95, 0, 100))}px`
          ),
          height: springProps.height.to((h: number) => `${h}%`),
          background: `linear-gradient(to top, rgba(255, 255, 255, ${
            tension / 300
          }), rgba(255, 255, 255, ${tension / 300 + 0.1}))`,
        }}
      />
    </>
  );
}

function HandIndicator({ show }: { show: boolean }) {
  const slideAnimation = useSpring({
    to: async (next: any) => {
      if (!show) {
        await next({ opacity: 0, transform: "translateY(0px)" });
        return;
      }
      // Show hand, then animate slide up, then fade out
      await next({ opacity: 1, transform: "translateY(0px)" });
      await new Promise((resolve) => setTimeout(resolve, 800));
      await next({ opacity: 1, transform: "translateY(-120px)" });
      await new Promise((resolve) => setTimeout(resolve, 400));
      await next({ opacity: 0, transform: "translateY(-120px)" });
      await new Promise((resolve) => setTimeout(resolve, 1500));
    },
    from: { opacity: 0, transform: "translateY(0px)" },
    config: { tension: 120, friction: 20 },
    loop: show,
  });

  if (!show) return null;

  return (
    <animated.div
      className="absolute bottom-32 left-1/2 pointer-events-none flex flex-row items-center gap-2"
      style={{
        ...slideAnimation,
        transform: slideAnimation.transform.to(
          (t: string) => `translate(-50%, 0) ${t}`
        ),
      }}
    >
      {/* Caret up icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 14L12 9L17 14"
          stroke="rgba(66,178,194,0.9)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Helper text */}
      <div className="text-white/60 text-sm font-mono text-center whitespace-nowrap">
        Przesuń w górę
      </div>
    </animated.div>
  );
}

function DisplayNumberedScale({
  springProps,
  tension,
}: {
  springProps: any;
  tension: number;
}) {
  return (
    <>
      <animated.div
        role="height control"
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: springProps.height.to((h: number) => `${h}%`) }}
      ></animated.div>
      <div
        className="absolute inset-0 bottom-0 pointer-events-none bg-black/20 text-white/20 flex flex-col items-center justify-between text-6xl font-mono tracking-widest select-none  "
        style={{ height: `calc(100vh - ${UP_SCRREN_MARGIN}vh)` }}
      >
        <div>&nbsp;</div>
        <div
          className={clsx(
            "transition-colors duration-200",
            tension >= 100 ? `text-white z-10` : ""
          )}
        >
          10
        </div>

        <div
          className={clsx(
            "transition-colors duration-200",
            tension >= 80 ? "text-white/95 z-10" : ""
          )}
        >
          8
        </div>

        <div
          className={clsx(
            "transition-colors duration-200",
            tension >= 60 ? "text-white/90 z-10" : ""
          )}
        >
          6
        </div>

        <div
          className={clsx(
            "transition-colors duration-200",
            tension >= 40 ? "text-white/80 z-10" : ""
          )}
        >
          4
        </div>

        <div
          className={clsx(
            "transition-colors duration-200",
            tension >= 20 ? "text-white/70 z-10" : ""
          )}
        >
          2
        </div>

        {/* <div className={clsx("transition-colors duration-500", tension >= 10 ? 'text-white/40 z-10' : "")}>0</div> */}
        <div>&nbsp;</div>
      </div>
    </>
  );
}

function DisplayFaderHolder({ springProps }: { springProps: any }) {
  // Animated SVG elements
  const AnimatedPath = animated.path as any;
  const AnimatedRect = animated.rect as any;

  // Derive subtle color shifts from the spring height (tension)
  // Top becomes darker as tension increases; bottom becomes brighter.
  const topFill = springProps.height.to((h: number) => {
    // map h (0-100) -> lightness 70 -> 36 (darker as h increases)
    const light = Math.max(36, 70 - h * 0.34);
    return `hsl(0 0% ${light}%)`;
  });

  const bottomFill = springProps.height.to((h: number) => {
    // map h (0-100) -> lightness 10 -> 60 (brighter as h increases)
    const light = Math.min(60, 10 + h * 0.5);
    return `hsl(0 0% ${light}%)`;
  });
  const sideFill = springProps.height.to((h: number) => {
    // map h (0-100) -> lightness 10 -> 40 (brighter as h increases)
    const light = Math.min(40, 10 + h * 0.5);
    return `hsl(0 0% ${light}%)`;
  });

  return (
    <>
      {/* Static SVG edge centered (exported from figma design) */}
      <animated.div
        className="absolute left-1/2 pointer-events-none z-20"
        style={{
          bottom: springProps.height.to((h: number) => `${h}%`),
          transform: "translate(-50%, 50%)",
          width: "90%",
        }}
      >
        <svg
          viewBox="0 0 199 52"
          width="100%"
          height="64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block mx-auto"
        >
          <AnimatedRect
            x="1.11182"
            y="0.5"
            width="196"
            height="51"
            fill="black"
            stroke="#D0D0D0"
          />
          <AnimatedPath
            d="M196.612 1L164.612 25H34.6118L1.61182 1H196.612Z"
            fill={topFill}
            stroke="black"
          />
          <AnimatedPath
            d="M1.61182 51L34.6118 28V25.5L1.61182 1.5V51Z"
            fill={sideFill}
            stroke="black"
          />
          <AnimatedPath
            d="M164.612 28H35.1118L1.61182 51H196.612L164.612 28Z"
            fill={bottomFill}
            stroke="black"
          />
          <AnimatedPath
            d="M196.612 51L164.612 27.5V25.5L196.612 1.5V51Z"
            fill={sideFill}
            stroke="#151212"
          />
          <line
            x1="34.6118"
            y1="26"
            x2="164.612"
            y2="26"
            stroke="white"
            strokeWidth="4"
          />
        </svg>
      </animated.div>
    </>
  );
}

function RecordingIndicator({
  recordingStart = false,
}: {
  recordingStart?: boolean;
}) {
  const pulse = useSpring({
    to: async (next: any) => {
      if (!recordingStart) {
        await next({ transform: "scale(1)", boxShadow: "0 0 0 rgba(0,0,0,0)" });
        return;
      }
      // loop pulse while recording
      // animate to a slightly larger scale and glow, then back
      while (recordingStart) {
        await next({
          transform: "scale(1.25)",
          boxShadow: "0 0 14px rgba(255,77,79,0.5)",
        });
        await next({
          transform: "scale(1)",
          boxShadow: "0 0 6px rgba(255,77,79,0.15)",
        });
      }
    },
    config: { tension: 300, friction: 20 },
  });

  return (
    <div className="flex items-center gap-3 pointer-events-none">
      <animated.div
        style={{
          width: 12,
          height: 12,
          borderRadius: 9999,
          background: recordingStart ? "#ff4d4f" : "rgba(255,77,79,0.3)",
          ...pulse,
        }}
      />
      <div className="text-white/50 text-sm font-mono">
        {recordingStart ? "Rejestracja..." : "Gotowy do rejestracji"}
      </div>
    </div>
  );
}
