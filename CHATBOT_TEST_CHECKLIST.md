# ✅ AI Chatbot Integration - Test Checklist

## 🧪 Pre-Flight Checks

### Backend Status
- [ ] Backend server running on port 9000
- [ ] `/api/ai/conversation/guide` endpoint accessible
- [ ] JWT authentication working
- [ ] AI service connected (Gemini/RAG)

### Frontend Status
- [ ] Vite dev server running
- [ ] No TypeScript errors
- [ ] All imports resolved
- [ ] Authentication store initialized

## 🎯 Functionality Tests

### 1. Visual Appearance
- [ ] Floating button appears at bottom-right
- [ ] Button has gradient background
- [ ] Pulsing animation visible
- [ ] Green notification dot present
- [ ] Button doesn't overlap content

### 2. Opening/Closing
- [ ] Click button → chat panel slides in
- [ ] Panel appears above button
- [ ] Panel size: ~420px × 600px
- [ ] Panel has close button (X)
- [ ] Click X → panel closes smoothly
- [ ] Click floating button when open → panel closes
- [ ] Animations are smooth

### 3. Chat Interface
- [ ] Initial greeting message visible
- [ ] AI message on left with bot icon
- [ ] Input box at bottom
- [ ] Send button visible
- [ ] Header shows "AI Learning Assistant"
- [ ] Status shows "Ready to help"

### 4. Message Sending
- [ ] Type in input box
- [ ] Text appears correctly
- [ ] Click Send → message appears on right
- [ ] User message has correct styling
- [ ] Input clears after sending
- [ ] Status changes to "Thinking..."

### 5. AI Response
- [ ] AI responds within reasonable time
- [ ] Response appears on left side
- [ ] Bot icon visible
- [ ] Message formatted correctly
- [ ] Markdown rendered (if applicable)
- [ ] Math equations render (KaTeX)

### 6. Context Awareness
Test these questions and verify responses use simulation context:

- [ ] **Q**: "What am I learning?"
  - Should reference current scenario/topic
  
- [ ] **Q**: "Explain this concept"
  - Should explain based on current simulation
  
- [ ] **Q**: "Why is the image inverted?"
  - Should reference optical simulation setup
  
- [ ] **Q**: "Give me a hint"
  - Should provide task-specific hint
  
- [ ] **Q**: "What's next?"
  - Should guide to next learning step

### 7. RAG Integration
- [ ] Ask NCERT-related question
- [ ] Response includes RAG sources
- [ ] Chapter name displayed
- [ ] Page number shown
- [ ] Excerpt/citation visible
- [ ] Confidence score present

### 8. Error Handling
- [ ] Network error → fallback message shown
- [ ] Invalid response → graceful error
- [ ] Loading timeout → user notified
- [ ] Empty input → send disabled
- [ ] Auth error → appropriate message

### 9. Performance
- [ ] Chat opens instantly (<200ms)
- [ ] Messages render quickly
- [ ] No lag when typing
- [ ] Smooth scrolling
- [ ] No memory leaks (test extended use)

### 10. Edge Cases
- [ ] Long messages → proper wrapping
- [ ] Multiple rapid sends → queued correctly
- [ ] Special characters → handled properly
- [ ] Emoji support → renders correctly
- [ ] Code blocks → formatted nicely
- [ ] Math equations → LaTeX renders

## 🔄 Integration Tests

### Scenario Context
- [ ] `scenarioId` passed correctly
- [ ] `currentTaskId` available
- [ ] Context includes greeting
- [ ] Context includes scenario description
- [ ] Context includes key concepts
- [ ] Simulation config present

### Learning Store Integration
- [ ] `aiScenarioData` accessible
- [ ] `currentScenario` available
- [ ] Task completion works (if implemented)
- [ ] Progress tracking synced

### Auth Integration
- [ ] JWT token included in requests
- [ ] Unauthorized → appropriate handling
- [ ] Token refresh works
- [ ] Logout → chat gracefully handles

## 📱 Cross-Browser Tests

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers (if responsive implemented)
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Firefox Mobile

## ♿ Accessibility Tests

### Keyboard Navigation
- [ ] Tab to floating button
- [ ] Enter to open
- [ ] Tab through messages
- [ ] Tab to input
- [ ] Enter to send
- [ ] Esc to close (optional)

### Screen Reader
- [ ] Button has label
- [ ] Messages announced
- [ ] Status changes announced
- [ ] Input has label

### Visual
- [ ] High contrast mode works
- [ ] Zoom to 200% → still usable
- [ ] Focus indicators visible

## 🚨 Common Issues & Solutions

### Issue: Button not visible
**Solution**: Check z-index, ensure `fixed` positioning

### Issue: API calls failing
**Solution**: Verify backend URL, check CORS, confirm auth token

### Issue: No response from AI
**Solution**: Check backend logs, verify scenario data, test API directly

### Issue: Messages not scrolling
**Solution**: Check ScrollArea component, verify ref attachment

### Issue: Panel overlapping content
**Solution**: Adjust z-index, check positioning conflicts

### Issue: Animations choppy
**Solution**: Reduce motion complexity, check CSS will-change property

## 📊 Test Data

### Sample Questions to Test

**Conceptual:**
- "What is focal length?"
- "Explain image formation"
- "Why do we see rainbows?"

**Simulation-Specific:**
- "What happens if I increase focal length?"
- "Why is my image blurred?"
- "How does object distance affect image?"

**Task-Related:**
- "Give me a hint for task 1"
- "Am I on the right track?"
- "What should I do next?"

**NCERT-Related:**
- "What does NCERT say about this?"
- "Show me examples from the textbook"
- "Which chapter covers this?"

**Meta:**
- "How does this work?"
- "Can you help me understand?"
- "I'm stuck, what now?"

## ✅ Success Criteria

### Must Have:
✅ Button visible and clickable
✅ Panel opens/closes smoothly
✅ Messages send and receive
✅ AI provides context-aware responses
✅ No errors in console
✅ Auth works properly

### Nice to Have:
- RAG sources displayed
- Typing indicators
- Message timestamps
- Confidence scores
- Follow-up suggestions

## 🎉 Final Verification

After all tests pass:

- [ ] Code committed
- [ ] Documentation updated
- [ ] Team demo prepared
- [ ] User guide created
- [ ] Known issues logged
- [ ] Metrics tracking added (optional)

---

## 🐛 Bug Report Template

```markdown
**Issue**: [Brief description]

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**: 

**Actual Behavior**: 

**Screenshots**: 

**Console Errors**: 

**Environment**:
- Browser: 
- OS: 
- Screen size: 

**Additional Context**: 
```

---

## 📝 Test Results Log

| Test | Status | Notes | Tester | Date |
|------|--------|-------|--------|------|
| Visual Appearance | ⬜ | | | |
| Opening/Closing | ⬜ | | | |
| Message Sending | ⬜ | | | |
| AI Response | ⬜ | | | |
| Context Awareness | ⬜ | | | |
| RAG Integration | ⬜ | | | |
| Error Handling | ⬜ | | | |
| Performance | ⬜ | | | |

Legend: ✅ Pass | ❌ Fail | ⚠️ Partial | ⬜ Not Tested

---

**Start Testing**: Run `npm run dev` and navigate to any simulation screen!
