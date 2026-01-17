import express from 'express';
import axios from 'axios';

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// In-memory storage for flashcard sessions
// In production, use Redis or similar
const flashcardSessions = new Map();

/**
 * Start flashcard generation (fire-and-forget)
 * POST /api/visual-flashcards/start
 */
router.post('/start', async (req, res) => {
  try {
    const { grade, subject, topic, sessionId } = req.body;

    if (!grade || !subject || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: grade, subject, topic'
      });
    }

    const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`🎨 Starting flashcard generation for session: ${sid}`);

    // Mark as in progress
    flashcardSessions.set(sid, {
      status: 'generating',
      startTime: new Date(),
      grade,
      subject,
      topic
    });

    // Return immediately
    res.json({
      success: true,
      sessionId: sid,
      message: 'Flashcard generation started'
    });

    // Call AI service asynchronously (don't await)
    generateFlashcardsAsync(sid, grade, subject, topic);

  } catch (error) {
    console.error('❌ Error starting flashcard generation:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to start flashcard generation'
    });
  }
});

/**
 * Get generated flashcards
 * GET /api/visual-flashcards/:sessionId
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = flashcardSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      status: session.status,
      flashcards: session.flashcards || [],
      count: session.flashcards?.length || 0,
      error: session.error
    });

  } catch (error) {
    console.error('❌ Error fetching flashcards:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch flashcards'
    });
  }
});

/**
 * Clear session (cleanup)
 * DELETE /api/visual-flashcards/:sessionId
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    flashcardSessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Session cleared'
    });

  } catch (error) {
    console.error('❌ Error clearing session:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clear session'
    });
  }
});

/**
 * Async function to call AI service and store results
 */
async function generateFlashcardsAsync(sessionId, grade, subject, topic) {
  try {
    console.log(`🤖 [Session ${sessionId}] Starting flashcard generation...`);
    console.log(`   Grade: ${grade}, Subject: ${subject}, Topic: ${topic}`);
    console.log(`   AI Service URL: ${AI_SERVICE_URL}/api/visual-flashcards/generate`);

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/visual-flashcards/generate`,
      null,
      {
        params: { grade, subject, topic },
        timeout: 120000 // 2 minute timeout for image generation
      }
    );

    console.log(`📥 [Session ${sessionId}] Received response from AI service`);
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response data:`, JSON.stringify(response.data, null, 2));
    
    const { flashcards } = response.data;

    // Update session with results
    flashcardSessions.set(sessionId, {
      status: 'completed',
      flashcards,
      grade,
      subject,
      topic,
      completedTime: new Date()
    });

    console.log(`✅ [Session ${sessionId}] Flashcards generated successfully: ${flashcards.length} cards`);

  } catch (error) {
    console.error(`❌ [Session ${sessionId}] AI service error:`, error.message);
    console.error(`   Error details:`, error.response?.data || error);
    console.error(`   Stack trace:`, error.stack);

    // Update session with error
    flashcardSessions.set(sessionId, {
      status: 'failed',
      error: error.message,
      grade,
      subject,
      topic
    });
  }
}

/**
 * Cleanup old sessions periodically
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [sessionId, session] of flashcardSessions.entries()) {
    const sessionTime = session.completedTime || session.startTime;
    if (sessionTime && now - sessionTime.getTime() > maxAge) {
      flashcardSessions.delete(sessionId);
      console.log(`🧹 Cleaned up old session: ${sessionId}`);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

export default router;
