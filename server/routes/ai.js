import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { translateObject } from '../services/translationService.js';

const router = express.Router();

// AI Service base URL from environment or default
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_BASE_URL || 'http://localhost:8001';
const AI_SERVICE_URL = AI_SERVICE_BASE_URL;

// Validation middleware
const scenarioValidation = [
  body('grade').isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1 and 12'),
  body('subject').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Subject is required'),
  body('topic').isString().trim().isLength({ min: 1, max: 200 }).withMessage('Topic is required'),
];

const conversationValidation = [
  body('scenario_id').isString().trim().notEmpty().withMessage('Scenario ID is required'),
  body('current_task_id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
  body('student_input').isString().trim().notEmpty().withMessage('Student input is required'),
];

// @route   POST /api/ai/scenario/generate
// @desc    Generate learning scenario using AI service
// @access  Private
router.post('/scenario/generate', authenticateToken, scenarioValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { grade, subject, topic, difficulty } = req.body;

    console.log(`🤖 AI Service: Generating scenario for ${subject} - ${topic} (Grade ${grade})`);
    console.log(`⏳ AI Service: This may take 30-60 seconds...`);

    // Call AI service with extended timeout (scenario generation takes ~35 seconds)
    const response = await axios.post(`${AI_SERVICE_URL}/api/scenario/generate`, {
      grade,
      subject,
      topic,
      student_id: req.user._id.toString(),
      difficulty: difficulty || 'medium'
    }, {
      timeout: 300000 // 300 second timeout (5 minutes)
    });

    console.log(`✅ AI Service: Scenario generated successfully - ${response.data.scenarioId || 'unknown'}`);

    // Translate response if requested
    const targetLanguage = req.headers['x-language'] || 'en';
    const translatedData = targetLanguage !== 'en'
      ? await translateObject(response.data, targetLanguage)
      : response.data;

    res.json({
      success: true,
      data: translatedData
    });

  } catch (error) {
    console.error('❌ AI Service Error:', error.message);

    // Handle different error types
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please ensure the AI service is running on port 8001.'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'AI service error',
        error: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate scenario',
      error: error.message
    });
  }
});

// @route   POST /api/ai/conversation/guide
// @desc    Get conversational guidance from AI
// @access  Private
router.post('/conversation/guide', authenticateToken, conversationValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { scenario_id, current_task_id, student_input, context, session_history } = req.body;

    console.log(`🤖 AI Service: Getting guidance for task ${current_task_id}`);

    // Call AI service with reasonable timeout for conversation
    const response = await axios.post(`${AI_SERVICE_URL}/api/conversation/guide`, {
      scenario_id,
      current_task_id,
      student_input,
      context: context || {},
      session_history: session_history || []
    }, {
      timeout: 300000 // 30 second timeout for conversation
    });

    console.log(`✅ AI Service: Guidance generated - Action: ${response.data.action}`);

    // Translate response if requested
    const targetLanguage = req.headers['x-language'] || 'en';
    const translatedData = targetLanguage !== 'en'
      ? await translateObject(response.data, targetLanguage)
      : response.data;

    res.json({
      success: true,
      data: translatedData
    });

  } catch (error) {
    console.error('❌ AI Service Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.detail || 'AI service error',
        error: error.response.data
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get guidance',
      error: error.message
    });
  }
});

// @route   POST /api/ai/rag/search
// @desc    Search NCERT content using RAG
// @access  Private
router.post('/rag/search', authenticateToken, async (req, res) => {
  try {
    const { query, grade, subject, top_k } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    console.log(`🔍 RAG Search: "${query}"`);

    // Build query params
    const params = new URLSearchParams();
    params.append('query', query);
    if (grade) params.append('grade', grade);
    if (subject) params.append('subject', subject);
    if (top_k) params.append('top_k', top_k);

    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/api/rag/search?${params.toString()}`, {}, {
      timeout: 10000
    });

    console.log(`✅ RAG Search: Found ${response.data.results?.count || 0} results`);

    res.json({
      success: true,
      results: response.data.results
    });

  } catch (error) {
    console.error('❌ RAG Search Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to search content',
      error: error.message
    });
  }
});

// @route   POST /api/ai/questions/practice
// @desc    Get practice questions (PYQ + AI generated)
// @access  Private
router.post('/questions/practice', authenticateToken, async (req, res) => {
  try {
    const { topic, grade, subject, count, difficulty, includeGenerated } = req.body;

    console.log(`📚 Fetching practice questions for: ${topic}`);

    const response = await axios.post(`${AI_SERVICE_URL}/api/questions/practice`, {
      topic,
      grade,
      subject,
      count,
      difficulty,
      includeGenerated
    });

    // Translate response if requested
    const targetLanguage = req.headers['x-language'] || 'en';
    const translatedData = targetLanguage !== 'en'
      ? await translateObject(response.data, targetLanguage)
      : response.data;

    res.json({
      success: true,
      data: translatedData
    });

  } catch (error) {
    console.error('❌ Practice Questions Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch practice questions',
      error: error.message
    });
  }
});

// @route   GET /api/ai/stats
// @desc    Get AI service and RAG statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    console.log(`📊 Fetching AI service stats`);

    // Call both health and RAG stats endpoints
    const [healthResponse, ragStatsResponse] = await Promise.all([
      axios.get(`${AI_SERVICE_URL}/health`).catch(err => null),
      axios.get(`${AI_SERVICE_URL}/api/rag/stats`).catch(err => null)
    ]);

    const stats = {
      service_available: !!healthResponse,
      service_status: healthResponse?.data || null,
      rag_stats: ragStatsResponse?.data || null
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Stats Error:', error.message);

    res.json({
      success: true,
      stats: {
        service_available: false,
        error: error.message
      }
    });
  }
});

// @route   GET /api/ai/health
// @desc    Check if AI service is reachable
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      ai_service: 'connected',
      details: response.data
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      ai_service: 'disconnected',
      message: 'AI service is not available',
      error: error.message
    });
  }
});

export default router;
