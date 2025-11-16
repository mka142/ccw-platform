'use client';

import React, { useState } from 'react';
import LeftPanel from '@/components/LeftPanel';
import AudioChartUploader from '@/components/AudioChartUploader';
import RightPanel from '@/components/RightPanel';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react';

export default function AnalysisDashboard() {
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col p-4 gap-4 bg-background">
      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Panel Analizy - Instrukcja</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfoModal(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 text-sm">
            <section>
              <h4 className="font-semibold text-base mb-2">Struktura Aplikacji</h4>
              <p>
                Aplikacja składa się z trzech głównych paneli: <strong>Rekordy</strong> (lewy), 
                <strong>Wykres</strong> (środkowy) oraz <strong>Operacje</strong> (prawy).
              </p>
            </section>

            <section>
              <h4 className="font-semibold text-base mb-2">📊 Panel Rekordy (Lewy)</h4>
              <p className="mb-2">
                Panel zawiera listę wszystkich wczytanych rekordów danych oraz utworzonych zestawów.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Rekordy</strong> - indywidualne serie danych wczytane z pliku JSON</li>
                <li><strong>Zestawy</strong> - tworzone z aktualnie zaznaczonych rekordów</li>
                <li>Każdy rekord/zestaw może mieć własny kolor i widoczność</li>
                <li>Można dodawać tagi do organizacji danych</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-base mb-2">🎯 Zestawy Danych</h4>
              <p>
                <strong>Zestawy</strong> są tworzone z aktualnie zaznaczonych rekordów. 
                Pozwalają grupować dane i stosować do nich operacje jako do całości. 
                Zestawy zachowują się jak osobne rekordy, ale reprezentują zagregowane dane.
              </p>
            </section>

            <section>
              <h4 className="font-semibold text-base mb-2">⚙️ Panel Operacje (Prawy)</h4>
              <p className="mb-2">
                Panel zawiera narzędzia do transformacji i analizy danych:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Zakładka Operacje</strong> - transformacje danych i operacje statystyczne</li>
                <li><strong>Zakładka Ustawienia</strong> - konfiguracja wykresu i widoku</li>
              </ul>
            </section>

            <section>
              <h4 className="font-semibold text-base mb-2">🔄 Przepływ Przetwarzania Danych</h4>
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <p className="font-semibold">1. Transformacje Danych (Operacje Indywidualne)</p>
                <p className="ml-4 text-muted-foreground">
                  Zastosowane <strong>tylko do zaznaczonych rekordów</strong> lub do wszystkich:
                </p>
                <ul className="list-disc list-inside ml-6 space-y-1 text-muted-foreground">
                  <li>Przesuwanie danych dla każdego rekordu (zmiana offsetu)</li>
                  <li>Normalizacja (Min-Max, Z-Score)</li>
                  <li>Przybliżenie (Quantize)</li>
                  <li>Średnia Ruchoma (SMA, WMA, RMA)</li>
                </ul>

                <p className="font-semibold mt-3">2. Resampling (Opcjonalny)</p>
                <p className="ml-4 text-muted-foreground">
                  Zmiana częstotliwości próbkowania z interpolacją (Linear/Step)
                </p>

                <p className="font-semibold mt-3">3. Operacje Statystyczne (Globalne)</p>
                <p className="ml-4 text-muted-foreground">
                  Zastosowane do <strong>wszystkich danych po transformacjach</strong>:
                </p>
                <ul className="list-disc list-inside ml-6 space-y-1 text-muted-foreground">
                  <li>Średnia (Mean)</li>
                  <li>Odchylenie Standardowe</li>
                  <li>Zmiany/Pochodna</li>
                </ul>
                <p className="ml-4 mt-2 text-muted-foreground">
                  ⚡ <strong>Można stosować wiele operacji statystycznych jedna po drugiej!</strong>
                </p>
              </div>
            </section>

            <section>
              <h4 className="font-semibold text-base mb-2">💾 Projekty</h4>
              <p className="mb-2">
                Kliknij ikonę <strong>folderu 📁</strong> w prawym panelu aby zarządzać projektami:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Utwórz Projekt</strong> - zapisuje aktualne dane, konfigurację i audio</li>
                <li><strong>Zapisz</strong> - aktualizuje projekt po zmianach</li>
                <li><strong>Eksportuj</strong> - zapisuje projekt do pliku JSON</li>
                <li><strong>Importuj</strong> - wczytuje projekt z pliku</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Projekty przechowują wszystkie transformacje, operacje, ustawienia wizualizacji oraz pliki audio.
              </p>
            </section>

            <section>
              <h4 className="font-semibold text-base mb-2">💡 Wskazówki</h4>
              <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>Użyj tagów do organizacji dużej liczby rekordów</li>
                <li>Twórz zestawy z podobnych rekordów do zbiorczej analizy</li>
                <li>Stosuj resampling przed operacjami statystycznymi</li>
                <li>Operacje można usuwać i zmieniać w dowolnej kolejności</li>
                <li>Eksportuj projekty regularnie aby nie stracić pracy</li>
              </ul>
            </section>
          </div>
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 relative">
        {/* Left Panel - Record List */}
        {isLeftPanelVisible && (
          <div className="col-span-3 min-h-0">
            <LeftPanel 
              panelHeader={
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Panel Analizy</h1>
                    <p className="text-sm text-muted-foreground">
                      Interaktywna wizualizacja danych
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowInfoModal(true)}
                    className="h-8 w-8"
                    title="Informacje o aplikacji"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
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
