import express from 'express';
import { translateText } from '../services/translationService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/translate
 * @desc    Translate UI strings or content
 * @access  Private (or Public if needed, but requirements say NO exposing credentials)
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { text, targetLanguage, sourceLanguage } = req.body;

        if (!text || !targetLanguage) {
            return res.status(400).json({
                success: false,
                message: 'Text and targetLanguage are required'
            });
        }

        const translatedText = await translateText(text, targetLanguage, sourceLanguage);

        res.json({
            success: true,
            translatedText
        });
    } catch (error) {
        console.error('❌ Translation Route Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to translate text',
            error: error.message
        });
    }
});

export default router;
