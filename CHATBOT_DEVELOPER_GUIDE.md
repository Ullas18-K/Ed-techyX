# 🎓 AI Chatbot - Developer Guide

## 🚀 Quick Start

The AI chatbot is already integrated into `SimulationScreen.tsx`. It appears automatically on all simulation screens.

### Minimal Usage (Already Done)
```tsx
import { SimulationAIBot } from './SimulationAIBot';

// Inside your component
<SimulationAIBot
  scenarioId={aiScenarioData.scenarioId}
  currentTaskId={1}
  context={{
    greeting: aiScenarioData.greeting,
    scenario: aiScenarioData.scenarioDescription,
    // ... more context
  }}
/>
```

## 🎯 Props API

### SimulationAIBot Props

```typescript
interface SimulationAIBotProps {
  scenarioId: string;           // Required: Current scenario identifier
  currentTaskId: number;         // Required: Active task number
  context: any;                  // Required: Simulation context object
  onTaskComplete?: (taskId: number) => void;  // Optional: Task completion callback
}
```

### Context Object Structure

```typescript
interface BotContext {
  // Basic info
  greeting?: string;
  scenario?: string;
  
  // Learning content
  concepts?: Array<{
    stepNumber: number;
    description: string;
    details: string;
  }>;
  
  learningObjectives?: Array<{
    stepNumber: number;
    description: string;
    details: string;
  }>;
  
  // Simulation config
  simulationConfig?: {
    type: string;
    title: string;
    controls: any[];
    // ...
  };
  
  // Dynamic simulation state (optional, added by AIContextChat)
  simulation_state?: {
    [key: string]: any;
  };
}
```

## 📦 Component Architecture

```
SimulationAIBot (Wrapper)
    ↓
├─ Floating Button (UI only)
│  - Handles open/close state
│  - Animations
│  - Positioning
│
└─ Chat Panel (Conditional)
   ↓
   AIContextChat (Logic + UI)
   - Message state
   - API calls
   - RAG display
   - Task completion
```

## 🔧 Customization Examples

### 1. Dynamic Task Tracking

```tsx
// In SimulationScreen.tsx
const [currentTaskId, setCurrentTaskId] = useState(1);

const handleTaskComplete = (completedTaskId: number) => {
  console.log(`✅ Task ${completedTaskId} complete!`);
  
  // Move to next task
  setCurrentTaskId(completedTaskId + 1);
  
  // Show notification
  toast.success(`Task ${completedTaskId} completed! 🎉`);
  
  // Update learning store
  completeTask(`task_${completedTaskId}`);
  
  // Optional: Track analytics
  trackEvent('task_completed', { taskId: completedTaskId });
};

// Pass to bot
<SimulationAIBot
  currentTaskId={currentTaskId}
  onTaskComplete={handleTaskComplete}
  // ...
/>
```

### 2. Enhanced Context with Real-Time State

```tsx
// Capture simulation values
const [simulationState, setSimulationState] = useState({
  focalLength: 15,
  objectDistance: 30,
  objectHeight: 5,
  imagePosition: null,
  imageHeight: null,
  imageNature: null
});

// Build rich context
const botContext = {
  greeting: aiScenarioData.greeting,
  scenario: aiScenarioData.scenarioDescription,
  concepts: aiScenarioData.keyConcepts,
  
  // Add real-time state
  currentSetup: {
    focalLength: simulationState.focalLength,
    objectDistance: simulationState.objectDistance,
    imageType: simulationState.imageNature
  },
  
  // Add user progress
  userProgress: {
    completedTasks: completedTasks.length,
    totalTasks: aiScenarioData.tasks.length,
    timeSpent: elapsedTime
  }
};

<SimulationAIBot
  context={botContext}
  // ...
/>
```

### 3. Conditional Rendering

```tsx
// Only show bot after introduction
const [showBot, setShowBot] = useState(false);

useEffect(() => {
  // Show bot after 10 seconds or after first interaction
  const timer = setTimeout(() => setShowBot(true), 10000);
  return () => clearTimeout(timer);
}, []);

// In JSX
{showBot && aiScenarioData && (
  <SimulationAIBot {...props} />
)}
```

