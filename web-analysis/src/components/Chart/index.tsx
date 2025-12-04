"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useDashboard, parseRecordId } from "@/context/DashboardContext";
import { useTheme } from "@/context/ThemeContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChartVisualizationMode } from "@/lib/types";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#a78bfa",
  "#fb923c",
  "#34d399",
  "#f472b6",
];

// Type for chart data series
type ChartDataSeries = {
  type: string;
  name: string;
  showInLegend: boolean;
  color: string;
  lineThickness?: number;
  lineDashType?: string;
  markerType: string;
  dataPoints: Array<{ x: number; y: number }>;
  click?: () => void;
};

interface ChartProps {
  footer?: React.ReactNode;
  currentTime?: number; // Current playback time in seconds (for audio sync)
  recordingStartTimestamp?: number; // Optional: Recording start timestamp to offset all data
  chartEndTime?: number; // Optional: Chart display end time in seconds
}

export default function Chart({
  footer,
  currentTime,
  chartEndTime,
  recordingStartTimestamp,
}: ChartProps = {}) {
  const {
    processedData,
    effectiveConfig,
    config,
    setHighlightedRecordId,
    chartVisualizationMode,
    setChartVisualizationMode,
    setYAxisRange,
    clearYAxisRange,
    isProcessing,
  } = useDashboard();
  const { theme } = useTheme();

  const [CanvasJSStockChart, setCanvasJSStockChart] =
    useState<React.ComponentType<{
      options: unknown;
      containerProps?: unknown;
      ref?: unknown;
      onRef?: unknown;
    }> | null>(null);
  const chartRef = useRef<unknown>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartKey, setChartKey] = useState(0); // Force rerender on resize

  // Y-axis range state
  const [yMin, setYMin] = useState(config.yAxisRange?.min?.toString() || "");
  const [yMax, setYMax] = useState(config.yAxisRange?.max?.toString() || "");

  // Update local state when config changes
  useEffect(() => {
    if (config.yAxisRange?.enabled) {
      setYMin(config.yAxisRange.min.toString());
      setYMax(config.yAxisRange.max.toString());
    } else {
      setYMin("");
      setYMax("");
    }
  }, [config.yAxisRange]);

  // Resize observer to rerender chart when container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger chart rerender by updating key
      setChartKey((prev) => prev + 1);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Dynamically import CanvasJS only on client side
  useEffect(() => {
    // @ts-expect-error - CanvasJS doesn't have TypeScript definitions
    import("@canvasjs/react-stockcharts")
      .then((CanvasJSReact) => {
        console.log("CanvasJS loaded:", CanvasJSReact);
        console.log("CanvasJSReact.default:", CanvasJSReact.default);
        console.log(
          "CanvasJSReact.CanvasJSStockChart:",
          CanvasJSReact.CanvasJSStockChart
        );

        // Try to get the component from the module
        const StockChart =
          CanvasJSReact.CanvasJSStockChart ||
          CanvasJSReact.default?.CanvasJSStockChart;
        console.log("StockChart component:", StockChart);

        if (StockChart) {
          setCanvasJSStockChart(() => StockChart);
        } else {
          console.error(
            "Could not find CanvasJSStockChart component in module"
          );
        }
      })
      .catch((error) => {
        console.error("Failed to load CanvasJS:", error);
      });
  }, []);

  const sliderRangeRef = useRef<{ min: number; max: number } | null>(null);
  // Range change handler - using useCallback to keep reference stable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRangeChanged = useCallback((e: any) => {
    // Save the slider range when user changes it (without causing re-render)
    if (e.stockChart?.navigator?.slider) {
      sliderRangeRef.current = {
        min: e.stockChart.navigator.slider.minimum,
        max: e.stockChart.navigator.slider.maximum,
      };
    }
  }, []);

  // Reset slider range when recordingStartTimestamp changes
  useEffect(() => {
    sliderRangeRef.current = null;
  }, [recordingStartTimestamp]);

  // Determine the effective visualization mode
  const effectiveMode = effectiveConfig.resampling.applied
    ? effectiveConfig.resampling.interpolationMethod
    : chartVisualizationMode;

  const isResamplingApplied = effectiveConfig.resampling.applied;

  // Memoize processedData as JSON to prevent unnecessary recalculations
  const processedDataJson = useMemo(
    () => JSON.stringify(processedData),
    [processedData]
  );

  const configSetsJson = useMemo(
    () => JSON.stringify(config.sets),
    [config.sets]
  );

  // Helper function: Generate data series from processed data
  const generateDataSeries = useCallback(
    (
      data: typeof processedData,
      minTimestamp: number,
      mode: "linear" | "step",
      recordMetadata: typeof effectiveConfig.recordMetadata
    ): ChartDataSeries[] => {
      console.log("Generating data series with mode:", mode);

      const dataSeries = data.map((record, index) => {
        // Parse the prefixed record ID
        const parsedId = parseRecordId(record.id);

        // Get line style from the set if applicable (look up dynamically)
        let lineStyle = null;
        if (parsedId.isSet && parsedId.setName) {
          const set = config.sets.find((s) => s.name === parsedId.setName);
          lineStyle = set?.lineStyle || null;
        }

        // Priority order for label:
        // 1. Record's own label (from global operations)
        // 2. Metadata label
        // 3. Original ID
        const label =
          record.label ||
          recordMetadata[parsedId.originalId]?.label ||
          parsedId.originalId;

        const dataPoints = record.data.map((point) => {
          // Calculate duration in seconds from recording start
          const durationMs = point.timestamp - minTimestamp;
          const durationSec = durationMs / 1000;

          return {
            x: durationSec,
            y: point.value,
          };
        });

        return {
          type: mode === "step" ? "stepLine" : "spline",
          name: label,
          showInLegend: false,
          color: lineStyle?.color || COLORS[index % COLORS.length],
          lineThickness: lineStyle?.lineThickness || 2,
          lineDashType: lineStyle?.lineDashType || "solid",
          markerType: "none",
          dataPoints: dataPoints,
          click: function () {
            setHighlightedRecordId(record.id);
          },
        };
      });

      return dataSeries;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processedDataJson, configSetsJson]
  );

  // Helper function: Add playback indicator
  const addPlaybackIndicator = useCallback(
    (
      dataSeries: ChartDataSeries[],
      currentTimeValue: number,
      data: typeof processedData
    ): ChartDataSeries[] => {
      // Find the Y-axis range from all data points
      // Use reduce instead of Math.min/max(...array) to avoid stack overflow with large arrays
      const allYValues = data.flatMap((r) => r.data.map((d) => d.value));
      const minY = allYValues.length > 0
        ? allYValues.reduce((min, val) => (val < min ? val : min), allYValues[0])
        : 0;
      const maxY = allYValues.length > 0
        ? allYValues.reduce((max, val) => (val > max ? val : max), allYValues[0])
        : 0;

      // Add vertical line at current time
      dataSeries.push({
        type: "line",
        name: "Playback Position",
        showInLegend: false,
        color: "red",
        markerType: "none",
        dataPoints: [
          { x: currentTimeValue, y: minY },
          { x: currentTimeValue, y: maxY },
        ],
      });

      return dataSeries;
    },
    []
  );

  // Helper function: Generate navigator data
  const generateNavigatorData = useCallback(
    (
      data: typeof processedData,
      minTimestamp: number,
      recordingStart?: number,
      endTime?: number
    ) => {
      const navigatorDataPoints =
        data.length > 0
          ? data[0].data.map((point) => {
            const durationMs = point.timestamp - minTimestamp;
            const durationSec = durationMs / 1000;
            return {
              x: durationSec,
              y: point.value,
            };
          })
          : [];

      // Add anchor points to navigator to ensure full timeline visibility
      if (recordingStart !== undefined && endTime !== undefined) {
        navigatorDataPoints.push({ x: 0, y: 0 });
        navigatorDataPoints.push({ x: endTime, y: 0 });
      }

      return navigatorDataPoints;
    },
    []
  );

  // Transform processed data into CanvasJS format
  const chartOptions = useMemo(() => {
    console.log("Generating chart data from processedData:", processedData);

    if (processedData.length === 0) {
      return null;
    }

    // Data is already downsampled by the worker
    // Get the earliest and latest timestamps
    const allTimestamps = processedData.flatMap((r) =>
      r.data.map((d) => d.timestamp)
    );

    // If recordingStartTimestamp is provided, use it as the baseline (time 0)
    // Otherwise, use the earliest timestamp from the data
    // Use reduce instead of Math.min(...array) to avoid stack overflow with large arrays
    const minTimestamp =
      recordingStartTimestamp ??
      (allTimestamps.length > 0
        ? allTimestamps.reduce(
          (min, ts) => (ts < min ? ts : min),
          allTimestamps[0]
        )
        : 0);
    const maxTimestamp =
      allTimestamps.length > 0
        ? allTimestamps.reduce(
          (max, ts) => (ts > max ? ts : max),
          allTimestamps[0]
        )
        : 0;

    // Generate data series for each record
    let dataSeries = generateDataSeries(
      processedData,
      minTimestamp,
      effectiveMode,
      effectiveConfig.recordMetadata
    );

    // Add red line indicator for audio playback position (if currentTime is provided)
    if (currentTime !== undefined) {
      dataSeries = addPlaybackIndicator(dataSeries, currentTime, processedData);
    }

    // Generate navigator data
    const navigatorDataPoints = generateNavigatorData(
      processedData,
      minTimestamp,
      recordingStartTimestamp,
      chartEndTime
    );

    // Slider range in seconds - respect chartStartTime and chartEndTime if provided
    // Calculate the actual data range in seconds relative to minTimestamp
    const dataEndSec = (maxTimestamp - minTimestamp) / 1000;

    // When recordingStartTimestamp is set, always start from 0 (recording start)
    // Otherwise start from the earliest data point
    const defaultSliderMax = chartEndTime ?? dataEndSec;
    const sliderMin = 0;
    const sliderMax = sliderRangeRef.current?.max ?? defaultSliderMax;

    return {
      theme: theme === "dark" ? "dark1" : "light2",
      backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
      animationEnabled: false,
      exportEnabled: true,
      title: {
        text: "",
        fontColor: theme === "dark" ? "#ffffff" : "#000000",
      },
      charts: [
        {
          backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
          axisX: {
            title: "Czas trwania (s)",
            titleFontSize: 14,
            labelFontSize: 16,
            titleFontColor: theme === "dark" ? "#ffffff" : "#000000",
            labelFontColor: theme === "dark" ? "#cccccc" : "#666666",
            lineColor: theme === "dark" ? "#444444" : "#cccccc",
            tickColor: theme === "dark" ? "#444444" : "#cccccc",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter: function (e: any) {
              const seconds = e.value;
              const wholeSec = Math.floor(seconds);
              const ms = Math.round((seconds - wholeSec) * 1000);

              if (ms === 0) {
                return wholeSec.toString();
              } else {
                return `${wholeSec}.${ms.toString().padStart(3, "0")}`;
              }
            },
            crosshair: {
              enabled: true,
              snapToDataPoint: true,
            },
          },
          axisY: {
            title: "Wartość",
            titleFontSize: 11,
            titleFontColor: theme === "dark" ? "#ffffff" : "#000000",
            labelFontColor: theme === "dark" ? "#cccccc" : "#666666",
            lineColor: theme === "dark" ? "#444444" : "#cccccc",
            tickColor: theme === "dark" ? "#444444" : "#cccccc",
            gridColor: theme === "dark" ? "#333333" : "#e0e0e0",
            //labelFontSize: 10,
            crosshair: {
              enabled: true,
            },
            ...(config.yAxisRange?.enabled && {
              minimum: config.yAxisRange.min,
              maximum: config.yAxisRange.max,
            }),
          },
          toolTip: {
            shared: true,
          },
          data: dataSeries,
        },
      ],
      navigator: {
        height: 40,
        backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
        data: [
          {
            dataPoints: navigatorDataPoints,
            color: theme === "dark" ? "#8884d8" : "#4a5568",
          },
        ],
        slider: {
          minimum: sliderMin,
          maximum: sliderMax,
          handleColor: theme === "dark" ? "#4a5568" : "#cbd5e0",
          handleBorderColor: theme === "dark" ? "#718096" : "#a0aec0",
        },
        axisX: {
          labelFontColor: theme === "dark" ? "#cccccc" : "#666666",
          lineColor: theme === "dark" ? "#444444" : "#cccccc",
        },
      },
      rangeSelector: {
        enabled: false,
      },
      rangeChanged: handleRangeChanged,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    processedDataJson, // Use JSON string instead of object reference for stable comparison
    effectiveConfig.recordMetadata,
    effectiveMode,
    handleRangeChanged,
    recordingStartTimestamp,
    chartEndTime,
    currentTime,
    generateDataSeries,
    addPlaybackIndicator,
    generateNavigatorData,
    config.yAxisRange,
    theme,
  ]);

  return (
    <Card className="h-full flex flex-col pt-0 pb-0">
      <div className="p-4 border-b flex justify-between overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-nowrap">
              {config.title || "Timeline Chart"}
            </h2>
          </div>

        </div>
        <div className="flex justify-between">
          {/* Y-axis range controls */}
          <div className="flex items-center gap-2 ">
            <Label className="text-sm whitespace-nowrap">Zakres osi Y:</Label>
            <Input
              type="number"
              placeholder="Min"
              value={yMin}
              onChange={(e) => setYMin(e.target.value)}
              className="w-24 h-8 text-sm"
            />
            <span className="text-sm text-muted-foreground">do</span>
            <Input
              type="number"
              placeholder="Max"
              value={yMax}
              onChange={(e) => setYMax(e.target.value)}
              className="w-24 h-8 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const min = parseFloat(yMin);
                const max = parseFloat(yMax);
                if (!isNaN(min) && !isNaN(max) && min < max) {
                  setYAxisRange(min, max);
                } else {
                  alert(
                    "Proszę wprowadzić prawidłowe wartości min/max (min < max)"
                  );
                }
              }}
              className="h-8"
            >
              Zastosuj
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                clearYAxisRange();
                setYMin("");
                setYMax("");
              }}
              disabled={!config.yAxisRange?.enabled}
              className="h-8"
            >
              Resetuj
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Widok:</Label>
            <Select
              value={
                isResamplingApplied ? effectiveMode : chartVisualizationMode
              }
              onValueChange={(v) =>
                !isResamplingApplied &&
                setChartVisualizationMode(v as ChartVisualizationMode)
              }
              disabled={isResamplingApplied}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Liniowy</SelectItem>
                <SelectItem value="step">Krokowy</SelectItem>
              </SelectContent>
            </Select>
            {isResamplingApplied && (
              <span className="text-xs text-muted-foreground">
                (Ustalony przez resampling)
              </span>
            )}
          </div>
        </div>

      </div>

      <div className="flex-1 p-4" ref={containerRef}>
        {!chartOptions || !CanvasJSStockChart ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {!CanvasJSStockChart
              ? "Ładowanie wykresu..."
              : "Brak danych do wyświetlenia"}
          </div>
        ) : isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p>Przetwarzanie danych...</p>
          </div>
        ) : (
          <CanvasJSStockChart
            key={`chart-${recordingStartTimestamp ?? "default"}-${chartKey}`}
            options={chartOptions}
            containerProps={{ height: "100%", width: "100%" }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onRef={(ref: any) => (chartRef.current = ref)}
          />
        )}
      </div>

      {/* Custom footer slot */}
      {footer && <div className="border-t">{footer}</div>}
    </Card>
  );
}
