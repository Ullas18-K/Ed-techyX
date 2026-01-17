# 🎨 How to Add Real Image Generation

## Current Status: Using Placeholders ✅

The system is **working right now** with placeholder images (text boxes). This is fine for testing!

---

## Why No Imagen?

The error you saw:
```
'google.generativeai' has no attribute 'ImageGenerationModel'
```

This is **normal** - the `google-generativeai` library doesn't include image generation. Imagen requires a different SDK.

---

## 3 Easy Options for Real Images

### Option 1: OpenAI DALL-E (Recommended - Easiest!)

**Cost:** $0.04 per image

**Setup (5 minutes):**

1. **Get API Key:** https://platform.openai.com/api-keys
   - Sign up / Login
   - Click "Create new secret key"
   - Copy the key (starts with `sk-proj-...`)

2. **Install:**
```bash
cd ai-service
pip install openai
```

3. **Add to `.env`:**
```bash
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXX
```

4. **Add to `config/settings.py`:**
```python
OPENAI_API_KEY: str = ""  # Add this line after GEMINI_API_KEY
```

5. **Update `visual_flashcards.py` line 215:**

Replace the entire try block (lines 215-233) with:

```python
        try:
            # OpenAI DALL-E Image Generation
            import openai
            from openai import OpenAI
            
            if not settings.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY not set, using placeholder")
                return self._generate_placeholder_image(concept["name"])
            
            logger.info(f"   🎨 Generating real image with DALL-E: {concept['name']}")
            
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.images.generate(
                model="dall-e-3",
                prompt=image_prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            
            # Download image and convert to base64
            import requests
            image_url = response.data[0].url
            img_data = requests.get(image_url).content
            img_str = base64.b64encode(img_data).decode()
            
            logger.info(f"   ✅ Real image generated for: {concept['name']}")
            return f"data:image/png;base64,{img_str}"
                
        except Exception as e:
            logger.error(f"❌ DALL-E failed: {e}, using placeholder")
            return self._generate_placeholder_image(concept["name"])
```

6. **Restart AI service:**
```bash
python main.py
```

**Done!** Now generates real images! 🎨

---

### Option 2: Stability AI (Cheapest!)

**Cost:** $0.002 per image (50x cheaper!)

**Setup:**

1. **Get API Key:** https://platform.stability.ai/account/keys
   - Create account
   - Generate API key

2. **Add to `.env`:**
```bash
STABILITY_API_KEY=sk-XXXXXXXXXXXXXXX
```

3. **Add to `config/settings.py`:**
```python
STABILITY_API_KEY: str = ""
```

4. **Update `visual_flashcards.py` line 215:**

```python
        try:
            # Stability AI Image Generation
            import requests
            
            if not settings.STABILITY_API_KEY:
                logger.warning("STABILITY_API_KEY not set, using placeholder")
                return self._generate_placeholder_image(concept["name"])
            
            logger.info(f"   🎨 Generating real image with Stability AI: {concept['name']}")
            
            response = requests.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.STABILITY_API_KEY}",
                },
                json={
                    "text_prompts": [{"text": image_prompt}],
                    "cfg_scale": 7,
                    "height": 768,
                    "width": 1024,
                    "samples": 1,
                    "steps": 30,
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                img_base64 = data["artifacts"][0]["base64"]
                logger.info(f"   ✅ Real image generated for: {concept['name']}")
                return f"data:image/png;base64,{img_base64}"
            else:
                raise Exception(f"API error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ Stability AI failed: {e}, using placeholder")
            return self._generate_placeholder_image(concept["name"])
```

---

### Option 3: Google Vertex AI Imagen (Complex)

**Cost:** $0.04 per image

**Setup:** Requires Google Cloud project setup, service accounts, etc. Not recommended unless you're already using Vertex AI.

**Skip this unless you need it!**

---

## What I Recommend

### For Testing Now:
**Keep placeholders!** They work fine and let you test the full flow.

### For Production Later:
1. **Start with OpenAI DALL-E** (easiest to set up)
2. **Switch to Stability AI later** if you want to save money

---

## Current Working State

Right now your system:
- ✅ Generates flashcard concepts with Gemini
- ✅ Creates placeholder images (text boxes)
- ✅ Returns 4-5 flashcards
- ✅ Full download support (ZIP/PDF)
- ✅ Background generation (no blocking)

**This is good enough to test everything!**

---

## When to Add Real Images

Add real images when:
- You want to show to users (placeholders look basic)
- You need actual educational diagrams
- You're ready to spend $0.04-0.16 per user session

Don't need real images yet if:
- Just testing the flow
- Verifying the feature works
- Developing other parts

---

## Quick Comparison

| Service | Setup Time | Cost/Image | Quality | Recommendation |
|---------|-----------|------------|---------|----------------|
| **Placeholders** | 0 min | Free | Basic text | ✅ Use now |
| **OpenAI DALL-E** | 5 min | $0.04 | Excellent | ✅ Best for production |
| **Stability AI** | 5 min | $0.002 | Good | 💰 Best price |
| **Vertex AI Imagen** | 30+ min | $0.04 | Excellent | ❌ Too complex |

---

## Testing Without Real Images

You can fully test:
- ✅ Flashcard generation flow
- ✅ Background async processing
- ✅ Frontend UI (swipe, navigate)
- ✅ Downloads (ZIP/PDF)
- ✅ Session management
- ✅ All the logging

The placeholders prove everything works!

---

## Next Steps

### Today:
1. Keep using placeholders ✅
2. Test the full flow ✅
3. Verify everything works ✅

### Later (when ready):
1. Choose: OpenAI DALL-E or Stability AI
2. Get API key (5 minutes)
3. Update code (copy-paste from above)
4. Restart and test real images

---

## Summary

**The error is normal** - that library doesn't support images.

**Your system works!** - It's using placeholders successfully.

**To add real images:** Follow Option 1 (DALL-E) above when ready.

**For now:** Test with placeholders - they're good enough! 🚀
