# AI Service Integration Guide

## ✅ Integration Complete!

The backend server (port 9000) is now connected to the AI service (port 8001).

## 📡 New API Endpoints

All endpoints require authentication (JWT token in Authorization header).

### 1. **Generate Learning Scenario**
```bash
POST http://localhost:9000/api/ai/scenario/generate
```

**Request:**
```json
{
  "grade": 10,
  "subject": "science",
  "topic": "photosynthesis",
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "scenario": {
    "scenario_id": "...",
    "topic": "Photosynthesis",
    "simulation": { ... },
    "tasks": [ ... ],
    "quiz": [ ... ]
  }
}
```

### 2. **Get Conversational Guidance**
```bash
POST http://localhost:9000/api/ai/conversation/guide
```

**Request:**
```json
{
  "scenario_id": "phot_123",
  "current_task_id": 1,
  "student_input": "I adjusted the sunlight to 50%",
  "context": {
    "task": {"instruction": "Set sunlight to 50%"},
    "grade": 10
  },
  "session_history": ["Started simulation"]
}
```

**Response:**
```json
{
  "success": true,
  "guidance": {
    "response": "Excellent! You've set the sunlight perfectly...",
    "action": "complete_task",
    "task_complete": true,
    "next_task_id": 2
  }
}
```

### 3. **Search NCERT Content (RAG)**
```bash
POST http://localhost:9000/api/ai/rag/search
```

**Request:**
```json
{
  "query": "photosynthesis process",
  "grade": 10,
  "subject": "science",
  "top_k": 5
}
```

### 4. **Get AI Service Stats**
```bash
GET http://localhost:9000/api/ai/stats
```

Returns vector store statistics and service health.

### 5. **Check AI Service Health**
```bash
GET http://localhost:9000/api/ai/health
```

Public endpoint to check if AI service is running.

## 🚀 How to Use

### Start Both Services:

**Terminal 1 - AI Service:**
```bash
cd ai-service
python main.py
# Runs on http://localhost:8001
```

**Terminal 2 - Backend Server:**
```bash
cd server
npm start
# Runs on http://localhost:9000
```

### Test the Integration:

1. **Login to get token:**
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

2. **Generate scenario (use token from step 1):**
```bash
curl -X POST http://localhost:9000/api/ai/scenario/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "grade": 10,
    "subject": "science",
    "topic": "photosynthesis"
  }'
```

## 🔄 Architecture Flow

```
Frontend (React)
    ↓
Backend Server (port 9000)
    ↓
AI Service (port 8001)
    ↓
├─→ RAG (ChromaDB + NCERT PDFs)
└─→ Vertex AI (Gemini)
```

## 📝 Features Implemented

✅ Scenario generation with RAG-enhanced content
✅ Real-time conversational AI guidance
✅ NCERT content search
✅ Authentication integrated with all AI endpoints
✅ Error handling and service health checks
✅ Proper timeout handling (30s for scenarios, 15s for guidance)

## 🔧 Configuration

Server `.env` file includes:
```env
AI_SERVICE_URL=http://localhost:8001
```

Change this if AI service runs on different host/port.

## 🐛 Troubleshooting

**"AI service is not available"**
- Ensure AI service is running: `python ai-service/main.py`
- Check port 8001 is accessible
- Verify AI_SERVICE_URL in server/.env

**"Embedding model not initialized"**
- Ensure GCP credentials are configured in ai-service/.env
- Check gcp-keys/service-account.json exists

**"503 Service Unavailable"**
- AI service may be processing a request (quota limits)
- Wait and retry

## 🎯 Next Steps

1. **Frontend Integration**: Update React components to call `/api/ai/*` endpoints
2. **Save Scenarios**: Store generated scenarios in MongoDB
3. **Session Tracking**: Track student progress through tasks
4. **Analytics**: Log AI interactions for insights
5. **Caching**: Cache frequent scenarios to reduce API calls

## 📚 API Documentation

- Backend: http://localhost:9000/api/health
- AI Service: http://localhost:8001/docs (Swagger UI)
