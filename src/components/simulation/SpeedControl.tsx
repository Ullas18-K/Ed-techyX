import { motion } from 'framer-motion';
import { 
  FastForward, 
  Rewind, 
  Play, 
  Pause, 
  RotateCcw,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
}

const speeds = [0.25, 0.5, 1, 1.5, 2];

export function SpeedControl({ speed, onSpeedChange, isPlaying, onPlayPause, onReset }: SpeedControlProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-2 bg-card/95 backdrop-blur-xl rounded-2xl shadow-medium border border-border/50"
    >
      {/* Reset */}
      <button
        onClick={onReset}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Slow down */}
      <button
        onClick={() => {
          const currentIndex = speeds.indexOf(speed);
          if (currentIndex > 0) onSpeedChange(speeds[currentIndex - 1]);
        }}
        disabled={speed === speeds[0]}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
      >
        <Rewind className="w-4 h-4" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className={cn(
          "p-3 rounded-xl transition-all",
          isPlaying 
            ? "bg-primary text-primary-foreground" 
            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        )}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>

      {/* Speed up */}
      <button
        onClick={() => {
          const currentIndex = speeds.indexOf(speed);
          if (currentIndex < speeds.length - 1) onSpeedChange(speeds[currentIndex + 1]);
        }}
        disabled={speed === speeds[speeds.length - 1]}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
      >
        <FastForward className="w-4 h-4" />
      </button>

      {/* Speed indicator */}
      <div className="px-3 py-1.5 bg-secondary rounded-lg min-w-[4rem] text-center">
        <span className="text-sm font-medium text-foreground">{speed}x</span>
      </div>
    </motion.div>
  );
}
