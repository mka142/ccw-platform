"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Edit2,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { RecordMetadata } from "@/lib/types";

interface RecordCardProps {
  id: string;
  metadata: RecordMetadata;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  showCheckbox?: boolean;
  isChecked?: boolean;
  onCheckChange?: () => void;
  onUpdateMetadata: (id: string, metadata: Partial<RecordMetadata>) => void;
  onRemoveOperation: (id: string, operationIndex: number) => void;
  onEditModeChange?: (id: string, isEditing: boolean) => void;
  resamplingApplied?: boolean;
  showLabel?: boolean;
}

export default function RecordCard({
  id,
  metadata,
  isHighlighted = false,
  isDisabled = false,
  showCheckbox = false,
  isChecked = false,
  onCheckChange,
  onUpdateMetadata,
  onRemoveOperation,
  onEditModeChange,
  resamplingApplied = false,
  showLabel = true,
}: RecordCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [labelInput, setLabelInput] = useState(metadata.label || "");
  const [tagInput, setTagInput] = useState("");

  const handleEditClick = () => {
    setIsEditing(true);
    setLabelInput(metadata.label || "");
    onEditModeChange?.(id, true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setLabelInput("");
    setTagInput("");
    onEditModeChange?.(id, false);
  };

  const handleSaveLabel = () => {
    onUpdateMetadata(id, { label: labelInput });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTags = [...metadata.tags, tagInput.trim()];
    onUpdateMetadata(id, { tags: newTags });
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = metadata.tags.filter((t) => t !== tag);
    console.log(tag, newTags);
    onUpdateMetadata(id, { tags: newTags });
  };

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    const step = 1000; // 1 second or 1 unit

    switch (direction) {
      case "up":
        onUpdateMetadata(id, { yMove: metadata.yMove + step });
        break;
      case "down":
        onUpdateMetadata(id, { yMove: metadata.yMove - step });
        break;
      case "left":
        onUpdateMetadata(id, { xMove: metadata.xMove - step });
        break;
      case "right":
        onUpdateMetadata(id, { xMove: metadata.xMove + step });
        break;
    }
  };

  return (
    <Card
      className={`p-3 ${isHighlighted ? "ring-2 ring-primary" : ""} ${
        isDisabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {showCheckbox && (
            <Checkbox
              checked={isChecked}
              onCheckedChange={onCheckChange}
              disabled={isDisabled}
            />
          )}
          <div>
            <p className="font-medium text-sm">{metadata.label || id}</p>
            {metadata.label && (
              <p className="text-xs text-muted-foreground">{id}</p>
            )}
          </div>
        </div>
        {!isEditing && !isDisabled && (
          <Button size="sm" variant="ghost" onClick={handleEditClick}>
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Tags */}
      {metadata.tags.length > 0 && !isEditing && (
        <div className="flex flex-wrap gap-1 mb-2">
          {metadata.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="mt-3 space-y-3 border-t pt-3">
          {/* Label */}
          {showLabel && (
            <div>
              <Label className="text-xs">Etykieta</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Niestandardowa etykieta"
                  className="text-sm"
                />
                <Button size="sm" onClick={handleSaveLabel}>
                  Zapisz
                </Button>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label className="text-xs">Tagi</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Dodaj tag"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button size="sm" onClick={handleAddTag}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {metadata.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <div onClick={() => handleRemoveTag(tag)}>
                    <X className="h-3 w-3 ml-1 cursor-pointer" />
                  </div>
                </Badge>
              ))}
            </div>
          </div>

          {/* Movement controls */}
          <div>
            <Label className="text-xs">Przesuń Rekord</Label>
            {resamplingApplied && (
              <p className="text-xs text-amber-600 mt-1 mb-2">
                Wyłącz resampling aby przesuwać lub stosować operacje
              </p>
            )}
            <div className="grid grid-cols-3 gap-1 mt-1">
              <div />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMove("up")}
                disabled={resamplingApplied}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <div />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMove("left")}
                disabled={resamplingApplied}
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
              <div className="text-center text-xs py-1">
                {metadata.xMove !== 0 && <div>X: {metadata.xMove}</div>}
                {metadata.yMove !== 0 && <div>Y: {metadata.yMove}</div>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMove("right")}
                disabled={resamplingApplied}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
              <div />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMove("down")}
                disabled={resamplingApplied}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <div />
            </div>
          </div>

          {/* Operations */}
          <div>
            <Label className="text-xs">Operacje</Label>
            {resamplingApplied && (
              <p className="text-xs text-amber-600 mt-1 mb-2">
                Wyłącz resampling aby przesuwać lub usuwać operacje
              </p>
            )}
            {metadata.operations.length > 0 && (
              <div className="mt-2 space-y-1">
                {metadata.operations.map((op, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-secondary p-2 rounded"
                  >
                    <span>
                      {op.type === "normalize" && "Normalizacja"}
                      {op.type === "quantize" && "Przybliżenie"}
                      {op.type === "custom" && "Custom"}
                      {op.type === "normalize" &&
                        op.params.minRange !== undefined && (
                          <span className="text-muted-foreground ml-1">
                            ({op.params.minRange}-{op.params.maxRange})
                          </span>
                        )}
                      {op.type === "quantize" &&
                        op.params.step !== undefined && (
                          <span className="text-muted-foreground ml-1">
                            (krok: {op.params.step})
                          </span>
                        )}
                    </span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onRemoveOperation(id, idx)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={handleCancelEdit}
          >
            Gotowe
          </Button>
        </div>
      )}
    </Card>
  );
}
