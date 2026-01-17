# 🚀 Quick Setup Guide - Image Generation for Flashcards

## What You Need

**ONE THING:** Google Gemini API Key from Google AI Studio

---

## Step 1: Get Your API Key (2 minutes)

1. **Go to:** https://aistudio.google.com/
2. **Click:** "Get API Key" (top right)
3. **Click:** "Create API Key"
4. **Copy the key** (looks like: `AIzaSy...`)

---

## Step 2: Add to .env File (1 minute)

Open: `ai-service/.env`

Add this line:
```bash
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Replace with your actual key!

---

## Step 3: Restart AI Service

```bash
# Stop current AI service (Ctrl+C)
cd ai-service
python main.py
```

---

## What's Currently Happening

### Image Generation
- **Current:** Using placeholder images (simple text boxes with PIL/Pillow)
- **Location:** [visual_flashcards.py](agents/visual_flashcards.py) line 246 - `_generate_placeholder_image()`
- **Why:** Real image generation (Imagen) requires additional setup

### How It Works
1. Gemini generates **text concepts** ✅ (works now)
2. For each concept, tries to generate **real image** ❌ (falls back to placeholder)
3. Returns placeholder image with concept name ✅ (works now)

---

## To Enable Real Images

### Option 1: Google Imagen (Recommended - Same API Key!)

**Already in your code!** (Line 220-235 in visual_flashcards.py)

The code tries:
```python
imagen_model = genai.ImageGenerationModel("imagen-3.0-generate-001")
result = imagen_model.generate_images(...)
```

**But it's falling back to placeholders because:**
1. Imagen API might not be enabled in your Google Cloud project
2. The `google.generativeai` library might not support imagen yet
3. Different authentication might be needed

**To check if Imagen works:**
```bash
cd ai-service
python -c "
import google.generativeai as genai
import os
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
try:
    model = genai.ImageGenerationModel('imagen-3.0-generate-001')
    print('✅ Imagen available!')
except Exception as e:
    print(f'❌ Imagen not available: {e}')
"
```

---

### Option 2: Use OpenAI DALL-E (Alternative)

**If Imagen doesn't work, use DALL-E:**

1. **Get API Key:** https://platform.openai.com/api-keys

2. **Install:**
```bash
pip install openai
```

3. **Add to `.env`:**
```bash
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXX
```

4. **Update settings.py:**
Add to [config/settings.py](config/settings.py):
```python
OPENAI_API_KEY: str = ""
```

5. **Replace image generation in visual_flashcards.py:**

Find line 192 (`async def _generate_image(...)`) and replace the try block (lines 215-235) with:

```python
            # Method 1: Try OpenAI DALL-E
            try:
                import openai
                
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.images.generate(
                    model="dall-e-3",
                    prompt=image_prompt,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                )
                
                # Download and convert to base64
                import requests
                image_url = response.data[0].url
                img_data = requests.get(image_url).content
                img_str = base64.b64encode(img_data).decode()
                return f"data:image/png;base64,{img_str}"
                
            except Exception as e:
                logger.warning(f"DALL-E not available: {e}, using placeholder")
                return self._generate_placeholder_image(concept["name"])
```

---

## Testing With Better Logging

### 1. Start All Services

**Terminal 1 - AI Service:**
```bash
cd ai-service
python main.py
```
Look for startup message

**Terminal 2 - Backend:**
```bash
cd server
npm start
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### 2. Open Browser Console (F12)

This shows frontend logs

### 3. Complete Quiz

Go through learning flow to Quiz page

**You should see:**
- Frontend console: `🎨 Flashcard generation started in background`
- Backend terminal: `🤖 [Session xxx] Starting flashcard generation...`
- AI service terminal: Detailed logs with `===` separators

### 4. Go to Flashcards Page

Navigate through Puzzle → Reflection → Flashcards

**You should see:**
- Frontend console: Polling attempts `📡 [Attempt 1/30]...`
- Backend terminal: Session status
- AI service terminal: Image generation logs

