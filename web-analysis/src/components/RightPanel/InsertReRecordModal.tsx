"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Upload, FileText } from "lucide-react";
import { InfoModal } from "@/components/ui/info-modal";
import { DataRecord } from "@/lib/types";
import { useDashboard } from "@/context/DashboardContext";

interface InsertReRecordModalProps {
  onClose: () => void;
  onInsert: (records: DataRecord[], label: string, tags: string[]) => void;
}

// Constants for placeholders and examples
const JSON_TEXTAREA_PLACEHOLDER = `{
  "data": [
    { "t": 1000, "v": 50 },
    { "t": 1100, "v": 52 }
  ],
  "recordingTimestampStart": 1234567890
}`;

const JSON_FORMAT_EXAMPLE = `{
  "data": [
    { "t": 1000, "v": 50 },
    { "t": 1100, "v": 52 },
    ...
  ]
}`;

const ARRAY_FORMAT_EXAMPLE = `[
  { "t": 1000, "v": 50 },
  { "t": 1100, "v": 52 },
  ...
]`;

const LABEL_PLACEHOLDER = "np. Pomiar 1, Sesja A, itp.";
const TAGS_PLACEHOLDER = "np. rerecord, pomiar, sesja1";

/**
 * Parse re-record data from JSON text and convert to DataRecord format
 * @param jsonText - JSON string containing re-record data
 * @param reRecordStartTimestamp - Optional timestamp when re-record started
 * @param existingStartTimestamp - Optional timestamp when existing recording started
 * @returns Array of DataRecord objects
 */
function parseReRecordData(
  jsonText: string,
  reRecordStartTimestamp?: number | null,
  existingStartTimestamp?: number | null
): DataRecord[] {
  try {
    const parsed = JSON.parse(jsonText);
    
    // Calculate timestamp offset if both timestamps are available
    // This syncs the re-record data with the existing recording timeline
    let timestampOffset = 0;
    if (
      reRecordStartTimestamp !== undefined &&
      reRecordStartTimestamp !== null &&
      existingStartTimestamp !== undefined &&
      existingStartTimestamp !== null
    ) {
      // Calculate the difference between existing start and re-record start
      // All timestamps will be shifted by this offset to sync the recordings
      timestampOffset = existingStartTimestamp - reRecordStartTimestamp;
    }
    
    // Handle re-record format: { data: [{ t: number, v: number }], recordingTimestampStart?: number }
    if (parsed.data && Array.isArray(parsed.data)) {
      const records: DataRecord[] = [];
      const recordId = `rerecord_${Date.now()}`;
      
      parsed.data.forEach((point: { t: number; v: number }, index: number) => {
        if (typeof point.t === "number" && typeof point.v === "number") {
          records.push({
            id: recordId,
            timestamp: point.t + timestampOffset,
            value: point.v,
          });
        }
      });
      
      if (records.length === 0) {
        throw new Error("Brak prawidłowych punktów danych w formacie {t, v}");
      }
      
      return records;
    }
    
    // Handle array format: [{ t: number, v: number }]
    if (Array.isArray(parsed)) {
      const records: DataRecord[] = [];
      const recordId = `rerecord_${Date.now()}`;
      
      parsed.forEach((point: { t: number; v: number }, index: number) => {
        if (typeof point.t === "number" && typeof point.v === "number") {
          records.push({
            id: recordId,
            timestamp: point.t + timestampOffset,
            value: point.v,
          });
        }
      });
      
      if (records.length === 0) {
        throw new Error("Brak prawidłowych punktów danych w formacie {t, v}");
      }
      
      return records;
    }
    
    throw new Error("Nieprawidłowy format danych. Oczekiwano obiektu z polem 'data' lub tablicy punktów");
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Błąd parsowania JSON");
  }
}

/**
 * Component to display timestamp synchronization info
 */
function TimestampSyncInfo({
  textInput,
  existingStartTimestamp,
}: {
  textInput: string;
  existingStartTimestamp: number | undefined;
}) {
  if (!existingStartTimestamp) {
    return null;
  }

  let offset: number | null = null;
  try {
    if (textInput.trim()) {
      const parsed = JSON.parse(textInput);
      if (parsed.recordingTimestampStart !== undefined) {
        offset = existingStartTimestamp - parsed.recordingTimestampStart;
      }
    }
  } catch {
    // Ignore parse errors
  }

  if (offset === null || offset === 0) {
    return (
      <p className="text-xs text-blue-600 mt-1">
        ℹ️ Timestamps zostaną automatycznie zsynchronizowane z istniejącym nagraniem
      </p>
    );
  }

  return (
    <p className="text-xs text-blue-600 mt-1">
      ℹ️ Timestamps zostaną automatycznie zsynchronizowane z istniejącym nagraniem
      {` (offset: ${offset > 0 ? '+' : ''}${offset}ms)`}
    </p>
  );
}

