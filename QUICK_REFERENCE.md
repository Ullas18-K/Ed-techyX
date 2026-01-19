# 🚀 Quick Deployment Reference

## 📱 One-Page Guide

### 🔗 Deployment URLs (Fill these in after deployment)

```
Frontend:  https://_________________.vercel.app
Backend:   https://_________________.onrender.com
AI Service: https://_________________.onrender.com
```

---

## ⚡ Quick Commands

### Local Development

```bash
# Frontend (http://localhost:8080)
cd frontend && npm install && npm run dev

# Backend (http://localhost:9000)
cd server && npm install && npm run dev

# AI Service (http://localhost:8000)
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload
```

### Deploy to Production

```bash
# 1. Commit & Push
git add .
git commit -m "Production ready"
git push origin main

# 2. Deploy Backend → Render
# 3. Deploy AI Service → Render  
# 4. Deploy Frontend → Vercel
```

---

## 🔑 Environment Variables Quick Reference

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_AI_SERVICE_URL=https://your-ai-service.onrender.com
```

### Backend (.env)
```bash
PORT=9000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
FIREBASE_API_KEY=...
CORS_ORIGINS=https://your-frontend.vercel.app
```

### AI Service (.env)
```bash
PORT=8000
ENVIRONMENT=production
GCP_PROJECT_ID=your-project-id
CORS_ORIGINS=https://your-frontend.vercel.app
```

---

## 🎯 Deployment Checklist (TL;DR)

- [ ] Push code to GitHub
- [ ] Deploy Backend to Render (get URL)
- [ ] Deploy AI Service to Render (get URL)
- [ ] Deploy Frontend to Vercel (use backend/AI URLs)
- [ ] Update CORS in backend & AI service with Vercel URL
- [ ] Redeploy backend & AI service
- [ ] Test everything works

---

## 🆘 Common Issues

**CORS Errors**
→ Add frontend URL to `CORS_ORIGINS` in backend & AI service

**Backend Slow/Sleeping**
→ Render free tier sleeps after 15 mins. Upgrade or use ping service.

**Environment Variables Not Working**
→ Redeploy after changing env vars in Render/Vercel

**Build Fails**
→ Check logs in deployment platform. Verify all dependencies in package.json/requirements.txt

---

## 📚 Documentation

- Full guide: [DEPLOYMENT.md](DEPLOYMENT.md)
- Checklist: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- Summary: [RESTRUCTURE_SUMMARY.md](RESTRUCTURE_SUMMARY.md)

---

**Save this for quick reference! 📌**
