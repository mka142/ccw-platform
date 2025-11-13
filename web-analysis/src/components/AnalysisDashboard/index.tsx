'use client';

import React, { useState } from 'react';
import LeftPanel from '@/components/LeftPanel';
import AudioChartUploader from '@/components/AudioChartUploader';
import RightPanel from '@/components/RightPanel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AnalysisDashboard() {
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);

  return (
    <div className="h-screen w-full flex flex-col p-4 gap-4 bg-background">
      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 relative">
        {/* Left Panel - Record List */}
        {isLeftPanelVisible && (
          <div className="col-span-3 min-h-0">
            <LeftPanel 
              panelHeader={
                <div>
                  <h1 className="text-2xl font-bold">Panel Analizy</h1>
                  <p className="text-sm text-muted-foreground">
                    Interaktywna wizualizacja danych
                  </p>
                </div>
              }
              onCollapse={() => setIsLeftPanelVisible(false)}
            />
          </div>
        )}

        {/* Toggle button for left panel */}
        {!isLeftPanelVisible && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-16 w-8 rounded-r-lg rounded-l-none border-l-0 shadow-md"
            onClick={() => setIsLeftPanelVisible(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Center Panel - Chart */}
        <div className={`min-h-0 ${
          isLeftPanelVisible && isRightPanelVisible ? 'col-span-6' :
          isLeftPanelVisible || isRightPanelVisible ? 'col-span-9' :
          'col-span-12'
        }`}>
          <AudioChartUploader />
        </div>

        {/* Toggle button for right panel */}
        {!isRightPanelVisible && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-16 w-8 rounded-l-lg rounded-r-none border-r-0 shadow-md"
            onClick={() => setIsRightPanelVisible(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Right Panel - Operations */}
        {isRightPanelVisible && (
          <div className="col-span-3 min-h-0">
            <RightPanel onCollapse={() => setIsRightPanelVisible(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