### 4. Custom Positioning

```tsx
// Create custom positioned version
<div className="fixed bottom-20 left-6 z-50">
  <SimulationAIBot {...props} />
</div>
```

### 5. Multiple Bots (Different Contexts)

```tsx
// Theory helper
<SimulationAIBot
  scenarioId={scenarioId}
  currentTaskId={taskId}
  context={{ ...baseContext, role: 'theory_explainer' }}
/>

// Task helper (different position)
<div className="fixed top-20 right-6 z-50">
  <SimulationAIBot
    scenarioId={scenarioId}
    currentTaskId={taskId}
    context={{ ...baseContext, role: 'task_guide' }}
  />
</div>
```

## 🎨 Styling Customization

### Change Button Appearance

Edit `SimulationAIBot.tsx`:

```tsx
<Button
  onClick={() => setIsOpen(!isOpen)}
  className={cn(
    "w-20 h-20",  // Larger button
    "rounded-full shadow-2xl",
    "bg-gradient-to-br from-purple-500 to-pink-500",  // Custom colors
    // ...
  )}
>
```

### Change Panel Size

```tsx
<motion.div
  // ...
  className="... w-[500px] h-[700px] ..."  // Larger panel
>
```

### Change Panel Position

```tsx
// Top-right instead of bottom-right
className="fixed top-24 right-6 z-50 ..."
```

### Custom Theme Colors

The bot automatically uses your theme. To override:

```tsx
// In your CSS or Tailwind config
.custom-bot-theme {
  --bot-primary: #your-color;
  --bot-accent: #your-accent;
}
```

## 🔌 API Integration Details

### Request Flow

```typescript
// User sends message
handleSend() 
  ↓
// Build context
const enhancedContext = {
  ...originalContext,
  simulation_state: {
    ...currentSimulationValues
  }
}
  ↓
// Call API
await getAIGuidance(
  scenarioId,
  currentTaskId,
  userMessage,
  enhancedContext,
  token
)
  ↓
// Handle response
{
  response: "...",
  action: "explain",
  task_complete: false,
  rag_used: true,
  rag_sources: [...]
}
  ↓
// Update UI
setMessages([...messages, aiMessage])
```

### Custom API Call

If you need to modify the API call:

```typescript
// In AIContextChat.tsx
const response = await fetch(`${API_URL}/ai/conversation/guide`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Custom-Header': 'value',  // Add custom headers
  },
  body: JSON.stringify({
    scenario_id: scenarioId,
    current_task_id: currentTaskId,
    student_input: userMessage,
    context: enhancedContext,
    
    // Add custom fields
    user_id: userId,
    session_id: sessionId,
    timestamp: Date.now()
  }),
});
```

## 🧩 Adding Features

### 1. Quick Action Buttons

Add to `AIContextChat.tsx`:

```tsx
// In the chat panel, after messages
<div className="p-3 border-t flex gap-2">
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleQuickQuestion("Give me a hint")}
  >
    💡 Hint
  </Button>
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleQuickQuestion("Explain this concept")}
  >
    📖 Explain
  </Button>
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleQuickQuestion("What's next?")}
  >
    ➡️ Next
  </Button>
</div>
```

### 2. Message Timestamps

Add to message rendering:

```tsx
<div className="text-xs text-muted-foreground mt-1">
  {message.timestamp.toLocaleTimeString()}
</div>
```

### 3. Copy Message Button

```tsx
import { Copy } from 'lucide-react';

// In message component
<Button
  size="sm"
  variant="ghost"
  onClick={() => {
    navigator.clipboard.writeText(message.content);
    toast.success('Copied!');
  }}
>
  <Copy className="w-3 h-3" />
</Button>
```

### 4. Export Chat

```tsx
const exportChat = () => {
  const chatText = messages
    .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join('\n\n');
    
  const blob = new Blob([chatText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat-${scenarioId}-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};
```

### 5. Persistent Chat History

