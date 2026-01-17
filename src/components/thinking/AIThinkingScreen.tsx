import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLearningStore } from '@/lib/learningStore';

// Typing animation component
function TypingAnimation() {
  const text = "Generating";
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        currentIndex = 0;
        setDisplayedText('');
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="text-center">
      <span className="text-3xl font-light text-blue-300">
        {displayedText}
        {showCursor && <span className="animate-pulse">|</span>}
      </span>
    </div>
  );
}

interface AIThinkingScreenProps {
  onComplete: () => void;
}

export function AIThinkingScreen({ onComplete }: AIThinkingScreenProps) {
  const { currentScenario, isAIScenarioReady } = useLearningStore();

  // Monitor scenario generation
  useEffect(() => {
    if (isAIScenarioReady && currentScenario) {
      console.log('✅ AI Scenario fully generated and ready:', currentScenario.id);
      // Give a brief moment to show completion, then advance
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAIScenarioReady, currentScenario, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col items-center justify-start pt-20"
    >
      {/* Video Background - Centered */}
      <div className="flex items-center justify-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-96 h-96 object-cover"
        >
          <source src="/original-272d6c96cfeb527eb907a1c1cf06f828.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Bottom animated text only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 w-full flex items-center justify-center"
      >
        {isAIScenarioReady ? (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl font-light text-blue-300"
          >
            Scenario Generated Successfully
          </motion.span>
        ) : (
          <TypingAnimation />
        )}
      </motion.div>
    </motion.div>
  );
}