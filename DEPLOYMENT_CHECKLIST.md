# 🚀 Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## ✅ Pre-Deployment

### Accounts Setup
- [ ] GitHub account created
- [ ] Vercel account created and linked to GitHub
- [ ] Render account created and linked to GitHub
- [ ] MongoDB Atlas account created
- [ ] Firebase project created
- [ ] Google Cloud project created (for AI features)

### Credentials & Keys
- [ ] MongoDB connection string obtained
- [ ] Firebase config obtained (API keys, project ID, etc.)
- [ ] Firebase Admin SDK service account JSON downloaded
- [ ] Google Cloud service account JSON downloaded (for AI service)
- [ ] All sensitive files added to .gitignore

### Code Preparation
- [ ] All code changes committed
- [ ] No .env files in git history (check with `git log --all --full-history -- .env`)
- [ ] .gitignore properly configured
- [ ] Code pushed to GitHub repository

---

## 🔧 Backend Deployment (Render)

### Setup
- [ ] New Web Service created on Render
- [ ] GitHub repository connected
- [ ] Root directory set to `server`
- [ ] Environment set to `Node`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`

### Environment Variables
- [ ] `PORT` = 9000 (or leave empty for auto)
- [ ] `NODE_ENV` = production
- [ ] `MONGODB_URI` = [your MongoDB Atlas connection string]
- [ ] `FIREBASE_API_KEY` = [from Firebase console]
- [ ] `FIREBASE_AUTH_DOMAIN` = [from Firebase console]
- [ ] `FIREBASE_PROJECT_ID` = [from Firebase console]
- [ ] `FIREBASE_STORAGE_BUCKET` = [from Firebase console]
- [ ] `FIREBASE_MESSAGING_SENDER_ID` = [from Firebase console]
- [ ] `FIREBASE_APP_ID` = [from Firebase console]
- [ ] `CORS_ORIGINS` = https://your-frontend.vercel.app
- [ ] Firebase Admin SDK JSON uploaded as secret file

### Verification
- [ ] Service deployed successfully
- [ ] Backend URL copied (e.g., `https://edtechyx-backend.onrender.com`)
- [ ] Health endpoint working: `https://your-backend.onrender.com/api/health`
- [ ] No error logs in Render dashboard

---

## 🤖 AI Service Deployment (Render)

### Setup
- [ ] New Web Service created on Render
- [ ] Same GitHub repository connected
- [ ] Root directory set to `ai-service`
- [ ] Environment set to `Python 3`
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Environment Variables
- [ ] `PORT` = 8000 (or leave empty for auto)
- [ ] `HOST` = 0.0.0.0
- [ ] `ENVIRONMENT` = production
- [ ] `GCP_PROJECT_ID` = [your GCP project ID]
- [ ] `GCP_LOCATION` = us-central1
- [ ] `CORS_ORIGINS` = https://your-frontend.vercel.app,https://your-backend.onrender.com
- [ ] GCP service account JSON uploaded as secret file

### Verification
- [ ] Service deployed successfully
- [ ] AI Service URL copied (e.g., `https://edtechyx-ai.onrender.com`)
- [ ] Health endpoint working: `https://your-ai.onrender.com/health`
- [ ] API docs accessible: `https://your-ai.onrender.com/docs`
- [ ] No error logs in Render dashboard

---

## 🎨 Frontend Deployment (Vercel)

### Setup
- [ ] New Project created on Vercel
- [ ] GitHub repository imported
- [ ] Framework preset: `Vite`
- [ ] Root directory: `frontend`
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `dist` (auto-detected)

### Environment Variables
- [ ] `VITE_API_URL` = https://your-backend.onrender.com/api
- [ ] `VITE_SOCKET_URL` = https://your-backend.onrender.com
- [ ] `VITE_AI_SERVICE_URL` = https://your-ai.onrender.com

### Verification
- [ ] Deployment successful
- [ ] Frontend URL copied (e.g., `https://edtechyx.vercel.app`)
- [ ] Website loads correctly
- [ ] No console errors in browser
- [ ] Can connect to backend APIs

---

## 🔄 Post-Deployment Updates

### Update CORS Origins
- [ ] Backend `CORS_ORIGINS` updated with Vercel URL
- [ ] AI Service `CORS_ORIGINS` updated with Vercel URL
- [ ] Backend redeployed on Render
- [ ] AI Service redeployed on Render

### Update MongoDB
- [ ] MongoDB Atlas IP whitelist updated (0.0.0.0/0 for Render, or specific IPs)
- [ ] Database user created with proper permissions
- [ ] Connection tested from backend

### Final Verification
- [ ] Frontend can fetch data from backend
- [ ] Backend can communicate with AI service
- [ ] WebSocket connections working
- [ ] User authentication working
- [ ] AI features responding correctly
- [ ] No CORS errors in browser console

---

## 🧪 Testing Production

### Functional Tests
- [ ] User can sign up / log in
- [ ] AI scenario generation works
- [ ] Exam planning works
- [ ] Quiz generation works
- [ ] Study room collaboration works
- [ ] Translation feature works
- [ ] All pages load without errors

### Performance
- [ ] Page load time acceptable (< 3 seconds)
- [ ] API response time acceptable (< 2 seconds)
- [ ] No memory leaks or crashes
- [ ] Images and assets loading correctly

### Security
- [ ] HTTPS enabled on all services
- [ ] Environment variables not exposed in client
- [ ] No API keys visible in browser
- [ ] CORS properly configured
- [ ] Firebase Auth rules configured

---

## 📊 Monitoring Setup

### Render
- [ ] Email notifications enabled for deploy failures
- [ ] Health check endpoints monitored
- [ ] Auto-deploy enabled for main branch

### Vercel
- [ ] Production domain configured (if using custom domain)
- [ ] Preview deployments enabled for PRs
- [ ] Analytics enabled (optional)

### Database
- [ ] MongoDB Atlas alerts configured
- [ ] Backup schedule set
- [ ] Performance monitoring enabled

---

## 📝 Documentation

- [ ] README.md updated with production URLs
- [ ] DEPLOYMENT.md reviewed and accurate
- [ ] API documentation updated
- [ ] Team members notified of new URLs

---

## 🎉 Launch!

- [ ] All checklist items completed
- [ ] Production environment stable
- [ ] User acceptance testing done
- [ ] Ready to share with users!

---

## 🚨 Rollback Plan

If something goes wrong:

1. **Frontend:** Revert to previous deployment in Vercel dashboard
2. **Backend:** Redeploy previous commit in Render
3. **AI Service:** Redeploy previous commit in Render
4. **Database:** Restore from MongoDB Atlas backup

---

**Last updated:** _[Add date after deployment]_
**Deployed by:** _[Your name]_
**Production URLs:**
- Frontend: _[Add URL]_
- Backend: _[Add URL]_
- AI Service: _[Add URL]_
