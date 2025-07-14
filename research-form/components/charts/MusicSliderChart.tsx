"use client";
import React, { useState } from "react";
import { BaseMusicSliderChart } from "./BaseMusicSliderChart";
import { Fullscreen } from "../ui/Fullscreen";
import { Button } from "../ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
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
  defaultMaxValue?: number | null; // default max value for y-axis if no data is provided
}

export function MusicSliderChart({
  formId,
  fieldId,
  audioSrc,
  height = 350,
  width = 100,
  defaultData = null,
  defaultMaxValue = null,
}: MusicSliderChartProps) {
  const [data, setData] = useState<chartData>([]);
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showMean, setShowMean] = useState(false);
  const [meanLoading, setMeanLoading] = useState(false);
  const [zoomReset, setZoomReset] = useState(false);
  const [quantStep, setQuantStep] = useState<number>(1);
  const [lineType, setLineType] = useState<lineType>("monotone");
  const [keepTreshold, setKeepTreshold] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    if (defaultData) {
      setData(defaultData);
    } else {
      const res = await fetch(`/api/responses/${formId}/${fieldId}`);
      const json = await res.json();
      setData(json.data || []);
    }
    setLoading(false);
  };

  // Chart dimensions for fullscreen
  const chartHeight = fullscreen ? 700 : height;
  const chartWidth = fullscreen ? 1200 : width;

  const [meanData, setMeanData] = useState<[number, number][]>([]);

  const computeMean = async () => {
    if (showMean) {
      setShowMean(false);
      return;
    }
    setMeanLoading(true);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!data.length) {
          setMeanData([]);
          setShowMean(true);
          setMeanLoading(false);
          resolve();
          return;
        }
        const allX = new Set<number>();
        data.forEach((arr) => arr.forEach(([x]) => allX.add(x)));
        const xArr = Array.from(allX).sort((a, b) => a - b);
        const meanArr = xArr.map((x) => {
          const ys = data
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
                            {step}
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
                    <span className="text-xs">Treshold:</span>
                    <Switch
                      checked={keepTreshold}
                      onCheckedChange={setKeepTreshold}
                      className="ml-1"
                    />
                  </>
                )}
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-sm w-fit"
                  onClick={computeMean}
                  disabled={meanLoading}
                >
                  {meanLoading
                    ? "Ładowanie..."
                    : showMean
                    ? "Wyłącz średnią"
                    : "Średnia"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setZoomReset(true)}
                  className="px-2 py-1 text-sm w-fit"
                >
                  Resetuj zoom
                </Button>
                <Button
                  variant={fullscreen ? "outline" : "default"}
                  onClick={() => setFullscreen((v) => !v)}
                  className="px-2 py-1 text-sm w-fit"
                >
                  {fullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
                </Button>
              </div>

              <BaseMusicSliderChart
                zoomEnabled
                setZoomReset={setZoomReset}
                zoomReset={zoomReset}
                data={showMean ? [meanData] : data}
                audioSrc={audioSrc}
                height={chartHeight}
                quantStep={quantStep}
                width={chartWidth}
                keepTreshold={keepTreshold}
                lineType={lineType}
                defaultMaxValue={defaultMaxValue}
              />
            </>
          )}
        </div>
      </div>
    </Fullscreen>
  );
}
