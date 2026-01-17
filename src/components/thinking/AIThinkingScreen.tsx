import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, Target, Sparkles, Cog, FlaskConical, HelpCircle, CheckCircle2, Zap, Atom, Network } from 'lucide-react';
import { aiThinkingSteps } from '@/lib/mockData';
import { useLearningStore } from '@/lib/learningStore';
import { Button } from '@/components/ui/button';

interface AIThinkingScreenProps {
  onComplete: () => void;
}

export function AIThinkingScreen({ onComplete }: AIThinkingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loopCount, setLoopCount] = useState(0);
  const { currentScenario, currentQuestion, isAIScenarioReady } = useLearningStore();

  // Monitor scenario generation - only advance when AI scenario is truly ready
  useEffect(() => {
    if (isAIScenarioReady && currentScenario) {
      console.log('✅ AI Scenario fully generated and ready:', currentScenario.id);
      console.log('🎯 Advancing to plan phase...');
      // Give a brief moment to show completion, then advance
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAIScenarioReady, currentScenario, onComplete]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const processStep = (stepIndex: number) => {
      // If AI scenario is ready, stop looping
      if (isAIScenarioReady && currentScenario) {
        console.log('🛑 AI Scenario ready, stopping step loop');
        return;
      }

      // If we've completed all steps, loop back to beginning
      if (stepIndex >= aiThinkingSteps.length) {
        console.log(`🔄 Completed loop ${loopCount + 1}, AI scenario not ready yet. Looping...`);
        setLoopCount(prev => prev + 1);
        setCompletedSteps([]);
        // Restart from step 0 after brief pause
        timeoutId = setTimeout(() => processStep(0), 300);
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
  }, [loopCount, isAIScenarioReady, currentScenario]);

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
      className="fixed inset-0 bg-background bg-gradient-mesh noise z-50 overflow-hidden"
    >
      {/* Enhanced ambient orbs - full screen */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="orb orb-primary w-[80vw] h-[80vh] top-0 left-0"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="orb orb-accent w-[70vw] h-[70vh] bottom-0 right-0"
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        />
        <motion.div 
          className="orb orb-warm w-[60vw] h-[60vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main content - no container restrictions */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
        {/* Enhanced header with large AI brain */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-8"
        >
          {/* Compact pulsing AI brain icon */}
          <motion.div className="relative w-20 h-20 mx-auto mb-4">
            {/* Outer glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/10 blur-lg"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-1 rounded-full bg-primary/20 blur-md"
              animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            
            {/* Main brain container */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-xl shadow-primary/40 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-10 h-10 text-primary-foreground" />
            </motion.div>

            {/* Orbiting icons */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-primary" />
              <Atom className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-primary" />
              <Network className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
              <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
            </motion.div>
          </motion.div>

          {/* Professional title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent mb-2"
          >
            AI Learning Engine
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground mb-4"
          >
            Crafting your personalized learning experience
          </motion.p>

          {/* Question card - compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-xl px-5 py-3 max-w-2xl mx-auto border border-primary/20 shadow-lg"
          >
            <p className="text-xs text-primary font-semibold mb-1.5 uppercase tracking-wide">Analyzing Your Question</p>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              "{currentQuestion}"
            </p>
          </motion.div>
        </motion.div>

        {/* Enhanced steps grid - compact */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {aiThinkingSteps.map((step, index) => {
              const Icon = getStepIcon(step.id);
              const isActive = currentStep === index;
              const isComplete = completedSteps.includes(index);
              const detail = getStepDetail(step.id);

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: isActive || isComplete ? 1 : 0.5,
                    y: 0,
                    scale: isActive ? 1.03 : 1
                  }}
                  transition={{ delay: index * 0.1, duration: 0.4, type: "spring" }}
                  className={`
                    relative overflow-hidden rounded-xl p-4 transition-all duration-500
                    ${isActive ? 'glass-strong border-2 border-primary shadow-xl shadow-primary/20' : 
                      isComplete ? 'glass-card border border-success/40 shadow-md' : 
                      'glass-subtle border border-border/30'}
                  `}
                >
                  {/* Background gradient for active state */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  <div className="relative flex items-start gap-3">
                    {/* Enhanced icon */}
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0 shadow-md
                      ${isComplete ? 'bg-gradient-to-br from-success to-success/80 text-success-foreground scale-105' : 
                        isActive ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/40' : 
                        'bg-muted/70 text-muted-foreground'}
                    `}>
                      {isComplete ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm font-semibold mb-0.5 ${isComplete || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.text}
                      </p>
                      {isComplete && detail && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-primary font-medium"
                        >
                          ✓ {detail}
                        </motion.p>
                      )}
                      {isActive && !isComplete && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-muted-foreground mt-0.5"
                        >
                          Processing...
                        </motion.p>
                      )}
                    </div>

                    {/* Active spinner */}
                    {isActive && (
                      <motion.div
                        className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full flex-shrink-0 mt-1"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Enhanced progress bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-xl p-4 max-w-xl mx-auto border border-primary/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Overall Progress</span>
              <span className="text-xs font-bold text-primary">
                {isAIScenarioReady
                  ? '100%'
                  : completedSteps.length === aiThinkingSteps.length
                  ? '95%'
                  : Math.round(((completedSteps.length + 1) / aiThinkingSteps.length) * 100) + '%'}
              </span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full shadow-md shadow-primary/40"
                initial={{ width: "0%" }}
                animate={{ 
                  width: isAIScenarioReady
                    ? '100%'
                    : completedSteps.length === aiThinkingSteps.length
                    ? '95%'
                    : `${((completedSteps.length + 1) / aiThinkingSteps.length) * 100}%`
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {isAIScenarioReady ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-success font-semibold"
                >
                  ✅ Scenario generated successfully!
                </motion.span>
              ) : completedSteps.length === aiThinkingSteps.length ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-primary font-semibold"
                >
                  🎨 Generating your personalized scenario...{loopCount > 0 && ` (${loopCount + 1})`}
                </motion.span>
              ) : (
                <>{completedSteps.length} of {aiThinkingSteps.length} steps completed</>
              )}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}