import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LearningPlanScreen } from '@/components/plan/LearningPlanScreen';
import { useLearningStore } from '@/lib/learningStore';
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

const LearningPlanPage = () => {
  const navigate = useNavigate();
  const { currentScenario } = useLearningStore();

  const handleStartSimulation = useCallback(() => {
    if (!currentScenario) {
      navigate('/simulation');
      return;
    }

    const topic = currentScenario.topic.toLowerCase();
    const simulationType = currentScenario.simulation?.type?.toLowerCase() || '';
    const combined = `${topic} ${simulationType}`;
    
    // Optics-related keywords (check first for priority)
    const opticsKeywords = [
      'ray optic', 'geometric optic', 'light', 'mirror', 'lens', 'reflection',
      'refraction', 'focal', 'image formation', 'concave', 'convex', 'prism',
      'spherical mirror', 'refract', 'reflect'
    ];
    
    // Chemistry-related keywords (more specific to avoid conflicts)
    const chemistryKeywords = [
      'acid', 'base', 'salt', 'chemical reaction', 'chemistry', 
      'neutralization', 'indicator', 'ph', 'litmus', 'phenolphthalein',
      'metal oxide', 'hydroxide', 'carbonate', 'bicarbonate',
      'sulfate', 'chloride', 'nitrate', 'alkali', 'corrosion',
      'titration', 'precipitation'
    ];
    
    // Check optics first (higher priority for 'ray optics' etc.)
    const isOptics = opticsKeywords.some(keyword => combined.includes(keyword));
    
    // Check chemistry
    const isChemistry = chemistryKeywords.some(keyword => combined.includes(keyword));
    
    if (isOptics) {
      navigate('/optics');
      toast('Starting optics exploration!', { icon: '🔬' });
    } else if (isChemistry) {
      navigate('/chemistry');
      toast('Starting chemistry exploration!', { icon: '🧪' });
    } else {
      navigate('/simulation');
      toast('Starting simulation!', { icon: '🎯' });
    }
  }, [navigate, currentScenario]);

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
    </motion.div>
  );
};

export default LearningPlanPage;
