import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningStep {
  id: string;
  title: string;
  completed: boolean;
}

interface LearningProgressBarProps {
  steps: LearningStep[];
  currentIndex: number;
}

export function LearningProgressBar({ steps, currentIndex }: LearningProgressBarProps) {
  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
          />
        </div>
        
        {/* Step indicators */}
        <div className="absolute top-0 left-0 right-0 flex justify-between -translate-y-1/2">
          {steps.map((step, i) => {
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            
            return (
              <motion.div
                key={step.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    step.completed && "bg-success border-2 border-success",
                    isCurrent && !step.completed && "bg-primary border-2 border-primary ring-4 ring-primary/20",
                    !step.completed && !isCurrent && "bg-secondary border-2 border-border"
                  )}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                
                {/* Step label */}
                <div
                  className={cn(
                    "absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium",
                    step.completed && "text-success",
                    isCurrent && "text-primary",
                    !step.completed && !isCurrent && "text-muted-foreground"
                  )}
                >
                  Step {i + 1}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Current step info */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-8"
      >
        {currentIndex < steps.length && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-primary">
              {steps[currentIndex]?.title}
            </span>
          </div>
        )}
        
        {currentIndex >= steps.length && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">
              All steps completed! 🎉
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
