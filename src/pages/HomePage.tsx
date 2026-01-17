import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/home/HeroSection';
import { InputMethods } from '@/components/home/InputMethods';
import { AIThinkingScreen } from '@/components/thinking/AIThinkingScreen';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { useLearningStore } from '@/lib/learningStore';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

const HomePage = () => {
  const navigate = useNavigate();
  const { setQuestion, setAIScenario, resetSession, currentPhase } = useLearningStore();
  const { addSimulationHistory, token } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Reset to home when component mounts
  useEffect(() => {
    if (currentPhase !== 'home') {
      resetSession();
    }
  }, []);

  const handleQuestionSubmit = useCallback(async (question: string) => {
    try {
      // Show thinking screen
      setQuestion(question);
      addSimulationHistory(question);
      setIsThinking(true);
      
      // Try AI-powered scenario generation
      try {
        await setAIScenario(question, token || '');
        console.log('✅ AI scenario generated successfully');
      } catch (error) {
        console.log('⚠️ AI generation failed, using legacy mode:', error);
        toast.info('Using standard learning mode', {
          description: 'AI service unavailable - using pre-built content',
          duration: 3000
        });
      }
      
    } catch (error) {
      console.error('❌ Question submission failed:', error);
      toast.error('Failed to start learning session');
      setIsThinking(false);
    }
  }, [setQuestion, setAIScenario, addSimulationHistory, token]);

  const handleThinkingComplete = useCallback(() => { 
    setIsThinking(false);
    navigate('/plan');
    toast.success('Learning plan ready!'); 
  }, [navigate]);

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

      {/* Navbar - Only show when not thinking */}
      {!isThinking && (
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
        {!isThinking ? (
          <motion.div
            key="home"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col justify-center w-full relative z-10 h-screen overflow-hidden"
            layout={false}
            style={{ willChange: 'opacity', contain: 'layout style' }}
          >
            <div className="flex-1 flex flex-col justify-center items-center px-4 relative z-10 w-full overflow-y-auto" style={{ willChange: 'auto', maxHeight: 'calc(100vh - 80px)', paddingTop: '20px' }}>
              <motion.div 
                className="flex-1 flex flex-col justify-center items-center max-w-4xl w-full gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                layout={false}
              >
                <HeroSection />
                <InputMethods onSubmit={handleQuestionSubmit} />
              </motion.div>
            </div>
          </motion.div>
        ) : (
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
      </AnimatePresence>
    </motion.div>
  );
};

export default HomePage;
