# 🚀 Ed-TechyX Deployment Guide

## 📁 New Project Structure

```
Ed-techyX/
├── frontend/           # React + Vite app → Deploy to Vercel
├── server/             # Node.js + Express + Socket.io → Deploy to Render
├── ai-service/         # Python FastAPI → Deploy to Render
└── README.md
```

---

## 🎯 Deployment Overview

| Service | Technology | Platform | Purpose |
|---------|-----------|----------|---------|
| **Frontend** | React + Vite | Vercel | User interface |
| **Backend** | Node.js + Express | Render | API & WebSocket server |
| **AI Service** | Python FastAPI | Render | AI-powered features |

---

## 📋 Pre-Deployment Checklist

### 1. **Prepare Your Accounts**
- [ ] GitHub account (to push code)
- [ ] Vercel account (https://vercel.com)
- [ ] Render account (https://render.com)
- [ ] MongoDB Atlas account (for database)
- [ ] Firebase project (for authentication)
- [ ] Google Cloud project (for AI services)

### 2. **Environment Variables Setup**

#### Frontend (.env in frontend/)
```bash
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_AI_SERVICE_URL=https://your-ai-service.onrender.com
```

#### Backend (.env in server/)
```bash
PORT=9000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
GOOGLE_APPLICATION_CREDENTIALS=./config/firebase/service-account.json
AI_SERVICE_URL=https://your-ai-service.onrender.com
CORS_ORIGINS=https://your-frontend.vercel.app
```

#### AI Service (.env in ai-service/)
```bash
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=production
GCP_PROJECT_ID=your_gcp_project_id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./gcp-keys/service-account.json
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-backend.onrender.com
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Restructure for deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/your-username/ed-techyx.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend to Render

1. **Go to Render Dashboard** → New → Web Service
2. **Connect GitHub repository**
3. **Configure:**
   - Name: `edtechyx-backend`
   - Root Directory: `server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free (or Starter for production)
4. **Add Environment Variables** (from Backend .env above)
5. **Deploy** → Wait for build to complete
6. **Copy the URL** (e.g., `https://edtechyx-backend.onrender.com`)

### Step 3: Deploy AI Service to Render

1. **Go to Render Dashboard** → New → Web Service
2. **Connect same GitHub repository**
3. **Configure:**
   - Name: `edtechyx-ai-service`
   - Root Directory: `ai-service`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free (or Starter for production)
4. **Add Environment Variables** (from AI Service .env above)
5. **Upload GCP Service Account JSON:**
   - Go to Environment tab
   - Add secret file: `GOOGLE_APPLICATION_CREDENTIALS` → Upload your `service-account.json`
6. **Deploy** → Wait for build
7. **Copy the URL** (e.g., `https://edtechyx-ai.onrender.com`)

### Step 4: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard** → New Project
2. **Import from GitHub** → Select your repository
3. **Configure:**
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
4. **Add Environment Variables:**
   ```
   VITE_API_URL=https://edtechyx-backend.onrender.com/api
   VITE_SOCKET_URL=https://edtechyx-backend.onrender.com
   VITE_AI_SERVICE_URL=https://edtechyx-ai.onrender.com
   ```
5. **Deploy** → Vercel will auto-deploy
6. **Copy your frontend URL** (e.g., `https://edtechyx.vercel.app`)

### Step 5: Update CORS Origins

Now that you have all URLs, update environment variables:

#### Backend on Render:
```
CORS_ORIGINS=https://edtechyx.vercel.app
```

#### AI Service on Render:
```
CORS_ORIGINS=https://edtechyx.vercel.app,https://edtechyx-backend.onrender.com
```

**Redeploy both services** after updating CORS.

---

## 🔧 Local Development Setup

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with local URLs
npm run dev
```

### Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GCP credentials
uvicorn main:app --reload --port 8000
```

---

## 🛠️ Production Considerations

### Backend (Render)
- ✅ Use environment variables for all secrets
- ✅ Enable health checks: `/api/health`
- ✅ Consider upgrading to paid tier for:
  - No spin-down (free tier sleeps after 15 mins)
  - Better performance
  - Custom domains

### AI Service (Render)
- ✅ Upload GCP service account as secret file
- ✅ ChromaDB will persist data in Render's disk (consider external storage for production)
- ✅ Consider caching AI responses
- ⚠️ Free tier has limited resources - may need upgrade for heavy AI operations

### Frontend (Vercel)
- ✅ Automatic HTTPS and CDN
- ✅ Preview deployments for PRs
- ✅ Environment variables per branch (production/preview)
- ✅ Add custom domain if needed

### Database
- ✅ Use MongoDB Atlas (free tier available)
- ✅ Whitelist Render IP addresses
- ✅ Enable database backups

### Security
- ✅ Never commit `.env` files
- ✅ Use secret managers for production
- ✅ Enable CORS only for your domains
- ✅ Add rate limiting to backend APIs
- ✅ Keep dependencies updated

---

## 🔍 Monitoring & Debugging

### Check Logs
- **Render:** Dashboard → Service → Logs tab
- **Vercel:** Dashboard → Project → Deployments → Logs

### Health Checks
- Backend: `https://your-backend.onrender.com/api/health`
- AI Service: `https://your-ai-service.onrender.com/health`

### Common Issues

**1. Free Render services sleeping**
- Free tier sleeps after 15 mins of inactivity
- First request after sleep takes 30-60 seconds
- Solution: Upgrade to paid tier or use a ping service

**2. Environment variables not updating**
- After changing env vars, redeploy the service
- Clear cache if needed

**3. CORS errors**
- Verify CORS_ORIGINS includes your frontend URL
- Check for trailing slashes
- Redeploy after updating

**4. Build failures**
- Check build logs in Render/Vercel
- Verify all dependencies are in package.json/requirements.txt
- Check Node/Python versions

---

## 📞 Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/
- **Firebase Console:** https://console.firebase.google.com/

---

## 🎉 You're Live!

Once deployed, your URLs will be:
- 🌐 **Frontend:** https://edtechyx.vercel.app
- ⚙️ **Backend:** https://edtechyx-backend.onrender.com
- 🤖 **AI Service:** https://edtechyx-ai.onrender.com

**Important:** Update these URLs in all environment variables and redeploy!

---

**Built with ❤️ by Kyabar Sikushal Sai**
