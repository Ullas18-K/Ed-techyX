# Render Deployment Guide

## Quick Start

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select `Ed-techyX` repo
5. Fill in:
   - **Name**: `edtech-ai-service`
   - **Root Directory**: `ai-service`
   - **Environment**: `Docker`
   - **Region**: `Oregon` (us-west)
   - **Plan**: `Standard`

## Environment Variables to Add in Render Dashboard

After creating the service, go to **Settings** → **Environment** and add:

```
ENVIRONMENT=production
GCP_PROJECT_ID=YOUR_GCP_PROJECT_ID
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
BACKEND_BASE_URL=https://ed-techyx.onrender.com
FRONTEND_BASE_URL=https://ed-techy-x.vercel.app
CHROMA_PERSIST_DIR=/app/chroma_db
```

## Important Notes

- **GEMINI_API_KEY**: Get from https://aistudio.google.com/app/apikey
- **GCP_PROJECT_ID**: Your Google Cloud Project ID
- First deployment takes 5-10 minutes
- After deployment, you'll get a URL like: `https://edtech-ai-service.onrender.com`
- Copy this URL and update your frontend `.env.production`

## What Files Are Included

- `Dockerfile` - Builds the Docker image
- `.dockerignore` - Excludes unnecessary files from build
- `render.yaml` - Optional config file (auto-deploy settings)
- `.env.production` - Example production variables

## Auto-Redeploy on Git Push

Render automatically redeploys whenever you push to the `main` branch!
