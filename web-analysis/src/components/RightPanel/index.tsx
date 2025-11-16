'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, FolderOpen } from 'lucide-react';
import ProjectManager from '@/components/ProjectManager';
import OperationsTab from './OperationsTab';
import SettingsTab from './SettingsTab';

interface RightPanelProps {
  onCollapse?: () => void;
}

export default function RightPanel({ onCollapse }: RightPanelProps) {
  const [showProjectManager, setShowProjectManager] = useState(false);

  return (
    <>
      {/* Project Manager Modal */}
      {showProjectManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl h-[80vh] m-4">
            <ProjectManager onClose={() => setShowProjectManager(false)} />
          </div>
        </div>
      )}

      <Card className="h-full flex flex-col">
        <Tabs defaultValue="operations" className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProjectManager(true)}
                title="Zarządzanie Projektami"
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
              <TabsList className="grid grid-cols-2">
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
    </>
  );
}
