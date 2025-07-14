"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";

// Use audio file duration for chart maxDuration
function useAudioDuration(audioSrc: string, fallback: number) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioDuration, setAudioDuration] = useState<number>(fallback);
  useEffect(() => {
    const ref = audioRef.current;
    if (!ref) return;
    const handleLoadedMetadata = () => {
      if (ref.duration && !isNaN(ref.duration)) {
        setAudioDuration(Math.ceil(ref.duration));
      }
    };
    ref.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      ref.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioSrc]);
  return { audioRef, audioDuration };
}

interface BaseMusicSliderChartProps {
  data: Array<Array<[number, number]>>;
  audioSrc: string;
  height?: number;
  width?: number;
  zoomEnabled?: boolean;
  setZoomReset?: (v: boolean) => void;
  zoomReset?: boolean;
  quantStep?: number | null; // step for quantization of x-axis, default is 1
  lineType?: "monotone" | "linear" | "step" | "basis" | "natural";
  keepTreshold?: boolean;
  defaultMaxValue?: number | null; // default max value for y-axis if no data is provided
}

export function BaseMusicSliderChart({
  data,
  audioSrc,
  zoomEnabled = true,
  setZoomReset = () => {},
  zoomReset = true,
  quantStep = 1,
  lineType = "monotone",
  keepTreshold = false, // if true the value will be kept the same until the next value is set, otherwise it will be set to 0
  defaultMaxValue = null, // default max value for y-axis if no data is provided
}: BaseMusicSliderChartProps) {
  // Merged chart data for recharts
  type ChartPoint = { x: number } & { [key: string]: number | undefined };

  const { mergedChartData, lastX } = React.useMemo(() => {
    const merged: ChartPoint[] = [];
    let lastX = 0;
    if (data.length > 0) {
      lastX = Math.max(
        ...data.map((arr) => (arr.length > 0 ? arr[arr.length - 1][0] : 0))
      );
    }
    // keys y-0, y-1, etc. for each array in data
    const _notKeepTrasholdCahe: { [key: string]: number | undefined } = {};

    if (data.length > 0 && lastX > 0) {
      const step = quantStep;
      for (let t = 0; t <= lastX; t += step as number) {
        const point: ChartPoint = { x: Number(t.toFixed(2)) };
        data.forEach((arr, idx) => {
          if (keepTreshold) {
            const closest = arr.reduce((prev, curr) =>
              Math.abs(curr[0] - t) < Math.abs(prev[0] - t) ? curr : prev
            );
            point[`y-${idx}`] = closest ? closest[1] : undefined;
          } else {
            // just find the first one larger than t or last smallest one
            const closest = arr.find((p) => p[0] >= t) || arr[arr.length - 1];

            if (t === 0) {
              point[`y-${idx}`] = closest ? closest[1] : 0;
              _notKeepTrasholdCahe[`y-${idx}`] = point[`y-${idx}`];
            } else {
              // check last value and if it is the same as the current one, set undefined
              const lastValue = _notKeepTrasholdCahe[`y-${idx}`];
              if (lastValue === closest[1]) {
                point[`y-${idx}`] = undefined;
              } else {
                point[`y-${idx}`] = closest ? closest[1] : 0;
                _notKeepTrasholdCahe[`y-${idx}`] = point[`y-${idx}`];
              }
            }
          }
        });
        merged.push(point);
      }
    }
    return { mergedChartData: merged, lastX };
  }, [data, quantStep, keepTreshold]);

  const { audioRef, audioDuration } = useAudioDuration(audioSrc, lastX);

  const maxDuration = audioDuration;
  const maxValue = React.useMemo(() => {
    if (defaultMaxValue !== null) return defaultMaxValue;
    if (data.length === 0) return 0;
    return Math.max(...data.flatMap((arr) => arr.map((point) => point[1])));
  }, [data, defaultMaxValue]);

  // Chart sync with audio reference line
  const [currentTime, setCurrentTime] = useState(0);
  //const audioRef = useRef<HTMLAudioElement>(null);
  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  // Zoom state
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [xDomain, setXDomain] = useState<[number, number]>([0, maxDuration]);
  const [yDomain, setYDomain] = useState<[number, number]>([0, maxValue]);

  useEffect(() => {
    setXDomain([0, maxDuration]);
  }, [maxDuration]);

  // Chart lines (memoized)
  const chartLines = React.useMemo(
    () =>
      data.map((arr, idx) => (
        <Line
          key={`line-${idx}`}
          dataKey={`y-${idx}`}
          type={lineType}
          stroke={`var(--color-chart-${(idx % 5) + 1})`}
          dot={false}
          // isAnimationActive={false}
          name={`Odpowiedź ${idx + 1}`}
          connectNulls
          strokeWidth={2}
        />
      )),
    [data, lineType]
  );

  // Memoized Y domain calculation for zoom
  const getAxisYDomain = React.useCallback(
    (from: number, to: number, offset = 1): [number, number] => {
      const points = mergedChartData.filter((d) => d.x >= from && d.x <= to);
      let min = maxValue,
        max = 0;
      points.forEach((d) => {
        Object.keys(d).forEach((key) => {
          if (key !== "x" && typeof d[key] === "number") {
            if ((d[key] as number) < min) min = d[key] as number;
            if ((d[key] as number) > max) max = d[key] as number;
          }
        });
      });
      return [Math.floor(min - offset), Math.ceil(max + offset)];
    },
    [mergedChartData, maxValue]
  );

  // Zoom logic
  const zoom = () => {
    if (
      refAreaLeft === null ||
      refAreaRight === null ||
      refAreaLeft === refAreaRight
    ) {
      setRefAreaLeft(null);
      setRefAreaRight(null);

      return;
    }
    const left = Math.min(refAreaLeft, refAreaRight);
    const right = Math.max(refAreaLeft, refAreaRight);
    setXDomain([left, right]);
    setYDomain(getAxisYDomain(left, right));
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setZoomReset(false); // Reset zoom state in parent
  };

  const zoomOut = () => {
    setXDomain([0, maxDuration]);
    setYDomain([0, maxValue]);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  useEffect(() => {
    if (zoomReset) zoomOut();
  }, [zoomReset]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="block">
      {/* Reset zoom button is now controlled by parent via onResetZoom prop */}
      <ChartContainer
        config={{}}
        // className="w-full h-full"
      >
        <ResponsiveContainer>
          <LineChart
            accessibilityLayer
            data={mergedChartData}
            margin={{ left: 24, right: 24, top: 24, bottom: 32 }}
            onMouseDown={
              zoomEnabled
                ? (e) => {
                    if (e && e.activeLabel !== undefined) {
                      const labelNum =
                        typeof e.activeLabel === "number"
                          ? e.activeLabel
                          : Number(e.activeLabel);
                      if (!isNaN(labelNum)) setRefAreaLeft(labelNum);
                    }
                  }
                : undefined
            }
            onMouseMove={
              zoomEnabled
                ? (e) => {
                    if (
                      refAreaLeft !== null &&
                      e &&
                      e.activeLabel !== undefined
                    ) {
                      const labelNum =
                        typeof e.activeLabel === "number"
                          ? e.activeLabel
                          : Number(e.activeLabel);
                      if (!isNaN(labelNum)) setRefAreaRight(labelNum);
                    }
                  }
                : undefined
            }
            onMouseUp={zoomEnabled ? zoom : undefined}
            style={{ userSelect: "none" }}
          >
            <CartesianGrid />
            <XAxis
              dataKey="x"
              type="number"
              domain={xDomain}
              allowDataOverflow
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              label={{
                value: "Czas (s)",
                position: "insideBottomRight",
                offset: -5,
              }}
            />
            <YAxis
              type="number"
              domain={yDomain}
              allowDataOverflow
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              label={{
                value: "Wartość",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {chartLines}
            <ReferenceLine
              x={currentTime}
              stroke="var(--color-destructive)"
              strokeWidth={2}
              label={{ value: "O", position: "top" }}
            />
            {zoomEnabled && refAreaLeft !== null && refAreaRight !== null ? (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <audio
        ref={audioRef}
        src={audioSrc}
        controls
        onTimeUpdate={handleTimeUpdate}
        className="w-full mt-2"
      />
    </div>
  );
}
