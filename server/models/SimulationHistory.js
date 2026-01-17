import mongoose from 'mongoose';

const simulationHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    context: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true, // adds createdAt/updatedAt
  }
);

// Compound index for efficient retrieval of latest history per user
simulationHistorySchema.index({ user: 1, createdAt: -1 });

const SimulationHistory = mongoose.model('SimulationHistory', simulationHistorySchema);

export default SimulationHistory;
