import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ruler, 
  Timer, 
  Calculator, 
  Compass, 
  Search,
  Thermometer,
  Scale,
  Zap,
  X,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const tools: Tool[] = [
  { id: 'ruler', name: 'Ruler', icon: <Ruler className="w-5 h-5" />, description: 'Measure distances in the simulation' },
  { id: 'timer', name: 'Stopwatch', icon: <Timer className="w-5 h-5" />, description: 'Time your experiments' },
  { id: 'calculator', name: 'Calculator', icon: <Calculator className="w-5 h-5" />, description: 'Quick calculations' },
  { id: 'protractor', name: 'Protractor', icon: <Compass className="w-5 h-5" />, description: 'Measure angles' },
  { id: 'magnifier', name: 'Magnifier', icon: <Search className="w-5 h-5" />, description: 'Zoom in on details' },
  { id: 'thermometer', name: 'Thermometer', icon: <Thermometer className="w-5 h-5" />, description: 'Check temperature' },
  { id: 'scale', name: 'Scale', icon: <Scale className="w-5 h-5" />, description: 'Measure weight' },
  { id: 'multimeter', name: 'Multimeter', icon: <Zap className="w-5 h-5" />, description: 'Measure electrical values' },
];

interface SimulationToolsProps {
  onToolSelect?: (toolId: string | null) => void;
  activeTool: string | null;
}

export function SimulationTools({ onToolSelect, activeTool }: SimulationToolsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      {/* Main tools bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-1 p-2 bg-card/95 backdrop-blur-xl rounded-2xl shadow-medium border border-border/50"
      >
        {tools.slice(0, 4).map((tool) => (
          <motion.button
            key={tool.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToolSelect?.(activeTool === tool.id ? null : tool.id)}
            className={cn(
              "p-3 rounded-xl transition-all duration-200 relative group",
              activeTool === tool.id 
                ? "bg-primary text-primary-foreground shadow-glow" 
                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {tool.icon}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {tool.name}
            </div>
          </motion.button>
        ))}
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "p-3 rounded-xl transition-all duration-200",
            isExpanded 
              ? "bg-secondary text-foreground" 
              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-xs font-medium">More</span>
        </motion.button>
      </motion.div>

      {/* Expanded tools panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 p-3 bg-card/95 backdrop-blur-xl rounded-2xl shadow-medium border border-border/50 min-w-[280px]"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground text-sm">Lab Tools</h4>
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {tools.map((tool) => (
                <motion.button
                  key={tool.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    onToolSelect?.(activeTool === tool.id ? null : tool.id);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                    activeTool === tool.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tool.icon}
                  <span className="text-[10px] font-medium">{tool.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Ruler overlay component
export function RulerOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none"
    >
      {/* Horizontal ruler */}
      <div className="absolute top-4 left-4 right-4 h-6 bg-card/90 backdrop-blur rounded-lg border border-border flex items-end">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 relative">
            <div className={cn(
              "absolute bottom-0 left-0 w-px bg-foreground/50",
              i % 5 === 0 ? "h-4" : "h-2"
            )} />
            {i % 5 === 0 && (
              <span className="absolute -bottom-4 left-0 text-[8px] text-muted-foreground">
                {i * 10}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Vertical ruler */}
      <div className="absolute top-4 left-4 bottom-4 w-6 bg-card/90 backdrop-blur rounded-lg border border-border flex flex-col items-end">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="flex-1 relative w-full">
            <div className={cn(
              "absolute right-0 top-0 h-px bg-foreground/50",
              i % 5 === 0 ? "w-4" : "w-2"
            )} />
            {i % 5 === 0 && (
              <span className="absolute -right-4 top-0 text-[8px] text-muted-foreground rotate-90 origin-left">
                {i * 10}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Stopwatch component
export function StopwatchWidget() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useState(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((t) => t + 100);
      }, 100);
    }
    return () => clearInterval(interval);
  });

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      drag
      dragMomentum={false}
      className="absolute top-20 right-4 bg-card/95 backdrop-blur-xl rounded-2xl shadow-medium border border-border p-4 cursor-move"
    >
      <div className="text-center">
        <p className="text-3xl font-mono font-bold text-foreground mb-3">
          {formatTime(time)}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isRunning ? "destructive" : "hero"}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? 'Stop' : 'Start'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setTime(0); setIsRunning(false); }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Calculator widget
export function CalculatorWidget() {
  const [display, setDisplay] = useState('0');
  const [operation, setOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setOperation(null);
    setPreviousValue(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue;
      let newValue = 0;

      switch (operation) {
        case '+': newValue = currentValue + inputValue; break;
        case '-': newValue = currentValue - inputValue; break;
        case '×': newValue = currentValue * inputValue; break;
        case '÷': newValue = currentValue / inputValue; break;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (operation && previousValue !== null) {
      performOperation(operation);
      setOperation(null);
      setPreviousValue(null);
    }
  };

  const buttons = [
    'C', '±', '%', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', '='
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      drag
      dragMomentum={false}
      className="absolute top-20 right-4 bg-card/95 backdrop-blur-xl rounded-2xl shadow-medium border border-border p-3 cursor-move w-56"
    >
      <div className="bg-muted rounded-xl p-3 mb-3">
        <p className="text-right text-2xl font-mono font-bold text-foreground truncate">
          {display}
        </p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === 'C') clear();
              else if (btn === '=') calculate();
              else if (btn === '.') inputDecimal();
              else if (['+', '-', '×', '÷'].includes(btn)) performOperation(btn);
              else if (btn === '±') setDisplay(String(-parseFloat(display)));
              else if (btn === '%') setDisplay(String(parseFloat(display) / 100));
              else inputDigit(btn);
            }}
            className={cn(
              "p-3 rounded-xl text-sm font-semibold transition-all",
              btn === '0' && "col-span-2",
              ['÷', '×', '-', '+', '='].includes(btn) 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : ['C', '±', '%'].includes(btn)
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-muted hover:bg-muted/80 text-foreground"
            )}
          >
            {btn}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Magnifier overlay
export function MagnifierOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none"
    >
      <div className="absolute inset-0 bg-foreground/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-primary/50 bg-transparent" 
        style={{ 
          transform: 'translate(-50%, -50%) scale(1.5)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.2)'
        }}
      />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-foreground bg-card/90 px-4 py-2 rounded-full">
        2x Magnification Active
      </p>
    </motion.div>
  );
}
