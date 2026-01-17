import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HeroSection } from '@/components/home/HeroSection';
import { InputMethods } from '@/components/home/InputMethods';
import { SubjectGrid } from '@/components/home/SubjectGrid';
import { AIThinkingScreen } from '@/components/thinking/AIThinkingScreen';
import { LearningPlanScreen } from '@/components/plan/LearningPlanScreen';
import { SimulationScreen } from '@/components/simulation/SimulationScreen';
import { ExplanationScreen } from '@/components/explanation/ExplanationScreen';
import { QuizScreen } from '@/components/quiz/QuizScreen';
import { ReflectionScreen } from '@/components/reflection/ReflectionScreen';
import { MasterySummaryScreen } from '@/components/mastery/MasterySummaryScreen';
import { useLearningStore } from '@/lib/learningStore';
import { toast } from 'sonner';

const Index = () => {
  const { currentPhase, setQuestion, startLearning, setPhase, resetSession } = useLearningStore();

  const handleQuestionSubmit = useCallback((question: string) => {
    setQuestion(question);
    startLearning();
    toast.success('Generating your learning experience...');
  }, [setQuestion, startLearning]);

  const handleThinkingComplete = useCallback(() => { setPhase('plan'); toast.success('Learning plan ready!'); }, [setPhase]);
  const handleStartSimulation = useCallback(() => { setPhase('simulation'); toast('Simulation started! Explore and experiment.', { icon: '🔬' }); }, [setPhase]);
  const handleSimulationComplete = useCallback(() => { setPhase('explanation'); toast.success('Great job! Let\'s understand the concepts.'); }, [setPhase]);
  const handleExplanationComplete = useCallback(() => { setPhase('quiz'); toast('Quiz time! Test your knowledge.', { icon: '📝' }); }, [setPhase]);
  const handleQuizComplete = useCallback(() => { setPhase('reflection'); toast.success('Almost done! Time to reflect.'); }, [setPhase]);
  const handleReflectionComplete = useCallback(() => { setPhase('mastery'); toast.success('🎉 Congratulations! You completed the journey!'); }, [setPhase]);
  const handleNewQuestion = useCallback(() => { resetSession(); }, [resetSession]);

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh noise">
      <AnimatePresence mode="wait">
        {currentPhase === 'home' && (
          <div className="min-h-screen flex flex-col justify-center px-4 py-12 relative">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/4 w-[600px] h-[600px] orb orb-primary" />
              <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] orb orb-accent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] orb orb-warm" />
            </div>
            <div className="relative z-10">
              <HeroSection />
              <InputMethods onSubmit={handleQuestionSubmit} />
              <SubjectGrid />
            </div>
          </div>
        )}
        {currentPhase === 'thinking' && <AIThinkingScreen onComplete={handleThinkingComplete} />}
        {currentPhase === 'plan' && <div className="min-h-screen flex items-center py-12 bg-gradient-mesh noise"><LearningPlanScreen onStart={handleStartSimulation} /></div>}
        {currentPhase === 'simulation' && <SimulationScreen onComplete={handleSimulationComplete} />}
        {currentPhase === 'explanation' && <div className="min-h-screen flex items-center py-12 bg-gradient-mesh noise"><ExplanationScreen onComplete={handleExplanationComplete} /></div>}
        {currentPhase === 'quiz' && <div className="min-h-screen flex items-center py-12 bg-gradient-mesh noise"><QuizScreen onComplete={handleQuizComplete} /></div>}
        {currentPhase === 'reflection' && <div className="min-h-screen flex items-center py-12 bg-gradient-mesh noise"><ReflectionScreen onComplete={handleReflectionComplete} /></div>}
        {currentPhase === 'mastery' && <div className="min-h-screen flex items-center py-12 bg-gradient-mesh noise"><MasterySummaryScreen onRestart={handleStartSimulation} onNewQuestion={handleNewQuestion} /></div>}
      </AnimatePresence>
    </div>
  );
};

export default Index;