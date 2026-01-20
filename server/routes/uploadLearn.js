import express from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

const router = express.Router();

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL;

if (!AI_SERVICE_BASE_URL) {
    console.warn('⚠️  AI_SERVICE_BASE_URL not set - Upload & Learn proxy will fail');
}

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    }
});

/**
 * POST /api/upload-learn/analyze
 * Proxy for AI service's upload-and-learn endpoint
 * Accepts image upload and returns NCERT question analysis
 */
router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No image file provided',
                message: 'Please upload an image file'
            });
        }

        console.log(`📸 Proxying upload-and-learn request for image: ${req.file.originalname}`);

        // Create FormData to forward to AI service
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        // Forward to AI service
        const response = await axios.post(
            `${AI_SERVICE_BASE_URL}/api/upload-and-learn`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            }
        );

        console.log(`✅ Upload-and-learn analysis successful: NCERT=${response.data.is_ncert}`);
        res.json(response.data);

    } catch (error) {
        console.error('❌ Upload-and-learn proxy error:', error.message);
        
        if (error.response) {
            // AI service returned an error
            return res.status(error.response.status).json({
                error: 'AI service error',
                message: error.response.data?.detail || error.response.data?.message || 'Failed to analyze image'
            });
        }

        // Network or other error
        res.status(500).json({
            error: 'Upload and learn failed',
            message: 'Unable to process image. Please try again.'
        });
    }
});

export default router;
