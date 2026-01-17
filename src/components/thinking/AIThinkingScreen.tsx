import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, Target, Sparkles, Cog, FlaskConical, HelpCircle, CheckCircle2 } from 'lucide-react';
import { aiThinkingSteps } from '@/lib/mockData';
import { useLearningStore } from '@/lib/learningStore';

interface AIThinkingScreenProps {
  onComplete: () => void;
}

export function AIThinkingScreen({ onComplete }: AIThinkingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { currentScenario, currentQuestion } = useLearningStore();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const processStep = (stepIndex: number) => {
      if (stepIndex >= aiThinkingSteps.length) {
        timeoutId = setTimeout(onComplete, 800);
        return;
      }

      setCurrentStep(stepIndex);

      timeoutId = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, stepIndex]);
        processStep(stepIndex + 1);
      }, aiThinkingSteps[stepIndex].duration);
    };

    processStep(0);

    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  const getStepIcon = (stepId: number) => {
    const icons = [Brain, BookOpen, Target, Sparkles, Cog, FlaskConical, HelpCircle, CheckCircle2];
    const Icon = icons[stepId - 1] || Brain;
    return Icon;
  };

  const getStepDetail = (stepId: number) => {
    if (!currentScenario) return '';
    
    switch (stepId) {
      case 2:
        return currentScenario.subject;
      case 3:
        return currentScenario.level;
      case 4:
        return currentScenario.topic;
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background bg-gradient-mesh noise z-50 flex items-center justify-center p-4"
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="orb orb-primary w-[600px] h-[600px] top-1/4 left-1/4"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="orb orb-accent w-[500px] h-[500px] bottom-1/4 right-1/4"
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Central AI orb with glass effect */}
        <motion.div
          className="relative w-36 h-36 mx-auto mb-12"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Outer glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-ai opacity-30"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-ai opacity-40"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          
          {/* Core orb with glass */}
          <div className="absolute inset-4 rounded-full bg-gradient-hero shadow-glow flex items-center justify-center">
            <Brain className="w-14 h-14 text-primary-foreground" />
          </div>
        </motion.div>

        {/* Question being analyzed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-sm text-muted-foreground mb-2">Analyzing your question</p>
          <div className="glass-card rounded-2xl px-6 py-4 inline-block max-w-lg">
            <p className="text-lg font-medium text-foreground line-clamp-2">
              "{currentQuestion}"
            </p>
          </div>
        </motion.div>

        {/* Steps visualization with glass cards */}
        <div className="space-y-3">
          {aiThinkingSteps.map((step, index) => {
            const Icon = getStepIcon(step.id);
            const isActive = currentStep === index;
            const isComplete = completedSteps.includes(index);
            const detail = getStepDetail(step.id);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: isActive || isComplete ? 1 : 0.5,
                  x: 0 
                }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center gap-4 p-4 rounded-2xl transition-all duration-300
                  ${isActive ? 'glass-card border-primary/30 shadow-glow' : 
                    isComplete ? 'glass-card border-success/30' : 
                    'glass-subtle'}
                `}
              >
                {/* Icon */}
                <div className={`
                  w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-soft
                  ${isComplete ? 'bg-success text-success-foreground' : 
                    isActive ? 'bg-primary text-primary-foreground' : 
                    'bg-muted text-muted-foreground'}
                `}>
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className={`font-medium ${isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.text}
                  </p>
                  {isComplete && detail && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-sm text-primary font-semibold mt-1"
                    >
                      → {detail}
                    </motion.p>
                  )}
                </div>

                {/* Loading indicator */}
                {isActive && (
                  <motion.div
                    className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}