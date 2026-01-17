import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Image, Send, Sparkles, X, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sampleQuestions } from '@/lib/mockData';

interface InputMethodsProps {
  onSubmit: (question: string) => void;
}

export function InputMethods({ onSubmit }: InputMethodsProps) {
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showOCRResult, setShowOCRResult] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [question]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleVoiceClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setRecordingTime(0);
      const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
      setQuestion(randomQuestion);
    } else {
      setIsRecording(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setTimeout(() => {
          setShowOCRResult(true);
          setQuestion('What is the process shown in this diagram?');
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setShowOCRResult(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      className="w-full max-w-3xl mx-auto"
    >
      {/* Main input container - premium glass effect */}
      <div className={cn(
        "relative glass-panel rounded-3xl overflow-hidden transition-all duration-500",
        isFocused && "ring-2 ring-primary/20 shadow-glow"
      )}>
        {/* Top shine effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        
        {/* Uploaded image preview */}
        <AnimatePresence>
          {uploadedImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative p-4 border-b border-border/40"
            >
              <div className="relative inline-block">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="max-h-32 rounded-2xl object-contain border border-border/50 shadow-soft"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {showOCRResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-muted-foreground inline-flex items-center gap-2 glass-card rounded-xl px-4 py-2"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Text extracted from image</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text input area */}
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your question here... (e.g., Why is photosynthesis important?)"
            className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-lg leading-relaxed"
            rows={1}
          />
        </div>

        {/* Voice recording indicator */}
        <AnimatePresence>
          {isRecording && (
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
                  Recording... {recordingTime}s
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center justify-between px-6 pb-6">
          <div className="flex items-center gap-2">
            {/* Voice input button */}
            <Button
              variant={isRecording ? "destructive" : "glass"}
              size="icon-lg"
              onClick={handleVoiceClick}
              className={cn(
                "rounded-xl",
                isRecording && "animate-pulse"
              )}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            {/* Image upload button */}
            <Button
              variant="glass"
              size="icon-lg"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl"
            >
              <Image className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Submit button */}
          <Button
            variant="hero"
            size="lg"
            onClick={handleSubmit}
            disabled={!question.trim()}
            className="gap-2 group rounded-xl"
          >
            <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>Generate Experience</span>
            <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Sample questions - glass cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <p className="text-sm text-muted-foreground text-center mb-4">Try these questions:</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {sampleQuestions.slice(0, 3).map((q, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setQuestion(q)}
              className="px-5 py-3 text-sm glass-card hover:shadow-medium rounded-xl text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              {q}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Features hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-8 mt-10"
      >
        {[
          { icon: Mic, label: 'Voice input', color: 'text-primary' },
          { icon: Upload, label: 'Image upload', color: 'text-primary' },
          { icon: Sparkles, label: 'AI-powered', color: 'text-accent' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-2 rounded-xl glass-card">
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <span>{label}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}