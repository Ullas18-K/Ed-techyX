import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  VolumeX,
  Volume2,
  SkipForward,
  CheckCircle2,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Translate } from '@/components/Translate';
import { useTranslationStore } from '@/lib/translationStore';
import API_CONFIG from '@/config/api';

const TTS_URL = `${API_CONFIG.BACKEND_API_URL}/tts/synthesize`;

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
 * Penman - Premium Learning Assistant
 * 
 * Task-driven assistant with cloud TTS, translation, and professional UI.
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
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [lastCompletedTask, setLastCompletedTask] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { currentLanguage, translate } = useTranslationStore();

  const getLanguageCodeForTTS = (language: string): string => {
    const languageMap: Record<string, string> = {
      en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ml: 'ml-IN',
      ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
      bn: 'bn-IN', pa: 'pa-IN'
    };
    return languageMap[language] || 'en-IN';
  };

  const speak = useCallback(async (text: string) => {
    if (isMuted || !text || !enabled) return;

    try {
      setIsLoading(true);

      // Translate if needed
      let finalMsg = text;
      if (currentLanguage !== 'en') {
        const result = await translate(text);
        finalMsg = Array.isArray(result) ? result[0] : (result as string);
      }

      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: finalMsg,
          language_code: getLanguageCodeForTTS(currentLanguage),
          speaking_rate: 1.0,
          pitch: 0.0,
        }),
      });

      if (!response.ok) throw new Error('TTS synthesis failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Penman TTS Error:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [isMuted, currentLanguage, translate, enabled]);

  // Track which tasks we've already announced
  const announcedTasksRef = useRef<Set<string>>(new Set(completedTasks));

  // Handle task completion detection
  useEffect(() => {
    const newlyCompleted = completedTasks.find(taskId =>
      !announcedTasksRef.current.has(taskId) && taskId in messages
    );

    if (newlyCompleted) {
      announcedTasksRef.current.add(newlyCompleted);

      if (messages[newlyCompleted]?.completion) {
        setLastCompletedTask(newlyCompleted);
        setShowCompletionMessage(true);
        speak(messages[newlyCompleted].completion!);

        setTimeout(() => {
          setShowCompletionMessage(false);
        }, 5000);
      }
    }
  }, [completedTasks, messages, speak]);

  // Speak instruction when task changes
  useEffect(() => {
    if (activeTaskId && messages[activeTaskId]) {
      setIsVisible(true);
      const message = messages[activeTaskId].instruction;
      setTimeout(() => speak(message), 800);
    }
  }, [activeTaskId, messages, speak]);

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

  if (!enabled || !currentMessage) {
    return null;
  }

  const handleSkip = () => {
    if (activeTaskId && onSkipTask) {
      onSkipTask(activeTaskId);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && currentMessage) {
      speak(isShowingCompletion ? currentMessage.completion! : currentMessage.instruction);
    } else if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn("absolute bottom-4 right-0 z-50 pointer-events-none px-4", className)}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
      >
        {isVisible ? (
          <div className="flex flex-row-reverse items-end gap-0 max-w-2xl">
            {/* Penman Character */}
            <motion.div
              className="relative z-20 pointer-events-auto"
              animate={{
                y: [-4, 4, -4],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 bg-blue-500/10 blur-[60px] rounded-full scale-110" />
                <img
                  src="/penman.png"
                  alt="Penman"
                  className="w-full h-full object-contain relative z-10 drop-shadow-2xl brightness-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/public/penman.png';
                  }}
                />
              </div>
            </motion.div>

            {/* Bubble Container */}
            <motion.div
              className="relative mb-8 -mr-4 z-30 pointer-events-auto"
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              key={activeTaskId + (isShowingCompletion ? '-comp' : '-inst')}
            >
              <div className={cn(
                "bg-white/95 backdrop-blur-2xl border-[1.5px] p-6 rounded-[2.5rem] rounded-br-sm shadow-[0_25px_60px_-15px_rgba(30,58,138,0.25)] ring-1 ring-black/5 max-w-[300px]",
                isShowingCompletion ? "border-green-100" : "border-blue-50"
              )}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-2 w-2">
                      <span className={cn(
                        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                        isShowingCompletion ? "bg-green-400" : "bg-blue-400"
                      )}></span>
                      <span className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        isShowingCompletion ? "bg-green-500" : "bg-blue-500"
                      )}></span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.15em]",
                      isShowingCompletion ? "text-green-600" : "text-blue-600"
                    )}>
                      {isShowingCompletion ? "Task Complete" : "Learning Guide"}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-black/5"
                      onClick={toggleMute}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className={cn("h-4 w-4", isPlaying && "text-blue-500 animate-pulse")} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full hover:bg-black/5"
                      onClick={() => setIsVisible(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  <Translate>
                    {isShowingCompletion ? (currentMessage.completion || '') : currentMessage.instruction}
                  </Translate>
                </p>

                {currentMessage.hint && !isShowingCompletion && (
                  <div className="mt-3 p-3 bg-yellow-50/50 rounded-xl border border-yellow-100/50">
                    <p className="text-[11px] text-amber-700 leading-normal font-medium italic">
                      💡 <Translate>{currentMessage.hint}</Translate>
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Speaking...</span>
                    </div>
                  ) : <div />}

                  {!isShowingCompletion && onSkipTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-wider"
                      onClick={handleSkip}
                    >
                      <SkipForward className="w-3 h-3 mr-1.5" />
                      Skip
                    </Button>
                  )}
                </div>
              </div>

              {/* Bubble Tail - Mirrored to point right */}
              <svg
                className="absolute -right-3 bottom-0 w-8 h-8 text-white/95 drop-shadow-[5px_5px_10px_rgba(0,0,0,0.05)] scale-x-[-1]"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M32 0C32 0 24 4 16 12C8 20 0 32 0 32L32 32V0Z"
                  fill="currentColor"
                  stroke={isShowingCompletion ? "rgba(187, 247, 208, 0.5)" : "rgba(219, 234, 254, 0.5)"}
                  strokeWidth="1"
                />
              </svg>
            </motion.div>
          </div>
        ) : (
          <div className="flex justify-end pointer-events-auto">
            <Button
              size="icon"
              className="w-12 h-12 rounded-full shadow-2xl bg-white hover:bg-blue-50 border-2 border-blue-100 text-blue-600 group"
              onClick={() => setIsVisible(true)}
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};