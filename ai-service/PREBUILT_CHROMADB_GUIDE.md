# 🚀 Pre-Built ChromaDB Solution - Complete Guide

## The Problem
**Render's free tier (512MB RAM) cannot process PDFs in real-time.** Even a single PDF exceeds memory limits.

## The Solution
**Build ChromaDB offline on your local machine (or larger instance), then upload it to GCS.**

Your Render service downloads the ready-made database (~100MB) instead of processing PDFs (~600MB+).

---

## Step-by-Step Implementation

### Step 1: Build ChromaDB Locally

#### Option A: On Your Local Machine (Recommended)

1. **Navigate to ai-service directory:**
   ```bash
   cd ai-service
   ```

2. **Ensure your environment variables are set:**
   ```bash
   # Copy from your Render environment
   export GCP_PROJECT_ID=your-project-id
   export GOOGLE_APPLICATION_CREDENTIALS='{"type":"service_account",...}'
   ```

   Or create `.env` file:
   ```env
   GCP_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...}
   ```

3. **Run the offline builder:**
   ```bash
   python build_chromadb_offline.py
   ```

   **This will:**
   - Process all PDFs in `./ncert_pdfs/`
   - Generate embeddings using Vertex AI
   - Create complete ChromaDB in `./chroma_db/`
   - Takes ~10-20 minutes depending on number of PDFs

4. **Monitor progress:**
   ```
   📖 [1/8] Processing: class_9_science.pdf
      📦 Extracted 23 chunks
      🔄 Generating embeddings and adding to vector store...
      ✅ Added successfully (Total: 23 chunks)
   
   📖 [2/8] Processing: class_10_maths.pdf
   ...
   
   ✅ Successful PDFs: 8/8
   📦 Total chunks: 150
   💾 Database location: ./chroma_db
   ```

#### Option B: On Google Cloud VM (For Large Datasets)

If you have many PDFs or want faster processing:

1. **Create a VM:**
   ```bash
   gcloud compute instances create chromadb-builder \
     --machine-type=e2-standard-2 \
     --zone=us-central1-a \
     --image-family=debian-11 \
     --image-project=debian-cloud
   ```

2. **SSH and setup:**
   ```bash
   gcloud compute ssh chromadb-builder
   
   # Install Python 3.11
   sudo apt update
   sudo apt install python3.11 python3.11-venv git
   
   # Clone your repo
   git clone https://github.com/Ullas18-K/Ed-techyX.git
   cd Ed-techyX/ai-service
   
   # Install dependencies
   python3.11 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Run builder and upload:**
   ```bash
   # Set env vars
   export GCP_PROJECT_ID=your-project-id
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   
   # Build database
   python build_chromadb_offline.py
   
   # Upload to GCS (see Step 2)
   ```

4. **Delete VM when done:**
   ```bash
   gcloud compute instances delete chromadb-builder --zone=us-central1-a
   ```

---

### Step 2: Upload ChromaDB to Google Cloud Storage

#### Option A: Using gsutil (Fastest)

```bash
# Install gcloud SDK if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Upload the entire chroma_db folder
gsutil -m cp -r ./chroma_db gs://edtech-ncert-pdfs/
```

**Upload time:** ~2-5 minutes depending on size

#### Option B: Using GCS Console (Easy)

1. Go to: https://console.cloud.google.com/storage
2. Select your bucket: `edtech-ncert-pdfs`
3. Click **Upload folder**
4. Select `ai-service/chroma_db/` directory
5. Wait for upload to complete

---

### Step 3: Configure Render Service

1. **Go to Render Dashboard:**
   https://dashboard.render.com

2. **Select your AI service**

3. **Add Environment Variable:**
   ```
   GCS_CHROMADB_PATH = chroma_db
   ```

4. **Verify existing variables:**
   - ✅ `GCS_BUCKET_NAME = edtech-ncert-pdfs`
   - ✅ `GCP_PROJECT_ID = your-project-id`
   - ✅ `GOOGLE_APPLICATION_CREDENTIALS = {...JSON...}`

5. **Save changes** → Auto-deploys

---

### Step 4: Verify Deployment

#### Check Logs (Render Dashboard)

You should see:
```
📦 GCS ChromaDB configured - checking for pre-built database...
🔄 Downloading pre-built ChromaDB from GCS...
📁 Found 47 files to download
   Downloaded 10/47 files...
   Downloaded 20/47 files...
   ...
✅ Successfully downloaded 47 files
💾 ChromaDB ready at: ./chroma_db
📊 Vector store stats: {'total_documents': 150, 'subjects': ['science', 'maths'], 'grades': [9, 10]}
✅ Vector store ready with 150 documents
```

#### Test Health Endpoint

```bash
curl https://YOUR-AI-SERVICE.onrender.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "vector_store": {
    "total_documents": 150,
    "subjects": ["science", "maths"],
    "grades": [9, 10]
  },
  "gcp_configured": true
}
```

#### Test RAG Search

```bash
curl -X POST https://YOUR-AI-SERVICE.onrender.com/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"photosynthesis","grade":9,"subject":"science","top_k":3}'
```

Should return relevant NCERT content.

#### Test Scenario Generation

Use your frontend to generate a scenario:
- Subject: Science
- Grade: 9  
- Topic: Photosynthesis

Should return detailed scenario with NCERT context.

---

## Architecture Comparison

### ❌ Old Approach (Failed on 512MB)
```
Render Startup:
  ↓