export default function InsertReRecordModal({
  onClose,
  onInsert,
}: InsertReRecordModalProps) {
  const { config } = useDashboard();
  const [inputMethod, setInputMethod] = useState<"file" | "text">("text");
  const [textInput, setTextInput] = useState("");
  const [label, setLabel] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setTextInput(content);
        setError(null);
      } catch (err) {
        setError("Błąd odczytu pliku");
      }
    };
    reader.onerror = () => {
      setError("Błąd odczytu pliku");
    };
    reader.readAsText(file);
  };

  const handleInsert = () => {
    setError(null);
    
    if (!textInput.trim()) {
      setError("Proszę wprowadzić dane JSON");
      return;
    }

    try {
      // Extract recordingTimestampStart from parsed JSON
      let reRecordStartTimestamp: number | null = null;
      try {
        const parsed = JSON.parse(textInput);
        reRecordStartTimestamp = parsed.recordingTimestampStart ?? null;
      } catch {
        // Ignore parse errors here, will be caught in parseReRecordData
      }

      const records = parseReRecordData(
        textInput,
        reRecordStartTimestamp,
        config.recordingStartTimestamp
      );
      
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      
      onInsert(records, label.trim() || `Re-Record ${new Date().toLocaleString()}`, tags);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd parsowania danych");
    }
  };

  const isInsertDisabled = !textInput.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Wstaw dane Re-Record</h2>
          <div className="flex items-center gap-2">
            <InfoModal title="Format danych Re-Record">
              <p className="font-semibold">Format JSON:</p>
              <p>Dane powinny być w formacie JSON z tablicą punktów:</p>
              <code className="block bg-muted p-2 rounded mt-1">
                {JSON_FORMAT_EXAMPLE}
              </code>
              <p className="mt-3 font-semibold">Lub jako tablica:</p>
              <code className="block bg-muted p-2 rounded mt-1">
                {ARRAY_FORMAT_EXAMPLE}
              </code>
              <p className="mt-3">
                <strong>t</strong> - timestamp w milisekundach
                <br />
                <strong>v</strong> - wartość (liczba)
                <br />
                <strong>recordingTimestampStart</strong> - (opcjonalnie) timestamp rozpoczęcia nagrywania
              </p>
              <p className="mt-3 font-semibold">Synchronizacja timestampów:</p>
              <p className="text-sm">
                Jeśli dane zawierają <code>recordingTimestampStart</code> i w projekcie jest ustawiony
                <code>recordingStartTimestamp</code>, wszystkie timestamps zostaną automatycznie
                przesunięte, aby zsynchronizować nagrania.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Możesz wkleić dane z eksportu JSON z panelu administracyjnego
                re-record lub bezpośrednio z API.
              </p>
            </InfoModal>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Input Method Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Metoda wprowadzania
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={inputMethod === "text" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setInputMethod("text")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Tekst / Wklej JSON
                </Button>
                <Button
                  variant={inputMethod === "file" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setInputMethod("file")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Plik JSON
                </Button>
              </div>
            </div>

            {/* File Input */}
            {inputMethod === "file" && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Wybierz plik JSON
                </Label>
                <Input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  disabled={inputMethod !== "file"}
                />
                {textInput && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Plik załadowany. Możesz przejść do pola tekstowego, aby edytować.
                  </p>
                )}
              </div>
            )}

            {/* Text Input */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Dane JSON
              </Label>
              <Textarea
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setError(null);
                }}
                placeholder={JSON_TEXTAREA_PLACEHOLDER}
                className="font-mono text-sm min-h-[200px]"
                disabled={inputMethod === "file" && !textInput}
              />
              {inputMethod === "file" && !textInput && (
                <p className="text-xs text-muted-foreground mt-1">
                  Wybierz plik JSON powyżej, aby załadować dane
                </p>
              )}
              <TimestampSyncInfo
                textInput={textInput}
                existingStartTimestamp={config.recordingStartTimestamp}
              />
            </div>

            {/* Label Input */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Etykieta (opcjonalnie)
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={LABEL_PLACEHOLDER}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Jeśli puste, zostanie wygenerowana automatyczna etykieta
              </p>
            </div>

            {/* Tags Input */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Tagi (opcjonalnie)
              </Label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={TAGS_PLACEHOLDER}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Oddziel tagi przecinkami
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button 
            onClick={handleInsert} 
            disabled={isInsertDisabled}
          >
            Wstaw dane
          </Button>
        </div>
      </Card>
    </div>
  );
}

