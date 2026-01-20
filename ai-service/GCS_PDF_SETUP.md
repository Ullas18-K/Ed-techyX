# NCERT PDF Setup with Google Cloud Storage

## Overview
This guide shows how to upload NCERT PDFs to Google Cloud Storage (GCS) and configure your AI service to automatically download and process them on startup.

## Prerequisites
- Google Cloud Project (you already have: `ringed-enigma-482810-k8`)
- Service account credentials (you already have this)
- NCERT PDFs organized in folders

## Step-by-Step Guide

### 1. Install Google Cloud Storage SDK (Locally)

```powershell
pip install google-cloud-storage
```

### 2. Upload PDFs to GCS (One-Time Setup)

Run this command from the `ai-service` directory:

```powershell
cd C:\Users\Ullas\MyDocs\Projects\ex\Ed-techyX\ai-service
python upload_pdfs_to_gcs.py
```

**What this does:**
- Creates a GCS bucket called `edtech-ncert-pdfs`
- Uploads all PDFs from `ncert_pdfs/` and `pyqs/` folders
- Skips files that already exist (so it's safe to run multiple times)

**Expected output:**
```
🚀 NCERT PDF Uploader to Google Cloud Storage

📦 Creating bucket 'edtech-ncert-pdfs'...
✅ Bucket 'edtech-ncert-pdfs' created

📤 Uploading 15 PDFs from ./ncert_pdfs/class_9...
  ✅ Uploaded: ncert_pdfs/class_9/science.pdf
  ✅ Uploaded: ncert_pdfs/class_9/math.pdf
  ...

✅ Upload Complete!
📊 Total files uploaded: 42
🪣 Bucket: gs://edtech-ncert-pdfs
```

### 3. Configure Render Environment Variables

Add this to your **AI Service** environment variables on Render:

```
GCS_BUCKET_NAME=edtech-ncert-pdfs
```

### 4. Deploy & Verify

After adding the env var, Render will automatically redeploy. Check the logs for:

```
📦 GCS Bucket configured: edtech-ncert-pdfs
📥 Downloading PDFs from gs://edtech-ncert-pdfs...
✅ Download complete: 42 files
📚 Found NCERT PDFs, processing automatically...
✅ PDFs processed and indexed
```

## How It Works

1. **On Render startup:**
   - Checks if `GCS_BUCKET_NAME` env var is set
   - Downloads all PDFs from GCS to `/app/ncert_pdfs/`
   - Automatically processes PDFs and builds vector database
   - Caches locally so subsequent restarts are faster

2. **Adding New PDFs:**
   - Add PDFs to your local `ncert_pdfs/` folder
   - Run `python upload_pdfs_to_gcs.py` again
   - Restart your Render service (it will download new PDFs)

3. **No GCS? No Problem:**
   - If `GCS_BUCKET_NAME` is not set, service still works
   - It just won't have RAG capabilities (will use Gemini's knowledge only)

## Troubleshooting

### "Bucket already exists" error
- This is normal! The bucket was created previously
- The script will skip bucket creation and just upload files

### "Permission denied" error
- Your service account needs Storage Admin role
- Go to: https://console.cloud.google.com/iam-admin/iam
- Find your service account: `edtech-ai-service@ringed-enigma-482810-k8.iam.gserviceaccount.com`
- Add role: **Storage Admin**

### PDFs not downloading on Render
- Check Render logs for error messages
- Verify `GCS_BUCKET_NAME` env var is set
- Verify `GOOGLE_APPLICATION_CREDENTIALS` has correct JSON

## Cost Estimate

**Google Cloud Storage pricing (us-central1):**
- Storage: $0.02/GB/month
- Download (egress): $0.12/GB (first 1GB free)

**For ~500MB of PDFs:**
- Storage: ~$0.01/month
- Download on each deploy: ~$0.00 (under free tier)

**Total: ~$0.01/month** ✅

## Alternative: Skip RAG (Temporary)

If you want to deploy quickly without PDFs:
1. Don't set `GCS_BUCKET_NAME`
2. Service will work fine using Gemini's built-in knowledge
3. Add PDFs later when ready
