# 🔧 Flashcard Issues FIXED & Testing Guide

## ✅ What Was Fixed

### 1. **Port Mismatch (Main Issue!)**
- **Problem:** Backend was looking for AI service on port 8000
- **Reality:** AI service runs on port 8001  
- **Fixed:** Added `AI_SERVICE_URL=http://localhost:8001` to `server/.env`

### 2. **Added Comprehensive Logging**
Now you'll see **exactly** where things fail:
- **Frontend console (F12):** Each fetch attempt with response details
- **Backend terminal:** AI service calls with request/response data  
- **AI service terminal:** Step-by-step generation with progress

### 3. **Error Context**
- Full stack traces
- Response bodies logged
- Session tracking through entire flow

---

## 🚀 RESTART BACKEND (Required!)

**The .env change won't apply until you restart:**

```bash
# Terminal 2 - Stop current backend (Ctrl+C), then:
cd server
npm start
```

**Should see:**
```
Server running on port 9000
```

---

## 🧪 Testing Steps

### Step 1: Verify All Services Running

**Terminal 1 (AI Service):**
```bash
cd ai-service
python main.py
```
**Should show:** `Uvicorn running on http://0.0.0.0:8001` ✅

**Terminal 2 (Backend) - RESTART THIS:**
```bash
cd server  
npm start
```
**Should show:** `Server running on port 9000` ✅

**Terminal 3 (Frontend):**
```bash
npm run dev
```
**Should show:** `Local: http://localhost:5173/` ✅

### Step 2: Open Browser with DevTools

1. Go to: http://localhost:5173
2. **Press F12** to open DevTools
3. Click **Console** tab
4. Leave it open to see logs

### Step 3: Test Flashcard Generation

1. **Login** to your account
2. **Navigate** through: Home → Search → Plan → Optics → Simulation → **Quiz**
3. **Watch Console** - should see:
   ```
   🎨 Flashcard generation started in background
   Session ID: session_xxxxx
   ```

4. **Complete Quiz** (answer questions)
5. **Do Puzzle page** (~30 seconds)
6. **Do Reflection page** (~30 seconds)

**While you work, check AI Service Terminal** - should show:
```
============================================================
🎨 VISUAL FLASHCARD GENERATION REQUEST
============================================================
Grade: 10
Subject: science
Topic: reflection
============================================================
```

7. **Click Continue** on Reflection page → Goes to Flashcards

**Frontend Console will show:**
```
📡 [Attempt 1/30] Fetching flashcards for session: session_xxxxx
📡 Response status: 200 OK
📦 Received data: { status: "completed", flashcards: [Array(4)], count: 4 }
✅ Flashcards ready: 4 cards
```

---

## 📊 Expected Logs

### AI Service Terminal (Most Important!)
```bash
============================================================
🎨 VISUAL FLASHCARD GENERATION REQUEST
============================================================
Grade: 10
Subject: science
Topic: reflection of light
============================================================

📚 Step 1: Retrieving NCERT context via RAG...
📚 Retrieved 3 NCERT chunks
   ✅ Retrieved 1234 characters of context

💡 Step 2: Generating flashcard concepts with Gemini...
💡 Generated 4 flashcard concepts
   ✅ Generated 4 concepts

🖼️  Step 3: Generating images for 4 concepts...
   🖼️  [1/4] Generating image for: Incident Ray
   ⚠️ Imagen not available: 'ImageGenerationModel', using placeholder
   ✅ [1/4] Successfully generated: Incident Ray
   
   🖼️  [2/4] Generating image for: Reflected Ray
   ⚠️ Imagen not available: 'ImageGenerationModel', using placeholder
   ✅ [2/4] Successfully generated: Reflected Ray
   
   🖼️  [3/4] Generating image for: Normal Line
   ⚠️ Imagen not available: 'ImageGenerationModel', using placeholder
   ✅ [3/4] Successfully generated: Normal Line
   
   🖼️  [4/4] Generating image for: Angle of Incidence
   ⚠️ Imagen not available: 'ImageGenerationModel', using placeholder
   ✅ [4/4] Successfully generated: Angle of Incidence

============================================================
🎉 GENERATION COMPLETE: 4/4 flashcards
   Success rate: 100.0%
============================================================
```

