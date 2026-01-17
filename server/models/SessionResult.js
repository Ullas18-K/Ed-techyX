import mongoose from 'mongoose';

const sessionResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 0
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  accuracy: {
    type: Number, // percentage 0-100
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for leaderboard queries
sessionResultSchema.index({ user: 1, completedAt: -1 });
sessionResultSchema.index({ completedAt: -1 });

const SessionResult = mongoose.model('SessionResult', sessionResultSchema);

export default SessionResult;
