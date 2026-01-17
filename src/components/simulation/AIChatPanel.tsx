import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Lightbulb, 
  HelpCircle,
  BookOpen,
  Beaker,
  ArrowRight,
  Bot,
  User,
  FileText,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'hint' | 'explanation' | 'formula';
}

interface AIChatPanelProps {
  topicName: string;
  subject: string;
  simulationType: string;
  onRequestHint: () => void;
  onRequestExplanation: () => void;
}

const predefinedResponses: Record<string, { keywords: string[]; response: string }[]> = {
  photosynthesis: [
    {
      keywords: ['what', 'photosynthesis'],
      response: "Photosynthesis is the process by which green plants use sunlight to convert carbon dioxide and water into glucose (food) and oxygen. Think of it as the plant's way of cooking its own meal using sunlight as the heat source!"
    },
    {
      keywords: ['why', 'important'],
      response: "Photosynthesis is crucial because:\n\n1. **Oxygen Production**: It produces the oxygen we breathe\n2. **Food Chain Base**: It creates food for all other living things\n3. **Carbon Cycle**: It removes CO₂ from atmosphere\n4. **Energy Source**: It stores solar energy in chemical form"
    },
    {
      keywords: ['chlorophyll', 'green'],
      response: "Chlorophyll is the green pigment in plants that captures light energy. It's found in chloroplasts and absorbs red and blue light while reflecting green light - that's why plants look green! Without chlorophyll, photosynthesis couldn't happen."
    },
    {
      keywords: ['equation', 'formula'],
      response: "The photosynthesis equation is:\n\n**6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂**\n\nIn words: Carbon dioxide + Water + Light energy → Glucose + Oxygen\n\nRemember: 6 molecules of each reactant produce 1 glucose and 6 oxygen molecules!"
    },
    {
      keywords: ['increase', 'faster', 'rate'],
      response: "To increase the rate of photosynthesis:\n\n1. **More light** (up to saturation point)\n2. **Higher CO₂** concentration\n3. **Optimal temperature** (25-35°C)\n4. **Adequate water** supply\n\nTry adjusting these in the simulation to see the effects!"
    }
  ],
  circuit: [
    {
      keywords: ['ohm', 'law'],
      response: "Ohm's Law states: **V = I × R**\n\nWhere:\n- V = Voltage (Volts)\n- I = Current (Amperes)\n- R = Resistance (Ohms)\n\nThis means current is proportional to voltage and inversely proportional to resistance. Double the voltage = double the current!"
    },
    {
      keywords: ['series', 'parallel', 'difference'],
      response: "**Series Circuit:**\n- Components in a line\n- Same current everywhere\n- Resistances add up: R = R₁ + R₂\n\n**Parallel Circuit:**\n- Components on separate branches\n- Same voltage everywhere\n- 1/R = 1/R₁ + 1/R₂\n\nHomes use parallel so one device failing doesn't affect others!"
    },
    {
      keywords: ['power', 'watt'],
      response: "Electrical power is calculated as:\n\n**P = V × I = I²R = V²/R**\n\nPower (Watts) tells us how quickly energy is used. A 60W bulb uses 60 joules of energy per second. More power = brighter bulb but more electricity used!"
    }
  ]
};

const quickActions = [
  { id: 'hint', label: 'Get Hint', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'explain', label: 'Explain This', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'formula', label: 'Show Formula', icon: <FileText className="w-4 h-4" /> },
  { id: 'experiment', label: 'What to Try', icon: <Beaker className="w-4 h-4" /> },
];

export function AIChatPanel({ topicName, subject, simulationType, onRequestHint, onRequestExplanation }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome to the ${topicName} lab! I'm your AI tutor. Ask me anything about ${topicName.toLowerCase()}, or try the quick actions below. What would you like to learn?`,
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    const responses = predefinedResponses[simulationType] || predefinedResponses.photosynthesis;
    
    for (const item of responses) {
      if (item.keywords.some(kw => lowerQuery.includes(kw))) {
        return item.response;
      }
    }
    
    return `That's a great question about ${topicName}! Based on what you're exploring in the simulation, try adjusting the controls and observing the changes. Each variable affects the outcome differently. Would you like me to explain any specific concept?`;
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const response = findResponse(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickAction = (actionId: string) => {
    let response = '';
    
    switch (actionId) {
      case 'hint':
        response = simulationType === 'photosynthesis' 
          ? "💡 Hint: Try setting all inputs to around 70-80% and observe the plant health. What happens when you reduce just the sunlight while keeping others high?"
          : "💡 Hint: Start with a simple circuit - low voltage (3V), one resistor. Notice how current changes when you double the voltage!";
        onRequestHint();
        break;
      case 'explain':
        response = simulationType === 'photosynthesis'
          ? "The simulation shows how photosynthesis rate depends on multiple factors working together. The plant health indicator represents overall photosynthetic efficiency - it's highest when all inputs are balanced at optimal levels."
          : "This circuit simulation demonstrates Ohm's Law in action. The brightness of the bulb is directly proportional to the current flowing through it, which depends on voltage and resistance.";
        break;
      case 'formula':
        response = simulationType === 'photosynthesis'
          ? "📝 Key Formula:\n\n**6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂**\n\nRate factors: Light intensity, CO₂ concentration, Temperature, Water availability"
          : "📝 Key Formulas:\n\n**V = I × R** (Ohm's Law)\n**P = V × I** (Power)\n\nSeries: R_total = R₁ + R₂\nParallel: 1/R_total = 1/R₁ + 1/R₂";
        break;
      case 'experiment':
        response = simulationType === 'photosynthesis'
          ? "🧪 Try this experiment:\n\n1. Set all values to 50%\n2. Run the experiment and note results\n3. Now increase sunlight to 100%\n4. Compare oxygen output\n5. What's the relationship?"
          : "🧪 Try this experiment:\n\n1. Set voltage to 6V, resistance to 10Ω\n2. Calculate expected current (should be 0.6A)\n3. Run and verify!\n4. Now change to parallel - does current increase?";
        break;
    }

    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      type: actionId as any
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-ai">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Tutor</h3>
            <p className="text-xs text-muted-foreground">Ask me anything about {topicName}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'assistant' 
                  ? "bg-gradient-ai" 
                  : "bg-secondary"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <User className="w-4 h-4 text-secondary-foreground" />
                )}
              </div>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.role === 'assistant'
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-ai">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-secondary rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-border">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-full text-xs font-medium text-secondary-foreground whitespace-nowrap transition-colors"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2.5 bg-secondary rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={handleSend} className="gap-2" disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