### Backend Terminal
```bash
🤖 [Session session_xxxxx] Starting flashcard generation...
   Grade: 10, Subject: science, Topic: reflection of light
   AI Service URL: http://localhost:8001/api/visual-flashcards/generate

📥 [Session session_xxxxx] Received response from AI service
   Response status: 200
✅ [Session session_xxxxx] Flashcards generated successfully: 4 cards
```

### Browser Console (F12)
```javascript
🎨 Flashcard generation started in background
Session ID: session_1705503420123

// Later when you reach Flashcards page:
📡 [Attempt 1/30] Fetching flashcards for session: session_1705503420123
📡 Response status: 200 OK
📦 Received data: { 
  status: "completed", 
  flashcards: Array(4),
  count: 4 
}
✅ Flashcards ready: 4 cards
```

---

## ❌ Troubleshooting

### Error: "connect ECONNREFUSED ::1:8001"

**Cause:** Backend can't reach AI service

**Check:**
1. Is AI service running? Look at Terminal 1
2. Does it show "Uvicorn running on http://0.0.0.0:8001"?
3. Did you restart backend after adding AI_SERVICE_URL?

**Fix:**
```bash
# Terminal 1
cd ai-service
python main.py

# Terminal 2 (RESTART!)
cd server
npm start
```

---

### Error: "No flashcard session found"

**Cause:** Didn't go through Quiz page first

**Fix:** Must start from Quiz page - it triggers generation

---

### Error: "Failed to fetch flashcards"

**Cause:** Backend not responding

**Check Backend Terminal logs:**
- Any errors?
- Is it showing the request?

**Frontend Console shows:**
```javascript
📡 [Attempt 1/30] Fetching flashcards for session: xxx
❌ Failed to fetch flashcards: 500 Internal Server Error
```

**Fix:** Check what backend terminal says

---

### Warning: "Imagen not available, using placeholder"

**This is NORMAL!** Not an error.

**What it means:**
- Real image generation (Google Imagen) isn't set up
- System uses placeholder images (text boxes) instead
- **Flashcards still work!**

**To enable real images:** See [SETUP_IMAGES.md](ai-service/SETUP_IMAGES.md)

---

## ✅ Success Checklist

After testing, you should have:

- [x] All 3 services running (AI, backend, frontend)
- [x] Generation logs in AI service terminal
- [x] Response logs in backend terminal  
- [x] Fetch logs in browser console
- [x] 4 flashcards displayed (with placeholder images)
- [x] Can swipe/navigate flashcards
- [x] Can download ZIP or PDF

---

## 🎯 What to Check in Each Terminal

| Terminal | What to Look For | Success Indicator |
|----------|------------------|-------------------|
| **AI Service** | Generation logs with `===` bars | `🎉 GENERATION COMPLETE: 4/4 flashcards` |
| **Backend** | AI service calls | `✅ Flashcards generated successfully: 4 cards` |
| **Browser Console** | Polling attempts | `✅ Flashcards ready: 4 cards` |

---

## 📝 Quick Debug Commands

### Test AI Service directly:
```bash
curl -X POST "http://localhost:8001/api/visual-flashcards/generate?grade=10&subject=science&topic=reflection"
```

### Check if backend can reach AI service:
```bash
# From server directory:
curl http://localhost:8001/health
```

Should return: `{"status": "healthy", ...}`

---

## 🚨 If Still Having Issues

**Capture this info:**

1. **AI Service Terminal** - Last 50 lines
2. **Backend Terminal** - Last 50 lines  
3. **Browser Console (F12)** - All errors
4. **What step failed?** (Quiz? Puzzle? Flashcards page?)

With the new detailed logging, we can pinpoint the exact issue! 🔍

---

## 📚 More Documentation

- **[SETUP_IMAGES.md](ai-service/SETUP_IMAGES.md)** - How to enable real image generation
- **[visual_flashcards.py](ai-service/agents/visual_flashcards.py)** - The generator code
- **[flashcards.js](server/routes/flashcards.js)** - Backend routes
- **[FlashcardsScreen.tsx](src/components/flashcards/FlashcardsScreen.tsx)** - Frontend UI
