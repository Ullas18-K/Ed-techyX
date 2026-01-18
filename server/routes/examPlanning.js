import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import ExamPlan from '../models/ExamPlan.js';
import {
  generateStudyPlan,
  generateDailyLearningKit,
  analyzeTimeAllocation
} from '../services/examPlanningService.js';

const router = express.Router();

// Validation middleware
const generatePlanValidation = [
  body('examDate').isISO8601().withMessage('Valid exam date is required'),
  body('currentDate').optional().isISO8601().withMessage('Valid current date required'),
  body('subjects').isArray({ min: 1 }).withMessage('At least one subject is required'),
  body('topics').isArray({ min: 1 }).withMessage('At least one topic is required'),
  body('dailyStudyHours').optional().isInt({ min: 1, max: 16 }).withMessage('Daily study hours must be between 1-16'),
  body('grade').optional().isInt({ min: 1, max: 12 }).withMessage('Grade must be between 1-12')
];

/**
 * @route   POST /api/exam-planning/generate
 * @desc    Generate AI-powered exam study plan
 * @access  Private
 */
router.post('/generate', authenticateToken, generatePlanValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      examDate,
      currentDate = new Date().toISOString(),
      subjects,
      topics,
      dailyStudyHours = 6,
      grade = 12,
      examBoard = 'CBSE'
    } = req.body;

    console.log(`📚 Generating exam plan for user ${req.user._id}`);
    console.log(`📅 Exam date: ${examDate}, Subjects: ${subjects.join(', ')}`);

    // Validate exam date is in future
    const exam = new Date(examDate);
    const today = new Date(currentDate);
    if (exam <= today) {
      return res.status(400).json({
        success: false,
        message: 'Exam date must be in the future'
      });
    }

    // Generate study plan using AI
    const planData = await generateStudyPlan({
      examDate,
      currentDate,
      subjects,
      topics,
      dailyStudyHours,
      grade,
      examBoard
    });

    // Create exam plan document
    const examPlan = new ExamPlan({
      userId: req.user._id,
      examDate: new Date(examDate),
      currentDate: new Date(currentDate),
      totalDays: planData.timeAnalysis.totalDays,
      subjects: subjects.map(s => ({
        name: s,
        topics: topics.filter(t => t.toLowerCase().includes(s.toLowerCase()))
      })),
      dailyStudyHours,
      chapterPriorities: planData.chapterPriorities,
      dailyPlans: planData.dailyPlans,
      revisionDays: planData.timeAnalysis.revisionDays,
      metadata: {
        ...planData.metadata,
        grade,
        examBoard,
        difficultyLevel: planData.timeAnalysis.intensity === 'high' ? 'hard' : 
                         planData.timeAnalysis.intensity === 'medium' ? 'medium' : 'easy'
      },
      status: 'active'
    });

    await examPlan.save();

    console.log(`✅ Exam plan created successfully: ${examPlan._id}`);

    // Generate learning kits for the first 3 days in the background
    // Uses cache automatically - instant if content was generated before
    (async () => {
      try {
        console.log('🔄 Pre-generating learning kits for first 3 days (cache-aware)...');
        const daysToGenerate = Math.min(3, examPlan.dailyPlans.length);
        
        const startTime = Date.now();
        
        for (let i = 0; i < daysToGenerate; i++) {
          const dayPlan = examPlan.dailyPlans[i];
          
          try {
            const dayStartTime = Date.now();
            console.log(`\n📚 Pre-generating Day ${dayPlan.day}...`);
            console.log(`Subjects: ${dayPlan.subjects.map(s => `${s.name} (${s.chapters.join(', ')})`).join('; ')}`);
            
            const learningKit = await generateDailyLearningKit(
              dayPlan,
              examBoard,
              grade
            );
            
            const duration = Date.now() - dayStartTime;
            const wasCached = duration < 1000;
            
            // Log what was generated
            console.log(`📦 Generated learning kit for Day ${dayPlan.day}:`, {
              hasNotes: !!learningKit?.notes,
              notesLength: learningKit?.notes?.length || 0,
              derivationsCount: learningKit?.derivations?.length || 0,
              formulasCount: learningKit?.formulas?.length || 0,
              pyqsCount: learningKit?.pyqs?.length || 0,
              tipsCount: learningKit?.tips?.length || 0,
              scenariosCount: learningKit?.scenarios?.length || 0,
              practiceQuestionsCount: learningKit?.practiceQuestions?.length || 0,
              cached: wasCached,
              duration: `${duration}ms`
            });
            
            dayPlan.learningKit = learningKit;
            
            console.log(`${wasCached ? '⚡' : '✅'} Day ${dayPlan.day} learning kit ${wasCached ? 'loaded from cache' : 'generated'} (${duration}ms)`);
          } catch (error) {
            console.error(`⚠️ Failed to pre-generate Day ${dayPlan.day}:`, error.message);
            console.error('Error details:', error.stack);
            // Continue with other days even if one fails
          }
        }
        
        await examPlan.save();
        const totalDuration = Date.now() - startTime;
        console.log(`✅ Learning kits pre-generation complete (${totalDuration}ms for ${daysToGenerate} days)`);
      } catch (error) {
        console.error('⚠️ Background learning kit generation failed:', error.message);
        console.error('Error details:', error.stack);
      }
    })();

    res.json({
      success: true,
      message: 'Exam plan generated successfully',
      data: {
        planId: examPlan._id,
        totalDays: examPlan.totalDays,
        studyDays: planData.timeAnalysis.studyDays,
        revisionDays: examPlan.revisionDays,
        totalChapters: planData.chapterPriorities.length,
        dailyPlans: examPlan.dailyPlans.map(dp => ({
          day: dp.day,
          date: dp.date,
          subjects: dp.subjects,
          rationale: dp.rationale,
          preview: dp.preview
        }))
      }
    });

  } catch (error) {
    console.error('❌ Exam plan generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate exam plan',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/exam-planning/plans
 * @desc    Get all exam plans for current user
 * @access  Private
 */
router.get('/plans', authenticateToken, async (req, res) => {
  try {
    const { status = 'active', limit = 10 } = req.query;

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const plans = await ExamPlan.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-dailyPlans.learningKit'); // Exclude large learning kit data

    res.json({
      success: true,
      count: plans.length,
      data: plans
    });

  } catch (error) {
    console.error('❌ Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam plans',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/exam-planning/plans/:id
 * @desc    Get specific exam plan details
 * @access  Private
 */
router.get('/plans/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await ExamPlan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Exam plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('❌ Error fetching plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam plan',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/exam-planning/daily-content/:planId/:day
 * @desc    Get detailed learning kit content for a specific day
 * @access  Private
 */
router.get('/daily-content/:planId/:day', authenticateToken, async (req, res) => {
  try {
    const { planId, day } = req.params;
    const { regenerate = false } = req.query;

    const plan = await ExamPlan.findOne({
      _id: planId,
      userId: req.user._id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Exam plan not found'
      });
    }

    const dayPlan = plan.dailyPlans.find(dp => dp.day === parseInt(day));
    if (!dayPlan) {
      return res.status(404).json({
        success: false,
        message: 'Day not found in plan'
      });
    }

    // Check if learning kit content exists
    const hasContent = dayPlan.learningKit && 
                      (dayPlan.learningKit.notes || 
                       dayPlan.learningKit.derivations?.length > 0 ||
                       dayPlan.learningKit.formulas?.length > 0);

    console.log(`📊 Day ${day} content check:`, {
      hasLearningKit: !!dayPlan.learningKit,
      hasContent: hasContent,
      willGenerate: !hasContent || regenerate === 'true'
    });

    // Generate content if it doesn't exist or regenerate is requested
    if (!hasContent || regenerate === 'true') {
      console.log(`🔄 Generating learning kit for Day ${day}...`);
      
      const learningKit = await generateDailyLearningKit(
        dayPlan, 
        plan.metadata.examBoard || 'CBSE',
        plan.metadata.grade || 12
      );
      
      // Update the plan with new content
      dayPlan.learningKit = learningKit;
      await plan.save();
      
      console.log(`✅ Learning kit generated for Day ${day}`);
    }

    console.log(`📦 Returning learning kit for Day ${day}:`, {
      hasNotes: !!dayPlan.learningKit?.notes,
      derivationsCount: dayPlan.learningKit?.derivations?.length || 0,
      formulasCount: dayPlan.learningKit?.formulas?.length || 0,
      pyqsCount: dayPlan.learningKit?.pyqs?.length || 0,
      scenariosCount: dayPlan.learningKit?.scenarios?.length || 0,
      practiceQuestionsCount: dayPlan.learningKit?.practiceQuestions?.length || 0
    });

    res.json({
      success: true,
      data: {
        day: dayPlan.day,
        date: dayPlan.date,
        subjects: dayPlan.subjects,
        rationale: dayPlan.rationale,
        preview: dayPlan.preview,
        learningKit: dayPlan.learningKit
      }
    });

  } catch (error) {
    console.error('❌ Error fetching daily content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily content',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/exam-planning/plans/:id
 * @desc    Delete an exam plan
 * @access  Private
 */
router.delete('/plans/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await ExamPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Exam plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam plan deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exam plan',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/exam-planning/plans/:id/status
 * @desc    Update exam plan status
 * @access  Private
 */
router.patch('/plans/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const plan = await ExamPlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Exam plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Plan status updated',
      data: plan
    });

  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/exam-planning/stats
 * @desc    Get exam planning statistics for user
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalPlans = await ExamPlan.countDocuments({ userId: req.user._id });
    const activePlans = await ExamPlan.countDocuments({ userId: req.user._id, status: 'active' });
    const completedPlans = await ExamPlan.countDocuments({ userId: req.user._id, status: 'completed' });

    // Get upcoming exams
    const upcomingExams = await ExamPlan.find({
      userId: req.user._id,
      status: 'active',
      examDate: { $gte: new Date() }
    })
      .sort({ examDate: 1 })
      .limit(5)
      .select('examDate subjects totalDays');

    res.json({
      success: true,
      stats: {
        totalPlans,
        activePlans,
        completedPlans,
        upcomingExams
      }
    });

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;
