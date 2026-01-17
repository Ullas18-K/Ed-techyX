import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getAIGuidance } from '@/lib/aiService';
import { useAuthStore } from '@/lib/authStore';
import { useLearningStore } from '@/lib/learningStore';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
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
      content: context.greeting || "Hi! I'm your AI learning assistant. Ask me anything about what you're learning, or tell me what you're doing in the simulation!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { token } = useAuthStore();
  const { completeTask } = useLearningStore();

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
      // Call AI guidance API
      const response = await getAIGuidance(
        scenarioId,
        currentTaskId,
        userMessage.content,
        context,
        token || ''
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.response,
        timestamp: new Date()
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
        content: "I'm here to help! Keep exploring and let me know what you discover.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Learning Assistant</h3>
          <p className="text-xs text-white/60">Powered by Gemini</p>
        </div>
        <Sparkles className="w-4 h-4 text-primary ml-auto animate-pulse" />
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
                    ? 'bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30'
                    : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30'
                )}>
                  {message.role === 'ai' ? (
                    <Bot className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-blue-400" />
                  )}
                </div>

                <div className={cn(
                  "flex-1 max-w-[80%] p-3 rounded-2xl",
                  message.role === 'ai'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30'
                )}>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {message.content}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 max-w-[80%] p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm text-white/60">Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or describe what you're doing..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-white/40 mt-2 text-center">
          AI responses are powered by Google Gemini
        </p>
      </div>
    </div>
  );
}
