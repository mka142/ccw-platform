'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, TrendingUp, BarChart3, Activity, RefreshCw } from 'lucide-react';
import { InterpolationMethod } from '@/lib/types';

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

  const [resampleWindowMs, setResampleWindowMs] = useState(effectiveConfig.resampling.windowMs.toString());
  const [interpolationMethod, setInterpolationMethod] = useState<InterpolationMethod>(effectiveConfig.resampling.interpolationMethod);
  const [normalizeMin, setNormalizeMin] = useState('0');
  const [normalizeMax, setNormalizeMax] = useState('100');
  const [quantizeStep, setQuantizeStep] = useState('1');

  const isIndividualMode = mode === 'individual' && selectedRecordId;

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
      alert('Resampling musi być zastosowany przed użyciem operacji statystycznych');
      return;
    }
    if (effectiveConfig.globalOperations.some(op => op.type === 'mean')) {
      alert('Operacja średniej jest już zastosowana');
      return;
    }
    addGlobalOperation({
      type: 'mean',
      params: {}
    });
  };

  const handleApplyStandardDeviation = () => {
    if (!effectiveConfig.resampling.applied) {
      alert('Resampling musi być zastosowany przed użyciem operacji statystycznych');
      return;
    }
    if (effectiveConfig.globalOperations.some(op => op.type === 'standardDeviation')) {
      alert('Operacja odchylenia standardowego jest już zastosowana');
      return;
    }
    addGlobalOperation({
      type: 'standardDeviation',
      params: {}
    });
  };

  const handleApplyChanges = () => {
    if (!effectiveConfig.resampling.applied) {
      alert('Resampling musi być zastosowany przed użyciem operacji statystycznych');
      return;
    }
    if (effectiveConfig.globalOperations.some(op => op.type === 'changes')) {
      alert('Operacja zmian jest już zastosowana');
      return;
    }
    addGlobalOperation({
      type: 'changes',
      params: {}
    });
  };

  const handleApplyQuantize = () => {
    if (!effectiveConfig.resampling.applied) {
      alert('Resampling musi być zastosowany przed użyciem operacji statystycznych');
      return;
    }
    
    const step = parseFloat(quantizeStep);
    if (isNaN(step) || step <= 0) {
      alert('Proszę wprowadzić prawidłową wartość kroku (liczba dodatnia)');
      return;
    }

    if (effectiveConfig.globalOperations.some(op => op.type === 'quantize')) {
      alert('Operacja przybliżenia jest już zastosowana');
      return;
    }
    
    addGlobalOperation({
      type: 'quantize',
      params: { step }
    });
  };

  const handleApplyNormalize = () => {
    const minRange = parseFloat(normalizeMin);
    const maxRange = parseFloat(normalizeMax);
    
    if (isNaN(minRange) || isNaN(maxRange)) {
      alert('Proszę wprowadzić prawidłowe liczby dla zakresu min i max');
      return;
    }
    
    if (minRange >= maxRange) {
      alert('Zakres min musi być mniejszy niż zakres max');
      return;
    }

    // Get filtered record IDs (or all if none filtered)
    const targetIds = effectiveConfig.filterByIds.length > 0 
      ? effectiveConfig.filterByIds 
      : Object.keys(effectiveConfig.recordMetadata);

    let appliedCount = 0;
    targetIds.forEach(id => {
      const metadata = effectiveConfig.recordMetadata[id];
      if (!metadata.operations.some(op => op.type === 'normalize')) {
        applyOperationToRecord(id, {
          type: 'normalize',
          params: { minRange, maxRange }
        });
        appliedCount++;
      }
    });

    if (appliedCount === 0) {
      alert('Normalizacja jest już zastosowana do wszystkich wybranych rekordów');
    }
  };

  const handleClearNormalize = () => {
    // Get filtered record IDs (or all if none filtered)
    const targetIds = effectiveConfig.filterByIds.length > 0 
      ? effectiveConfig.filterByIds 
      : Object.keys(effectiveConfig.recordMetadata);

    let clearedCount = 0;
    targetIds.forEach(id => {
      const metadata = effectiveConfig.recordMetadata[id];
      const normalizeIndex = metadata.operations.findIndex(op => op.type === 'normalize');
      if (normalizeIndex !== -1) {
        removeOperationFromRecord(id, normalizeIndex);
        clearedCount++;
      }
    });

    if (clearedCount === 0) {
      alert('Brak operacji normalizacji do usunięcia w wybranych rekordach');
    }
  };

  const handleApplyIndividualQuantize = () => {
    const step = parseFloat(quantizeStep);
    
    if (isNaN(step) || step <= 0) {
      alert('Proszę wprowadzić prawidłową wartość kroku (liczba dodatnia)');
      return;
    }

    // Get filtered record IDs (or all if none filtered)
    const targetIds = effectiveConfig.filterByIds.length > 0 
      ? effectiveConfig.filterByIds 
      : Object.keys(effectiveConfig.recordMetadata);

    let appliedCount = 0;
    targetIds.forEach(id => {
      const metadata = effectiveConfig.recordMetadata[id];
      if (!metadata.operations.some(op => op.type === 'quantize')) {
        applyOperationToRecord(id, {
          type: 'quantize',
          params: { step }
        });
        appliedCount++;
      }
    });

    if (appliedCount === 0) {
      alert('Przybliżenie jest już zastosowane do wszystkich wybranych rekordów');
    }
  };

  const handleClearIndividualQuantize = () => {
    // Get filtered record IDs (or all if none filtered)
    const targetIds = effectiveConfig.filterByIds.length > 0 
      ? effectiveConfig.filterByIds 
      : Object.keys(effectiveConfig.recordMetadata);

    let clearedCount = 0;
    targetIds.forEach(id => {
      const metadata = effectiveConfig.recordMetadata[id];
      const quantizeIndex = metadata.operations.findIndex(op => op.type === 'quantize');
      if (quantizeIndex !== -1) {
        removeOperationFromRecord(id, quantizeIndex);
        clearedCount++;
      }
    });

    if (clearedCount === 0) {
      alert('Brak operacji przybliżenia do usunięcia w wybranych rekordach');
    }
  };

  return (
    <>
      <div className="p-4 border-b bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Tryb: <Badge variant={isIndividualMode ? 'default' : 'secondary'}>
            {isIndividualMode ? 'Indywidualny' : 'Globalny'}
          </Badge>
        </p>
        {currentSet && (
          <p className="text-xs text-muted-foreground mt-1">
            Zestaw: <Badge variant="outline">{currentSet}</Badge>
          </p>
        )}
        {isIndividualMode && (
          <p className="text-xs text-muted-foreground mt-1">
            Edycja: {selectedRecordId}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
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
                  : 'Stosuje się do wszystkich rekordów'}
            </p>
            
            {/* Normalization */}
            <div className="mt-3 space-y-2">
              <Label className="text-xs font-medium">Normalizacja</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    value={normalizeMin}
                    onChange={e => setNormalizeMin(e.target.value)}
                    className="text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    value={normalizeMax}
                    onChange={e => setNormalizeMax(e.target.value)}
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
                    const targetIds = effectiveConfig.filterByIds.length > 0 
                      ? effectiveConfig.filterByIds 
                      : Object.keys(effectiveConfig.recordMetadata);
                    return !targetIds.some(id => 
                      effectiveConfig.recordMetadata[id]?.operations.some(op => op.type === 'normalize')
                    );
                  })()}
                >
                  Wyczyść
                </Button>
              </div>
            </div>

            {/* Quantize (Individual) */}
            <div className="mt-3 space-y-2">
              <Label className="text-xs font-medium">Przybliżenie wartości</Label>
              <div>
                <Label className="text-xs text-muted-foreground">Krok</Label>
                <Input
                  type="number"
                  value={quantizeStep}
                  onChange={e => setQuantizeStep(e.target.value)}
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
                    const targetIds = effectiveConfig.filterByIds.length > 0 
                      ? effectiveConfig.filterByIds 
                      : Object.keys(effectiveConfig.recordMetadata);
                    return !targetIds.some(id => 
                      effectiveConfig.recordMetadata[id]?.operations.some(op => op.type === 'quantize')
                    );
                  })()}
                >
                  Wyczyść
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Resampling - Only in Global Mode */}
          {!isIndividualMode && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Resampling
                  {effectiveConfig.resampling.applied && (
                    <Badge variant="default" className="ml-2">Aktywny</Badge>
                  )}
                </Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">Okno (ms)</Label>
                    <Input
                      type="number"
                      value={resampleWindowMs}
                      onChange={e => setResampleWindowMs(e.target.value)}
                      className="text-sm mt-1"
                      disabled={effectiveConfig.resampling.applied}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Metoda Interpolacji</Label>
                    <Tabs
                      value={interpolationMethod}
                      onValueChange={(v) => setInterpolationMethod(v as InterpolationMethod)}
                      className="mt-1"
                    >
                      <TabsList className="w-full">
                        <TabsTrigger value="linear" className="flex-1" disabled={effectiveConfig.resampling.applied}>
                          Liniowa
                        </TabsTrigger>
                        <TabsTrigger value="step" className="flex-1" disabled={effectiveConfig.resampling.applied}>
                          Krokowa
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {!effectiveConfig.resampling.applied ? (
                    <Button
                      className="w-full"
                      onClick={handleApplyResampling}
                    >
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
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleApplyMean}
                    disabled={!effectiveConfig.resampling.applied}
                  >
                    Oblicz Średnią
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleApplyStandardDeviation}
                    disabled={!effectiveConfig.resampling.applied}
                  >
                    Odchylenie Standardowe
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleApplyChanges}
                    disabled={!effectiveConfig.resampling.applied}
                  >
                    Zmiany (Pochodna)
                  </Button>
                  
                  {/* Quantize Operation */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-medium">Przybliżenie (Kwantyzacja)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={quantizeStep}
                        onChange={e => setQuantizeStep(e.target.value)}
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
                      Zaokrąglij wartości do wybranej dokładności (np. 1 = liczby całkowite, 0.1 = jedna cyfra po przecinku)
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
                      {op.type === 'mean' && 'Średnia'}
                      {op.type === 'standardDeviation' && 'Odchylenie standardowe'}
                      {op.type === 'changes' && 'Zmiany (Pochodna)'}
                      {op.type === 'quantize' && `Przybliżenie (krok: ${op.params.step})`}
                      {!['mean', 'standardDeviation', 'changes', 'quantize'].includes(op.type) && op.type}
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
