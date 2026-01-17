import { useState, useEffect } from 'react';
import { LineChart, Download, Trash2, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  { id: 'objectDistance', label: 'Object Dist (u)', unit: 'cm', color: '#22c55e' },
  { id: 'imageDistance', label: 'Image Dist (v)', unit: 'cm', color: '#3b82f6' },
  { id: 'magnification', label: 'Magnification (m)', unit: '', color: '#f59e0b' },
  { id: 'objectHeight', label: 'Object Height', unit: 'cm', color: '#a855f7' },
  { id: 'imageHeight', label: 'Image Height', unit: 'cm', color: '#ec4899' },
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
          objectDistance: objectDistance / 10, // Convert px to cm (assuming 10px = 1cm)
          objectHeight: objectHeight / 10,
          imageDistance: Math.abs(imageDistance) / 10,
          imageHeight: Math.abs(imageHeight) / 10,
          magnification,
        },
      };
      setDataPoints((prev) => [...prev, newPoint].slice(-20));
    }
  }, [objectDistance, objectHeight, imageDistance, imageHeight, magnification, isRecording]);

  const clearData = () => {
    setDataPoints([]);
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', ...metrics.map((m) => `${m.label} (${m.unit})`), 'Focal Length (cm)'].join(','),
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
    a.download = 'optics-experiment-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Graph dimensions
  const graphWidth = 300;
  const graphHeight = 120;
  const padding = 20;

  const selectedData = dataPoints.map((p) => p.values[selectedMetric] || 0);
  const maxValue = Math.max(...selectedData, 1);
  const minValue = Math.min(...selectedData, 0);
  const range = maxValue - minValue || 1;

  // Create SVG path
  const pathData = selectedData
    .map((value, index) => {
      const x = padding + (index / (selectedData.length - 1 || 1)) * (graphWidth - 2 * padding);
      const y = graphHeight - padding - ((value - minValue) / range) * (graphHeight - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const selectedMetricData = metrics.find((m) => m.id === selectedMetric);
  const currentColor = selectedMetricData?.color || '#3b82f6';

  return (
    <Card className="bg-slate-900/80 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <LineChart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-slate-100 text-sm">Data Logger</CardTitle>
              <p className="text-xs text-slate-400">{dataPoints.length} data points</p>
            </div>
          </div>

          <Button
            size="sm"
            variant={isRecording ? 'destructive' : 'outline'}
            onClick={() => setIsRecording(!isRecording)}
            className="gap-1.5"
          >
            {isRecording ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isRecording ? 'Stop' : 'Record'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric selector */}
        <div className="flex gap-2 flex-wrap">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                selectedMetric === metric.id
                  ? 'text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
              style={{
                backgroundColor: selectedMetric === metric.id ? metric.color : undefined,
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>

        {/* Graph */}
        <div className="bg-slate-800/50 rounded-xl p-3">
          {dataPoints.length > 1 ? (
            <svg width="100%" viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                  key={ratio}
                  x1={padding}
                  y1={padding + ratio * (graphHeight - 2 * padding)}
                  x2={graphWidth - padding}
                  y2={padding + ratio * (graphHeight - 2 * padding)}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray="4"
                  className="text-slate-600"
                />
              ))}

              {/* Data line */}
              <path
                d={pathData}
                fill="none"
                stroke={currentColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {selectedData.map((value, index) => {
                const x = padding + (index / (selectedData.length - 1 || 1)) * (graphWidth - 2 * padding);
                const y =
                  graphHeight - padding - ((value - minValue) / range) * (graphHeight - 2 * padding);
                return <circle key={index} cx={x} cy={y} r={3} fill={currentColor} />;
              })}

              {/* Latest value label */}
              {selectedData.length > 0 && (
                <text
                  x={graphWidth - padding}
                  y={
                    graphHeight -
                    padding -
                    ((selectedData[selectedData.length - 1] - minValue) / range) *
                      (graphHeight - 2 * padding) -
                    10
                  }
                  textAnchor="end"
                  fill={currentColor}
                  fontSize={12}
                  fontWeight={600}
                >
                  {selectedData[selectedData.length - 1].toFixed(1)}
                  {selectedMetricData?.unit}
                </text>
              )}
            </svg>
          ) : (
            <div className="h-24 flex items-center justify-center text-slate-400 text-sm">
              {isRecording ? 'Waiting for data...' : 'Start recording to see data'}
            </div>
          )}
        </div>

        {/* Stats */}
        {dataPoints.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Min</p>
              <p className="text-sm font-semibold text-slate-100">
                {Math.min(...selectedData).toFixed(1)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Avg</p>
              <p className="text-sm font-semibold text-slate-100">
                {(selectedData.reduce((a, b) => a + b, 0) / selectedData.length).toFixed(1)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-400">Max</p>
              <p className="text-sm font-semibold text-slate-100">
                {Math.max(...selectedData).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Current Measurements */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-300 mb-2">Current Values:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Focal Length:</span>
              <span className="text-slate-100 font-mono">{(focalLength / 10).toFixed(1)} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Magnification:</span>
              <span className="text-slate-100 font-mono">{magnification.toFixed(2)}×</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Object Dist (u):</span>
              <span className="text-slate-100 font-mono">{(objectDistance / 10).toFixed(1)} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Image Dist (v):</span>
              <span className="text-slate-100 font-mono">{Math.abs(imageDistance / 10).toFixed(1)} cm</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={clearData}
            disabled={dataPoints.length === 0}
            className="flex-1 gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportData}
            disabled={dataPoints.length === 0}
            className="flex-1 gap-1.5"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
