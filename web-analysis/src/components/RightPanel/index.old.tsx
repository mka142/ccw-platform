'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, TrendingUp, BarChart3, Activity, RefreshCw } from 'lucide-react';
import { InterpolationMethod } from '@/lib/types';

export default function RightPanel() {
  const {
    mode,
    selectedRecordId,
    config,
    addGlobalOperation,
    removeGlobalOperation,
    applyOperationToRecord,
    setResampling,
    clearResampling,
    exportConfig,
    importConfig,
    setRecordingStartTimestamp
  } = useDashboard();

  const [resampleWindowMs, setResampleWindowMs] = useState(config.resampling.windowMs.toString());
  const [interpolationMethod, setInterpolationMethod] = useState<InterpolationMethod>(config.resampling.interpolationMethod);
  const [recordingTimestamp, setRecordingTimestamp] = useState(
    config.recordingStartTimestamp?.toString() || ''
  );

  const isIndividualMode = mode === 'individual' && selectedRecordId;

  const handleApplyResampling = () => {
    const ms = parseInt(resampleWindowMs, 10);
    if (isNaN(ms) || ms <= 0) return;
    setResampling(ms, interpolationMethod);
  };

  const handleClearResampling = () => {
    clearResampling();
  };

  const handleSetRecordingTimestamp = () => {
    if (recordingTimestamp === '') {
      setRecordingStartTimestamp(undefined);
      return;
    }
    const timestamp = parseInt(recordingTimestamp, 10);
    if (isNaN(timestamp)) {
      alert('Invalid timestamp');
      return;
    }
    setRecordingStartTimestamp(timestamp);
  };

  const handleClearRecordingTimestamp = () => {
    setRecordingTimestamp('');
    setRecordingStartTimestamp(undefined);
  };

  const handleApplyMean = () => {
    if (!config.resampling.applied) {
      alert('Resampling must be applied before using statistical operations');
      return;
    }
    // Check for duplicate
    if (config.globalOperations.some(op => op.type === 'mean')) {
      alert('Mean operation already applied');
      return;
    }
    addGlobalOperation({
      type: 'mean',
      params: {}
    });
  };

  const handleApplyMovingAverage = () => {
    if (!config.resampling.applied) {
      alert('Resampling must be applied before using statistical operations');
      return;
    }
    // Check for duplicate
    if (config.globalOperations.some(op => op.type === 'movingAverage')) {
      alert('Moving Average operation already applied');
      return;
    }
    addGlobalOperation({
      type: 'movingAverage',
      params: { windowSize: 5 }
    });
  };

  const handleApplyNormalize = () => {
    if (isIndividualMode && selectedRecordId) {
      const metadata = config.recordMetadata[selectedRecordId];
      // Check for duplicate
      if (metadata.operations.some(op => op.type === 'normalize')) {
        alert('Normalize operation already applied to this record');
        return;
      }
      applyOperationToRecord(selectedRecordId, {
        type: 'normalize',
        params: { minRange: 0, maxRange: 100 }
      });
    } else {
      // Apply to all records in global mode
      Object.keys(config.recordMetadata).forEach(id => {
        const metadata = config.recordMetadata[id];
        if (!metadata.operations.some(op => op.type === 'normalize')) {
          applyOperationToRecord(id, {
            type: 'normalize',
            params: { minRange: 0, maxRange: 100 }
          });
        }
      });
    }
  };

  const handleExportConfig = () => {
    const configJson = exportConfig();
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      importConfig(content);
    };
    reader.readAsText(file);
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Operations</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Mode: <Badge variant={isIndividualMode ? 'default' : 'secondary'}>
            {isIndividualMode ? 'Individual' : 'Global'}
          </Badge>
        </p>
        {isIndividualMode && (
          <p className="text-xs text-muted-foreground mt-1">
            Editing: {selectedRecordId}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Recording Start Timestamp */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recording Start Timestamp
              {config.recordingStartTimestamp !== undefined && (
                <Badge variant="default" className="ml-2">Active</Badge>
              )}
            </Label>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Timestamp (ms)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 1234567890000"
                  value={recordingTimestamp}
                  onChange={e => setRecordingTimestamp(e.target.value)}
                  className="text-sm mt-1"
                />
              </div>
              <div className="flex gap-2">
                {config.recordingStartTimestamp === undefined ? (
                  <Button
                    className="flex-1"
                    onClick={handleSetRecordingTimestamp}
                    disabled={recordingTimestamp === ''}
                  >
                    Set Timestamp
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={handleClearRecordingTimestamp}
                  >
                    Clear Timestamp
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Sets the recording start time for audio synchronization
              </p>
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
                  {config.resampling.applied && (
                    <Badge variant="default" className="ml-2">Active</Badge>
                  )}
                </Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <Label className="text-xs">Window (ms)</Label>
                    <Input
                      type="number"
                      value={resampleWindowMs}
                      onChange={e => setResampleWindowMs(e.target.value)}
                      className="text-sm mt-1"
                      disabled={config.resampling.applied}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Interpolation Method</Label>
                    <Tabs
                      value={interpolationMethod}
                      onValueChange={(v) => setInterpolationMethod(v as InterpolationMethod)}
                      className="mt-1"
                    >
                      <TabsList className="w-full">
                        <TabsTrigger value="linear" className="flex-1" disabled={config.resampling.applied}>
                          Linear
                        </TabsTrigger>
                        <TabsTrigger value="step" className="flex-1" disabled={config.resampling.applied}>
                          Step
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {!config.resampling.applied ? (
                    <Button
                      className="w-full"
                      onClick={handleApplyResampling}
                    >
                      Apply Resampling
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={handleClearResampling}
                    >
                      Clear Resampling
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Resampling required for statistical operations
                  </p>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Statistical Operations - Only in Global Mode with Resampling */}
          {!isIndividualMode && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Statistical Operations
              </Label>
              <div className="space-y-2 mt-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleApplyMean}
                  disabled={!config.resampling.applied}
                >
                  Calculate Mean
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleApplyMovingAverage}
                  disabled={!config.resampling.applied}
                >
                  Moving Average
                </Button>
              </div>
              {!config.resampling.applied && (
                <p className="text-xs text-muted-foreground mt-2">
                  Apply resampling first to enable statistical operations
                </p>
              )}
            </div>
          )}

          {!isIndividualMode && <Separator />}

          {/* Data Transformations */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Data Transformations
            </Label>
            <div className="space-y-2 mt-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleApplyNormalize}
              >
                Normalize (0-100)
              </Button>
            </div>
          </div>

          <Separator />

          {/* Active Global Operations */}
          {config.globalOperations.length > 0 && (
            <>
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active Global Operations
                </Label>
                <div className="space-y-2 mt-2">
                  {config.globalOperations.map((op, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-secondary p-2 rounded text-sm"
                    >
                      <span className="font-medium">{op.type}</span>
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
              <Separator />
            </>
          )}

          {/* Config Management */}
          <div>
            <Label className="text-sm font-medium">Configuration</Label>
            <div className="space-y-2 mt-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleExportConfig}
              >
                Export Config
              </Button>
              <div>
                <Label
                  htmlFor="import-config"
                  className="w-full"
                >
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => document.getElementById('import-config')?.click()}
                  >
                    Import Config
                  </Button>
                </Label>
                <input
                  id="import-config"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
