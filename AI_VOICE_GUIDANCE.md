# AI Voice Guidance Feature - Documentation

## Overview

The AI Voice Guidance system provides an interactive, speech-enabled learning experience for students. The AI tutor guides students through simulations step-by-step using voice, answers questions via voice input, and helps students understand concepts through auditory learning.

## Features

### 🎙️ AI Voice Guide Component

Located at: `src/components/simulation/AIVoiceGuide.tsx`

**Key Features:**
- **Auto-Start Introduction**: Automatically welcomes students and introduces the simulation topic
- **Step-by-Step Guidance**: Provides 6-7 guided steps for each simulation type
- **Voice Controls**: Play, Pause, Resume, Stop, Next Step, Restart
- **Voice Commands**: Students can control the guide using voice ("next", "pause", "restart", "help", "tip")
- **Adjustable Settings**: Volume and speed controls
- **Progress Tracking**: Visual progress bar showing current step
- **Smart Pausing**: Pauses after important steps to let students experiment
- **Random Tips**: Educational tips related to the topic
- **Text Display**: Shows what's currently being spoken

**Supported Simulations:**
- Photosynthesis
- Electric Circuits
- (Easily extensible for more topics)

### 💬 Enhanced AI Chat Panel

Located at: `src/components/simulation/AIChatPanel.tsx`

**New Features:**
- **Voice Input**: Microphone button to ask questions using voice
- **Voice Output**: "Read aloud" buttons on AI responses
- **Auto-Speak Mode**: Toggle to automatically speak all AI responses
- **Visual Feedback**: Animated microphone when listening
- **Speech Recognition**: Converts student's speech to text automatically

## How It Works

### For Students:

1. **Simulation Loads**
   - AI Voice Guide automatically appears in bottom-left corner
   - After 1 second, AI introduces the topic via speech
   - Students can pause, adjust volume, or skip intro

2. **Guided Learning**
   - AI speaks each step clearly
   - Students can pause after each instruction to experiment
   - Click "Next Step" or say "next" to continue
   - Progress bar shows completion status

3. **Voice Interaction**
   - Click microphone button in Voice Guide or Chat Panel
   - Speak naturally (e.g., "What is photosynthesis?", "Give me a tip", "Next step")
   - AI responds both in text and voice (if auto-speak enabled)

4. **Independent Exploration**
   - After guided steps complete, students can ask questions freely
   - Use voice or text input in chat panel
   - AI provides contextual help and explanations

### Technical Implementation:

**Speech Synthesis (Text-to-Speech):**
```typescript
const utterance = new SpeechSynthesisUtterance(text);
utterance.volume = 0.8; // Adjustable
utterance.rate = 1;     // Adjustable (0.5x to 2x)
utterance.pitch = 1;
window.speechSynthesis.speak(utterance);
```

**Speech Recognition (Voice-to-Text):**
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.start();
```

## Voice Commands

Students can use these voice commands:

| Command | Action |
|---------|--------|
| "next" / "continue" | Move to next step |
| "pause" / "stop" | Pause voice guidance |
| "restart" / "start over" | Restart from beginning |
| "help" | Get help on available commands |
| "tip" / "give me a tip" | Get a random educational tip |
| Any question | Sends to AI for response |

## Browser Compatibility

**Speech Synthesis (Voice Output):**
- ✅ Chrome/Edge: Full support
- ✅ Safari: Full support
- ✅ Firefox: Full support
- ⚠️ All modern browsers supported

**Speech Recognition (Voice Input):**
- ✅ Chrome: Full support
- ✅ Edge: Full support
- ✅ Safari: Full support (iOS 14.5+)
- ❌ Firefox: Not supported (uses alternative polyfill if needed)

## Customization

### Adding New Simulation Guidance

Edit `AIVoiceGuide.tsx` and add to `simulationGuidance` object:

```typescript
const simulationGuidance: Record<string, {...}> = {
  yourSimulation: {
    intro: "Welcome message for your simulation...",
    steps: [
      {
        id: 1,
        text: "First instruction...",
        pauseAfter: true
      },
      // Add 5-7 steps
    ],
    tips: [
      "Educational tip 1",
      "Educational tip 2",
      // Add 3-5 tips
    ]
  }
};
```

### Adjusting Voice Settings

**Default Volume:** Line 154 in AIVoiceGuide.tsx
```typescript
const [volume, setVolume] = useState([0.8]); // 0.0 to 1.0
```

**Default Speed:** Line 155 in AIVoiceGuide.tsx
```typescript
const [rate, setRate] = useState([1]); // 0.5 to 2.0
```

**Auto-Start Delay:** Line 217 in AIVoiceGuide.tsx
```typescript
setTimeout(() => {
  speakText(guidance.intro);
}, 1000); // milliseconds
```

## User Experience Flow

```
Student opens simulation
         ↓
Voice Guide appears (bottom-left)
         ↓
AI speaks introduction (1s delay)
         ↓
Student listens & can adjust settings
         ↓
AI guides through steps one-by-one
         ↓
Student experiments after each step
         ↓
Student clicks "Next" or says "next"
         ↓
Continues until all steps complete
         ↓
Student explores independently
         ↓
Student can ask questions via voice/text
         ↓
AI responds with voice + text
```

## Accessibility Features

- **Visual Indicators**: Shows what's being spoken in text
- **Adjustable Speed**: Slower speech for better comprehension
- **Pause/Resume**: Control learning pace
- **Text Alternatives**: All voice content also shown as text
- **Keyboard Support**: All controls accessible via keyboard
- **Screen Reader Compatible**: Semantic HTML structure

## Best Practices for Students

1. **Use Headphones**: For better audio quality in quiet environments
2. **Enable Microphone**: Grant permission for voice commands
3. **Speak Clearly**: Natural pace, clear pronunciation
4. **Quiet Environment**: Reduce background noise for better recognition
5. **Follow Steps**: Complete each guided step before moving on
6. **Ask Questions**: Use voice or text to ask anything you don't understand

## Troubleshooting

**Voice not working:**
- Check browser supports Web Speech API
- Ensure volume is not muted
- Try reloading the page
- Check system audio settings

**Microphone not working:**
- Grant microphone permission in browser
- Check system microphone access
- Use Chrome or Edge for best compatibility
- Check microphone is not used by another app

**Voice commands not recognized:**
- Speak clearly and at normal pace
- Ensure quiet environment
- Check microphone is working
- Try typing the command instead

## Future Enhancements

Potential improvements:
- Multiple language support
- Customizable voice selection
- Conversation history export
- Voice interaction analytics
- AI personality customization
- Background music option
- Study group voice chat integration

## Performance Considerations

- Voice synthesis is client-side (no server load)
- Speech recognition is client-side (no data sent to server)
- Minimal memory footprint
- No impact on simulation performance
- Graceful degradation if APIs unavailable

## Privacy & Security

- All voice processing happens in the browser
- No audio is recorded or stored
- No voice data sent to external servers
- Speech recognition uses browser's built-in API
- Full GDPR compliance

---

**Version:** 1.0
**Last Updated:** December 30, 2025
**Compatibility:** Modern browsers with Web Speech API support
