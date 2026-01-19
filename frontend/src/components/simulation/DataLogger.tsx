import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  TrendingUp, 
  Download, 
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataPoint {
  timestamp: number;
  values: Record<string, number>;
}

interface DataLoggerProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  simulationResults: Record<string, number>;
  outputs: Array<{ id: string; label: string; unit: string; color: string }>;
}

const colorMap: Record<string, string> = {
  success: '#22c55e',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444'
};

export function DataLogger({ isRecording, onToggleRecording, simulationResults, outputs }: DataLoggerProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>(outputs[0]?.id || '');

  useEffect(() => {
    if (isRecording && Object.keys(simulationResults).length > 0) {
      setDataPoints(prev => {
        const newPoint: DataPoint = {
          timestamp: Date.now(),
          values: { ...simulationResults }
        };
        // Keep last 20 points
        const updated = [...prev, newPoint].slice(-20);
        return updated;
      });
    }
  }, [simulationResults, isRecording]);

  const clearData = () => {
    setDataPoints([]);
  };

  const exportData = () => {
    const csvContent = [
      ['Timestamp', ...outputs.map(o => o.label)].join(','),
      ...dataPoints.map(point => [
        new Date(point.timestamp).toISOString(),
        ...outputs.map(o => point.values[o.id] || 0)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate graph dimensions
  const graphWidth = 300;
  const graphHeight = 120;
  const padding = 20;

  const selectedData = dataPoints.map(p => p.values[selectedMetric] || 0);
  const maxValue = Math.max(...selectedData, 1);
  const minValue = Math.min(...selectedData, 0);
  const range = maxValue - minValue || 1;

  // Create SVG path
  const pathData = selectedData.map((value, index) => {
    const x = padding + (index / (selectedData.length - 1 || 1)) * (graphWidth - 2 * padding);
    const y = graphHeight - padding - ((value - minValue) / range) * (graphHeight - 2 * padding);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const selectedOutput = outputs.find(o => o.id === selectedMetric);
  const currentColor = selectedOutput ? colorMap[selectedOutput.color] || '#3b82f6' : '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 shadow-soft border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-info/10">
            <LineChart className="w-5 h-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Data Logger</h3>
            <p className="text-xs text-muted-foreground">
              {dataPoints.length} data points
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isRecording ? "destructive" : "outline"}
            onClick={onToggleRecording}
            className="gap-1.5"
          >
            {isRecording ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isRecording ? 'Stop' : 'Record'}
          </Button>
        </div>
      </div>

      {/* Metric selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {outputs.map((output) => (
          <button
            key={output.id}
            onClick={() => setSelectedMetric(output.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              selectedMetric === output.id
                ? "text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
            style={{
              backgroundColor: selectedMetric === output.id ? colorMap[output.color] : undefined
            }}
          >
            {output.label}
          </button>
        ))}
      </div>

      {/* Graph */}
      <div className="bg-muted rounded-xl p-3 mb-4">
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
              const y = graphHeight - padding - ((value - minValue) / range) * (graphHeight - 2 * padding);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={3}
                  fill={currentColor}
                />
              );
            })}

            {/* Latest value label */}
            {selectedData.length > 0 && (
              <text
                x={graphWidth - padding}
                y={graphHeight - padding - ((selectedData[selectedData.length - 1] - minValue) / range) * (graphHeight - 2 * padding) - 10}
                textAnchor="end"
                fill={currentColor}
                fontSize={12}
                fontWeight={600}
              >
                {selectedData[selectedData.length - 1].toFixed(1)}
              </text>
            )}
          </svg>
        ) : (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            {isRecording ? 'Waiting for data...' : 'Start recording to see data'}
          </div>
        )}
      </div>

      {/* Stats */}
      {dataPoints.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Min</p>
            <p className="text-sm font-semibold text-foreground">
              {Math.min(...selectedData).toFixed(1)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Avg</p>
            <p className="text-sm font-semibold text-foreground">
              {(selectedData.reduce((a, b) => a + b, 0) / selectedData.length).toFixed(1)}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Max</p>
            <p className="text-sm font-semibold text-foreground">
              {Math.max(...selectedData).toFixed(1)}
            </p>
          </div>
        </div>
      )}

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
    </motion.div>
  );
}
