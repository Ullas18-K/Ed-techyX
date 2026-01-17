# AI Learning Forge Backend

Backend server for AI Learning Forge with MongoDB integration.

## Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Edit the `.env` file with your MongoDB connection string:

**For Local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/ai-learning-forge
```

**For MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ai-learning-forge?retryWrites=true&w=majority
```

### 3. Install MongoDB Locally (if not using Atlas)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Verify MongoDB is running:**
```bash
mongosh
```

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "bio": "Learning enthusiast",
  "preferences": {
    "notifications": true,
    "theme": "dark"
  }
}
```

#### Update Learning Stats
```
PUT /api/auth/learning-stats
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessions": 5,
  "questionsAsked": 20,
  "totalTimeSpent": 120
}
```

### Health Check
```
GET /api/health
```

## Database Schema

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique),
  password: String (required, hashed, min 6 chars),
  avatar: String (optional),
  bio: String (max 500 chars),
  preferences: {
    notifications: Boolean,
    theme: String (light/dark/system),
    language: String
  },
  learningStats: {
    sessions: Number,
    questionsAsked: Number,
    totalTimeSpent: Number (minutes)
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication with 7-day expiry
- ✅ Input validation with express-validator
- ✅ Protected routes with authentication middleware
- ✅ CORS enabled for frontend communication
- ✅ Email uniqueness validation
- ✅ Secure password storage (never returned in responses)

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Error Handling

All endpoints return consistent JSON responses:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

## Development Tips

1. **MongoDB Connection Issues**: Ensure MongoDB is running locally or your Atlas credentials are correct
2. **JWT Secret**: Change `JWT_SECRET` in `.env` for production
3. **CORS**: Update `CLIENT_URL` in `.env` if your frontend runs on a different port
4. **Logs**: Check console for connection status and request logs
