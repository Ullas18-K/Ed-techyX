# AI Service Setup & Step-by-Step GCP Configuration

## 📁 What I Just Created

I've built a complete Python AI service with:

```
ai-service/
├── main.py                      # FastAPI server ✅
├── requirements.txt             # Python dependencies ✅
├── .env.example                 # Environment template ✅
├── config/
│   └── settings.py              # Configuration management ✅
├── models/
│   └── schemas.py               # Pydantic data models ✅
├── prompts/
│   └── templates.py             # AI prompts for Gemini ✅
├── rag/
│   ├── pdf_processor.py         # PDF → chunks converter ✅
│   ├── vector_store.py          # ChromaDB integration ✅
│   └── retriever.py             # RAG search engine ✅
└── agents/
    ├── scenario_gen.py          # Scenario generator ✅
    └── conversation.py          # Conversational guide ✅
```

---

## 🎯 Your Step-by-Step Action Plan

### PHASE 1: Set Up Python AI Service (10 minutes)

#### Step 1.1: Create Python Virtual Environment

```powershell
# Navigate to ai-service directory
cd C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\activate

# You should see (venv) in your prompt
```

#### Step 1.2: Install Dependencies

```powershell
# Install all required packages
pip install -r requirements.txt

# This installs:
# - FastAPI, Uvicorn (web server)
# - Google Cloud AI Platform
# - LangChain, ChromaDB (RAG)
# - PyPDF2 (PDF processing)
```

**Note**: This may take 2-3 minutes. If you get errors, you might need:
```powershell
# Upgrade pip first
python -m pip install --upgrade pip
```

#### Step 1.3: Create .env File

```powershell
# Copy example to .env
cp .env.example .env

# .env will be created - we'll fill it in after GCP setup
```

---

### PHASE 2: GCP Console Setup (20 minutes) - **YOU DO THIS**

I'll guide you through each step in the GCP console.

#### Step 2.1: Enable Required APIs

1. **Go to GCP Console**: https://console.cloud.google.com/

2. **Select or Create Project**:
   - Top bar: Click project dropdown
   - Click "New Project"
   - Name: `edtech-ai-platform`
   - Click "Create"
   - Wait ~30 seconds for project creation
   - Make sure it's selected (top bar should show "edtech-ai-platform")

3. **Enable Vertex AI API**:
   - In search bar (top), type: `Vertex AI API`
   - Click "Vertex AI API"
   - Click "Enable" button
   - Wait ~1 minute

4. **Enable Cloud AI Platform API** (if not already enabled):
   - Search: `Cloud AI Platform API`
   - Click "Enable"

#### Step 2.2: Create Service Account (For Authentication)

1. **Go to IAM & Admin**:
   - Left menu → "IAM & Admin" → "Service Accounts"
   - OR search: `service accounts`

2. **Create Service Account**:
   - Click "+ CREATE SERVICE ACCOUNT" (top)
   - Service account name: `edtech-ai-service`
   - Service account ID: (auto-filled) `edtech-ai-service@edtech-ai-platform.iam.gserviceaccount.com`
   - Click "CREATE AND CONTINUE"

3. **Grant Permissions**:
   - In "Grant this service account access to project":
   - Click "Select a role" dropdown
   - Search and add these roles (click "+ ADD ANOTHER ROLE" for each):
     * `Vertex AI User`
     * `AI Platform Admin` (or AI Platform Developer)
   - Click "CONTINUE"
   - Click "DONE"

#### Step 2.3: Create & Download Service Account Key

1. **Find Your Service Account**:
   - You should see `edtech-ai-service@...` in the list
   - Click on it

2. **Create Key**:
   - Click "KEYS" tab (top)
   - Click "ADD KEY" → "Create new key"
   - Select "JSON"
   - Click "CREATE"
   - **A JSON file downloads automatically** (e.g., `edtech-ai-platform-abc123.json`)

3. **Save the Key File**:
   ```powershell
   # Create a secure directory
   mkdir C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service\gcp-keys
   
   # Move the downloaded JSON file there
   # Example: Move from Downloads to ai-service/gcp-keys/
   move C:\Users\Ullas\Downloads\edtech-ai-platform-*.json C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service\gcp-keys\service-account.json
   ```

**⚠️ SECURITY WARNING**: 
- Never commit this JSON file to Git!
- Already added `gcp-keys/` to `.gitignore`

#### Step 2.4: Get Your Project ID

1. **Copy Project ID**:
   - In GCP Console, top bar shows project name
   - Click it → you'll see "Project ID"
   - Example: `edtech-ai-platform` or `edtech-ai-platform-123456`
   - **Copy this Project ID**

---

### PHASE 3: Configure AI Service Environment (5 minutes)

#### Step 3.1: Update .env File

```powershell
# Edit ai-service/.env
# Use notepad or VS Code
notepad .env
```

Fill in these values:

