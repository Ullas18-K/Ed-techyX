import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SimulationScreen } from '@/components/simulation/SimulationScreen';
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

const SimulationPage = () => {
  const navigate = useNavigate();
  const { currentQuestion, totalPoints } = useLearningStore();
  const { submitSessionResult } = useAuthStore();

  const handleSimulationComplete = useCallback(async () => {
    try {
      await submitSessionResult({ 
        question: currentQuestion || 'Unknown', 
        points: totalPoints, 
        accuracy: 0, 
        duration: 0 
      });
    } catch (e) {
      console.error('Failed to submit session result', e);
    }
    navigate('/quiz');
    toast('Quiz time! Test your knowledge.', { icon: '📝' });
  }, [submitSessionResult, currentQuestion, totalPoints, navigate]);

  return (
    <motion.div 
      className="min-h-screen w-full bg-background bg-gradient-mesh noise overflow-x-hidden flex flex-col relative"
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="orb orb-primary w-[100vw] h-[100vh] fixed top-0 left-0 opacity-40" />
        <div className="orb orb-accent w-[90vw] h-[90vh] fixed top-0 right-0 opacity-30" />
      </div>

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
    </motion.div>
  );
};

export default SimulationPage;
