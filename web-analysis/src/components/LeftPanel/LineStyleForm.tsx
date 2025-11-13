'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { LineStyle, LineDashType } from '@/lib/types';
import { X } from 'lucide-react';

interface LineStyleFormProps {
  lineStyle: LineStyle;
  onChange: (lineStyle: LineStyle) => void;
}

const LINE_DASH_OPTIONS: { value: LineDashType; label: string }[] = [
  { value: 'solid', label: 'Ciągła' },
  { value: 'dash', label: 'Kreskowana' },
  { value: 'dot', label: 'Kropkowana' },
  { value: 'dashDot', label: 'Kreska-Kropka' },
  { value: 'longDash', label: 'Długa Kreska' },
  { value: 'longDashDot', label: 'Długa Kreska-Kropka' },
  { value: 'shortDash', label: 'Krótka Kreska' },
  { value: 'shortDot', label: 'Krótka Kropka' },
  { value: 'shortDashDot', label: 'Krótka Kreska-Kropka' },
];

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

export default function LineStyleForm({ lineStyle, onChange }: LineStyleFormProps) {
  const handleColorChange = (color: string) => {
    onChange({ ...lineStyle, color });
  };

  const handleClearColor = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { color, ...rest } = lineStyle;
    onChange(rest);
  };

  const handleThicknessChange = (value: number[]) => {
    onChange({ ...lineStyle, lineThickness: value[0] });
  };

  const handleDashTypeChange = (value: string) => {
    onChange({ ...lineStyle, lineDashType: value as LineDashType });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Kolor Linii</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            value={lineStyle.color || '#4ECDC4'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            type="text"
            value={lineStyle.color || '#4ECDC4'}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#4ECDC4"
            className="flex-1"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearColor}
            title="Wyczyść kolor"
            className="h-10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Grubość Linii: {lineStyle.lineThickness || 2}px</Label>
        <Slider
          value={[lineStyle.lineThickness || 2]}
          onValueChange={handleThicknessChange}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Styl Linii</Label>
        <Select
          value={lineStyle.lineDashType || 'solid'}
          onValueChange={handleDashTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz styl linii" />
          </SelectTrigger>
          <SelectContent>
            {LINE_DASH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Podgląd</Label>
        <div className="border rounded p-4 bg-gray-50">
          <svg width="100%" height="40">
            <line
              x1="0"
              y1="20"
              x2="100%"
              y2="20"
              stroke={lineStyle.color || '#4ECDC4'}
              strokeWidth={lineStyle.lineThickness || 2}
              strokeDasharray={getStrokeDashArray(lineStyle.lineDashType || 'solid')}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert LineDashType to SVG stroke-dasharray
function getStrokeDashArray(dashType: LineDashType): string {
  const dashMap: Record<LineDashType, string> = {
    solid: '0',
    dash: '10,5',
    dot: '2,3',
    dashDot: '10,5,2,5',
    longDash: '20,5',
    longDashDot: '20,5,2,5',
    shortDash: '5,3',
    shortDot: '1,2',
    shortDashDot: '5,3,1,3',
    shortDashDotDot: '5,3,1,3,1,3',
    longDashDotDot: '20,5,2,5,2,5',
  };
  return dashMap[dashType] || '0';
}
