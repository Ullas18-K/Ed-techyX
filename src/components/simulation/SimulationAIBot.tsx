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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] shadow-2xl"
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden glass-strong border border-primary/20">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 z-10 rounded-full w-8 h-8 glass-card hover:bg-destructive/20"
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
          className={cn(
            "w-16 h-16 rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-br from-primary via-primary to-accent",
            "hover:shadow-primary/50 hover:scale-110",
            "relative overflow-hidden group"
          )}
        >
          {/* Animated background pulse */}
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Icon */}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 text-white relative z-10" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-6 h-6 text-white relative z-10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification Dot (optional - can be used for new messages) */}
          {!isOpen && (
            <motion.div
              className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
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
