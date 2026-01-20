# Memory Optimization & PDF Processing Guide

## Problem
Render free tier has **512MB RAM limit**. Processing 8 PDFs at startup exceeds this limit.

## Solution: Lazy Loading + Manual Processing

### How It Works Now

1. **Startup (Fast)**:
   - Downloads PDFs from GCS (low memory)
   - Initializes AI service
   - Does NOT process PDFs automatically
   - Service starts in ~10 seconds ✅

2. **First Request**:
   - Lazy-loads and processes PDFs automatically
   - Happens in background
   - OR you can manually trigger processing

---

## Option 1: Manual Processing (Recommended)

After deployment, call the admin endpoint once:

```bash
curl -X POST https://YOUR-AI-SERVICE.onrender.com/admin/process-pdfs
```

**Response:**
```json
{
  "message": "Processing PDFs in background...",
  "status": "started"
}
```

Check logs to see progress:
```
🔄 Processing PDFs in background...
✅ PDFs processed successfully
Vector store stats: {'total_documents': 150, ...}
```

---

## Option 2: Lazy Loading (Automatic)

PDFs process automatically on **first scenario generation request**.

**Pros:**
- No manual step needed
- Processes only when needed

**Cons:**
- First request will be slower (~2-3 minutes)
- User sees loading during processing

---

## Option 3: Upgrade Render Plan

**Standard Plan ($7/month):**
- 512MB → 2GB RAM
- Can process PDFs at startup
- Faster overall

**To upgrade:**
1. Go to Render Dashboard
2. Select your AI service
3. Click "Upgrade"
4. Choose "Standard" plan

Then update code to auto-process:
```python
# In main.py startup_event, change line ~120 to:
logger.info("📚 Found NCERT PDFs, processing automatically...")
process_ncert_directory(str(ncert_dir))
```

---

## Current Status

✅ **Service deploys successfully** (no memory errors)  
✅ **PDFs downloaded** from GCS  
⏳ **PDFs not processed** until manual trigger or first use  
💡 **Service works without RAG** (uses Gemini's knowledge)

---

## Quick Command Reference

### Process PDFs manually:
```bash
curl -X POST https://edtech-ai-service-xxxxx.onrender.com/admin/process-pdfs
```

### Check vector store status:
```bash
curl https://edtech-ai-service-xxxxx.onrender.com/health
```

### Download PDFs from GCS (if needed):
```bash
curl -X POST https://edtech-ai-service-xxxxx.onrender.com/admin/download-pdfs
```

---

## Troubleshooting

### "Out of memory" error
- **Fix:** Don't process PDFs at startup
- **Current code:** Already fixed ✅

### PDFs not working in scenarios
- **Fix:** Call `/admin/process-pdfs` once
- **Or:** Wait for first scenario request (auto-processes)

### Want faster startup with auto-processing
- **Fix:** Upgrade to Standard plan ($7/month)
- **Then:** Enable auto-processing in code
