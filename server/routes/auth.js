import express from 'express';
import { body, validationResult } from 'express-validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SimulationHistory from '../models/SimulationHistory.js';
import SessionResult from '../models/SessionResult.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const simulationValidation = [
  body('query').isString().trim().isLength({ min: 1, max: 500 }).withMessage('Query must be 1-500 characters'),
];

// helper to fetch recent simulation history
async function getRecentHistory(userId, limit = 20) {
  const history = await SimulationHistory.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('query createdAt')
    .lean();

  return history.map((h) => ({ query: h.query, timestamp: h.createdAt }));
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const simulationHistory = await getRecentHistory(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        learningStats: user.learningStats,
        simulationHistory,
        joinedDate: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists (include password for verification)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const simulationHistory = await getRecentHistory(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        learningStats: user.learningStats,
        simulationHistory,
        joinedDate: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const simulationHistory = await getRecentHistory(req.user._id);

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        bio: req.user.bio,
        location: req.user.location,
        preferences: req.user.preferences,
        learningStats: req.user.learningStats,
        simulationHistory,
        joinedDate: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, bio, avatar, preferences, location } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };
    if (location) {
      updateData.location = {
        country: location.country ?? req.user.location?.country ?? '',
        region: location.region ?? req.user.location?.region ?? '',
        city: location.city ?? req.user.location?.city ?? ''
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    const simulationHistory = await getRecentHistory(user._id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        learningStats: user.learningStats,
        simulationHistory,
        joinedDate: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   PUT /api/auth/learning-stats
// @desc    Update learning statistics
// @access  Private
router.put('/learning-stats', authenticateToken, async (req, res) => {
  try {
    const { sessions, questionsAsked, totalTimeSpent } = req.body;

    const updateData = { learningStats: req.user.learningStats };
    
    if (sessions !== undefined) updateData.learningStats.sessions = sessions;
    if (questionsAsked !== undefined) updateData.learningStats.questionsAsked = questionsAsked;
    if (totalTimeSpent !== undefined) updateData.learningStats.totalTimeSpent = totalTimeSpent;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Learning stats updated successfully',
      learningStats: user.learningStats
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating stats'
    });
  }
});

// @route   POST /api/auth/simulations
// @desc    Add a simulation history entry for current user
// @access  Private
router.post('/simulations', authenticateToken, simulationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { query, context = {} } = req.body;

    await SimulationHistory.create({ user: req.user._id, query, context });

    const simulationHistory = await getRecentHistory(req.user._id);

    res.status(201).json({ success: true, simulationHistory });
  } catch (error) {
    console.error('Create simulation history error:', error);
    res.status(500).json({ success: false, message: 'Server error creating history' });
  }
});

// @route   GET /api/auth/simulations
// @desc    Get recent simulation history for current user
// @access  Private
router.get('/simulations', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const simulationHistory = await getRecentHistory(req.user._id, limit);

    res.json({ success: true, simulationHistory });
  } catch (error) {
    console.error('Fetch simulation history error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching history' });
  }
});

// @route   POST /api/auth/session-results
// @desc    Record session results with points
// @access  Private
router.post('/session-results', authenticateToken, async (req, res) => {
  try {
    const { question, points = 0, duration = 0, accuracy = 0 } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    if (typeof points !== 'number' || points < 0) {
      return res.status(400).json({ success: false, message: 'Points must be a non-negative number' });
    }

    // Create session result
    const sessionResult = await SessionResult.create({
      user: req.user._id,
      question: question.trim(),
      points: Math.max(0, Math.min(100, points)), // Cap between 0-100
      duration: Math.max(0, duration),
      accuracy: Math.max(0, Math.min(100, accuracy)) // Cap between 0-100
    });

    // Update user's total points and session count
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: {
          'learningStats.totalPoints': sessionResult.points,
          'learningStats.sessions': 1
        },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    ).select('-password');

    res.status(201).json({
      success: true,
      sessionResult,
      totalPoints: user.learningStats.totalPoints
    });
  } catch (error) {
    console.error('Create session result error:', error);
    res.status(500).json({ success: false, message: 'Server error creating session result' });
  }
});

// @route   GET /api/auth/leaderboard
// @desc    Get real-time leaderboard with top users by points
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'all'; // 'week', 'month', 'all'
    const scope = (req.query.scope || 'global').toString(); // 'global' | 'regional'
    const region = req.query.region ? req.query.region.toString().trim() : '';
    let dateFilter = {};

    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { completedAt: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { completedAt: { $gte: monthAgo } };
    }

    // Aggregate points by user with timeframe filter
    const pipeline = [
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$points' },
          sessions: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracy' },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { totalPoints: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
    ];

    // Apply regional filtering if requested and region provided
    if (scope === 'regional' && region) {
      pipeline.push({ $match: { 'userInfo.location.region': region } });
    }

    pipeline.push({
      $project: {
        _id: 1,
        name: '$userInfo.name',
        avatar: '$userInfo.avatar',
        totalPoints: 1,
        sessions: 1,
        avgAccuracy: { $round: ['$avgAccuracy', 1] },
        totalDuration: 1,
        region: '$userInfo.location.region',
        country: '$userInfo.location.country'
      }
    });

    const leaderboard = await SessionResult.aggregate(pipeline);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    res.json({ success: true, leaderboard: rankedLeaderboard, timeframe, scope, region });
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching leaderboard' });
  }
});

// @route   GET /api/auth/user-rank
// @desc    Get current user's rank and stats
// @access  Private
router.get('/user-rank', authenticateToken, async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'all';
    let dateFilter = {};

    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { completedAt: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { completedAt: { $gte: monthAgo } };
    }

    // Get user's total points (all time or filtered)
    const userStats = await SessionResult.aggregate([
      { $match: { user: req.user._id, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' },
          sessions: { $sum: 1 },
          avgAccuracy: { $avg: '$accuracy' }
        }
      }
    ]);

    // Get user's rank
    const rank = await SessionResult.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$points' }
        }
      },
      { $sort: { totalPoints: -1 } },
      {
        $group: {
          _id: null,
          users: { $push: '$_id' }
        }
      }
    ]);

    const userRank = rank[0]?.users.indexOf(req.user._id) + 1 || 0;
    const stats = userStats[0] || { totalPoints: 0, sessions: 0, avgAccuracy: 0 };

    res.json({
      success: true,
      rank: userRank,
      totalPoints: stats.totalPoints,
      sessions: stats.sessions,
      avgAccuracy: Math.round(stats.avgAccuracy * 10) / 10,
      timeframe
    });
  } catch (error) {
    console.error('Fetch user rank error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user rank' });
  }
});

export default router;