```tsx
// Save to localStorage
useEffect(() => {
  localStorage.setItem(
    `chat-${scenarioId}-${currentTaskId}`,
    JSON.stringify(messages)
  );
}, [messages]);

// Load on mount
useEffect(() => {
  const saved = localStorage.getItem(`chat-${scenarioId}-${currentTaskId}`);
  if (saved) {
    setMessages(JSON.parse(saved));
  }
}, []);
```

### 6. Typing Indicator

Add to `AIContextChat.tsx`:

```tsx
{isLoading && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex gap-2 items-center text-muted-foreground"
  >
    <Bot className="w-4 h-4" />
    <div className="flex gap-1">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        className="w-2 h-2 bg-primary rounded-full"
      />
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
        className="w-2 h-2 bg-primary rounded-full"
      />
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        className="w-2 h-2 bg-primary rounded-full"
      />
    </div>
  </motion.div>
)}
```

## 🐛 Debugging

### Enable Debug Logging

```tsx
// In SimulationAIBot.tsx
useEffect(() => {
  console.log('🤖 Bot Props:', {
    scenarioId,
    currentTaskId,
    contextKeys: Object.keys(context)
  });
}, [scenarioId, currentTaskId, context]);
```

### Check API Calls

```tsx
// In AIContextChat.tsx
console.log('📤 Sending to AI:', {
  scenario_id: scenarioId,
  current_task_id: currentTaskId,
  student_input: userMessage,
  context_size: JSON.stringify(context).length
});

console.log('📥 AI Response:', response);
```

### Monitor State Changes

```tsx
useEffect(() => {
  console.log('💬 Messages updated:', messages.length);
}, [messages]);

useEffect(() => {
  console.log('🔄 Bot state:', { isOpen, isLoading });
}, [isOpen, isLoading]);
```

## 📊 Analytics Integration

### Track Bot Usage

```tsx
// Track opens
const handleOpen = () => {
  setIsOpen(true);
  trackEvent('bot_opened', { scenarioId, taskId: currentTaskId });
};

// Track messages
const handleSend = async () => {
  trackEvent('bot_message_sent', {
    scenarioId,
    taskId: currentTaskId,
    messageLength: input.length
  });
  // ... rest of send logic
};

// Track task completions
const handleTaskComplete = (taskId: number) => {
  trackEvent('bot_task_completed', {
    scenarioId,
    taskId,
    messageCount: messages.length
  });
};
```

## 🧪 Testing

### Unit Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationAIBot } from './SimulationAIBot';

describe('SimulationAIBot', () => {
  const mockProps = {
    scenarioId: 'test-scenario',
    currentTaskId: 1,
    context: { greeting: 'Hello!' }
  };

  it('renders floating button', () => {
    render(<SimulationAIBot {...mockProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens chat panel on click', () => {
    render(<SimulationAIBot {...mockProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/AI Learning Assistant/i)).toBeInTheDocument();
  });
});
```

## 🚀 Performance Optimization

### Lazy Load Chat Component

```tsx
const AIContextChat = lazy(() => import('./AIContextChat'));

// In SimulationAIBot
{isOpen && (
  <Suspense fallback={<LoadingSpinner />}>
    <AIContextChat {...props} />
  </Suspense>
)}
```

### Memoize Context

```tsx
const botContext = useMemo(() => ({
  greeting: aiScenarioData.greeting,
  scenario: aiScenarioData.scenarioDescription,
  // ...
}), [aiScenarioData]);
```

### Debounce Input

```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedSend = useDebouncedCallback(
  (message) => handleSend(message),
  300
);
```

## 📚 Additional Resources

- [AIContextChat Source](./AIContextChat.tsx)
- [AI Service API](../lib/aiService.ts)
- [Backend Endpoint Docs](../../server/routes/ai.js)
- [Integration Guide](../../AI_CHATBOT_INTEGRATION.md)
- [Visual Guide](../../CHATBOT_VISUAL_GUIDE.md)
- [Test Checklist](../../CHATBOT_TEST_CHECKLIST.md)

---

**Questions?** Check the existing code or create an issue!
