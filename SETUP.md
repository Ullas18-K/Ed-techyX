# 🚀 AI Learning Forge - Setup Guide

Complete setup guide for the AI Learning Forge application with MongoDB backend.

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas cloud)
- npm or yarn

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB (Recommended for Development)

**macOS:**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh
# Should connect to mongodb://127.0.0.1:27017
```

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and run MongoDB as a service
3. MongoDB will run on `mongodb://localhost:27017`

**Linux (Ubuntu):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: MongoDB Atlas (Cloud - Free Tier Available)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `server/.env` with your connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ai-learning-forge?retryWrites=true&w=majority
   ```

## 🔧 Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment variables
# Edit server/.env with your MongoDB URI
nano .env

# Start the server
npm run dev
```

The backend will run on `http://localhost:5000`

**Backend endpoints:**
- Health check: `http://localhost:5000/api/health`
- Auth: `http://localhost:5000/api/auth/*`

## 🎨 Frontend Setup

```bash
# Navigate to project root (if in server directory)
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🧪 Testing the Application

### 1. Check Backend is Running

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-12-28T..."
}
```

### 2. Register a New User

Open the app at `http://localhost:5173`:
1. Click "Sign Up" tab
2. Enter:
   - Name: Your Name
   - Email: your@email.com
   - Password: (min 6 characters)
3. Click "Create Account"

### 3. Login

1. Switch to "Sign In" tab
2. Enter your email and password
3. Click "Sign In"

### 4. Test Profile

1. Click the profile button (top-right)
2. Edit your name and bio
3. Toggle notification preferences
4. View learning stats

## 📁 Project Structure

```
ai-learning-forge-clean/
├── server/                      # Backend (MongoDB + Express)
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── models/
│   │   └── User.js             # User schema
│   ├── routes/
│   │   └── auth.js             # Authentication routes
│   ├── middleware/
│   │   └── auth.js             # JWT authentication
│   ├── .env                    # Environment variables
│   ├── package.json
│   └── index.js                # Server entry point
│
├── src/                         # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── authStore.ts        # Auth state management
│   │   └── ...
│   └── ...
│
├── .env                        # Frontend environment variables
└── package.json
```

## 🔐 Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-learning-forge
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

### Backend won't start
- **Error: "connect ECONNREFUSED"**
  - MongoDB is not running
  - Start MongoDB: `brew services start mongodb-community` (macOS)
  
- **Error: "JWT_SECRET is not defined"**
  - Missing or incorrect `.env` file in `server/` directory
  - Copy `.env.example` to `.env` and configure

### Frontend can't connect to backend
- **Error: "Failed to fetch"**
  - Backend is not running on port 5000
  - Check `VITE_API_URL` in frontend `.env`
  - CORS issue - ensure backend has correct CORS configuration

### Login/Register not working
- **"Invalid email or password"**
  - Check credentials are correct
  - For first time, use "Sign Up" to create account
  
- **"User already exists"**
  - Email is already registered
  - Try logging in instead
  - Or use a different email

### MongoDB issues
- **Can't connect to MongoDB**
  ```bash
  # Check if MongoDB is running
  mongosh
  
  # If not running, start it
  brew services start mongodb-community  # macOS
  sudo systemctl start mongod            # Linux
  ```

- **View database contents**
  ```bash
  mongosh
  use ai-learning-forge
  db.users.find().pretty()
  ```

## 🔄 Development Workflow

### Starting Development

1. **Terminal 1 - Backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

3. **Terminal 3 - MongoDB (if needed):**
   ```bash
   mongosh
   ```

### Making Changes

- Backend changes auto-reload with `nodemon`
- Frontend changes hot-reload with Vite
- Database changes persist in MongoDB

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed with bcrypt),
  avatar: String (optional),
  bio: String (optional),
  preferences: {
    notifications: Boolean,
    theme: String,
    language: String
  },
  learningStats: {
    sessions: Number,
    questionsAsked: Number,
    totalTimeSpent: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

✅ Password hashing with bcrypt (salt rounds: 10)
✅ JWT tokens with 7-day expiration
✅ Protected API routes with authentication middleware
✅ Input validation with express-validator
✅ Email uniqueness enforcement
✅ CORS configuration for frontend
✅ Secure password storage (never returned in API responses)

## 📝 API Documentation

See `server/README.md` for complete API documentation.

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Change `JWT_SECRET` to a secure random string
3. Use MongoDB Atlas for production database
4. Deploy to: Heroku, Railway, Render, or DigitalOcean

### Frontend
1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy `dist/` folder to: Vercel, Netlify, or Cloudflare Pages

## 💡 Tips

- Use MongoDB Compass for visual database management
- Check browser console for frontend errors
- Check terminal for backend errors
- JWT tokens are stored in localStorage
- Clear localStorage to force logout: `localStorage.clear()`

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [React + Vite](https://vitejs.dev/guide/)

---

**Need help?** Check the error messages carefully - they usually indicate what's wrong!
