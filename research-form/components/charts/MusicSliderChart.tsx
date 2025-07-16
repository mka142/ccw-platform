"use client";
import React, { useEffect, useState } from "react";
import { BaseMusicSliderChart } from "./BaseMusicSliderChart";
import { Fullscreen } from "../ui/Fullscreen";
import { Button } from "../ui/button";
import { SimpleTooltip } from "../ui/SimpleTooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { MultiSelect } from "../ui/MultiSelect"; // You may need to create or adjust this component
import { Switch } from "../ui/switch";

type lineType = "linear" | "monotone" | "step" | "basis" | "natural";

type chartData = Array<Array<[number, number]>>;

interface MusicSliderChartProps {
  formId: string;
  fieldId: string;
  audioSrc: string;
  height?: number;
  width?: number;
  defaultData?: null | chartData;
  defaultLabels?: null | string[]; // default labels for x-axis if no data is provided
  defaultMaxValue?: number | null; // default max value for y-axis if no data is provided
}

export function MusicSliderChart({
  formId,
  fieldId,
  audioSrc,
  height = 350,
  width = 100,
  defaultData = null,
  defaultLabels = null,
  defaultMaxValue = null,
}: MusicSliderChartProps) {
  const [data, setData] = useState<chartData>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showMean, setShowMean] = useState(false);
  const [meanLoading, setMeanLoading] = useState(false);
  const [zoomReset, setZoomReset] = useState(false);
  const [quantStep, setQuantStep] = useState<number>(1);
  const [lineType, setLineType] = useState<lineType>("monotone");
  const [keepTreshold, setKeepTreshold] = useState(true);


  const fetchLabels = async (dataIds: string[]) => {
    const res = await fetch(`/api/responses/${formId}/labels`);
    const json = await res.json();
    return json.filter((e: { _id: string; label: string }) => dataIds.includes(e._id)).map((e: { _id: string; label: string }) => e.label);
  }

  const fetchData = async () => {
    setLoading(true);
    if (defaultLabels) {
      setLabels(defaultLabels);
    }
    if (defaultData) {
      setData(defaultData);
    } else {
      const res = await fetch(`/api/responses/${formId}/${fieldId}`);
      const json = await res.json()
      const _data = json.data.map((e: { _id: string, values: [] }) => e.values);
      const _dataIds = json.data.map((e: { _id: string }) => e._id);
      const labels = await fetchLabels(_dataIds);
      console.log("Fetched data:", _data, "Labels:", labels);
      if (!_data || !_data.length) {
        setData([]);
        setSelectedIndexes([]);
      } else {
        setLabels(labels);
        setSelectedIndexes(json.data?.length ? json.data.map((_: unknown, i: number) => i) : []);
        setData(_data as chartData);
      }
    }
    setLoading(false);
  };

  // Chart dimensions for fullscreen
  const chartHeight = fullscreen ? 700 : height;
  const chartWidth = fullscreen ? 1200 : width;

  // Filtered data for chart
  const filteredData =
    data.length > 1
      ? selectedIndexes.map((i) => data[i])
      : data;

  const filteredLabels =
    labels.length > 1 && selectedIndexes.length > 0
      ? selectedIndexes.map((i) => labels[i])
      : labels;

  const [meanData, setMeanData] = useState<[number, number][]>([]);
  const [medianData, setMedianData] = useState<[number, number][]>([]);
  const [stdDevData, setStdDevData] = useState<[number, number][]>([]);
  const [movingAvgData, setMovingAvgData] = useState<[number, number][]>([]);
  const [showMovingAvg, setShowMovingAvg] = useState(false);
  const [showMedian, setShowMedian] = useState(false);
  const [showStdDev, setShowStdDev] = useState(false);
  const [medianLoading, setMedianLoading] = useState(false);
  const [stdDevLoading, setStdDevLoading] = useState(false);
  const [movingAvgLoading, setMovingAvgLoading] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<"mean" | "median" | "stdDev" | "movingAvg" | null>(null);
  // Median calculation
  function calculateMedian(dt: chartData, quantStep: number) {
    if (!dt.length) return [];
    const allX = new Set<number>();
    dt.forEach((arr) => arr.forEach(([x]) => allX.add(x)));
    const xArr = Array.from(allX).sort((a, b) => a - b);
    const window = 2 * quantStep;
    return xArr.map((x) => {
      const ys: number[] = [];
      dt.forEach((arr) => {
        arr.forEach(([xi, yi]) => {
          if (Math.abs(xi - x) <= window) {
            ys.push(yi);
          }
        });
      });
      ys.sort((a, b) => a - b);
      let median = 0;
      if (ys.length) {
        const mid = Math.floor(ys.length / 2);
        median = ys.length % 2 !== 0 ? ys[mid] : (ys[mid - 1] + ys[mid]) / 2;
      }
      return [x, median];
    });
  }

  // Standard deviation calculation
  function calculateStdDev(dt: chartData, quantStep: number) {
    if (!dt.length) return [];
    const allX = new Set<number>();
    dt.forEach((arr) => arr.forEach(([x]) => allX.add(x)));
    const xArr = Array.from(allX).sort((a, b) => a - b);
    const window = 2 * quantStep;
    return xArr.map((x) => {
      const ys: number[] = [];
      dt.forEach((arr) => {
        arr.forEach(([xi, yi]) => {
          if (Math.abs(xi - x) <= window) {
            ys.push(yi);
          }
        });
      });
      const mean = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;
      const variance = ys.length ? ys.reduce((a, b) => a + (b - mean) ** 2, 0) / ys.length : 0;
      const stdDev = Math.sqrt(variance);
      return [x, stdDev];
    });
  }
  const computeMedian = async (dt: chartData) => {
    setMedianLoading(true);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!dt.length) {
          setMedianData([]);
          setShowMedian(true);
          setMedianLoading(false);
          resolve();
          return;
        }
        const medianArr = calculateMedian(dt, quantStep);
        setMedianData(medianArr as [number, number][]);
        setShowMedian(true);
        setMedianLoading(false);
        resolve();
      }, 0);
    });
  };

  const computeStdDev = async (dt: chartData) => {
    setStdDevLoading(true);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!dt.length) {
          setStdDevData([]);
          setShowStdDev(true);
          setStdDevLoading(false);
          resolve();
          return;
        }
        const stdDevArr = calculateStdDev(dt, quantStep);
        setStdDevData(stdDevArr as [number, number][]);
        setShowStdDev(true);
        setStdDevLoading(false);
        resolve();
      }, 0);
    });
  };
  // Moving average calculation
  function calculateMovingAverage(dt: chartData, quantStep: number) {
    if (!dt.length) return [];
    const allX = new Set<number>();
    dt.forEach((arr) => arr.forEach(([x]) => allX.add(x)));
    const xArr = Array.from(allX).sort((a, b) => a - b);
    const window = 2 * quantStep;
    return xArr.map((x) => {
      // For each x, collect all y values within [x-window, x+window]
      const ys: number[] = [];
      dt.forEach((arr) => {
        arr.forEach(([xi, yi]) => {
          if (Math.abs(xi - x) <= window) {
            ys.push(yi);
          }
        });
      });
      const avg = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;
      return [x, avg];
    });
  }
  const computeMovingAvg = async (dt: chartData) => {
    setMovingAvgLoading(true);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!dt.length) {
          setMovingAvgData([]);
          setShowMovingAvg(true);
          setMovingAvgLoading(false);
          resolve();
          return;
        }
        const avgArr = calculateMovingAverage(dt, quantStep);
        setMovingAvgData(avgArr as [number, number][]);
        setShowMovingAvg(true);
        setMovingAvgLoading(false);
        resolve();
      }, 0);
    });
  };

  const computeMean = async (dt: chartData) => {
    setMeanLoading(true);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!dt.length) {
          setMeanData([]);
          setShowMean(true);
          setMeanLoading(false);
          resolve();
          return;
        }
        const allX = new Set<number>();
        dt.forEach((arr) => arr.forEach(([x]) => allX.add(x)));
        const xArr = Array.from(allX).sort((a, b) => a - b);
        const meanArr = xArr.map((x) => {
          const ys = dt
            .map((arr) => {
              if (!arr.length) return undefined;
              const closest = arr.reduce((prev, curr) =>
                Math.abs(curr[0] - x) < Math.abs(prev[0] - x) ? curr : prev
              );
              return closest[1];
            })
            .filter((y) => y !== undefined);
          const mean = ys.length
            ? ys.reduce((a, b) => a + b, 0) / ys.length
            : 0;
          return [x, mean];
        });
        setMeanData(meanArr as [number, number][]);
        setShowMean(true);
        setMeanLoading(false);
        resolve();
      }, 0); // allow UI to update
    });
  };

  const hideAllExcept = (operation: "mean" | "median" | "stdDev" | "movingAvg" | null) => {
    setShowMean(operation === "mean");
    setShowMedian(operation === "median");
    setShowStdDev(operation === "stdDev");
    setShowMovingAvg(operation === "movingAvg");
    setCurrentOperation(operation);
  };

  const compute = (operation: "mean" | "median" | "stdDev" | "movingAvg" | null) => {
    switch (operation) {
      case "mean":
        computeMean(filteredData);
        break;
      case "median":
        computeMedian(filteredData);
        break;
      case "stdDev":
        computeStdDev(filteredData);
        break;
      case "movingAvg":
        computeMovingAvg(filteredData);
      case null:
        break;
      default:
        console.warn("Unknown operation:", operation);
        break;
    }
  };

  const onOperationClick = (operation: "mean" | "median" | "stdDev" | "movingAvg") => {
    const shouldCompute = currentOperation !== operation;
    if (!shouldCompute) {
      hideAllExcept(null);
      return;
    }
    hideAllExcept(operation);
    setCurrentOperation(operation);
    compute(operation);
  };

  useEffect(() => {
    compute(currentOperation);
  }, [selectedIndexes.join('-'), quantStep]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <Fullscreen activated={fullscreen}>
      <div
        className={`relative basis-10/12  ${fullscreen ? "max-h-[90vh] mb-2" : ""}`}
        style={{ flexBasis: "83.3333%" }}
      >
        <div className={"w-auto h-auto"}>
          {!data.length && (
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={loading}
              className="w-fit"
            >
              {loading ? "Ładowanie..." : "Pobierz dane i wykres"}
            </Button>
          )}
          {data.length > 0 && (
            <>
              <div className="flex items-center gap-2 justify-end mb-2 flex-wrap">
                {fullscreen && (
                  <>
                    <span className="text-xs">Kwantyzacja:</span>
                    <Select
                      value={String(quantStep)}
                      onValueChange={(val) => setQuantStep(Number(val))}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Brak" />
                      </SelectTrigger>
                      <SelectContent>
                        {[0.1, 0.2, 0.4, 0.6, 0.8, 1, 2, 4].map((step) => (
                          <SelectItem key={step} value={String(step)}>
                            {step} {step === 1 ? "sekunda" : "sekundy"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs">Typ linii:</span>
                    <Select
                      value={lineType}
                      onValueChange={(val) => setLineType(val as lineType)}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Typ linii" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basis">Podstawowa</SelectItem>
                        <SelectItem value="monotone">Monotoniczna</SelectItem>
                        <SelectItem value="natural">Naturalna</SelectItem>
                        <SelectItem value="step">Krokowa</SelectItem>
                        <SelectItem value="linear">Łamana</SelectItem>
                      </SelectContent>
                    </Select>
                    <SimpleTooltip text="Utrzymuj ostatnią wartość w każdym punkcie czasowym">
                      <div className="flex items-center">
                        <span className="text-xs m-auto">Utrzymuj próg</span>
                        <Switch
                          checked={keepTreshold}
                          onCheckedChange={setKeepTreshold}
                          className="ml-1"
                        />
                      </div>
                    </SimpleTooltip>
                    {/* Multi-select for records, only if data.length > 1 */}
                    {data.length > 1 && (
                      <SimpleTooltip text="Wybierz odpowiedzi do wyświetlenia na wykresie">
                        <div>

                          <MultiSelect
                            options={labels.map((label, i) => ({ label, value: i }))}
                            selected={selectedIndexes}
                            onChange={setSelectedIndexes}
                            placeholder="Wybierz rekordy"
                            className="min-w-[180px]"
                          />
                        </div>
                      </SimpleTooltip>
                    )}
                  </>
                )}
                <SimpleTooltip text="Oblicz średnią (uśrednienie wszystkich odpowiedzi w każdym punkcie czasu)">
                  <Button
                    variant={showMean ? "default" : "ghost"}
                    className="px-2 py-1 text-sm w-fit"
                    onClick={() => onOperationClick("mean")}
                    disabled={meanLoading}
                  >
                    {meanLoading ? "Ładowanie..." : "Średnia"}
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip text="Oblicz medianę (wartość środkowa wszystkich odpowiedzi w każdym punkcie czasu)">
                  <Button
                    variant={showMedian ? "default" : "ghost"}
                    className="px-2 py-1 text-sm w-fit"
                    onClick={() => onOperationClick("median")}
                    disabled={medianLoading}
                  >
                    {medianLoading ? "Ładowanie..." : "Mediana"}
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip text="Oblicz odchylenie standardowe (miara rozrzutu odpowiedzi w każdym punkcie czasu)">
                  <Button
                    variant={showStdDev ? "default" : "ghost"}
                    className="px-2 py-1 text-sm w-fit"
                    onClick={() => onOperationClick("stdDev")}
                    disabled={stdDevLoading}
                  >
                    {stdDevLoading ? "Ładowanie..." : "Odchylenie standardowe"}
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip text="Oblicz średnią ruchomą (uśrednienie w oknie czasowym wokół każdego punktu)">
                  <Button
                    variant={showMovingAvg ? "default" : "ghost"}
                    className="px-2 py-1 text-sm w-fit"
                    onClick={() => onOperationClick("movingAvg")}
                    disabled={movingAvgLoading}
                  >
                    {movingAvgLoading ? "Ładowanie..." : "Średnia ruchoma (MA)"}
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip text="Zresetuj powiększenie wykresu do domyślnego widoku">
                  <Button
                    variant="ghost"
                    onClick={() => setZoomReset(true)}
                    className="px-2 py-1 text-sm w-fit"
                  >
                    Resetuj zoom
                  </Button>
                </SimpleTooltip>
                <SimpleTooltip text={fullscreen ? "Wyjdź z trybu pełnoekranowego" : "Wyświetl wykres na pełnym ekranie"}>
                  <Button
                    variant={fullscreen ? "outline" : "default"}
                    onClick={() => setFullscreen((v) => !v)}
                    className="px-2 py-1 text-sm w-fit"
                  >
                    {fullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
                  </Button>
                </SimpleTooltip>
              </div>

              <BaseMusicSliderChart
                zoomEnabled
                setZoomReset={setZoomReset}
                zoomReset={zoomReset}
                data={
                  showMovingAvg
                    ? [movingAvgData]
                    : showStdDev
                      ? [stdDevData]
                      : showMedian
                        ? [medianData]
                        : showMean
                          ? [meanData]
                          : filteredData
                }
                audioSrc={audioSrc}
                height={chartHeight}
                quantStep={quantStep}
                width={chartWidth}
                keepTreshold={keepTreshold}
                lineType={lineType}
                defaultMaxValue={defaultMaxValue}
                getDataLabelByIndex={(index: number) => {
                  if (filteredLabels.length > index) {
                    return filteredLabels[index];
                  }
                  return `Odpowiedź ${index + 1}`;
                }
                }
              />
            </>
          )}
        </div>
      </div>
    </Fullscreen>
  );
}
