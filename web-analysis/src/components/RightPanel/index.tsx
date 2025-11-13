'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight } from 'lucide-react';
import OperationsTab from './OperationsTab';
import SettingsTab from './SettingsTab';

interface RightPanelProps {
  onCollapse?: () => void;
}

export default function RightPanel({ onCollapse }: RightPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <Tabs defaultValue="operations" className="h-full flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="operations">Operacje</TabsTrigger>
              <TabsTrigger value="settings">Ustawienia</TabsTrigger>
            </TabsList>
          </div>
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="h-8 w-8 ml-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <TabsContent value="operations" className="flex-1 mt-0 overflow-auto">
          <OperationsTab />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 mt-0 overflow-auto">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
