# 🤖 AI Chatbot - Quick Reference

## 🚀 1-Minute Setup Verification

```bash
# 1. Check files exist
ls src/components/simulation/SimulationAIBot.tsx  ✓
ls src/components/simulation/SimulationScreen.tsx  ✓

# 2. No TypeScript errors
npm run build  # Should succeed

# 3. Start app
npm run dev

# 4. Test
Navigate to simulation → See floating button bottom-right → Click → Chat!
```

## 📁 What Changed

```
src/components/simulation/
├── SimulationAIBot.tsx          ← NEW (133 lines)
├── SimulationScreen.tsx         ← MODIFIED (+2 lines)
└── AIContextChat.tsx            ← EXISTING (reused)
```

## 🎯 Component Props

```typescript
<SimulationAIBot
  scenarioId="string"          // Required
  currentTaskId={number}       // Required  
  context={object}             // Required
  onTaskComplete={(id) => {}}  // Optional
/>
```

## 🎨 Visual Specs

| Element | Size | Position | Color |
|---------|------|----------|-------|
| Button | 64×64px | Fixed bottom-right | Primary gradient |
| Panel | 420×600px | Above button | Glass-strong |
| Z-index | 40/50 | Floats above | - |

## 🔗 API Endpoint

```
POST /api/ai/conversation/guide

Request:
{
  scenario_id: string
  current_task_id: number
  student_input: string
  context: object
}

Response:
{
  response: string
  action: string
  rag_used: boolean
  rag_sources: array
  confidence: number
}
```

## 🎭 User Flow

```
Click 🤖 → Panel opens → Type question → Hit Enter → AI responds
```

## 🔧 Quick Customizations

### Change Button Color
```tsx
// SimulationAIBot.tsx line ~72
className="bg-gradient-to-br from-purple-500 to-pink-500"
```

### Change Panel Size
```tsx
// SimulationAIBot.tsx line ~34
className="w-[500px] h-[700px]"
```

### Make Task ID Dynamic
```tsx
// SimulationScreen.tsx
const [taskId, setTaskId] = useState(1);
<SimulationAIBot currentTaskId={taskId} />
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not visible | Check z-index, verify component mounted |
| API fails | Check backend running, verify token |
| No response | Check console errors, test endpoint directly |
| Panel overlaps | Adjust positioning in SimulationAIBot.tsx |

## 📚 Documentation

| File | Purpose |
|------|---------|
| `AI_CHATBOT_INTEGRATION.md` | Overview & data flow |
| `CHATBOT_VISUAL_GUIDE.md` | UI/UX specifications |
| `CHATBOT_TEST_CHECKLIST.md` | Testing procedures |
| `CHATBOT_DEVELOPER_GUIDE.md` | Customization guide |
| `CHATBOT_IMPLEMENTATION_SUMMARY.md` | Complete summary |

## ✅ Checklist

- [x] SimulationAIBot.tsx created
- [x] SimulationScreen.tsx updated
- [x] TypeScript errors: None
- [x] Existing logic: Untouched
- [x] Documentation: Complete
- [ ] Manual testing: TODO
- [ ] Backend integration: TODO
- [ ] User testing: TODO

## 🎯 Success Metrics

- ✅ No breaking changes
- ✅ Type-safe code
- ✅ Reuses existing components
- ✅ Self-contained state
- ✅ Comprehensive docs

## 🚀 Go Live

```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend  
npm run dev

# Browser
http://localhost:5173 → Simulation → 🤖 Chat!
```

## 💡 Pro Tips

1. **Context is king**: Bot is only as smart as the context you provide
2. **Task IDs matter**: Make them dynamic for better guidance
3. **RAG sources**: Show these to build student trust
4. **Error handling**: Already implemented, but monitor in production
5. **Mobile**: Add responsive design for mobile users

## 🎨 Style Guide

```typescript
// Consistent with existing design system
- Glass effects: glass-card, glass-strong
- Colors: primary, accent, foreground, background
- Spacing: 4px grid (p-4, gap-4, etc.)
- Rounded: rounded-xl, rounded-2xl
- Shadows: shadow-xl, shadow-2xl
```

## 🔥 One-Liners

**What is it?** Context-aware AI chatbot for simulations
**Where?** Bottom-right floating button
**How?** Click → Chat → Get AI help
**Why?** Students need real-time guidance
**Status?** ✅ Ready to test

## 📞 Need Help?

1. Check documentation files
2. Review code comments
3. Test with checklist
4. Debug with console logs

---

**TL;DR**: Floating AI chat button added to simulations. Click it, ask questions, get context-aware answers. Zero breaking changes. Fully documented. Ready to test! 🚀
