# EdTech AI Service

AI-powered learning scenario generation and conversational guidance using Google Cloud Vertex AI, RAG (Retrieval Augmented Generation), and NCERT textbooks.

## 🎯 What This Does

- **Scenario Generation**: Creates personalized learning scenarios with tasks, simulations, and quizzes based on NCERT content
- **Conversational Guidance**: Provides real-time voice coaching during learning sessions
- **RAG Pipeline**: Retrieves relevant context from NCERT textbooks to ground AI responses
- **Quiz Generation**: Creates assessment questions aligned with curriculum

## 🏗️ Architecture

```
Student Request
     ↓
FastAPI Server (main.py)
     ↓
RAG Retriever ← ChromaDB (NCERT embeddings)
     ↓
Vertex AI Gemini (scenario/conversation generation)
     ↓
Structured Response (JSON)
```

## 📁 Project Structure

```
ai-service/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables (YOU CREATE THIS)
├── config/
│   └── settings.py         # Configuration management
├── models/
│   └── schemas.py          # Pydantic data models
├── prompts/
│   └── templates.py        # AI prompt templates
├── rag/
│   ├── pdf_processor.py    # PDF → chunks converter
│   ├── vector_store.py     # ChromaDB vector database
│   └── retriever.py        # RAG search & retrieval
└── agents/
    ├── scenario_gen.py     # Scenario generator agent
    └── conversation.py     # Conversational guide agent
```

## 🚀 Quick Start

See **[GCP_SETUP_GUIDE.md](./GCP_SETUP_GUIDE.md)** for detailed setup instructions.

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your GCP credentials
```

### 3. Run Server

```bash
python main.py
# Server starts at http://localhost:8001
```

### 4. Process NCERT PDFs

```bash
# Add PDFs to ncert_pdfs/ directory
# Then: POST http://localhost:8001/admin/process-pdfs
```

## 📚 API Endpoints

### Core Endpoints

- `POST /api/scenario/generate` - Generate learning scenario
- `POST /api/conversation/guide` - Get conversational guidance
- `GET /api/rag/stats` - Vector store statistics
- `POST /api/rag/search` - Search NCERT content

### Admin Endpoints

- `POST /admin/process-pdfs` - Process NCERT PDFs
- `DELETE /admin/clear-vector-store` - Clear vector database

### Interactive Docs

Visit http://localhost:8001/docs for full API documentation and testing interface.

## 🧪 Testing

```bash
# Test health
curl http://localhost:8001/health

# Test scenario generation
curl -X POST http://localhost:8001/api/scenario/generate \
  -H "Content-Type: application/json" \
  -d '{
    "grade": 6,
    "subject": "science",
    "topic": "photosynthesis",
    "student_id": "test123"
  }'
```

## 🔧 Environment Variables

```env
# Required
GCP_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-keys/service-account.json

# Optional (defaults shown)
GCP_LOCATION=us-central1
EMBEDDING_MODEL=textembedding-gecko@003
GENERATION_MODEL=gemini-1.5-pro
CHUNK_SIZE=1000
TOP_K_RESULTS=5
```

## 🐛 Troubleshooting

### "GCP_PROJECT_ID not set"
- Check `.env` file exists
- Ensure `GCP_PROJECT_ID` is set to your actual project ID

### "Failed to initialize Gemini"
- Verify service account has "Vertex AI User" role
- Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Ensure Vertex AI API is enabled in GCP

### PDF processing fails
- Check PDFs are in correct directory structure
- Ensure PDFs are text-based (not scanned images)
- Watch terminal logs for specific errors

## 📊 Monitoring

```bash
# Check vector store status
curl http://localhost:8001/api/rag/stats

# Example response:
{
  "total_documents": 250,
  "subjects": ["science", "maths"],
  "grades": [6, 7]
}
```

## 🔐 Security Notes

- **Never commit** `.env` or `gcp-keys/` to version control
- Service account JSON contains sensitive credentials
- Use least-privilege IAM roles in production
- Rotate service account keys regularly

## 📈 Performance

- PDF processing: ~5-10 minutes per 100-page PDF
- Embedding generation: ~0.5 seconds per chunk
- Scenario generation: ~5-10 seconds (with RAG)
- Conversation response: ~2-3 seconds

## 🌐 Production Deployment

For production:
1. Deploy to Google Cloud Run or GCE
2. Use Secret Manager for credentials
3. Enable Cloud Logging
4. Set up monitoring alerts
5. Use production-grade vector database (Vertex AI Vector Search)

## 📞 Support

For issues or questions:
1. Check [GCP_SETUP_GUIDE.md](./GCP_SETUP_GUIDE.md)
2. See main project [ACTION_CHECKLIST.md](../ACTION_CHECKLIST.md)
3. Review FastAPI logs for errors

## 📄 License

Part of EdTech platform. See main project README.
