"use client";

import React, { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Edit2, Trash2, Layers } from "lucide-react";
import LineStyleForm from "./LineStyleForm";
import { LineStyle } from "@/lib/types";

// Utility function to determine if a color is light or dark
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export default function SetsList() {
  const {
    config,
    filteredRecordIds,
    createSet,
    updateSet,
    deleteSet,
    setCurrentSet,
    toggleSetVisibility,
  } = useDashboard();

  const [editingSetName, setEditingSetName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");

  const handleStartEdit = (setName: string) => {
    const set = config.sets.find((s) => s.name === setName);
    if (!set) return;

    setEditingSetName(setName);
    setNameInput(setName);
    setDescriptionInput(set.description);
  };

  const handleSaveEdit = () => {
    if (!editingSetName || !nameInput.trim()) return;

    // If name changed, check uniqueness
    if (nameInput !== editingSetName) {
      if (config.sets.some((s) => s.name === nameInput.trim())) {
        alert("Nazwa zestawu musi być unikalna");
        return;
      }
      // For now, we don't support renaming (would need to update currentSet references)
      alert(
        "Zmiana nazwy zestawów nie jest jeszcze obsługiwana. Proszę zamiast tego utworzyć nowy zestaw."
      );
      return;
    }

    updateSet(editingSetName, { description: descriptionInput });
    setEditingSetName(null);
    setNameInput("");
    setDescriptionInput("");
  };

  const handleCancelEdit = () => {
    setEditingSetName(null);
    setNameInput("");
    setDescriptionInput("");
  };

  const handleCreateSet = () => {
    if (!newSetName.trim()) {
      alert("Proszę wprowadzić nazwę zestawu");
      return;
    }

    if (config.sets.some((s) => s.name === newSetName.trim())) {
      alert("Nazwa zestawu musi być unikalna");
      return;
    }

    // Create from filtered records or all if none filtered
    const fromFiltered =
      config.filterByIds.length > 0 || config.filterByTags.length > 0;
    createSet(newSetName.trim(), newSetDescription.trim(), fromFiltered);

    setIsCreatingNew(false);
    setNewSetName("");
    setNewSetDescription("");
  };

  const handleCancelCreate = () => {
    setIsCreatingNew(false);
    setNewSetName("");
    setNewSetDescription("");
  };

  const handleDeleteSet = (setName: string) => {
    if (confirm(`Czy na pewno chcesz usunąć zestaw "${setName}"?`)) {
      deleteSet(setName);
    }
  };

  const handleEditRecords = (setName: string) => {
    setCurrentSet(setName);
  };

  return (
    <div className="p-4 space-y-3">
      {/* Create New Set Button */}
      {!isCreatingNew && (
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setIsCreatingNew(true)}
        >
          Utwórz nowy zestaw
        </Button>
      )}

      {/* Create New Set Form */}
      {isCreatingNew && (
        <Card className="p-3 border-2 border-primary">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">
                Nazwa zestawu (wymagana, unikalna)
              </Label>
              <Input
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                placeholder="e.g., Experiment 1"
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Opis</Label>
              <Textarea
                value={newSetDescription}
                onChange={(e) => setNewSetDescription(e.target.value)}
                placeholder="Opcjonalny opis..."
                className="text-sm mt-1 min-h-[60px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {config.filterByIds.length > 0 || config.filterByTags.length > 0
                ? `Utworzy zestaw z ${filteredRecordIds.length} wybranych rekordów`
                : "Utworzy zestaw ze wszystkich rekordów"}
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCreateSet}>
                Utwórz
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleCancelCreate}
              >
                Anuluj
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Sets List */}
      {config.sets.length === 0 && !isCreatingNew && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Brak zestawów. Utwórz zestaw, aby grupować i zarządzać rekordami
          razem.
        </p>
      )}

      {config.sets.map((set) => {
        const isEditing = editingSetName === set.name;
        const recordCount = Object.keys(set.recordMetadata).length;
        const bgColor = set.lineStyle?.color || "#f3f4f6"; // Default to gray if no color set
        const textColor = isLightColor(bgColor) ? "#000000" : "#ffffff";
        const onBgButtonVariant = isLightColor(bgColor)
          ? "outline"
          : "secondary";

        return (
          <Card
            key={set.name}
            className={`p-3 ${isEditing ? "border-2 border-primary" : ""}`}
            style={{
              backgroundColor: bgColor,
              borderColor: bgColor,
              color: textColor,
            }}
          >
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Nazwa</Label>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-sm mt-1"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nazwa nie może być zmieniona
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Opis</Label>
                  <Textarea
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="text-sm mt-1 min-h-[60px]"
                  />
                </div>

                <Separator />

                {/* Line Style Configuration */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">
                    Styl Linii
                  </Label>
                  <LineStyleForm
                    lineStyle={set.lineStyle || {}}
                    onChange={(lineStyle: LineStyle) => {
                      updateSet(set.name, { ...set, lineStyle });
                    }}
                  />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleSaveEdit}>
                    Zapisz
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelEdit}
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <Checkbox
                      checked={set.visible}
                      onCheckedChange={() => toggleSetVisibility(set.name)}
                      title={
                        set.visible ? "Ukryj z wykresu" : "Pokaż na wykresie"
                      }
                    />
                    <Layers className="h-4 w-4  flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{set.name}</p>
                      {set.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {set.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="text-xs mt-1">
                        {recordCount}{" "}
                        {recordCount === 1
                          ? "rekord"
                          : recordCount < 5
                          ? "rekordy"
                          : "rekordów"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(set.name)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSet(set.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Edit Records Button */}
                <Button
                  size="sm"
                  variant={onBgButtonVariant}
                  className="w-full mt-2"
                  onClick={() => handleEditRecords(set.name)}
                >
                  Edytuj Rekordy
                </Button>
              </>
            )}
          </Card>
        );
      })}
    </div>
  );
}
