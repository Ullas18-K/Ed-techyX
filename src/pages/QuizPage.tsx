import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QuizScreen } from '@/components/quiz/QuizScreen';
import { useRealtimeStudyRoomStore } from '@/lib/realtimeStudyRoomStore';
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

const QuizPage = () => {
  const navigate = useNavigate();
  const { roomId, enableOpticsPuzzle } = useRealtimeStudyRoomStore();
  const { currentScenario, aiScenarioData } = useLearningStore();
  const { token } = useAuthStore();

  // Trigger flashcard generation on mount
  useEffect(() => {
    startFlashcardGeneration();
  }, []);

  const startFlashcardGeneration = async () => {
    try {
      if (!aiScenarioData || !currentScenario) {
        console.warn('No scenario data available for flashcard generation');
        return;
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store session ID for later retrieval
      localStorage.setItem('flashcard_session_id', sessionId);

      // Fire-and-forget request to start generation
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9000/api'}/visual-flashcards/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grade: aiScenarioData.gradeLevel,
          subject: aiScenarioData.subject,
          topic: currentScenario.topic,
          sessionId
        })
      }).catch(err => {
        console.error('Failed to start flashcard generation:', err);
      });

      console.log('🎨 Flashcard generation started in background');
    } catch (err) {
      console.error('Error starting flashcard generation:', err);
    }
  };

  const handleQuizComplete = useCallback(() => {
    // Check if in multiplayer room and if puzzle is enabled
    if (roomId && enableOpticsPuzzle) {
      // In multiplayer with puzzle enabled - go to puzzle (compulsory)
      navigate('/optics-puzzle');
      toast.success('Great! Now solve the optics puzzle!');
    } else if (roomId && !enableOpticsPuzzle) {
      // In multiplayer but puzzle disabled - skip to reflection
      navigate('/reflection');
      toast.success('Almost done! Time to reflect.');
    } else {
      // Solo learning - go to puzzle (but it will be skippable)
      navigate('/optics-puzzle');
      toast.success('Bonus challenge! Try the optics puzzle or skip to reflection.');
    }
  }, [navigate, roomId, enableOpticsPuzzle]);

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
        key="quiz"
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
          <QuizScreen onComplete={handleQuizComplete} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default QuizPage;
