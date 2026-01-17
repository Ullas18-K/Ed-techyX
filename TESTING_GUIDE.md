# 🧪 Quick Testing Guide - New SimulationScreen

## Prerequisites
1. AI service running on port 8001
2. Frontend dev server running
3. User logged in

---

## Test Scenario: Magnification in Optics

### Step 1: Start Services

**Terminal 1 - AI Service**:
```bash
cd ai-service
uvicorn main:app --reload --port 8001
```

**Terminal 2 - Frontend**:
```bash
cd c:\Users\rahul\Desktop\EdTech
npm run dev
```

---

### Step 2: Navigate Through Flow

1. **Home Screen**
   - Enter question: `"Explain magnification in optics"`
   - Click submit/generate

2. **Thinking Screen (AI Processing)**
   - Watch for: "Generating AI scenario..."
   - Both APIs called in parallel here
   - Should complete in ~30-60 seconds

3. **Learning Plan Screen**
   - Shows AI-generated learning plan
   - Click "Start Learning" or equivalent button

4. **🎯 NEW SimulationScreen** ← This is what we built!

---

### Step 3: Verify SimulationScreen

#### Left Column Checklist:
- [ ] ✅ Welcome card with AI greeting visible
- [ ] ✅ "Overview" section shows scenario description
- [ ] ✅ "Key Concepts" section displays numbered concepts
- [ ] ✅ Concepts are expandable (click to reveal details)
- [ ] ✅ Tabs visible: "Notes" and "Formulas & Derivations"
- [ ] ✅ Clicking tabs switches content
- [ ] ✅ Notes tab shows detailed learning notes
- [ ] ✅ Formulas tab shows mathematical formulas
- [ ] ✅ Math renders correctly (no raw LaTeX)

#### Right Column Checklist:
- [ ] ✅ Header shows "Practice Questions" title
- [ ] ✅ Question count displayed (e.g., "5 questions")
- [ ] ✅ Question cards render correctly
- [ ] ✅ Year badges visible (e.g., "[2014]")
- [ ] ✅ Source badges visible ("PYQ" or "AI Generated")
- [ ] ✅ Question text readable
- [ ] ✅ "Show Answer" button on each question
- [ ] ✅ Clicking button reveals answer section
- [ ] ✅ Answer text displayed
- [ ] ✅ Explanation text displayed
- [ ] ✅ Page reference visible (e.g., "NCERT Page 168")

#### Navigation Checklist:
- [ ] ✅ "Home" button in header works
- [ ] ✅ "Continue to Quiz" button in header works
- [ ] ✅ Clicking "Continue to Quiz" advances to quiz phase

---

### Step 4: Test Interactions

#### Expand/Collapse Tests:
1. Click on first key concept
   - Should expand to show details
2. Click again
   - Should collapse
3. Expand multiple concepts simultaneously
   - All should work independently

#### Tab Switching Tests:
1. Click "Notes" tab
   - Should show notes content
2. Click "Formulas & Derivations" tab
   - Should show formulas
   - Math should render properly
3. Switch back and forth
   - Content should update smoothly

#### Question Answer Tests:
1. Click "Show Answer" on first question
   - Answer section should expand
   - Answer should be visible
   - Explanation should be visible
2. Click "Hide Answer"
   - Should collapse
3. Expand multiple questions
   - Each should work independently

---

### Step 5: Visual Checks

#### Layout:
- [ ] ✅ Two columns clearly visible
- [ ] ✅ Left column ~50% width
- [ ] ✅ Right column ~50% width
- [ ] ✅ Vertical divider between columns
- [ ] ✅ Both columns scrollable independently
- [ ] ✅ Header stays fixed at top

#### Styling:
- [ ] ✅ Clean, professional look
- [ ] ✅ NOT game-like
- [ ] ✅ Cards have subtle shadows
- [ ] ✅ Colors: Primary blue, muted backgrounds
- [ ] ✅ Text readable and well-spaced
- [ ] ✅ Animations smooth (expand/collapse)

