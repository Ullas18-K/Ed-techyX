import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLearningStore } from '@/lib/learningStore';
import { cn } from '@/lib/utils';

interface ReflectionScreenProps {
  onComplete: () => void;
}

export function ReflectionScreen({ onComplete }: ReflectionScreenProps) {
  const { currentScenario, reflectionAnswers, saveReflection } = useLearningStore();
  const [currentReflectionIndex, setCurrentReflectionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');

  if (!currentScenario) return null;

  const reflections = currentScenario.reflections;
  const currentReflection = reflections[currentReflectionIndex];
  const isLastReflection = currentReflectionIndex >= reflections.length - 1;
  const answeredCount = Object.keys(reflectionAnswers).length;

  const handleSubmitReflection = () => {
    if (!currentAnswer.trim()) return;
    saveReflection(currentReflection, currentAnswer);
    setCurrentAnswer('');
    if (isLastReflection) { onComplete(); } 
    else { setCurrentReflectionIndex(prev => prev + 1); }
  };

  const handleSkip = () => {
    if (isLastReflection) { onComplete(); } 
    else { setCurrentReflectionIndex(prev => prev + 1); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-6xl mx-auto px-4 py-8 min-h-screen flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card text-accent text-sm font-semibold mb-4">
          <Lightbulb className="w-4 h-4" />
          <span>Deep Thinking</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Reflection & Connections</h1>
        <p className="text-muted-foreground text-lg">Take a moment to think deeply about what you've learned</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground font-medium">Question {currentReflectionIndex + 1} of {reflections.length}</span>
          <span className="font-semibold text-accent">{answeredCount} answered</span>
        </div>
        <div className="flex gap-1.5 p-1.5 glass-subtle rounded-full">
          {reflections.map((reflection, index) => (
            <div key={index} className={cn("h-2 flex-1 rounded-full transition-all", index === currentReflectionIndex ? "bg-accent" : reflectionAnswers[reflection] ? "bg-success" : "bg-muted")} />
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={currentReflectionIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border-accent/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-accent/10"><MessageSquare className="w-6 h-6 text-accent" /></div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">{currentReflection}</h2>
                <p className="text-sm text-muted-foreground">There's no wrong answer – express your thoughts freely</p>
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <Textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder="Type your thoughts here..." className="min-h-[150px] text-lg border-none focus-visible:ring-0 resize-none bg-transparent" />
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Need ideas?</span>
              {['I think...', 'I learned that...', 'This connects to...'].map((prompt, index) => (
                <button key={index} onClick={() => setCurrentAnswer(prev => prev + (prev ? ' ' : '') + prompt)} className="text-xs px-3 py-1.5 rounded-full glass-subtle hover:glass-card text-muted-foreground hover:text-foreground transition-all">{prompt}</button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-center gap-4 mt-8">
        <Button variant="outline" size="lg" onClick={handleSkip} className="gap-2 rounded-xl">Skip for now</Button>
        <Button variant="hero" size="lg" onClick={handleSubmitReflection} disabled={!currentAnswer.trim()} className="gap-2 rounded-xl"><Send className="w-4 h-4" /><span>Save Reflection</span></Button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card text-success"><Sparkles className="w-4 h-4" /><span className="text-sm font-semibold">+15 points per reflection</span></div>
      </motion.div>

      {answeredCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Your reflections</h3>
          <div className="space-y-3">
            {Object.entries(reflectionAnswers).map(([question, answer], index) => (
              <div key={index} className="p-4 glass-subtle rounded-2xl">
                <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-success" /><span className="text-sm font-semibold text-foreground">{question}</span></div>
                <p className="text-sm text-muted-foreground pl-6">{answer}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}