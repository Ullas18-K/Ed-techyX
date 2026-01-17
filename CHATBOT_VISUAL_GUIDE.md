# 🎨 AI Chatbot - Visual Guide

## 📍 Position & Layout

```
┌─────────────────────────────────────────────────────────────┐
│  SimulationScreen.tsx                                       │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────────────────┐   │
│  │                  │  │                             │   │
│  │  Left Panel:     │  │  Right Panel:               │   │
│  │  - Greeting      │  │  - Previous Year Questions  │   │
│  │  - Overview      │  │  - Practice Problems        │   │
│  │  - Key Concepts  │  │  - Solutions                │   │
│  │  - Notes         │  │                             │   │
│  │  - Formulas      │  │                             │   │
│  │                  │  │                             │   │
│  │                  │  │                             │   │
│  └──────────────────┘  └─────────────────────────────┘   │
│                                                             │
│                                           ┌──────────────┐ │
│                                           │   Chat       │ │
│                                           │   Panel      │ │
│                                           │   (420x600)  │ │
│                                           │              │ │
│                                           │  ┌────────┐  │ │
│                                           │  │ AI msg │  │ │
│                                           │  └────────┘  │ │
│                                           │     ┌─────┐  │ │
│                                           │     │User │  │ │
│                                           │     └─────┘  │ │
│                                           │  [Input box] │ │
│                                           └──────────────┘ │
│                                                             │
│                                              🤖 (Floating)│
└─────────────────────────────────────────────────────────────┘
```

## 🎭 Component Hierarchy

```
SimulationScreen
├── Header (Home button, Title, Continue button)
├── Main Content (2 columns)
│   ├── Left: Theory & Notes
│   └── Right: Practice Questions
└── SimulationAIBot ✨ NEW
    ├── Floating Button (bottom-right)
    └── Chat Panel (conditionally rendered)
        └── AIContextChat
            ├── Header (AI Assistant title)
            ├── Messages (ScrollArea)
            │   ├── AI messages (left, with bot icon)
            │   └── User messages (right, with user icon)
            └── Input Footer (text box + send button)
```

## 🎨 UI States

### State 1: Closed (Default)
```
                                               
                                               
                                               
                                               
                                               
                                               
                                               
                                               
                                    ┌────────┐
                                    │   🤖   │ ← Pulsing button
                                    │        │    with notification dot
                                    └────────┘
```

### State 2: Open (Chat Active)
```
                          ┌────────────────────────────┐
                          │ 🤖 AI Learning Assistant   │ ← Header
                          │ Ready to help              │
                          ├────────────────────────────┤
                          │                            │
                          │  🤖 Hi! I'm your AI...     │ ← AI message
                          │                            │
                          │         Why is the image   │ ← User message
                          │         inverted? 👤       │
                          │                            │
                          │  🤖 The image is inverted  │ ← AI response
                          │  because light rays...     │
                          │  📚 NCERT Ch 10, Page 168  │ ← RAG source
                          │                            │
                          ├────────────────────────────┤
                          │ [Type your question...] 📤 │ ← Input
                          └────────────────────────────┘
                                    ┌────────┐
                                    │   ✕    │ ← Close button
                                    └────────┘
```

### State 3: Thinking
```
                          ┌────────────────────────────┐
                          │ 🤖 AI Learning Assistant   │
                          │ Thinking... ⏳             │ ← Status
                          ├────────────────────────────┤
                          │                            │
                          │  🤖 Hi! I'm your AI...     │
                          │                            │
                          │         Explain focal      │
                          │         length to me 👤    │
                          │                            │
                          │  🤖 ...                    │ ← Loading
                          │     (animated dots)        │
                          │                            │
                          ├────────────────────────────┤
                          │ [Type your question...] 📤 │
                          └────────────────────────────┘
```

## 🎨 Design Tokens

