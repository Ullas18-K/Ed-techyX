import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { AIContextChat } from './AIContextChat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SimulationAIBotProps {
  scenarioId: string;
  currentTaskId: number;
  context: any;
  onTaskComplete?: (taskId: number) => void;
}

export function SimulationAIBot({
  scenarioId,
  currentTaskId,
  context,
  onTaskComplete
}: SimulationAIBotProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] group"
          >
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
              {/* Close Button - more integrated */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-[60] rounded-xl w-8 h-8 hover:bg-white/10 text-white/50 hover:text-white transition-all p-0"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Chat Component */}
              <AIContextChat
                scenarioId={scenarioId}
                currentTaskId={currentTaskId}
                context={context}
                onTaskComplete={onTaskComplete}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', damping: 15 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          className={cn(
            "w-20 h-20 rounded-full transition-all duration-300 p-0",
            "hover:scale-110",
            "relative overflow-visible group bg-transparent hover:bg-transparent border-none shadow-none"
          )}
        >
          {/* Flare removed as per user request (no blur/bg) */}

          {/* Icon */}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="relative z-10 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/20"
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="relative z-10 w-full h-full"
              >
                <img src="/penman.png" alt="Penman" className="w-full h-full object-contain drop-shadow-2xl" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification Dot */}
          {!isOpen && (
            <motion.div
              className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg z-20"
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </Button>
      </motion.div>
    </>
  );
}