#### Content:
- [ ] ✅ All text from AI API visible
- [ ] ✅ All PYQ questions visible
- [ ] ✅ No "undefined" or "null" displayed
- [ ] ✅ No console errors in browser
- [ ] ✅ No TypeScript errors

---

### Step 6: Network Check

Open browser DevTools → Network tab:

1. **During Thinking phase**, verify requests:
   - [ ] ✅ POST to `/api/ai/scenario/generate`
   - [ ] ✅ POST to `http://localhost:8001/api/questions/practice`
   - [ ] ✅ Both return 200 OK
   - [ ] ✅ Both return valid JSON

2. **Check Response Data**:
   - Scenario API returns:
     ```json
     {
       "success": true,
       "data": {
         "scenarioId": "...",
         "title": "...",
         "greeting": "...",
         "keyConcepts": [...],
         ...
       }
     }
     ```
   - PYQ API returns:
     ```json
     {
       "questions": [...],
       "totalCount": 5,
       "pyqCount": 3,
       "generatedCount": 2,
       ...
     }
     ```

---

### Step 7: Edge Cases

Test these scenarios:

1. **No PYQ Data**
   - If PYQ API fails, right column should show:
     "Loading practice questions..." or similar

2. **Empty Formulas**
   - If no formulas, Formulas tab should show:
     "No formulas or derivations available"

3. **Long Content**
   - Scroll both columns independently
   - Content should not overflow

4. **Many Questions**
   - Right column should scroll smoothly
   - All questions accessible

---

### Step 8: Console Checks

Open browser console, look for:

✅ **Expected Logs**:
```
🚀 Fetching AI scenario and PYQs in parallel...
🤖 Generating AI scenario for: Explain magnification in optics
📚 Fetching practice questions for: Explain magnification in optics
✅ AI scenario generated successfully: scenario_123
✅ Fetched 5 practice questions
```

❌ **No Errors**:
- No red error messages
- No "Cannot read property" errors
- No "undefined is not a function"
- No 404 or 500 errors

---

## 🎯 Success Criteria

All of these should be TRUE:

- [x] Both APIs called in parallel during Thinking phase
- [x] SimulationScreen renders after Learning Plan
- [x] Left column shows AI theory content
- [x] Right column shows PYQ questions
- [x] Expandable elements work correctly
- [x] Tabs switch properly
- [x] Math formulas render (KaTeX)
- [x] Questions can reveal answers
- [x] Navigation works (Home, Continue to Quiz)
- [x] No console errors
- [x] Clean, professional UI
- [x] NOT game-like or simulation-like

---

## 🐛 Troubleshooting

### Problem: "Loading learning content..."
- **Cause**: APIs not returning data
- **Fix**: Check AI service is running on port 8001
- **Check**: Network tab for failed requests

### Problem: Math formulas show raw LaTeX
- **Cause**: KaTeX not rendering
- **Fix**: Verify `katex/dist/katex.min.css` imported
- **Check**: Console for KaTeX errors

### Problem: Questions not showing
- **Cause**: PYQ API failed or returned empty
- **Fix**: Check `http://localhost:8001/api/questions/practice` endpoint
- **Check**: Console logs for PYQ fetch errors

### Problem: State shows old data
- **Cause**: State not cleared between sessions
- **Fix**: Refresh page or reset session
- **Check**: localStorage cleared

---

## ✅ Test Complete When:

1. You can submit a question
2. Wait for AI processing
3. See the new SimulationScreen
4. Explore both columns
5. Expand concepts and answers
6. Switch tabs
7. Navigate to Quiz

**If all above work → Implementation successful!** 🎉

---

## 📸 Screenshot Checklist

Take screenshots of:
1. Thinking screen (shows parallel API loading)
2. SimulationScreen - full view
3. SimulationScreen - left column (greeting, concepts, tabs)
4. SimulationScreen - right column (questions, answers)
5. Expanded key concept
6. Expanded question answer
7. Formulas tab with KaTeX rendering
8. Browser console (showing successful API calls)
9. Network tab (showing both API requests)

---

**Happy Testing!** 🚀
