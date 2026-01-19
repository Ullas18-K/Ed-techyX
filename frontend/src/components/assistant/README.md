# Penman Learning Assistant - Implementation Guide

## Overview

Penman is a hard-coded (non-AI) learning assistant that provides friendly, gamified guidance through simulation tasks across all subjects. It's designed to be generic and reusable.

## Key Features

- ✅ **Generic & Reusable** - Works with any subject
- ✅ **Task-Driven** - Reacts only to task state changes  
- ✅ **Hard-Coded Messages** - No AI models required
- ✅ **Voice Narration** - Optional browser-based TTS
- ✅ **Slide-in Animation** - Friendly cartoon-style avatar
- ✅ **Student Controls** - Skip, mute, close, global mute

## Architecture

```
UnifiedSimulationLayout
├── Canvas (subject content)
├── TaskSidebar (task management)
└── Penman (learning assistant)
    ├── subscribes to task state
    ├── displays contextual messages
    └── provides voice guidance
```

## Usage

### 1. Define Subject Messages

Create a messages file for your subject:

```typescript
// src/components/[subject]/penmanMessages.ts
import { PenmanMessage } from '../assistant/Penman';

export const [subject]PenmanMessages: Record<string, PenmanMessage> = {
  'task-1': {
    instruction: "Welcome! Let's start with [concept]. Try [action].",
    completion: "Excellent! You've learned [outcome]!",
    hint: "Optional hint for struggling students"
  },
  'task-2': {
    instruction: "Great! Now explore [next concept]...",
    completion: "Perfect! You understand [learning goal]!",
    hint: "Remember: [key insight]"
  }
  // Add more tasks...
};
```

### 2. Integrate with Simulation

Pass the messages to `UnifiedSimulationLayout`:

```typescript
<UnifiedSimulationLayout
  // ... other props
  penmanMessages={[subject]PenmanMessages}
  onSkipTask={handleSkipTask}
>
  {/* Your simulation content */}
</UnifiedSimulationLayout>
```

### 3. Penman Behavior

- **Auto-appears** when simulation loads
- **Reacts to task state** (activeTaskId, completedTasks)
- **Shows instructions** for active task
- **Celebrates completion** with success messages
- **Advances automatically** to next task
- **Provides voice narration** (optional, mutable)

## Message Structure

```typescript
interface PenmanMessage {
  instruction: string;    // Main guidance text (2-3 lines max)
  completion?: string;    // Success message when task completes
  hint?: string;         // Optional hint for struggling students
}
```

## Student Controls

- **Skip Task** - Skip current task and move to next
- **Mute Voice** - Disable voice for current session
- **Close Popup** - Hide Penman (can be restored)
- **Global Mute** - Disable all voice throughout simulation

## Voice Requirements

- Uses browser `SpeechSynthesisUtterance`
- No AI TTS required
- Fully optional and mutable
- Automatically reads instruction/completion text

## Visual Design

- **Floating cartoon avatar** (pencil-shaped character)
- **Slide-in animation** from bottom-right
- **Color-coded states** (blue = instruction, green = completion)
- **Non-blocking** - doesn't interfere with simulation canvas

## File Structure

```
src/components/assistant/
├── Penman.tsx                     # Main component
├── penmanMessageTemplates.ts     # Templates for new subjects
└── README.md                     # This documentation

src/components/[subject]/
└── penmanMessages.ts             # Subject-specific messages
```

## Best Practices

### Message Writing
- Keep instructions **clear and actionable**
- Use **friendly, encouraging tone**
- Maximum **2-3 lines** per message
- Include **specific actions** students should take
- Celebrate **learning achievements** in completion messages

### Integration
- Always sync with existing **task state**
- Never manage **separate task tracking**
- Provide **skip functionality** for accessibility
- Make voice **fully optional** with mute controls

### Extensibility
- Design messages to be **subject-agnostic**
- Use **task IDs** as the primary key
- Keep **completion logic generic**
- Allow **easy message customization**

## Example Implementation

See `src/components/optics/penmanMessages.ts` for a complete working example with 8 tasks covering reflection, refraction, and lens optics.

## Future Enhancements

- **Multi-language support** via message translation
- **Custom avatars** per subject
- **Animation variations** for different celebration types
- **Progress tracking** with streak counters