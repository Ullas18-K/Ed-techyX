import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { InputMethods } from '@/components/home/InputMethods';
import { SubjectGrid } from '@/components/home/SubjectGrid';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import { AIThinkingScreen } from '@/components/thinking/AIThinkingScreen';
import { LearningPlanScreen } from '@/components/plan/LearningPlanScreen';
import { SimulationScreen } from '@/components/simulation/SimulationScreen';
import { ExplanationScreen } from '@/components/explanation/ExplanationScreen';
import { QuizScreen } from '@/components/quiz/QuizScreen';
import { ReflectionScreen } from '@/components/reflection/ReflectionScreen';
import { MasterySummaryScreen } from '@/components/mastery/MasterySummaryScreen';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { useLearningStore } from '@/lib/learningStore';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';

// Smooth transition variants for seamless morphing
const pageVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

const Index = () => {
  const { currentPhase, setQuestion, startLearning, setPhase, resetSession, currentQuestion, totalPoints } = useLearningStore();
  const { isAuthenticated, addSimulationHistory, submitSessionResult } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Redirect to home if user logs out during a session
  useEffect(() => {
    if (!isAuthenticated && currentPhase !== 'home') {
      resetSession();
    }
  }, [isAuthenticated, currentPhase, resetSession]);

  const handleQuestionSubmit = useCallback((question: string) => {
    setQuestion(question);
    addSimulationHistory(question);
    startLearning();
    toast.success('Generating your learning experience...');
  }, [setQuestion, startLearning, addSimulationHistory]);

  const handleThinkingComplete = useCallback(() => { 
    setPhase('plan'); 
    toast.success('Learning plan ready!'); 
  }, [setPhase]);

  const handleStartSimulation = useCallback(() => { 
    setPhase('simulation'); 
    toast('Simulation started! Explore and experiment.', { icon: '🔬' }); 
  }, [setPhase]);

  const handleSimulationComplete = useCallback(async () => { 
    try {
      await submitSessionResult({ question: currentQuestion || 'Unknown', points: totalPoints, accuracy: 0, duration: 0 });
    } catch (e) {
      console.error('Failed to submit session result', e);
    }
    setPhase('explanation'); 
    toast.success('Great job! Let\'s understand the concepts.'); 
  }, [submitSessionResult, currentQuestion, totalPoints, setPhase]);

  const handleExplanationComplete = useCallback(() => { 
    setPhase('quiz'); 
    toast('Quiz time! Test your knowledge.', { icon: '📝' }); 
  }, [setPhase]);

  const handleQuizComplete = useCallback(() => { 
    setPhase('reflection'); 
    toast.success('Almost done! Time to reflect.'); 
  }, [setPhase]);

  const handleReflectionComplete = useCallback(() => { 
    setPhase('mastery'); 
    toast.success('🎉 Congratulations! You completed the journey!'); 
  }, [setPhase]);

  const handleNewQuestion = useCallback(() => { 
    resetSession(); 
  }, [resetSession]);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => toast.success('Welcome to AI Learning Forge!')} />;
  }

  return (
    <motion.div 
      className="min-h-screen w-full bg-background bg-gradient-mesh noise overflow-x-hidden flex flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      layout={false}
    >
      {/* Full-screen background orbs */}
      <motion.div 
        className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        layout={false}
        style={{ willChange: 'opacity', contain: 'layout style paint' }}
      >
        <motion.div 
          className="orb orb-primary w-[100vw] h-[100vh] fixed top-0 left-0"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0 }}
          style={{ willChange: 'transform, opacity' }}
        />
        <motion.div 
          className="orb orb-accent w-[90vw] h-[90vh] fixed top-0 right-0"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2, repeatDelay: 0 }}
          style={{ willChange: 'transform, opacity' }}
        />
        <motion.div 
          className="orb orb-warm w-[80vw] h-[80vh] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4, repeatDelay: 0 }}
          style={{ willChange: 'transform, opacity' }}
        />
      </motion.div>

      {currentPhase === 'home' && (
        <Navbar
          onProfileClick={(anchor) => {
            setProfileAnchor(anchor);
            setShowProfile(true);
          }}
        />
      )}
      
      {/* Profile Screen Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileScreen
            onClose={() => setShowProfile(false)}
            anchor={profileAnchor || undefined}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentPhase === 'home' && (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col justify-center w-full relative z-10"
            layout={false}
            style={{ willChange: 'opacity', contain: 'layout style' }}
          >
            {/* Main Content with Side Panels */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 py-4 mt-2 relative z-10 w-full" style={{ willChange: 'auto' }}>
              {/* Left Panel - History */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="w-full lg:w-80 flex-shrink-0 flex items-start"
                layout={false}
              >
                <div style={{ height: '650px' }} className="w-full">
                  <HistoryPanel />
                </div>
              </motion.div>

              {/* Center Content */}
              <motion.div 
                className="flex-1 flex flex-col justify-center items-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                layout={false}
              >
                <HeroSection />
                <InputMethods onSubmit={handleQuestionSubmit} />
                <SubjectGrid />
              </motion.div>

              {/* Right Panel - Leaderboard */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="w-full lg:w-80 flex-shrink-0 flex items-start"
                layout={false}
              >
                <div style={{ height: '650px' }} className="w-full">
                  <LeaderboardPanel />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {currentPhase === 'thinking' && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AIThinkingScreen onComplete={handleThinkingComplete} />
          </motion.div>
        )}

        {currentPhase === 'plan' && (
          <motion.div
            key="plan"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen flex items-center justify-center py-12 relative z-10"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <LearningPlanScreen onStart={handleStartSimulation} />
            </motion.div>
          </motion.div>
        )}

        {currentPhase === 'simulation' && (
          <motion.div
            key="simulation"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10"
          >
            <SimulationScreen onComplete={handleSimulationComplete} />
          </motion.div>
        )}

        {currentPhase === 'explanation' && (
          <motion.div
            key="explanation"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen flex items-center justify-center py-12 relative z-10"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <ExplanationScreen onComplete={handleExplanationComplete} />
            </motion.div>
          </motion.div>
        )}

        {currentPhase === 'quiz' && (
          <motion.div
            key="quiz"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen flex items-center justify-center py-12 relative z-10"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <QuizScreen onComplete={handleQuizComplete} />
            </motion.div>
          </motion.div>
        )}

        {currentPhase === 'reflection' && (
          <motion.div
            key="reflection"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen flex items-center justify-center py-12 relative z-10"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <ReflectionScreen onComplete={handleReflectionComplete} />
            </motion.div>
          </motion.div>
        )}

        {currentPhase === 'mastery' && (
          <motion.div
            key="mastery"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen flex items-center justify-center py-12 relative z-10"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <MasterySummaryScreen onRestart={handleStartSimulation} onNewQuestion={handleNewQuestion} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Index;
