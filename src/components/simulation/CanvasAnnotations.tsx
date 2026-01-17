import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil, 
  Type, 
  Circle, 
  Square, 
  ArrowUpRight,
  Eraser,
  Trash2,
  Undo,
  Download,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Annotation {
  id: string;
  type: 'draw' | 'text' | 'circle' | 'rectangle' | 'arrow';
  points?: { x: number; y: number }[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
}

interface CanvasAnnotationsProps {
  isActive: boolean;
  onToggle: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const colors = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#000000', // black
  '#ffffff', // white
];

const tools = [
  { id: 'draw', icon: <Pencil className="w-4 h-4" />, label: 'Draw' },
  { id: 'text', icon: <Type className="w-4 h-4" />, label: 'Text' },
  { id: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
  { id: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle' },
  { id: 'arrow', icon: <ArrowUpRight className="w-4 h-4" />, label: 'Arrow' },
  { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser' },
];

export function CanvasAnnotations({ isActive, onToggle, canvasRef }: CanvasAnnotationsProps) {
  const [activeTool, setActiveTool] = useState<string>('draw');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // Draw annotations on overlay canvas
  useEffect(() => {
    if (!overlayRef.current || !isActive) return;
    
    const canvas = overlayRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (annotation.type) {
        case 'draw':
          if (annotation.points && annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case 'circle':
          if (annotation.x !== undefined && annotation.y !== undefined && annotation.width) {
            ctx.beginPath();
            ctx.arc(annotation.x, annotation.y, annotation.width / 2, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case 'rectangle':
          if (annotation.x !== undefined && annotation.y !== undefined && annotation.width && annotation.height) {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
          }
          break;
        case 'arrow':
          if (annotation.points && annotation.points.length === 2) {
            const [start, end] = annotation.points;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            
            // Arrowhead
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle - Math.PI / 6),
              end.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(
              end.x - headLength * Math.cos(angle + Math.PI / 6),
              end.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;
        case 'text':
          if (annotation.text && annotation.x !== undefined && annotation.y !== undefined) {
            ctx.font = '16px sans-serif';
            ctx.fillText(annotation.text, annotation.x, annotation.y);
          }
          break;
      }
    });

    // Draw current drawing
    if (isDrawing && currentPoints.length > 1 && activeTool === 'draw') {
      ctx.strokeStyle = activeColor;
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [annotations, isActive, currentPoints, isDrawing, activeTool, activeColor]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    
    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentPoints([coords]);

    if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setAnnotations([...annotations, {
          id: Date.now().toString(),
          type: 'text',
          text,
          x: coords.x,
          y: coords.y,
          color: activeColor
        }]);
      }
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isActive || activeTool === 'text') return;
    
    const coords = getCanvasCoordinates(e);
    
    if (activeTool === 'draw') {
      setCurrentPoints([...currentPoints, coords]);
    } else if (activeTool === 'eraser') {
      // Remove annotations near cursor
      setAnnotations(annotations.filter(ann => {
        if (ann.type === 'draw' && ann.points) {
          return !ann.points.some(p => 
            Math.abs(p.x - coords.x) < 20 && Math.abs(p.y - coords.y) < 20
          );
        }
        return true;
      }));
    } else {
      setCurrentPoints([currentPoints[0], coords]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    if (activeTool === 'draw') {
      setAnnotations([...annotations, {
        id: Date.now().toString(),
        type: 'draw',
        points: currentPoints,
        color: activeColor
      }]);
    } else if (activeTool === 'circle' && currentPoints.length === 2) {
      const [start, end] = currentPoints;
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      setAnnotations([...annotations, {
        id: Date.now().toString(),
        type: 'circle',
        x: start.x,
        y: start.y,
        width: radius * 2,
        height: radius * 2,
        color: activeColor
      }]);
    } else if (activeTool === 'rectangle' && currentPoints.length === 2) {
      const [start, end] = currentPoints;
      setAnnotations([...annotations, {
        id: Date.now().toString(),
        type: 'rectangle',
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
        color: activeColor
      }]);
    } else if (activeTool === 'arrow' && currentPoints.length === 2) {
      setAnnotations([...annotations, {
        id: Date.now().toString(),
        type: 'arrow',
        points: currentPoints,
        color: activeColor
      }]);
    }

    setIsDrawing(false);
    setCurrentPoints([]);
  };

  const clearAll = () => {
    setAnnotations([]);
  };

  const undo = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  if (!isActive) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="absolute top-4 left-4 p-3 bg-card/95 backdrop-blur-xl rounded-xl shadow-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <Pencil className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <>
      {/* Annotation overlay canvas */}
      <canvas
        ref={overlayRef}
        width={600}
        height={400}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Tools panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 left-4 bg-card/95 backdrop-blur-xl rounded-2xl shadow-medium border border-border p-2"
      >
        <div className="flex flex-col gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "p-3 rounded-xl transition-all relative group",
                activeTool === tool.id 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tool.icon}
              <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {tool.label}
              </div>
            </button>
          ))}
          
          <div className="w-full h-px bg-border my-1" />
          
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-3 rounded-xl hover:bg-secondary transition-all"
            >
              <div 
                className="w-4 h-4 rounded-full border-2 border-foreground/20"
                style={{ backgroundColor: activeColor }}
              />
            </button>
            
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute left-full ml-2 p-2 bg-card rounded-xl shadow-medium border border-border grid grid-cols-4 gap-1"
                >
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => { setActiveColor(color); setShowColorPicker(false); }}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                        activeColor === color ? "border-foreground" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="w-full h-px bg-border my-1" />
          
          <button
            onClick={undo}
            disabled={annotations.length === 0}
            className="p-3 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
          >
            <Undo className="w-4 h-4" />
          </button>
          
          <button
            onClick={clearAll}
            disabled={annotations.length === 0}
            className="p-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={onToggle}
            className="p-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
          >
            Done
          </button>
        </div>
      </motion.div>
    </>
  );
}