### Colors
```css
/* Button */
--button-bg: linear-gradient(to bottom right, var(--primary), var(--accent));
--button-shadow: 0 25px 50px -12px rgba(var(--primary-rgb), 0.5);

/* Panel */
--panel-bg: rgba(255, 255, 255, 0.8); /* glass-strong */
--panel-border: rgba(var(--primary-rgb), 0.2);

/* Messages */
--ai-message-bg: var(--accent);
--user-message-bg: var(--primary);
--message-border-radius: 1rem;
```

### Dimensions
```css
/* Button */
--fab-size: 64px;
--fab-position: 24px; /* from bottom and right */

/* Panel */
--panel-width: 420px;
--panel-height: 600px;
--panel-border-radius: 16px;
--panel-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Spacing */
--panel-offset-from-button: 96px; /* button height + gap */
```

### Animations
```css
/* Button pulse */
@keyframes pulse {
  0%, 100% { scale: 1; opacity: 0.5; }
  50% { scale: 1.3; opacity: 0; }
}

/* Panel slide in */
@keyframes slideIn {
  from {
    opacity: 0;
    scale: 0.9;
    translateY: 20px;
  }
  to {
    opacity: 1;
    scale: 1;
    translateY: 0;
  }
}

/* Icon rotate */
@keyframes rotate {
  from { rotate: 90deg; }
  to { rotate: 0deg; }
}
```

## 🔄 Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Journey                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User lands on SimulationScreen                         │
│     ↓                                                       │
│  2. Sees pulsing chat button (bottom-right)                │
│     ↓                                                       │
│  3. Clicks button                                          │
│     ↓                                                       │
│  4. Chat panel slides in with greeting                     │
│     ↓                                                       │
│  5. Types question about simulation                        │
│     ↓                                                       │
│  6. Hits Enter or clicks Send                              │
│     ↓                                                       │
│  7. Message appears on right side                          │
│     ↓                                                       │
│  8. "AI is thinking..." indicator shows                    │
│     ↓                                                       │
│  9. API call to /api/ai/conversation/guide                 │
│     ↓                                                       │
│  10. AI response appears on left side                      │
│     ↓                                                       │
│  11. Shows RAG sources if used                             │
│     ↓                                                       │
│  12. User can continue conversation or close               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (>1024px)
- Full 420px × 600px panel
- Fixed bottom-right position
- All features visible

### Tablet (768px - 1024px)
- Slightly smaller panel: 380px × 550px
- Same position
- Adjusted spacing

### Mobile (<768px)
- Full-width panel: 100vw × 70vh
- Slides up from bottom
- Button moves to bottom-center

## 🎯 Click Targets

```
Interactive Elements:

1. Floating Button
   - Size: 64×64px ✅ (Meets 44×44 minimum)
   - Hover: Scale 110%
   - Active: Press effect

2. Close Button (X)
   - Size: 32×32px
   - Position: Top-right of panel
   - Hover: Red tint

3. Send Button
   - Icon only: 40×40px
   - Always visible
   - Disabled when empty/loading

4. Message Input
   - Full width minus padding
   - Min height: 40px
   - Expands with content
```

## 🌈 Accessibility Features

```
✓ Keyboard Navigation
  - Tab to button
  - Enter to open/close
  - Focus visible indicators

✓ Screen Reader Support
  - ARIA labels on icons
  - Message role="log"
  - Status announcements

✓ Color Contrast
  - Text: 4.5:1 minimum
  - Icons: 3:1 minimum
  - Focus indicators: Clear borders

✓ Motion Preferences
  - Respects prefers-reduced-motion
  - Instant transitions if requested
```

## 🎨 Theme Integration

The chatbot automatically adapts to:
- ✅ Light mode
- ✅ Dark mode
- ✅ Custom theme colors
- ✅ System preferences

Uses CSS variables from `tailwind.config.ts`:
- `--primary`
- `--accent`
- `--background`
- `--foreground`
- `--muted`
- `--border`

---

**Visual Design**: Modern, clean, non-intrusive, context-integrated