---

## Understanding the Logs

### ✅ Success Pattern:

**AI Service Terminal:**
```
============================================================
🎨 VISUAL FLASHCARD GENERATION REQUEST
============================================================
Grade: 10
Subject: science  
Topic: reflection
============================================================

📚 Step 1: Retrieving NCERT context via RAG...
   ✅ Retrieved 1234 characters of context

💡 Step 2: Generating flashcard concepts with Gemini...
   ✅ Generated 4 concepts

🖼️  Step 3: Generating images for 4 concepts...
   🖼️  [1/4] Generating image for: Incident Ray
   ✅ [1/4] Successfully generated: Incident Ray
   🖼️  [2/4] Generating image for: Reflected Ray
   ✅ [2/4] Successfully generated: Reflected Ray
   ...

============================================================
🎉 GENERATION COMPLETE: 4/4 flashcards
   Success rate: 100.0%
============================================================
```

**Backend Terminal:**
```
🤖 [Session xxx] Starting flashcard generation...
   Grade: 10, Subject: science, Topic: reflection
   AI Service URL: http://localhost:8000/api/visual-flashcards/generate
📥 [Session xxx] Received response from AI service
   Response status: 200
✅ [Session xxx] Flashcards generated successfully: 4 cards
```

**Frontend Console:**
```
📡 [Attempt 1/30] Fetching flashcards for session: xxx
📡 Response status: 200 OK
📦 Received data: { status: "completed", flashcards: [...], count: 4 }
✅ Flashcards ready: 4 cards
```

---

### ❌ Error Patterns to Look For:

**1. API Key Missing:**
```
❌ FLASHCARD GENERATION FAILED
   Error: GEMINI_API_KEY not set
```
**Fix:** Add `GEMINI_API_KEY` to `.env`

**2. AI Service Not Running:**
```
❌ [Session xxx] AI service error: connect ECONNREFUSED
```
**Fix:** Start AI service (`python main.py`)

**3. Image Generation Failed (Using Placeholders):**
```
⚠️ Imagen not available: ..., using placeholder
✅ [1/4] Successfully generated: Incident Ray  ← Still succeeds with placeholder
```
**Fix:** This is OK for testing! Real images optional.

**4. No Session Found:**
```
Error: No flashcard session found
```
**Fix:** Start from Quiz page (generation must be triggered first)

---

## Current Status Summary

### ✅ What Works Now:
- Flashcard generation flow (fire-and-forget)
- Background generation while user works
- RAG-based concept generation with Gemini
- Placeholder images (text-based)
- Download ZIP/PDF
- Comprehensive logging

### ⏳ What Needs Setup:
- Real image generation (currently using placeholders)
- Add `GEMINI_API_KEY` to `.env`

### 🎯 To Get Real Images:
1. **Try Imagen first** (check if it works with your key)
2. **If not, use DALL-E** (needs separate key + code change)
3. **Or keep placeholders** (good enough for testing!)

---

## Quick Checklist

- [ ] Add `GEMINI_API_KEY` to `ai-service/.env`
- [ ] Restart AI service
- [ ] Test from Quiz page
- [ ] Check all 3 terminal logs
- [ ] Check browser console (F12)
- [ ] Verify flashcards show (even if placeholders)

---

## Cost Information

### Current (Placeholders):
- **Free!** No API costs

### With Real Images:
- **Google Imagen:** $0.04 per image (4 images = $0.16 per session)
- **OpenAI DALL-E:** $0.04 per image (4 images = $0.16 per session)
- **Gemini text generation:** $0.00015 per 1K tokens (~$0.001 per session)

**Total per learning session:** ~$0.16-0.17

---

## Next Steps

1. **Add API key and restart** (required)
2. **Test with placeholders** (works now)
3. **Enable real images later** (optional upgrade)

The system is functional with placeholders - you can test the full flow now! 🚀