```env
# GCP Configuration
GCP_PROJECT_ID=edtech-ai-platform        # ← Paste YOUR project ID here
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./gcp-keys/service-account.json  # ← Path to your JSON key

# Server Configuration (leave as is)
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development

# CORS Origins (leave as is)
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173

# Vector Database (leave as is)
CHROMA_PERSIST_DIR=./chroma_db
VECTOR_COLLECTION_NAME=ncert_textbooks

# AI Models (leave as is)
EMBEDDING_MODEL=textembedding-gecko@003
GENERATION_MODEL=gemini-1.5-pro

# RAG Config (leave as is)
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
```

Save and close.

---

### PHASE 4: Test AI Service (10 minutes)

#### Step 4.1: Start the AI Service

```powershell
# Make sure you're in ai-service directory with venv activated
cd C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service
.\venv\Scripts\activate

# Start the server
python main.py

# You should see:
# INFO:     Started server process
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
# INFO:     Uvicorn running on http://0.0.0.0:8001
```

#### Step 4.2: Test in Browser

1. **Open**: http://localhost:8001/
   - Should show: `{"service": "EdTech AI Service", "version": "1.0.0", ...}`

2. **Check Health**: http://localhost:8001/health
   - Should show: `{"status": "healthy", "vector_store": {...}}`

3. **Interactive Docs**: http://localhost:8001/docs
   - FastAPI auto-generated API documentation
   - You can test endpoints here!

#### Step 4.3: Test Scenario Generation (Without PDFs Yet)

In the browser at http://localhost:8001/docs:

1. Find `POST /api/scenario/generate`
2. Click "Try it out"
3. Enter this JSON:
```json
{
  "grade": 6,
  "subject": "science",
  "topic": "photosynthesis",
  "student_id": "test123",
  "difficulty": "medium"
}
```
4. Click "Execute"

**Expected**: You'll get a mock scenario (since no PDFs processed yet). This proves the service works!

---

### PHASE 5: Process NCERT PDFs (15-30 minutes)

#### Step 5.1: Prepare PDFs

Create the directory structure:

```powershell
# Create directory for PDFs
mkdir C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service\ncert_pdfs

# Create grade folders
mkdir C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service\ncert_pdfs\class_6
mkdir C:\Users\Ullas\MyDocs\Projects\edtech\EdTech\ai-service\ncert_pdfs\class_7
# ... etc for other grades
```

#### Step 5.2: Add Your NCERT PDFs

```
ncert_pdfs/
├── class_6/
│   ├── science.pdf    ← Your NCERT Class 6 Science PDF
│   └── maths.pdf      ← Your NCERT Class 6 Maths PDF
├── class_7/
│   ├── science.pdf
│   └── maths.pdf
└── ... (more grades)
```

**Copy your PDFs** into the appropriate folders.

#### Step 5.3: Process PDFs via API

With the AI service running:

1. Go to http://localhost:8001/docs
2. Find `POST /admin/process-pdfs`
3. Click "Try it out"
4. Leave `directory` as `ncert_pdfs`
5. Click "Execute"

**This will**:
- Extract text from all PDFs
- Split into chunks (~1000 chars each)
- Generate embeddings using Vertex AI
- Store in ChromaDB

**Time**: ~5-10 minutes per PDF (depending on size)

Watch the terminal logs to see progress.

#### Step 5.4: Verify Processing

Check stats:
```powershell
# In your browser or use curl
curl http://localhost:8001/api/rag/stats
```

Should show:
```json
{
  "total_documents": 250,  // or however many chunks
  "subjects": ["science", "maths"],
  "grades": [6, 7]
}
```

---

### PHASE 6: Test Real AI Generation (5 minutes)

Now that PDFs are processed, test again:

1. Go to http://localhost:8001/docs
2. `POST /api/scenario/generate`
3. Same JSON as before:
```json
{
  "grade": 6,
  "subject": "science",
  "topic": "photosynthesis",
  "student_id": "test123"
}
```

**NOW**: You should get a real AI-generated scenario based on NCERT content!

---

## 🔗 Next: Connect to Backend

Once AI service is working, I'll update your Node.js backend to call it.

Tell me when you've:
1. ✅ Installed Python dependencies
2. ✅ Set up GCP (service account, APIs)
3. ✅ Configured .env with your project ID
4. ✅ Started AI service successfully
5. ✅ Processed at least 1 NCERT PDF

Then I'll proceed with Phase 7: Backend Integration!

---

## 🐛 Troubleshooting

### Issue: `pip install` fails

**Solution**:
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Issue: "GCP_PROJECT_ID not set"

**Solution**: Check your `.env` file has `GCP_PROJECT_ID=your-actual-project-id`

### Issue: "Permission denied" for service account

**Solution**:
1. Check service account has "Vertex AI User" role
2. Download key again if needed
3. Verify `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`

### Issue: PDF processing fails

**Solution**:
```powershell
# Check PDF directory exists
ls ncert_pdfs

# Check PDFs are readable
pip install pypdf2
python -c "import PyPDF2; print('PyPDF2 working')"
```

### Issue: ChromaDB errors

**Solution**:
```powershell
# Delete and recreate ChromaDB
rm -rf chroma_db
# Restart AI service
```

---

## 📞 Ready for Next Step?

Reply with your progress, and I'll continue with:
- Updating Node.js backend
- Adding new API routes
- Connecting frontend to AI service
- Full end-to-end testing!

Let's do this! 🚀
