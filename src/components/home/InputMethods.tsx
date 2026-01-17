import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Sparkles, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sampleQuestions } from '@/lib/mockData';
import { Translate } from '@/components/Translate';
import { useTranslate } from '@/lib/useTranslate';
import { useTranslationStore } from '@/lib/translationStore';
import { useSpeechRecognition } from 'react-speech-kit';

interface InputMethodsProps {
  onSubmit: (question: string) => void;
}

export function InputMethods({ onSubmit }: InputMethodsProps) {
  const { currentLanguage } = useTranslate();
  const { translate } = useTranslationStore();
  const [translatedPlaceholder, setTranslatedPlaceholder] = useState("Type your question here... (e.g., Why is photosynthesis important?)");

  useEffect(() => {
    const initPlaceholder = async () => {
      const p = "Type your question here... (e.g., Why is photosynthesis important?)";
      if (currentLanguage !== 'en') {
        const result = await translate(p);
        setTranslatedPlaceholder(result as string);
      } else {
        setTranslatedPlaceholder(p);
      }
    };
    initPlaceholder();
  }, [currentLanguage, translate]);
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { listen, listening, stop } = useSpeechRecognition({
    onResult: (result: string) => {
      setQuestion(result);
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [question]);

  const handleVoiceClick = () => {
    if (listening) {
      stop();
    } else {
      const languageMap: Record<string, string> = {
        en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ml: 'ml-IN',
        ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
        bn: 'bn-IN', pa: 'pa-IN'
      };
      listen({ lang: languageMap[currentLanguage] || 'en-IN' });
    }
  };

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-2xl mx-auto my-0"
    >
      {/* Main input container - premium glass effect */}
      <div className={cn(
        "relative glass-panel rounded-2xl overflow-hidden transition-all duration-500",
        isFocused && "ring-2 ring-primary/20 shadow-glow"
      )}>
        {/* Top shine effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        {/* Text input area */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={translatedPlaceholder}
            className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-base leading-relaxed"
            rows={1}
          />
        </div>

        {/* Voice recording indicator */}
        <AnimatePresence>
          {listening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-4"
            >
              <div className="flex items-center gap-4 p-4 glass-card rounded-2xl border-destructive/20">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-destructive rounded-full"
                      animate={{
                        height: [8, 24, 8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-destructive font-medium">
                  <Translate>Listening...</Translate>
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-2">
            {/* Voice input button */}
            <Button
              variant={listening ? "destructive" : "glass"}
              size="icon-lg"
              onClick={handleVoiceClick}
              className={cn(
                "rounded-lg",
                listening && "animate-pulse"
              )}
            >
              {listening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Submit button */}
          <Button
            variant="hero"
            size="lg"
            onClick={handleSubmit}
            disabled={!question.trim()}
            className="gap-2 group rounded-lg text-sm"
          >
            <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span><Translate>Generate</Translate></span>
            <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}