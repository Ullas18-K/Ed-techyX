import express from 'express';
import axios from 'axios';

const router = express.Router();

// AI Service base URL
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://localhost:8001';

// @route   POST /api/tts/synthesize
// @desc    Text-to-speech synthesis (proxy to AI service)
// @access  Public (can add auth later if needed)
router.post('/synthesize', async (req, res) => {
  try {
    const { text, language_code, speaking_rate, pitch } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    console.log(`🔊 TTS Request: "${text.substring(0, 50)}..." in ${language_code || 'en-IN'}`);

    // Forward to AI service
    const response = await axios.post(`${AI_SERVICE_BASE_URL}/api/tts/synthesize`, {
      text,
      language_code: language_code || 'en-IN',
      speaking_rate: speaking_rate || 1.0,
      pitch: pitch || 0.0
    }, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    // Forward the audio response
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);

  } catch (error) {
    console.error('❌ TTS Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to synthesize speech',
      error: error.message
    });
  }
});

export default router;
