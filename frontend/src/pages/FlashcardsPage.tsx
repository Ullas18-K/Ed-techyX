import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FlashcardsScreen } from '@/components/flashcards/FlashcardsScreen';
import { useCallback } from 'react';

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

const FlashcardsPage = () => {
  const navigate = useNavigate();

  const handleComplete = useCallback(() => {
    navigate('/mastery');
  }, [navigate]);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="h-screen"
    >
      <FlashcardsScreen onComplete={handleComplete} />
    </motion.div>
  );
};

export default FlashcardsPage;
