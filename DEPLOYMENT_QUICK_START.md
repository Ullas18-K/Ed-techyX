# Quick Deployment Guide

## 📋 What You Need to Do (In Order)

### 1. **Upload PDFs to Google Cloud (Optional but Recommended)**

```powershell
# Install GCS package
pip install google-cloud-storage

# Upload PDFs (from ai-service directory)
cd C:\Users\Ullas\MyDocs\Projects\ex\Ed-techyX\ai-service
python upload_pdfs_to_gcs.py
```

---

### 2. **Update Render Environment Variables**

#### **Server (Backend) - https://dashboard.render.com**

Add/update these:
```
AI_SERVICE_BASE_URL=https://YOUR-AI-SERVICE-URL.onrender.com
NODE_ENV=production
PORT=9000
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
GCP_PROJECT_ID=ringed-enigma-482810-k8
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=<your-json-credentials-string>
CORS_ORIGINS=https://ed-techy-x.vercel.app
```

#### **AI Service - https://dashboard.render.com**

Add/update these:
```
GCS_BUCKET_NAME=edtech-ncert-pdfs
BACKEND_BASE_URL=https://ed-techyx.onrender.com
FRONTEND_BASE_URL=https://ed-techy-x.vercel.app
ENVIRONMENT=production
GCP_PROJECT_ID=ringed-enigma-482810-k8
GEMINI_API_KEY=<your-gemini-api-key>
GOOGLE_APPLICATION_CREDENTIALS=<your-json-credentials-string>
GENERATION_MODEL=gemini-2.5-pro
EMBEDDING_MODEL=text-embedding-005
```

---

### 3. **Commit & Push Code**

```powershell
git add .
git commit -m "Add GCS PDF support and TTS proxy"
git push origin main
```

---

### 4. **Verify Deployment**

After Render redeploys (auto-triggers on push):

**Check AI Service Logs:**
- Should see: `📦 GCS Bucket configured: edtech-ncert-pdfs`
- Should see: `✅ PDFs processed and indexed`
- Should see: `Vector store stats: {'total_documents': XX, ...}`

**Check Server Logs:**
- Should see: `🚀 Server running on port 9000`
- Should see: `✅ Translation Client initialized successfully`

**Test Frontend:**
- Visit https://ed-techy-x.vercel.app
- Try generating a scenario
- Try text-to-speech

---

## 🔥 Common Issues & Fixes

### Issue: "502 Bad Gateway" on server
**Fix:** Check server Render logs for crash errors. Usually missing env vars.

### Issue: "Vector store is empty"
**Fix:** 
- Option 1: Add `GCS_BUCKET_NAME` env var (recommended)
- Option 2: Skip for now, app works without RAG

### Issue: TTS not working
**Fix:** Verify backend has `GOOGLE_APPLICATION_CREDENTIALS` with JSON string

### Issue: CORS errors
**Fix:** Ensure `CORS_ORIGINS=https://ed-techy-x.vercel.app` is set on both services

---

## 📊 Final Checklist

- [ ] Code committed and pushed to GitHub
- [ ] Server env vars updated on Render
- [ ] AI Service env vars updated on Render  
- [ ] Both services redeployed successfully
- [ ] Server logs show no errors
- [ ] AI Service logs show PDF processing (if GCS configured)
- [ ] Frontend works without CORS errors
- [ ] TTS works through backend
- [ ] Scenario generation works

---

## 🎯 Testing URLs

- **Frontend:** https://ed-techy-x.vercel.app
- **Backend Health:** https://ed-techyx.onrender.com/api/health
- **AI Service Health:** https://YOUR-AI-SERVICE.onrender.com/health

---

## 💡 Pro Tips

1. **PDFs are optional!** Your app works fine without them using Gemini's knowledge
2. **Add PDFs later** by running `upload_pdfs_to_gcs.py` and restarting Render
3. **Check Render logs** if something doesn't work - they're very helpful
4. **Use Render's restart button** to force reload env vars without redeploying
