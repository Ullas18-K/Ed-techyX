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
    // Determine which game/challenge to navigate to based on subject/topic
    const topic = currentScenario?.topic?.toLowerCase() || '';
    const subject = currentScenario?.subject?.toLowerCase() || '';
    const simulationType = currentScenario?.simulation?.type?.toLowerCase() || '';
    const combined = `${topic} ${subject} ${simulationType}`;
    
    // Optics-related keywords (check FIRST for priority)
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
    
    // Check optics FIRST (higher priority for 'ray optics' etc.)
    const isOptics = opticsKeywords.some(keyword => combined.includes(keyword));
    
    // Then check chemistry
    const isChemistry = !isOptics && chemistryKeywords.some(keyword => combined.includes(keyword));
    
    // Check if in multiplayer room and if puzzle is enabled
    if (roomId && enableOpticsPuzzle) {
      // In multiplayer with puzzle enabled - go to appropriate challenge (compulsory)
      if (isOptics) {
        navigate('/optics-puzzle');
        toast.success('Great! Now solve the optics puzzle!', { icon: '🔬' });
      } else if (isChemistry) {
        navigate('/chemistry-challenge');
        toast.success('Great! Now solve the chemistry challenge!', { icon: '🧪' });
      } else {
        navigate('/optics-puzzle');
        toast.success('Great! Now solve the puzzle!');
      }
    } else if (roomId && !enableOpticsPuzzle) {
      // In multiplayer but puzzle disabled - skip to reflection
      navigate('/reflection');
      toast.success('Almost done! Time to reflect.');
    } else {
      // Solo learning - go to appropriate challenge (but it will be skippable)
      if (isOptics) {
        navigate('/optics-puzzle');
        toast.success('Bonus challenge! Try the optics puzzle or skip to reflection.', { icon: '🔬' });
      } else if (isChemistry) {
        navigate('/chemistry-challenge');
        toast.success('Bonus challenge! Try the chemistry challenge or skip to reflection.', { icon: '🧪' });
      } else {
        // Default to reflection if no specific challenge
        navigate('/reflection');
        toast.success('Quiz complete! Time to reflect on what you learned.');
      }
    }
  }, [navigate, roomId, enableOpticsPuzzle, currentScenario]);

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
