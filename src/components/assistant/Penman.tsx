import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  VolumeX,
  Volume2,
  SkipForward,
  CheckCircle2,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PenmanMessage {
  instruction: string;
  completion?: string;
  hint?: string;
}

export interface PenmanProps {
  // Task state from parent
  activeTaskId: string | null;
  completedTasks: string[];

  // Message mapping: taskId -> messages
  messages: Record<string, PenmanMessage>;

  // Controls
  onSkipTask?: (taskId: string) => void;

  // Global settings
  defaultMuted?: boolean;
  className?: string;
  enabled?: boolean;
}

/**
 * Penman - Hard-coded Learning Assistant
 * 
 * Generic, task-driven assistant that provides guidance through simulation tasks.
 * Works with any subject by consuming task state and predefined messages.
 */
export const Penman: React.FC<PenmanProps> = ({
  activeTaskId,
  completedTasks,
  messages,
  onSkipTask,
  defaultMuted = false,
  className,
  enabled = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [lastCompletedTask, setLastCompletedTask] = useState<string | null>(null);

  // Voice synthesis
  const speak = useCallback((text: string) => {
    if (isMuted || isGlobalMuted || !text) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    // Try to use a pleasant voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Female') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen') ||
      voice.lang.includes('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    speechSynthesis.speak(utterance);
  }, [isMuted, isGlobalMuted]);

  // Track which tasks we've already announced to prevent loops and duplicate messages
  const announcedTasksRef = React.useRef<Set<string>>(new Set(completedTasks));

  // Handle task completion detection
  useEffect(() => {
    // Find a task that is completed, has a message, and hasn't been announced yet
    const newlyCompleted = completedTasks.find(taskId =>
      !announcedTasksRef.current.has(taskId) && taskId in messages
    );

    if (newlyCompleted) {
      // Mark as announced immediately to prevent re-processing
      announcedTasksRef.current.add(newlyCompleted);

      if (messages[newlyCompleted]?.completion) {
        setLastCompletedTask(newlyCompleted);
        setShowCompletionMessage(true);
        speak(messages[newlyCompleted].completion!);

        // Auto-hide completion message after 3 seconds
        setTimeout(() => {
          setShowCompletionMessage(false);
        }, 3000);
      }
    }
  }, [completedTasks, messages, speak]);

  // Speak instruction when task changes
  // Speak instruction when task changes
  useEffect(() => {
    if (activeTaskId && messages[activeTaskId]) {
      // Auto-show Penman when task changes
      setIsVisible(true);

      const message = messages[activeTaskId].instruction;
      // Small delay to let UI settle
      setTimeout(() => speak(message), 500);
    }
  }, [activeTaskId, messages, speak]);

  // Get current message
  const getCurrentMessage = (): PenmanMessage | null => {
    if (showCompletionMessage && lastCompletedTask && messages[lastCompletedTask]) {
      return messages[lastCompletedTask];
    }
    if (activeTaskId && messages[activeTaskId]) {
      return messages[activeTaskId];
    }
    return null;
  };

  const currentMessage = getCurrentMessage();
  const isShowingCompletion = showCompletionMessage && lastCompletedTask;

  // Don't render if disabled globally
  if (!enabled) {
    return null;
  }

  // If no message, also don't render (unless we want to show a generic state, for now hide)
  if (!currentMessage) {
    return null;
  }

  // Note: We DO render below even if !isVisible, to show the "Restore" button.
  // The main message bubble is conditionally rendered based on isVisible logic inside the return.

  const handleSkip = () => {
    if (activeTaskId && onSkipTask) {
      onSkipTask(activeTaskId);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      speechSynthesis.cancel(); // Stop current speech
    }
  };

  const toggleGlobalMute = () => {
    setIsGlobalMuted(!isGlobalMuted);
    if (!isGlobalMuted) {
      speechSynthesis.cancel(); // Stop current speech
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          "absolute bottom-6 right-6 z-50 pointer-events-none",
          className
        )}
        initial={{ opacity: 0, y: 100, x: 50 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 100, x: 50 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.6
        }}
      >
        {/* Message Bubble - Only show if Visible */}
        {isVisible && (
          <div className="flex items-end gap-3 pointer-events-auto">
            {/* Speech Bubble */}
            <motion.div
              className={cn(
                "relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-4 max-w-sm",
                isShowingCompletion
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                  : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Speech bubble pointer */}
              <div className={cn(
                "absolute bottom-0 right-4 w-4 h-4 rotate-45 transform translate-y-2",
                isShowingCompletion ? "bg-green-50" : "bg-blue-50"
              )} />

              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isShowingCompletion ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                    )}
                    <span className={cn(
                      "font-bold text-xs uppercase tracking-wider",
                      isShowingCompletion ? "text-green-700" : "text-blue-700"
                    )}>
                      {isShowingCompletion ? "Well Done!" : "Penman Guide"}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {/* Voice Controls */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 rounded-full hover:bg-black/10"
                      onClick={toggleMute}
                      title={isMuted ? "Unmute voice" : "Mute voice"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </Button>

                    {/* Global Mute */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "w-6 h-6 rounded-full hover:bg-black/10",
                        isGlobalMuted && "bg-red-100 text-red-600"
                      )}
                      onClick={toggleGlobalMute}
                      title="Global mute toggle"
                    >
                      <VolumeX className="w-3 h-3" />
                    </Button>

                    {/* Close */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 rounded-full hover:bg-black/10"
                      onClick={() => setIsVisible(false)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm leading-relaxed text-gray-800 mb-3">
                  {isShowingCompletion
                    ? currentMessage.completion
                    : currentMessage.instruction}
                </p>

                {/* Hint */}
                {!isShowingCompletion && currentMessage.hint && (
                  <p className="text-xs text-gray-600 italic border-l-2 border-yellow-300 pl-2 mb-3">
                    💡 {currentMessage.hint}
                  </p>
                )}

                {/* Actions */}
                {!isShowingCompletion && (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      onClick={handleSkip}
                    >
                      <SkipForward className="w-3 h-3 mr-1" />
                      Skip
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Penman Avatar */}
            <motion.div
              className="flex-shrink-0"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.4,
                type: "spring",
                stiffness: 400,
                damping: 15
              }}
            >
              <div className={cn(
                "w-16 h-20 rounded-2xl shadow-xl border-4 overflow-hidden relative",
                isShowingCompletion
                  ? "border-green-300 bg-green-50"
                  : "border-blue-300 bg-blue-50"
              )}>
                {/* Penman Character - Using CSS to create the character */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Head (pencil tip) */}
                  <div className={cn(
                    "w-8 h-6 rounded-t-full",
                    isShowingCompletion ? "bg-green-600" : "bg-blue-600"
                  )} />

                  {/* Body */}
                  <div className={cn(
                    "w-6 h-8 rounded-lg mt-1",
                    isShowingCompletion ? "bg-green-500" : "bg-blue-500"
                  )} />

                  {/* Eyes */}
                  <div className="absolute top-2 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <div className="absolute top-2.5 flex gap-1">
                    <div className="w-1 h-1 bg-black rounded-full" />
                    <div className="w-1 h-1 bg-black rounded-full" />
                  </div>

                  {/* Smile */}
                  <div className="absolute top-4 w-2 h-1 border-b-2 border-white rounded-full" />
                </div>

                {/* Floating animation */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ y: [-1, 1, -1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Restore button when hidden */}
        {!isVisible && (
          <motion.button
            className="absolute bottom-0 right-0 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-50 pointer-events-auto"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => setIsVisible(true)}
            title="Show Penman guide"
          >
            <MessageCircle className="w-6 h-6 mx-auto" />
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};