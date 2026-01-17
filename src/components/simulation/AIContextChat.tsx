import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Loader2, BookOpen, Lightbulb, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAIGuidance } from '@/lib/aiService';
import { useAuthStore } from '@/lib/authStore';
import { useLearningStore } from '@/lib/learningStore';

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
      content: context.greeting || "Hi! I'm your AI learning assistant powered by Google Gemini and NCERT content. 🌟 Ask me anything about what you're learning, or tell me what you're observing in the simulation!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const { completeTask, simulationValues, simulationResults } = useLearningStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  return (
    <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-primary/10">
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
          {isLoading && (
            <motion.div 
              className="absolute inset-0"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-full h-full rounded-full bg-primary/30" />
            </motion.div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">AI Learning Assistant</h3>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Thinking...' : 'Ready to help'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">AI-Powered</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
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
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === 'ai' 
                    ? 'bg-gradient-to-br from-primary to-accent'
                    : 'bg-primary/20 border border-primary/30'
                )}>
                  {message.role === 'ai' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>

                <div className={cn(
                  "flex-1 max-w-[80%] rounded-2xl glass-card",
                  message.role === 'user' && 'bg-primary/5'
                )}>
                  <div className="p-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {message.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Enhanced AI message features */}
                  {message.role === 'ai' && (
                    <>

                      {/* Follow-up Suggestions */}
                      {message.follow_up_suggestions && message.follow_up_suggestions.length > 0 && (
                        <div className="px-3 pb-3 space-y-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Continue exploring:
                          </p>
                          {message.follow_up_suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickQuestion(suggestion)}
                              disabled={isLoading}
                              className="w-full text-left text-xs p-2.5 rounded-lg glass-card
                                       hover:bg-primary/5 transition-all duration-200
                                       disabled:opacity-50 disabled:cursor-not-allowed
                                       text-foreground font-medium"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 max-w-[80%] p-3 rounded-2xl glass-card">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-primary/10">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the topic or simulation..."
            className="flex-1 glass-input text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs text-muted-foreground">
            AI-Powered Learning Assistant
          </p>
        </div>
      </div>
    </div>
  );
}
