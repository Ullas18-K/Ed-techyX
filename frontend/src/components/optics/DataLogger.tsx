import { useState, useEffect } from 'react';
import { LineChart, Download, Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DataPoint {
  timestamp: number;
  values: Record<string, number>;
}

interface DataLoggerProps {
  objectDistance: number;
  objectHeight: number;
  imageDistance: number;
  imageHeight: number;
  magnification: number;
  focalLength: number;
}

const metrics = [
  { id: 'objectDistance', label: 'u', fullLabel: 'Object Dist', unit: 'cm', color: '#22c55e' },
  { id: 'imageDistance', label: 'v', fullLabel: 'Image Dist', unit: 'cm', color: '#3b82f6' },
  { id: 'magnification', label: 'm', fullLabel: 'Mag', unit: 'x', color: '#f59e0b' },
];

export function DataLogger({
  objectDistance,
  objectHeight,
  imageDistance,
  imageHeight,
  magnification,
  focalLength,
}: DataLoggerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('objectDistance');

  useEffect(() => {
    if (isRecording) {
      const newPoint: DataPoint = {
        timestamp: Date.now(),
        values: {
          objectDistance: objectDistance / 10,
          objectHeight: objectHeight / 10,
          imageDistance: Math.abs(imageDistance) / 10,
          imageHeight: Math.abs(imageHeight) / 10,
          magnification,
        },
      };
      setDataPoints((prev) => [...prev, newPoint].slice(-40)); // Keep more points for smoother graph
    }
  }, [objectDistance, objectHeight, imageDistance, imageHeight, magnification, isRecording]);

  const clearData = () => setDataPoints([]);

  const exportData = () => {
    const csvContent = [
      ['Timestamp', ...metrics.map((m) => `${m.fullLabel} (${m.unit})`), 'Focal Length (cm)'].join(','),
      ...dataPoints.map((point) => [
        new Date(point.timestamp).toISOString(),
        ...metrics.map((m) => (point.values[m.id] || 0).toFixed(2)),
        (focalLength / 10).toFixed(2),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optics_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sparkline Graph Logic
  const graphWidth = 320;
  const graphHeight = 80;
  const padding = 5;

  const selectedData = dataPoints.map((p) => p.values[selectedMetric] || 0);
  const maxValue = Math.max(...selectedData, 1);
  const minValue = Math.min(...selectedData, 0);
  const range = maxValue - minValue || 1;

  const pathData = selectedData.length > 1 ? selectedData
    .map((value, index) => {
      const x = (index / (selectedData.length - 1)) * graphWidth;
      const y = graphHeight - ((value - minValue) / range) * graphHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ') : '';

  const selectedMetricInfo = metrics.find((m) => m.id === selectedMetric);

  return (
    <div className="w-full">
      {/* Header / Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {metrics.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMetric(m.id)}
              className={cn(
                "text-[10px] px-3 py-1 rounded-md font-bold uppercase transition-all",
                selectedMetric === m.id ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray-500 hover:text-black hover:bg-gray-200"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={cn("w-7 h-7 rounded-full", isRecording ? "" : "border-gray-200 hover:bg-gray-100")}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5 text-black" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7 rounded-full border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100"
            onClick={clearData}
            disabled={dataPoints.length === 0}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-7 h-7 rounded-full border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100"
            onClick={exportData}
            disabled={dataPoints.length === 0}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Graph Area */}
      <div className="relative h-24 w-full bg-white rounded-xl border border-gray-200 p-2 overflow-hidden group shadow-sm">
        {dataPoints.length > 1 ? (
          <svg width="100%" height="100%" viewBox={`0 0 ${graphWidth} ${graphHeight}`} preserveAspectRatio="none" className="overflow-visible">
            <path
              d={pathData}
              fill="none"
              stroke={selectedMetricInfo?.color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
            {/* Current Value Dot */}
            <circle
              cx={graphWidth}
              cy={graphHeight - ((selectedData[selectedData.length - 1] - minValue) / range) * graphHeight}
              r="4"
              fill={selectedMetricInfo?.color}
              className="animate-pulse"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Activity className="w-6 h-6 opacity-30" />
            <span className="text-[10px] uppercase tracking-wider opacity-50">Start Recording</span>
          </div>
        )}

        {/* Legend/Info Overlay */}
        {dataPoints.length > 0 && (
          <div className="absolute top-2 left-2 text-xs font-mono font-bold text-black/80">
            {selectedData[selectedData.length - 1].toFixed(2)} <span className="text-[10px] text-gray-500">{selectedMetricInfo?.unit}</span>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] uppercase tracking-wider">
        <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
          <span className="text-gray-500 block mb-0.5">Focal Len</span>
          <span className="text-black font-mono">{(focalLength / 10).toFixed(1)}</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
          <span className="text-gray-500 block mb-0.5">Mag</span>
          <span className="text-black font-mono">{magnification.toFixed(2)}x</span>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
          <span className="text-gray-500 block mb-0.5">Status</span>
          <span className={imageHeight > 0 ? "text-green-600 font-bold" : "text-blue-600 font-bold"}>
            {imageHeight > 0 ? "REAL" : "VIRT"}
          </span>
        </div>
      </div>
    </div>
  );
}
