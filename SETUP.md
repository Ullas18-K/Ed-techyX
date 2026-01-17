# AI Learning Forge - Setup Guide

An interactive AI-powered learning platform for students to learn complex topics through simulations, voice guidance, and personalized learning paths.

## 📋 Table of Contents
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [AI Integration (Future)](#ai-integration-future)
- [Troubleshooting](#troubleshooting)

---

## 🏗 Project Structure

```
EdTech/
├── src/                    # Frontend React application
│   ├── components/        # React components (Navbar, Simulation, Quiz, etc.)
│   ├── pages/            # Page components
│   ├── lib/              # Stores, utilities, mock data
│   └── hooks/            # Custom React hooks
├── server/               # Backend Node.js/Express API
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth middleware
│   ├── models/          # MongoDB models (User, Session, etc.)
│   └── routes/          # API routes
├── public/              # Static assets
└── package.json         # Frontend dependencies
```

---

## ✅ Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (Community Edition) - [Download](https://www.mongodb.com/try/download/community)
  - OR use MongoDB Atlas (cloud) - [Sign up free](https://www.mongodb.com/cloud/atlas/register)
- **Git** - [Download](https://git-scm.com/)

Check your installations:
```powershell
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
mongod --version # Should show MongoDB version (if installed locally)
```

---

## 🎨 Frontend Setup

### 1. Install Dependencies

The frontend uses React + TypeScript + Vite with various UI libraries.

```powershell
# Navigate to project root
cd C:\Users\Ullas\MyDocs\Projects\edtech\EdTech

# Install dependencies (use --legacy-peer-deps due to react-speech-kit compatibility)
npm install --legacy-peer-deps
```

**Note**: We use `--legacy-peer-deps` because `react-speech-kit@3.0.1` requires React 16, but we're using React 18. This is safe for now, but consider replacing `react-speech-kit` in the future.

### 2. Configuration

Create a `.env` file in the project root (optional for frontend):

```env
# Frontend environment variables (optional)
VITE_API_URL=http://localhost:4000
```

### 3. Available Scripts

```powershell
# Development server (with hot reload)
npm run dev
# Open http://localhost:5173 in your browser

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🔧 Backend Setup

### 1. Navigate to Server Directory

```powershell
cd server
```

### 2. Install Backend Dependencies

```powershell
npm install
```

**Dependencies installed**:
- `express` - Web framework
- `mongoose` - MongoDB ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `express-validator` - Input validation

### 3. Set Up MongoDB

#### Option A: Local MongoDB

1. **Install MongoDB Community Edition** from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

2. **Start MongoDB service**:
   ```powershell
   # Windows (run as Administrator)
   net start MongoDB
   
   # Or start mongod manually:
   mongod --dbpath C:\data\db
   ```

3. **Verify it's running**:
   ```powershell
   mongosh
   # Should connect to MongoDB shell
   # Type: exit
   ```

#### Option B: MongoDB Atlas (Cloud - Recommended for beginners)

1. **Sign up** at [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. **Create a free cluster** (M0 tier - no credit card needed)
3. **Create a database user** (username + password)
4. **Whitelist your IP** (or use `0.0.0.0/0` for development)
5. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy connection string (looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/...`)

### 4. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```powershell
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your values:

```env
PORT=4000
NODE_ENV=development

# Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/edtech-platform

# OR MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/edtech-platform?retryWrites=true&w=majority

JWT_SECRET=change-this-to-a-random-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

# AI Service (for future integration)
AI_SERVICE_URL=http://localhost:8001
```

**Security Note**: 
- Change `JWT_SECRET` to a strong random string (generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- Never commit `.env` to Git (it's in `.gitignore`)

### 5. Available Backend Scripts

```powershell
# Development mode (with auto-restart using nodemon)
npm run dev

# Production mode
npm start
```

---

## 🚀 Running the Application

### Development Mode (Recommended)

You need **two terminal windows**:

#### Terminal 1: Backend
```powershell
# Start MongoDB (if local)
net start MongoDB  # Windows
# OR ensure MongoDB Atlas is accessible

# Start backend server
cd C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\server
npm run dev

# Should see: "Server running on port 4000" and "MongoDB connected"
```

#### Terminal 2: Frontend
```powershell
# Start frontend dev server
cd C:\Users\Ullas\MyDocs\Projects\edtech\EdTech
npm run dev

# Should see: "Local: http://localhost:5173"
```

### Access the Application

1. **Frontend**: Open [http://localhost:5173](http://localhost:5173)
2. **Backend API**: Running on [http://localhost:4000](http://localhost:4000)

---

## 🔑 Environment Variables

### Frontend (`.env` in project root)
```env
VITE_API_URL=http://localhost:4000
```

### Backend (`server/.env`)
```env
# Required
PORT=4000
MONGODB_URI=mongodb://localhost:27017/edtech-platform
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Optional (for future AI integration)
AI_SERVICE_URL=http://localhost:8001
GCP_PROJECT_ID=edtech-ai-platform
GCP_LOCATION=us-central1
```

---

## 🤖 AI Integration (Future)

Currently, the app uses **mock AI** (hardcoded scenarios and voice guidance). To integrate **real AI**:

1. **Read the comprehensive guide**: [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md)

2. **What you'll learn**:
   - What is GCP, Vertex AI, and RAG
   - How to process NCERT PDFs
   - How to build an AI service (Python FastAPI)
   - How to connect it to your Node.js backend
   - Step-by-step implementation plan

3. **Quick overview**:
   - Use **Google Cloud Vertex AI** (Gemini model)
   - Implement **RAG** (Retrieval Augmented Generation) with NCERT textbooks
   - Build a **Python AI service** (FastAPI) for scenario generation
   - Connect via REST API from Node.js backend
   - Update frontend to use real AI responses

**Cost**: ~$20-30/month during development (GCP gives $300 free credit for 90 days)

---

## 🐛 Troubleshooting

### Issue: `npm install` fails with ERESOLVE error

**Solution**: Use `--legacy-peer-deps`:
```powershell
npm install --legacy-peer-deps
```

**Cause**: `react-speech-kit@3.0.1` requires React 16, but the project uses React 18. This is a peer dependency mismatch that's safe to bypass.

**Long-term fix**: Replace `react-speech-kit` with Web Speech API directly or find an updated alternative.

---

### Issue: MongoDB connection error

**Symptoms**:
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions**:

1. **Check if MongoDB is running**:
   ```powershell
   # Windows
   net start MongoDB
   
   # Or check services: Win + R → services.msc → Find "MongoDB"
   ```

2. **Verify connection string** in `server/.env`:
   ```env
   # Local MongoDB
   MONGODB_URI=mongodb://localhost:27017/edtech-platform
   
   # OR Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/edtech-platform
   ```

3. **Test connection**:
   ```powershell
   mongosh
   # Should connect successfully
   ```

4. **Check MongoDB Atlas IP whitelist** (if using Atlas):
   - Go to Atlas Dashboard → Network Access
   - Add your current IP or `0.0.0.0/0` for development

---

### Issue: Port already in use

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solutions**:

1. **Kill the process using the port**:
   ```powershell
   # Find process on port 4000
   netstat -ano | findstr :4000
   
   # Kill process (replace <PID> with actual process ID)
   taskkill /PID <PID> /F
   ```

2. **Change port** in `server/.env`:
   ```env
   PORT=4001
   ```

---

### Issue: CORS errors in browser console

**Symptoms**:
```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solutions**:

1. **Check `server/index.js`** has CORS middleware:
   ```javascript
   const cors = require('cors');
   app.use(cors({
     origin: process.env.CLIENT_URL || 'http://localhost:5173',
     credentials: true
   }));
   ```

2. **Verify `CLIENT_URL`** in `server/.env`:
   ```env
   CLIENT_URL=http://localhost:5173
   ```

3. **Restart backend server** after changes

---

### Issue: JWT authentication errors

**Symptoms**:
```
JsonWebTokenError: invalid token
```

**Solutions**:

1. **Check JWT_SECRET** in `server/.env` is set:
   ```env
   JWT_SECRET=your-secret-key-minimum-32-characters
   ```

2. **Clear browser localStorage**:
   ```javascript
   // In browser console:
   localStorage.clear();
   ```

3. **Generate new JWT_SECRET**:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

---

### Issue: Frontend build errors

**Symptoms**:
```
Module not found: Error: Can't resolve '@/components/...'
```

**Solutions**:

1. **Check `vite.config.ts`** has correct alias:
   ```typescript
   resolve: {
     alias: {
       "@": path.resolve(__dirname, "./src"),
     },
   }
   ```

2. **Reinstall dependencies**:
   ```powershell
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

---

## 📚 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Router** - Routing
- **Web Speech API** - Voice features

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Future AI Stack
- **Python 3.10+** - AI service
- **FastAPI** - AI service framework
- **Google Cloud Vertex AI** - Gemini model
- **LangChain** - RAG framework
- **ChromaDB** - Vector database

---

## 📞 Support

If you encounter issues:

1. Check this README's [Troubleshooting](#troubleshooting) section
2. Read [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md) for AI-related questions
3. Check browser console and terminal for error messages
4. Verify all environment variables are set correctly

---

## 🎯 Next Steps

1. ✅ Get the app running locally
2. 📖 Read [AI_IMPLEMENTATION_GUIDE.md](./AI_IMPLEMENTATION_GUIDE.md)
3. 🤖 Set up GCP and Vertex AI
4. 📚 Process NCERT PDFs
5. 🔧 Build Python AI service
6. 🔗 Integrate AI with backend
7. 🚀 Deploy to production

Happy coding! 🎓✨
