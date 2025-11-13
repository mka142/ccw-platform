'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import RecordCard from './RecordCard';

export default function SetRecordsList() {
  const { config, currentSet, setCurrentSet, updateRecordMetadata, removeOperationFromRecord, toggleIdFilter } = useDashboard();

  if (!currentSet) return null;

  const set = config.sets.find(s => s.name === currentSet);
  if (!set) return null;

  const recordIds = Object.keys(set.recordMetadata);

  const handleGoBack = () => {
    setCurrentSet(null);
  };

  return (
    <>
      {/* Header with back button */}
      <div className="p-4 border-b bg-muted/50">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleGoBack}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót do Zestawów
        </Button>
        <div className="flex items-center gap-2 overflow-auto">
          <h2 className="text-lg font-semibold">Rekordy</h2>
          <Badge variant="outline">{set.name}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {set.description || 'Brak opisu'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {recordIds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Brak rekordów w tym zestawie
            </p>
          ) : (
            recordIds.map(id => {
              const metadata = set.recordMetadata[id];
              if (!metadata) return null;

              const isFiltered = set.filterByIds.includes(id);

              return (
                <RecordCard
                  key={id}
                  id={id}
                  metadata={metadata}
                  isHighlighted={false}
                  isDisabled={false}
                  showCheckbox={true}
                  isChecked={isFiltered}
                  onCheckChange={() => toggleIdFilter(id)}
                  onUpdateMetadata={updateRecordMetadata}
                  onRemoveOperation={removeOperationFromRecord}
                  resamplingApplied={set.resampling.applied}
                  showLabel={false}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </>
  );
}
