import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Loader2, BookOpen, Lightbulb, CheckCircle, Volume2, VolumeX, X, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAIGuidance } from '@/lib/aiService';
import { useAuthStore } from '@/lib/authStore';
import { useLearningStore } from '@/lib/learningStore';
import { Translate } from '@/components/Translate';
import { useTranslationStore } from '@/lib/translationStore';
import { useSpeechRecognition } from 'react-speech-kit';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const TTS_URL = 'http://localhost:8001/api/tts/synthesize';

interface RAGSource {
  chapter?: string;
  page?: string;
  excerpt: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  // Enhanced AI message fields
  rag_used?: boolean;
  rag_sources?: RAGSource[];
  confidence?: number;
  follow_up_suggestions?: string[];
  action?: string;
}

interface AIContextChatProps {
  scenarioId: string;
  currentTaskId: number;
  context: any;
  onTaskComplete?: (taskId: number) => void;
}

export function AIContextChat({ scenarioId, currentTaskId, context, onTaskComplete }: AIContextChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: context.greeting || "Hi! I'm Penman, your AI learning assistant. 🌟 Ask me anything about what you're learning, or tell me what you're observing in the simulation!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const { completeTask, simulationValues, simulationResults } = useLearningStore();
  const { currentLanguage, translate } = useTranslationStore();

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result: string) => {
      setInput(result);
    },
  });

  const handleMicToggle = () => {
    if (listening) {
      stop();
    } else {
      listen({ lang: getLanguageCodeForTTS(currentLanguage) });
    }
  };

  const getLanguageCodeForTTS = (language: string): string => {
    const languageMap: Record<string, string> = {
      en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ml: 'ml-IN',
      ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
      bn: 'bn-IN', pa: 'pa-IN'
    };
    return languageMap[language] || 'en-IN';
  };

  const speak = useCallback(async (text: string) => {
    if (isMuted || !text) return;

    try {
      setIsSpeaking(true);

      // Translate if needed before TTS
      let textToSpeak = text;
      if (currentLanguage !== 'en') {
        const result = await translate(text);
        textToSpeak = Array.isArray(result) ? result[0] : (result as string);
      }

      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
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

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('AI Chat TTS Error:', error);
      setIsSpeaking(false);
    }
  }, [isMuted, currentLanguage, translate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Read greeting on mount if not muted
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'ai') {
      speak(messages[0].content);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build comprehensive context with simulation state
      const enhancedContext = {
        ...context,
        simulation_state: {
          ...simulationValues,
          ...simulationResults,
          current_task: currentTaskId
        }
      };

      // Call AI guidance API with enhanced context
      const response = await getAIGuidance(
        scenarioId,
        currentTaskId,
        userMessage.content,
        enhancedContext,
        token || ''
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.response,
        timestamp: new Date(),
        action: response.action
      };

      setMessages(prev => [...prev, aiMessage]);
      speak(aiMessage.content);

      // Handle task completion
      if (response.task_complete) {
        completeTask(`task_${currentTaskId}`);
        if (onTaskComplete) {
          onTaskComplete(currentTaskId);
        }
      }

    } catch (error) {
      console.error('AI guidance error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm having trouble connecting right now. Could you try asking that again? 🔄",
        timestamp: new Date(),
        action: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
      speak(errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    // Auto-send after a brief delay
    setTimeout(() => {
      if (question) {
        handleSend();
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (newMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(false);
    } else {
      // If unmuting, speak the last AI message
      const lastAiMsg = [...messages].reverse().find(m => m.role === 'ai');
      if (lastAiMsg) speak(lastAiMsg.content);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header - more compact */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-slate-800/20">
        <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
          <img src="/penman.png" alt="Penman" className="w-full h-full object-contain" />
          {isLoading && (
            <motion.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-full h-full rounded-xl bg-primary/30" />
            </motion.div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base tracking-tight truncate"><Translate>Penman Assistant</Translate></h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isLoading ? "bg-amber-400 animate-pulse" : "bg-green-400"
            )} />
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.1em]">
              {isLoading ? <Translate>Thinking</Translate> : <Translate>Online</Translate>}
            </p>
          </div>
        </div>
        <div className="flex items-center pr-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={cn(
              "h-8 w-8 rounded-lg transition-all",
              isMuted ? "text-white/20 hover:bg-white/10" : "text-white bg-white/10 hover:bg-white/20",
              isSpeaking && !isMuted && "animate-pulse"
            )}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Messages overflow-hidden handles the scroll better in a smaller area */}
      <ScrollArea ref={scrollRef} className="flex-1 px-3">
        <div className="space-y-6 py-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar only for AI - smaller and no bg */}
                {message.role === 'ai' && (
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 self-end mb-1">
                    <img src="/penman.png" alt="P" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className={cn(
                  "flex-1 max-w-[85%] rounded-[1.5rem] transition-all shadow-md px-4 py-3",
                  message.role === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white/95 text-slate-800 rounded-tl-none font-medium'
                )}>
                  {message.role === 'ai' ? (
                    <div className="text-[13px] leading-relaxed prose prose-sm max-w-none prose-headings:text-slate-800 prose-p:text-slate-800 prose-strong:text-slate-900 prose-ul:text-slate-800 prose-ol:text-slate-800 prose-li:text-slate-800 prose-a:text-primary">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed">
                      {message.content}
                    </p>
                  )}
                  <div className={cn(
                    "flex items-center gap-1.5 mt-2",
                    message.role === 'user' ? 'text-white/60' : 'text-slate-400'
                  )}>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Enhanced AI message features - more compact */}
                  {message.role === 'ai' && message.follow_up_suggestions && message.follow_up_suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.1em] flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3" />
                        Next Steps
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.follow_up_suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickQuestion(suggestion)}
                            disabled={isLoading}
                            className="text-left text-[10px] py-1.5 px-3 rounded-lg border border-slate-100 
                                     bg-slate-50/50 hover:bg-primary hover:text-white transition-all duration-200
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     text-slate-700 font-bold"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/penman.png" alt="P" className="w-full h-full object-contain" />
              </div>
              <div className="px-4 py-3 rounded-xl rounded-tl-none bg-white text-slate-800 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input - more compact and rounded */}
      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="flex gap-2 items-center bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/10 ring-1 ring-white/5 shadow-inner">
          <Button
            onClick={handleMicToggle}
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full shrink-0 transition-all duration-300",
              listening ? "bg-red-500/20 text-red-500 animate-pulse" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {listening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-white/30" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Penman..."
            className="flex-1 h-10 bg-transparent border-none text-white text-[13px] focus-visible:ring-0 placeholder:text-white/20 font-medium px-4"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "h-9 w-9 rounded-full shrink-0 p-0 transition-all duration-300 shadow-lg",
              "bg-white hover:bg-white text-slate-900",
              "hover:scale-105 active:scale-95"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
            ) : (
              <Send className="w-4 h-4 text-slate-900" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
