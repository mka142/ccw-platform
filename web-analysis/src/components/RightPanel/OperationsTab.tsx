"use client";

import React, { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, TrendingUp, BarChart3, Activity, RefreshCw } from "lucide-react";
import { InterpolationMethod } from "@/lib/types";
import { InfoModal } from "@/components/ui/info-modal";

export default function OperationsTab() {
  const {
    mode,
    selectedRecordId,
    effectiveConfig,
    currentSet,
    addGlobalOperation,
    removeGlobalOperation,
    applyOperationToRecord,
    removeOperationFromRecord,
    setResampling,
    clearResampling,
  } = useDashboard();

  const [resampleWindowMs, setResampleWindowMs] = useState(
    effectiveConfig.resampling.windowMs.toString()
  );
  const [interpolationMethod, setInterpolationMethod] =
    useState<InterpolationMethod>(
      effectiveConfig.resampling.interpolationMethod
    );
  const [normalizeMin, setNormalizeMin] = useState("0");
  const [normalizeMax, setNormalizeMax] = useState("100");
  const [quantizeStep, setQuantizeStep] = useState("1");
  const [movingAverageWindow, setMovingAverageWindow] = useState("5");
  const [movingAverageAlgorithm, setMovingAverageAlgorithm] = useState<
    "SMA" | "WMA" | "RMA"
  >("SMA");

  const isIndividualMode = mode === "individual" && selectedRecordId;

  const handleApplyResampling = () => {
    const ms = parseInt(resampleWindowMs, 10);
    if (isNaN(ms) || ms <= 0) return;
    setResampling(ms, interpolationMethod);
  };

  const handleClearResampling = () => {
    clearResampling();
  };

  const handleApplyMean = () => {
    if (!effectiveConfig.resampling.applied) {
      alert(
        "Resampling musi być zastosowany przed użyciem operacji statystycznych"
      );
      return;
    }
    addGlobalOperation({
      type: "mean",
      params: {},
    });
  };

  const handleApplyStandardDeviation = () => {
    if (!effectiveConfig.resampling.applied) {
      alert(
        "Resampling musi być zastosowany przed użyciem operacji statystycznych"
      );
      return;
    }
    addGlobalOperation({
      type: "standardDeviation",
      params: {},
    });
  };

  const handleApplyChanges = () => {
    if (!effectiveConfig.resampling.applied) {
      alert(
        "Resampling musi być zastosowany przed użyciem operacji statystycznych"
      );
      return;
    }
    addGlobalOperation({
      type: "changes",
      params: {},
    });
  };

  const handleApplyQuantize = () => {
    if (!effectiveConfig.resampling.applied) {
      alert(
        "Resampling musi być zastosowany przed użyciem operacji statystycznych"
      );
      return;
    }

    const step = parseFloat(quantizeStep);
    if (isNaN(step) || step <= 0) {
      alert("Proszę wprowadzić prawidłową wartość kroku (liczba dodatnia)");
      return;
    }

    addGlobalOperation({
      type: "quantize",
      params: { step },
    });
  };

  const handleApplyNormalize = () => {
    const minRange = parseFloat(normalizeMin);
    const maxRange = parseFloat(normalizeMax);

    if (isNaN(minRange) || isNaN(maxRange)) {
      alert("Proszę wprowadzić prawidłowe liczby dla zakresu min i max");
      return;
    }

    if (minRange >= maxRange) {
      alert("Zakres min musi być mniejszy niż zakres max");
      return;
    }

    // Get filtered record IDs (or all if none filtered)
    const targetIds =
      effectiveConfig.filterByIds.length > 0
        ? effectiveConfig.filterByIds
        : Object.keys(effectiveConfig.recordMetadata);

    targetIds.forEach((id) => {
      applyOperationToRecord(id, {
        type: "normalize",
        params: { minRange, maxRange },
      });
    });
  };

  const handleClearNormalize = () => {
    // Get filtered record IDs (or all if none filtered)
    const targetIds =
      effectiveConfig.filterByIds.length > 0
        ? effectiveConfig.filterByIds
        : Object.keys(effectiveConfig.recordMetadata);

    // Remove all normalize operations from each record
    targetIds.forEach((id) => {
      const metadata = effectiveConfig.recordMetadata[id];
      // Remove all normalize operations (iterate backwards to avoid index issues)
      for (let i = metadata.operations.length - 1; i >= 0; i--) {
        if (metadata.operations[i].type === "normalize") {
          removeOperationFromRecord(id, i);
        }
      }
    });
  };

  const handleApplyIndividualQuantize = () => {
    const step = parseFloat(quantizeStep);

    if (isNaN(step) || step <= 0) {
      alert("Proszę wprowadzić prawidłową wartość kroku (liczba dodatnia)");
      return;
    }

    // Get filtered record IDs (or all if none filtered)
    const targetIds =
      effectiveConfig.filterByIds.length > 0
        ? effectiveConfig.filterByIds
        : Object.keys(effectiveConfig.recordMetadata);

    targetIds.forEach((id) => {
      applyOperationToRecord(id, {
        type: "quantize",
        params: { step },
      });
    });
  };

  const handleClearIndividualQuantize = () => {
    // Get filtered record IDs (or all if none filtered)
    const targetIds =
      effectiveConfig.filterByIds.length > 0
        ? effectiveConfig.filterByIds
        : Object.keys(effectiveConfig.recordMetadata);

    // Remove all quantize operations from each record
    targetIds.forEach((id) => {
      const metadata = effectiveConfig.recordMetadata[id];
      // Remove all quantize operations (iterate backwards to avoid index issues)
      for (let i = metadata.operations.length - 1; i >= 0; i--) {
        if (metadata.operations[i].type === "quantize") {
          removeOperationFromRecord(id, i);
        }
      }
    });
  };

  // Moving Average handlers
  const handleApplyGlobalMovingAverage = () => {
    if (!effectiveConfig.resampling.applied) {
      alert(
        "Resampling musi być zastosowany przed użyciem operacji statystycznych"
      );
      return;
    }

    const windowSize = parseInt(movingAverageWindow, 10);
    if (isNaN(windowSize) || windowSize <= 0) {
      alert("Proszę wprowadzić prawidłowy rozmiar okna (liczba dodatnia)");
      return;
    }

    addGlobalOperation({
      type: "movingAverage",
      params: { windowSize, algorithm: movingAverageAlgorithm },
    });
  };

  const handleApplyIndividualMovingAverage = () => {
    const windowSize = parseInt(movingAverageWindow, 10);

    if (isNaN(windowSize) || windowSize <= 0) {
      alert("Proszę wprowadzić prawidłowy rozmiar okna (liczba dodatnia)");
      return;
    }

    // Get filtered record IDs (or all if none filtered)
    const targetIds =
      effectiveConfig.filterByIds.length > 0
        ? effectiveConfig.filterByIds
        : Object.keys(effectiveConfig.recordMetadata);

    targetIds.forEach((id) => {
      applyOperationToRecord(id, {
        type: "movingAverage",
        params: { windowSize, algorithm: movingAverageAlgorithm },
      });
    });
  };

  const handleClearIndividualMovingAverage = () => {
    // Get filtered record IDs (or all if none filtered)
    const targetIds =
      effectiveConfig.filterByIds.length > 0
        ? effectiveConfig.filterByIds
        : Object.keys(effectiveConfig.recordMetadata);

    // Remove all moving average operations from each record
    targetIds.forEach((id) => {
      const metadata = effectiveConfig.recordMetadata[id];
      // Remove all moving average operations (iterate backwards to avoid index issues)
      for (let i = metadata.operations.length - 1; i >= 0; i--) {
        if (metadata.operations[i].type === "movingAverage") {
          removeOperationFromRecord(id, i);
        }
      }
    });
  };

  return (
    <>
      <div className="p-4 border-b bg-muted/50">
        {/* COMMENTED OUT: Individual mode display */}
        <p className="text-sm text-muted-foreground">
          Tryb:{" "}
          <Badge variant={isIndividualMode ? "default" : "secondary"}>
            {isIndividualMode ? "Indywidualny" : "Globalny"}
          </Badge>
        </p>
        {currentSet && (
          <p className="text-xs text-muted-foreground mt-1">
            Zestaw: <Badge variant="outline">{currentSet}</Badge>
          </p>
        )}
        {/* COMMENTED OUT: Individual mode selected record display */}
        {isIndividualMode && (
          <p className="text-xs text-muted-foreground mt-1">
            Edycja: {selectedRecordId}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!isIndividualMode && (
            <>
              {/* Data Transformations - Applied to filtered records (or set records) */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Transformacje Danych
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentSet
                    ? `Stosuje się do rekordów w zestawie "${currentSet}"`
                    : effectiveConfig.filterByIds.length > 0
                    ? `Stosuje się do ${effectiveConfig.filterByIds.length} wybranych rekordów`
                    : "Stosuje się do wszystkich rekordów"}
                </p>

                {/* Normalization */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs font-medium">Normalizacja</Label>
                    <InfoModal title="Normalizacja">
                      <p className="font-semibold">Co to jest?</p>
                      <p>
                        Normalizacja przekształca wartości danych do określonego
                        zakresu, zachowując proporcje między nimi.
                      </p>

                      <p className="font-semibold mt-3">Jak działa?</p>
                      <p>
                        Dla każdej wartości <code>v</code> w danych,
                        normalizacja oblicza:
                      </p>
                      <code className="block bg-muted p-2 rounded mt-1">
                        v_norm = min + (v - v_min) / (v_max - v_min) * (max -
                        min)
                      </code>
                      <p className="mt-1">
                        gdzie <code>v_min</code> i <code>v_max</code> to
                        minimalna i maksymalna wartość w danych oryginalnych, a{" "}
                        <code>min</code> i <code>max</code> to docelowy zakres.
                      </p>

                      <p className="font-semibold mt-3">Kiedy używać?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Gdy chcesz porównać dane o różnych skalach</li>
                        <li>
                          Gdy chcesz sprowadzić dane do standardowego zakresu
                          (np. 0-1 lub 0-100)
                        </li>
                        <li>
                          Przed zastosowaniem operacji statystycznych
                          wymagających jednolitej skali
                        </li>
                      </ul>

                      <p className="font-semibold mt-3">Przykład:</p>
                      <p>
                        Dane: [10, 20, 30] → Normalizacja do [0, 100] → [0, 50,
                        100]
                      </p>
                    </InfoModal>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Min
                      </Label>
                      <Input
                        type="number"
                        value={normalizeMin}
                        onChange={(e) => setNormalizeMin(e.target.value)}
                        className="text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Max
                      </Label>
                      <Input
                        type="number"
                        value={normalizeMax}
                        onChange={(e) => setNormalizeMax(e.target.value)}
                        className="text-sm mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleApplyNormalize}
                    >
                      Normalizuj
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleClearNormalize}
                      disabled={(() => {
                        const targetIds =
                          effectiveConfig.filterByIds.length > 0
                            ? effectiveConfig.filterByIds
                            : Object.keys(effectiveConfig.recordMetadata);
                        return !targetIds.some((id) =>
                          effectiveConfig.recordMetadata[id]?.operations.some(
                            (op) => op.type === "normalize"
                          )
                        );
                      })()}
                    >
                      Wyczyść
                    </Button>
                  </div>
                </div>

                {/* Quantize (Individual) */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs font-medium">
                      Przybliżenie wartości
                    </Label>
                    <InfoModal title="Przybliżenie wartości (Quantize)">
                      <p className="font-semibold">Co to jest?</p>
                      <p>
                        Przybliżenie (kwantyzacja) zaokrągla wartości do
                        najbliższej wielokrotności określonego kroku, redukując
                        precyzję danych.
                      </p>

                      <p className="font-semibold mt-3">Jak działa?</p>
                      <p>
                        Dla każdej wartości <code>v</code> i kroku{" "}
                        <code>s</code>:
                      </p>
                      <code className="block bg-muted p-2 rounded mt-1">
                        v_quantized = round(v / s) * s
                      </code>

                      <p className="font-semibold mt-3">Kiedy używać?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Gdy chcesz zredukować szum w danych</li>
                        <li>
                          Gdy chcesz uprościć wizualizację danych ciągłych
                        </li>
                        <li>Gdy chcesz grupować podobne wartości razem</li>
                        <li>
                          Gdy chcesz zmniejszyć rozmiar danych (mniej unikalnych
                          wartości)
                        </li>
                      </ul>

                      <p className="font-semibold mt-3">Przykłady:</p>
                      <p>
                        <strong>Krok = 1:</strong> [1.2, 2.7, 3.1] → [1, 3, 3]
                      </p>
                      <p>
                        <strong>Krok = 0.5:</strong> [1.2, 2.7, 3.1] → [1.0,
                        2.5, 3.0]
                      </p>
                      <p>
                        <strong>Krok = 10:</strong> [12, 27, 31] → [10, 30, 30]
                      </p>
                    </InfoModal>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Krok
                    </Label>
                    <Input
                      type="number"
                      value={quantizeStep}
                      onChange={(e) => setQuantizeStep(e.target.value)}
                      placeholder="np. 1, 0.1, 0.01"
                      className="text-sm mt-1"
                      step="any"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Zaokrąglij wartości do wybranej dokładności
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleApplyIndividualQuantize}
                    >
                      Zastosuj
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleClearIndividualQuantize}
                      disabled={(() => {
                        const targetIds =
                          effectiveConfig.filterByIds.length > 0
                            ? effectiveConfig.filterByIds
                            : Object.keys(effectiveConfig.recordMetadata);
                        return !targetIds.some((id) =>
                          effectiveConfig.recordMetadata[id]?.operations.some(
                            (op) => op.type === "quantize"
                          )
                        );
                      })()}
                    >
                      Wyczyść
                    </Button>
                  </div>
                </div>

                {/* Moving Average (Individual) */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs font-medium">
                      Średnia Ruchoma
                    </Label>
                    <InfoModal title="Średnia Ruchoma (Moving Average)">
                      <p className="font-semibold">Co to jest?</p>
                      <p>
                        Średnia ruchoma wygładza dane poprzez obliczanie
                        średniej z określonej liczby kolejnych punktów (okna),
                        przesuwając okno wzdłuż całego szeregu czasowego.
                      </p>

                      <p className="font-semibold mt-3">Algorytmy:</p>

                      <div className="mt-2">
                        <p className="font-semibold">
                          SMA - Simple Moving Average
                        </p>
                        <p>Zwykła średnia arytmetyczna z okna N punktów:</p>
                        <code className="block bg-muted p-2 rounded mt-1">
                          SMA = (v₁ + v₂ + ... + vₙ) / N
                        </code>
                        <p className="mt-1">
                          <strong>Zalety:</strong> Prosta, łatwa do
                          interpretacji
                          <br />
                          <strong>Wady:</strong> Równa waga dla wszystkich
                          punktów, może być wolna w reakcji
                        </p>
                      </div>

                      <div className="mt-2">
                        <p className="font-semibold">
                          WMA - Weighted Moving Average
                        </p>
                        <p>
                          Średnia ważona - nowsze wartości mają większą wagę:
                        </p>
                        <code className="block bg-muted p-2 rounded mt-1">
                          WMA = (v₁×1 + v₂×2 + ... + vₙ×N) / (1+2+...+N)
                        </code>
                        <p className="mt-1">
                          <strong>Zalety:</strong> Szybsza reakcja na zmiany
                          <br />
                          <strong>Wady:</strong> Większa wrażliwość na szum
                        </p>
                      </div>

                      <div className="mt-2">
                        <p className="font-semibold">
                          RMA - Running Moving Average
                        </p>
                        <p>Wygładzona średnia ruchoma (Smoothed MA):</p>
                        <code className="block bg-muted p-2 rounded mt-1">
                          RMA[i] = (RMA[i-1] × (N-1) + v[i]) / N
                        </code>
                        <p className="mt-1">
                          <strong>Zalety:</strong> Najgładsze wygładzenie,
                          najmniejsze opóźnienie
                          <br />
                          <strong>Wady:</strong> Może być zbyt wygładzona dla
                          szybkich zmian
                        </p>
                      </div>

                      <p className="font-semibold mt-3">Uwaga:</p>
                      <p>
                        Średnia ruchoma redukuje liczbę punktów o N-1 (pierwsze
                        N-1 punktów jest usuwa usuniętych, ponieważ nie można
                        obliczyć dla nich pełnego okna).
                      </p>
                    </InfoModal>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Algorytm
                    </Label>
                    <select
                      value={movingAverageAlgorithm}
                      onChange={(e) =>
                        setMovingAverageAlgorithm(
                          e.target.value as "SMA" | "WMA" | "RMA"
                        )
                      }
                      className="w-full p-2 text-sm border rounded mt-1 bg-background"
                    >
                      <option value="SMA">SMA - Simple Moving Average</option>
                      <option value="WMA">WMA - Weighted Moving Average</option>
                      <option value="RMA">RMA - Running Moving Average</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {movingAverageAlgorithm === "SMA" &&
                        "Zwykła średnia arytmetyczna z okna"}
                      {movingAverageAlgorithm === "WMA" &&
                        "Nowsze wartości mają większą wagę"}
                      {movingAverageAlgorithm === "RMA" &&
                        "Wygładzona średnia z mniejszym opóźnieniem"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Rozmiar okna
                    </Label>
                    <Input
                      type="number"
                      value={movingAverageWindow}
                      onChange={(e) => setMovingAverageWindow(e.target.value)}
                      placeholder="np. 3, 5, 10"
                      className="text-sm mt-1"
                      min="1"
                      step="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Wygładź dane używając okna {movingAverageWindow} punktów
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleApplyIndividualMovingAverage}
                    >
                      Zastosuj
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleClearIndividualMovingAverage}
                      disabled={(() => {
                        const targetIds =
                          effectiveConfig.filterByIds.length > 0
                            ? effectiveConfig.filterByIds
                            : Object.keys(effectiveConfig.recordMetadata);
                        return !targetIds.some((id) =>
                          effectiveConfig.recordMetadata[id]?.operations.some(
                            (op) => op.type === "movingAverage"
                          )
                        );
                      })()}
                    >
                      Wyczyść
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Resampling - Only in Global Mode */}
          {!isIndividualMode && (
            <>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Resampling
                    {effectiveConfig.resampling.applied && (
                      <Badge variant="default" className="ml-2">
                        Aktywny
                      </Badge>
                    )}
                  </Label>
                  <InfoModal title="Resampling">
                    <p className="font-semibold">Co to jest?</p>
                    <p>
                      Resampling przekształca dane do równomiernych odstępów
                      czasowych, tworząc regularne próbki w określonych
                      interwałach (oknach czasowych).
                    </p>

                    <p className="font-semibold mt-3">Jak działa?</p>
                    <p>
                      Dla określonego okna czasowego (np. 100ms), dane są
                      dzielone na przedziały i dla każdego przedziału obliczana
                      jest wartość za pomocą interpolacji.
                    </p>

                    <p className="font-semibold mt-3">Metody Interpolacji:</p>

                    <div className="mt-2">
                      <p className="font-semibold">Liniowa (Linear)</p>
                      <p>
                        Wartości między punktami są obliczane jako liniowa
                        interpolacja między najbliższymi sąsiadami:
                      </p>
                      <code className="block bg-muted p-2 rounded mt-1">
                        y = y₀ + (x - x₀) × (y₁ - y₀) / (x₁ - x₀)
                      </code>
                      <p className="mt-1">
                        <strong>Zastosowanie:</strong> Dane ciągłe (temperatura,
                        ciśnienie, sygnały audio)
                        <br />
                        <strong>Zalety:</strong> Gładkie przejścia, brak skoków
                        <br />
                        <strong>Wady:</strong> Może wprowadzać wartości, które
                        nie występowały w oryginalnych danych
                      </p>
                    </div>

                    <div className="mt-2">
                      <p className="font-semibold">
                        Krokowa (Step / Zero-Order Hold)
                      </p>
                      <p>
                        Wartości między punktami pozostają stałe (ostatnia znana
                        wartość):
                      </p>
                      <code className="block bg-muted p-2 rounded mt-1">
                        y = y₀ (dla wszystkich x między x₀ a x₁)
                      </code>
                      <p className="mt-1">
                        <strong>Zastosowanie:</strong> Dane dyskretne (stany,
                        flagi, zdarzenia binarne)
                        <br />
                        <strong>Zalety:</strong> Zachowuje oryginalne wartości,
                        dobre dla danych skokowych
                        <br />
                        <strong>Wady:</strong> Ostre przejścia, nie wygładza
                        danych
                      </p>
                    </div>

                    <p className="font-semibold mt-3">Dlaczego resampling?</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Umożliwia porównanie danych z różnych źródeł o różnej
                        częstotliwości próbkowania
                      </li>
                      <li>
                        Wymagany przed operacjami statystycznymi (średnia,
                        odchylenie, etc.)
                      </li>
                      <li>Ułatwia synchronizację danych czasowych</li>
                    </ul>
                  </InfoModal>
                </div>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">Okno (ms)</Label>
                    <Input
                      type="number"
                      value={resampleWindowMs}
                      onChange={(e) => setResampleWindowMs(e.target.value)}
                      className="text-sm mt-1"
                      disabled={effectiveConfig.resampling.applied}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Metoda Interpolacji</Label>
                    <Tabs
                      value={interpolationMethod}
                      onValueChange={(v) =>
                        setInterpolationMethod(v as InterpolationMethod)
                      }
                      className="mt-1"
                    >
                      <TabsList className="w-full">
                        <TabsTrigger
                          value="linear"
                          className="flex-1"
                          disabled={effectiveConfig.resampling.applied}
                        >
                          Liniowa
                        </TabsTrigger>
                        <TabsTrigger
                          value="step"
                          className="flex-1"
                          disabled={effectiveConfig.resampling.applied}
                        >
                          Krokowa
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {!effectiveConfig.resampling.applied ? (
                    <Button className="w-full" onClick={handleApplyResampling}>
                      Zastosuj Resampling
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleClearResampling}
                    >
                      Wyczyść Resampling
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Resampling wymagany dla operacji statystycznych
                  </p>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Statistical Operations - Only in Global Mode with Resampling */}
          {!isIndividualMode && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Operacje Statystyczne
                </Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 justify-start"
                      variant="outline"
                      onClick={handleApplyMean}
                      disabled={!effectiveConfig.resampling.applied}
                    >
                      Oblicz Średnią
                    </Button>
                    <InfoModal title="Średnia (Mean)">
                      <p className="font-semibold">Co to jest?</p>
                      <p>
                        Średnia oblicza wartość przeciętną ze wszystkich
                        wybranych serii danych dla każdego punktu czasowego.
                      </p>

                      <p className="font-semibold mt-3">Jak działa?</p>
                      <p>
                        Dla każdego znacznika czasu <code>t</code>, gdzie mamy
                        wartości z różnych serii:
                      </p>
                      <code className="block bg-muted p-2 rounded mt-1">
                        mean(t) = (v₁(t) + v₂(t) + ... + vₙ(t)) / n
                      </code>
                      <p className="mt-1">
                        gdzie <code>n</code> to liczba serii zawierających
                        wartość w czasie <code>t</code>.
                      </p>

                      <p className="font-semibold mt-3">Kiedy używać?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Gdy chcesz zobaczyć ogólny trend z wielu pomiarów
                        </li>
                        <li>
                          Aby zredukować szum poprzez uśrednienie wielu sygnałów
                        </li>
                        <li>
                          Do porównania &quot;typowej&quot; wartości z
                          indywidualnymi pomiarami
                        </li>
                      </ul>

                      <p className="font-semibold mt-3">Wymagania:</p>
                      <p>
                        Wymaga włączonego resamplingu, aby wszystkie serie miały
                        te same znaczniki czasowe.
                      </p>
                    </InfoModal>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 justify-start"
                      variant="outline"
                      onClick={handleApplyStandardDeviation}
                      disabled={!effectiveConfig.resampling.applied}
                    >
                      Odchylenie Standardowe
                    </Button>
                    <InfoModal title="Odchylenie Standardowe (Standard Deviation)">
                      <p className="font-semibold">Co to jest?</p>
                      <p>
                        Odchylenie standardowe mierzy, jak bardzo wartości z
                        różnych serii różnią się od ich średniej w każdym
                        punkcie czasowym.
                      </p>

                      <p className="font-semibold mt-3">Jak działa?</p>
                      <p>
                        Dla każdego znacznika czasu <code>t</code>:
                      </p>
                      <code className="block bg-muted p-2 rounded mt-1">
                        σ(t) = √(Σ(vᵢ(t) - mean(t))² / n)
                      </code>
                      <p className="mt-1">
                        gdzie <code>mean(t)</code> to średnia w czasie{" "}
                        <code>t</code>, a <code>n</code> to liczba serii.
                      </p>

                      <p className="font-semibold mt-3">Interpretacja:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Małe σ:</strong> Wartości są blisko siebie
                          (mała zmienność)
                        </li>
                        <li>
                          <strong>Duże σ:</strong> Wartości są rozproszone (duża
                          zmienność)
                        </li>
                        <li>
                          <strong>σ = 0:</strong> Wszystkie wartości są
                          identyczne
                        </li>
                      </ul>

                      <p className="font-semibold mt-3">Kiedy używać?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Do analizy spójności pomiarów</li>
                        <li>
                          Do identyfikacji momentów dużej
                          zmienności/niestabilności
                        </li>
                        <li>Do oceny jakości/zgodności wielu czujników</li>
                      </ul>
                    </InfoModal>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1 justify-start"
                      variant="outline"
                      onClick={handleApplyChanges}
                      disabled={!effectiveConfig.resampling.applied}
                    >
                      Zmiany (Pochodna)
                    </Button>
                    <InfoModal title="Zmiany / Pochodna (Changes)">
                      <p className="font-semibold">Co to jest?</p>
                      <p>
                        Operacja &quot;zmiany&quot; oblicza różnicę między
                        kolejnymi punktami, pokazując tempo zmian wartości w
                        czasie (dyskretna pochodna).
                      </p>

                      <p className="font-semibold mt-3">Jak działa?</p>
                      <p>
                        Dla każdego punktu <code>i</code> (oprócz pierwszego):
                      </p>
                      <code className="block bg-muted p-2 rounded mt-1">
                        change[i] = v[i] - v[i-1]
                      </code>

                      <p className="font-semibold mt-3">Interpretacja:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Wartość dodatnia:</strong> Wartość rośnie
                        </li>
                        <li>
                          <strong>Wartość ujemna:</strong> Wartość maleje
                        </li>
                        <li>
                          <strong>Zero:</strong> Wartość pozostaje stała
                        </li>
                        <li>
                          <strong>Duża wartość bezwzględna:</strong> Szybka
                          zmiana
                        </li>
                      </ul>

                      <p className="font-semibold mt-3">Kiedy używać?</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Do analizy prędkości zmian (np. przyspieszenie z
                          danych o pozycji)
                        </li>
                        <li>Do wykrywania nagłych skoków lub anomalii</li>
                        <li>Do identyfikacji trendów wzrostowych/spadkowych</li>
                        <li>Do analizy częstotliwości zmian</li>
                      </ul>

                      <p className="font-semibold mt-3">Uwaga:</p>
                      <p>
                        Pierwszy punkt jest usuwany, ponieważ nie ma dla niego
                        poprzednika do obliczenia różnicy.
                      </p>
                    </InfoModal>
                  </div>

                  {/* Quantize Operation */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-medium">
                      Przybliżenie (Kwantyzacja)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={quantizeStep}
                        onChange={(e) => setQuantizeStep(e.target.value)}
                        placeholder="np. 1, 0.1"
                        className="text-sm"
                        step="any"
                        disabled={!effectiveConfig.resampling.applied}
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyQuantize}
                        disabled={!effectiveConfig.resampling.applied}
                      >
                        Zastosuj
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Zaokrąglij wartości do wybranej dokładności (np. 1 =
                      liczby całkowite, 0.1 = jedna cyfra po przecinku)
                    </p>
                  </div>

                  {/* Moving Average Operation */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-medium">
                      Średnia Ruchoma
                    </Label>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Algorytm
                      </Label>
                      <select
                        value={movingAverageAlgorithm}
                        onChange={(e) =>
                          setMovingAverageAlgorithm(
                            e.target.value as "SMA" | "WMA" | "RMA"
                          )
                        }
                        className="w-full p-2 text-sm border rounded mt-1 bg-background"
                        disabled={!effectiveConfig.resampling.applied}
                      >
                        <option value="SMA">SMA - Simple Moving Average</option>
                        <option value="WMA">
                          WMA - Weighted Moving Average
                        </option>
                        <option value="RMA">
                          RMA - Running Moving Average
                        </option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {movingAverageAlgorithm === "SMA" &&
                          "Zwykła średnia arytmetyczna z okna"}
                        {movingAverageAlgorithm === "WMA" &&
                          "Nowsze wartości mają większą wagę"}
                        {movingAverageAlgorithm === "RMA" &&
                          "Wygładzona średnia z mniejszym opóźnieniem"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={movingAverageWindow}
                        onChange={(e) => setMovingAverageWindow(e.target.value)}
                        placeholder="np. 3, 5, 10"
                        className="text-sm"
                        min="1"
                        step="1"
                        disabled={!effectiveConfig.resampling.applied}
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyGlobalMovingAverage}
                        disabled={!effectiveConfig.resampling.applied}
                      >
                        Zastosuj
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Wygładź dane używając okna {movingAverageWindow} punktów
                    </p>
                    <p className="text-xs text-amber-600">
                      Uwaga: Pierwsze {parseInt(movingAverageWindow) - 1 || 0}{" "}
                      punktów zostanie usuniętych z każdego rekordu
                    </p>
                  </div>
                </div>
                {!effectiveConfig.resampling.applied && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Zastosuj resampling aby włączyć operacje statystyczne
                  </p>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Active Global Operations */}
          {!isIndividualMode && effectiveConfig.globalOperations.length > 0 && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Aktywne Operacje Globalne
              </Label>
              <div className="space-y-2 mt-2">
                {effectiveConfig.globalOperations.map((op, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-secondary p-2 rounded text-sm"
                  >
                    <span className="font-medium">
                      {op.type === "mean" && "Średnia"}
                      {op.type === "standardDeviation" &&
                        "Odchylenie standardowe"}
                      {op.type === "changes" && "Zmiany (Pochodna)"}
                      {op.type === "quantize" &&
                        `Przybliżenie (krok: ${op.params.step})`}
                      {op.type === "movingAverage" &&
                        `Średnia Ruchoma ${
                          op.params.algorithm || "SMA"
                        } (okno: ${op.params.windowSize})`}
                      {![
                        "mean",
                        "standardDeviation",
                        "changes",
                        "quantize",
                        "movingAverage",
                      ].includes(op.type) && op.type}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeGlobalOperation(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}