Download PDFs from GCS (4.2MB)
  ↓
Process PDFs one-by-one (600MB+ memory)
  ↓
💥 OUT OF MEMORY ERROR
```

### ✅ New Approach (Works on 512MB)
```
Render Startup (~200MB):
  ↓
Download Pre-Built ChromaDB from GCS (~50MB download)
  ↓
Load ChromaDB into memory (~100MB)
  ↓
✅ READY (~300MB total)
```

---

## Memory Usage Breakdown

| Stage | Old Approach | New Approach |
|-------|-------------|--------------|
| Service Startup | 200MB | 200MB |
| PDF Processing | +600MB | ❌ N/A (offline) |
| ChromaDB Download | N/A | +50MB (ephemeral) |
| ChromaDB Load | N/A | +100MB |
| **TOTAL** | **800MB+ ❌** | **350MB ✅** |

---

## Updating ChromaDB (When Adding PDFs)

When you add new NCERT PDFs:

1. **Add PDFs to local** `ncert_pdfs/` folder

2. **Rebuild ChromaDB:**
   ```bash
   python build_chromadb_offline.py
   ```

3. **Re-upload to GCS:**
   ```bash
   gsutil -m cp -r ./chroma_db gs://edtech-ncert-pdfs/
   ```

4. **Restart Render service:**
   - Go to Render Dashboard
   - Manual Deploy → Clear build cache & deploy
   - Or just redeploy (will download updated ChromaDB)

---

## Troubleshooting

### "No files found in gs://bucket/chroma_db/"

**Problem:** ChromaDB not uploaded to GCS yet

**Solution:**
```bash
# Verify upload
gsutil ls gs://edtech-ncert-pdfs/chroma_db/

# Should show:
# gs://edtech-ncert-pdfs/chroma_db/chroma.sqlite3
# gs://edtech-ncert-pdfs/chroma_db/uuid-xxx-xxx/
```

### "Vector store is empty!"

**Problem:** `GCS_CHROMADB_PATH` not set

**Solution:**
1. Go to Render environment variables
2. Add: `GCS_CHROMADB_PATH = chroma_db`
3. Save & redeploy

### "Failed to download ChromaDB from GCS"

**Problem:** Service account permissions

**Solution:**
```bash
# Grant storage read access
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member="serviceAccount:YOUR-SERVICE-ACCOUNT@PROJECT.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

### "Still running out of memory"

**Problem:** ChromaDB too large for 512MB tier

**Solutions:**
1. **Reduce content:**
   - Process fewer PDFs
   - Use smaller chunk sizes in `pdf_processor.py`

2. **Upgrade Render plan:**
   - Standard: $7/month (2GB RAM) - Recommended
   - Pro: $25/month (4GB RAM)

---

## Alternative Solutions (If This Doesn't Work)

### 1. Managed Vector Database

Use a cloud vector DB instead of ChromaDB:

**Pinecone (Free Tier):**
- 1 index, 100K vectors free
- No local memory needed
- API-based

**Qdrant Cloud:**
- 1GB free cluster
- Better for small projects

**Weaviate Cloud:**
- 30-day free trial
- GraphQL API

### 2. Split Service Architecture

**Option:** Separate RAG service from main AI service

```
Frontend → Backend → AI Service (scenarios/chat)
                  ↓
               RAG Service (vector search only)
                  on larger instance
```

### 3. Simplified RAG

**Option:** Use smaller, curated content

Instead of full PDFs:
- Manually extract key concepts
- Store as JSON/text files
- Simple keyword matching
- No embeddings needed

---

## Cost Analysis

| Component | Free Tier | Paid Option | Notes |
|-----------|-----------|-------------|-------|
| Render (AI Service) | $0 (512MB) | $7/mo (2GB) | Current fails on free |
| Google Cloud Storage | ~$0.02/mo | Same | 1GB storage |
| Vertex AI Embeddings | ~$0.50 | One-time | Build locally |
| **TOTAL** | **$0.52** | **$7.52/mo** | After initial setup |

**Recommendation:** Try free approach first. If still fails, upgrade to Render Standard ($7/mo).

---

## Summary

✅ **What This Solves:**
- Memory overflow on Render free tier
- Slow/failed PDF processing
- Service startup failures

✅ **What You Get:**
- Instant startup (~30 seconds)
- Full RAG functionality
- Persistent vector store
- Works on 512MB tier (usually)

✅ **Trade-offs:**
- Must rebuild ChromaDB locally when adding PDFs
- Re-upload to GCS after changes
- Initial setup takes 20-30 minutes

---

**Last Updated:** January 21, 2026  
**Status:** Production-ready solution for memory-constrained deployments
