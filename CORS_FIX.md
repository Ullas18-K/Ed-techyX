# CORS Fix - Deployment Checklist

## Issue
The frontend at `https://ed-techy-x.vercel.app` was being blocked from accessing the backend at `https://ed-techyx.onrender.com` due to CORS policy.

## What Was Fixed

### 1. Backend Services Updated
Both backend services now explicitly include the Vercel frontend URL and have logging enabled:

- ✅ **Node.js server** (server/index.js)
- ✅ **Python AI service** (ai-service/main.py)

### 2. Environment Variables to Verify on Render

Check both Render services have these environment variables set:

#### For Node.js Backend (ed-techyx.onrender.com)
```
CORS_ORIGINS=https://ed-techy-x.vercel.app
```

#### For Python AI Service
```
FRONTEND_BASE_URL=https://ed-techy-x.vercel.app
BACKEND_BASE_URL=https://ed-techyx.onrender.com
CORS_ORIGINS=  (optional - for additional origins)
```

## Deployment Steps

1. **Commit and push the changes:**
   ```bash
   git add .
   git commit -m "fix: Update CORS configuration for Vercel frontend"
   git push origin main
   ```

2. **Verify on Render:**
   - Go to your Render dashboard
   - Both services should auto-deploy when you push
   - Check the logs for "CORS allowed origins" message
   - Ensure you see your Vercel URL in the list

3. **Test the fix:**
   - Clear browser cache or open incognito window
   - Visit `https://ed-techy-x.vercel.app`
   - Check browser console - CORS errors should be gone
   - The logs should show `✓ CORS allowed for origin: https://ed-techy-x.vercel.app`

## Troubleshooting

If CORS errors persist:

1. **Check Render logs** for the "CORS allowed origins" message
2. **Verify environment variables** are set correctly in Render dashboard
3. **Force redeploy** both services on Render (Manual Deploy → Deploy Latest Commit)
4. **Clear browser cache** completely
5. Check that the backend URLs match exactly (no trailing slashes)

## Testing Locally

To test locally with the production frontend:
```bash
# In ai-service directory
FRONTEND_BASE_URL=https://ed-techy-x.vercel.app python main.py

# In server directory  
CORS_ORIGINS=https://ed-techy-x.vercel.app npm start
```
