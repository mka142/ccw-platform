"use client";

import React, { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import SetsList from "./SetsList";
import SetRecordsList from "./SetRecordsList";
import RecordCard from "./RecordCard";

interface LeftPanelProps {
  panelHeader?: React.ReactNode;
  onCollapse?: () => void;
}

export default function LeftPanel({ panelHeader, onCollapse }: LeftPanelProps) {
  const {
    config,
    highlightedRecordId,
    isLeftPanelDisabled,
    currentSet,
    setMode,
    setSelectedRecordId,
    setCurrentSet,
    updateRecordMetadata,
    toggleIdFilter,
    toggleTagFilter,
    removeOperationFromRecord,
    toggleGlobalVisibility,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState("records");

  // When switching tabs, reset current set to global
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "records" && currentSet) {
      setCurrentSet(null);
    }
  };

  const recordIds = Object.keys(config.recordMetadata);
  const allTags = Array.from(
    new Set(Object.values(config.recordMetadata).flatMap((m) => m.tags))
  );

  const handleEditModeChange = (id: string, isEditing: boolean) => {
    if (isEditing) {
      setSelectedRecordId(id);
      setMode("individual");
    } else {
      setSelectedRecordId(null);
      setMode("global");
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {panelHeader && (
        <div className="p-4 border-b flex items-start justify-between">
          <div className="flex-1">{panelHeader}</div>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="h-8 w-8 -mt-1"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Show SetRecordsList when editing a set */}
      {currentSet ? (
        <SetRecordsList />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex flex-col h-full flex-1 overflow-auto"
        >
          <div className="p-4 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="records" className="flex items-center gap-2">
                <span>Rekordy</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGlobalVisibility('records');
                  }}
                  className="ml-auto cursor-pointer"
                  title={config.visible.records ? 'Ukryj rekordy z wykresu' : 'Pokaż rekordy na wykresie'}
                >
                  {config.visible.records ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3 opacity-50" />
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="sets" className="flex items-center gap-2">
                <span>Zestawy</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGlobalVisibility('sets');
                  }}
                  className="ml-auto cursor-pointer"
                  title={config.visible.sets ? 'Ukryj zestawy z wykresu' : 'Pokaż zestawy na wykresie'}
                >
                  {config.visible.sets ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3 opacity-50" />
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Records Tab */}
          <TabsContent
            value="records"
            className="flex-1 m-0 flex flex-col min-h-0"
          >
            {isLeftPanelDisabled && (
              <p className="text-sm text-muted-foreground mt-1">
                Wyłączone z powodu aktywnych operacji globalnych
              </p>
            )}

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="border-b">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tags" className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium cursor-pointer">
                          Filtruj według tagów
                        </Label>
                        {config.filterByTags.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {config.filterByTags.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={
                              config.filterByTags.includes(tag)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() =>
                              !isLeftPanelDisabled && toggleTagFilter(tag)
                            }
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {recordIds.map((id) => {
                  const metadata = config.recordMetadata[id];
                  const isFiltered = config.filterByIds.includes(id);
                  const isHighlighted = highlightedRecordId === id;

                  return (
                    <RecordCard
                      key={id}
                      id={id}
                      metadata={metadata}
                      isHighlighted={isHighlighted}
                      isDisabled={isLeftPanelDisabled}
                      showCheckbox={true}
                      isChecked={isFiltered}
                      onCheckChange={() =>
                        !isLeftPanelDisabled && toggleIdFilter(id)
                      }
                      onUpdateMetadata={updateRecordMetadata}
                      onRemoveOperation={removeOperationFromRecord}
                      onEditModeChange={handleEditModeChange}
                      resamplingApplied={config.resampling.applied}
                      showLabel={true}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Sets Tab */}
          <TabsContent
            value="sets"
            className="flex-1 m-0 flex flex-col min-h-0"
          >
            <ScrollArea className="flex-1">
              <SetsList />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
