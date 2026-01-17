import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ReflectionScreen } from '@/components/reflection/ReflectionScreen';
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

const ReflectionPage = () => {
  const navigate = useNavigate();

  const handleReflectionComplete = useCallback(() => {
    navigate('/flashcards');
    toast.success('📚 Time for visual flashcards!');
  }, [navigate]);

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
        key="reflection"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full overflow-y-auto relative z-10"
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
    </motion.div>
  );
};

export default ReflectionPage;
