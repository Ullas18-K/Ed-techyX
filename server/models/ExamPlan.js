import mongoose from 'mongoose';

const dailyContentSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  subjects: [{
    name: String,
    chapters: [String],
    timeSlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    },
    estimatedTime: Number // in minutes
  }],
  rationale: String,
  preview: {
    coreConcepts: [String],
    learningObjectives: [String],
    importantSubtopics: [String]
  },
  learningKit: {
    notes: String,
    derivations: [{
      title: String,
      steps: [String],
      difficulty: String
    }],
    formulas: [{
      name: String,
      formula: String,
      application: String,
      units: String
    }],
    pyqs: [{
      question: String,
      year: Number,
      examBoard: String,
      marks: Number,
      solution: String,
      difficulty: String
    }],
    tips: [String],
    commonMistakes: [String],
    scenarios: [mongoose.Schema.Types.Mixed], // Scenario objects from AI service
    practiceQuestions: [mongoose.Schema.Types.Mixed], // Practice question objects
    metadata: mongoose.Schema.Types.Mixed // Additional metadata
  }
}, { _id: false });

const chapterPrioritySchema = new mongoose.Schema({
  subject: String,
  chapter: String,
  importance: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low']
  },
  ncertRelevance: Number, // 1-10
  derivationHeavy: Boolean,
  formulaIntensive: Boolean,
  pyqDominant: Boolean,
  estimatedTime: Number, // in hours
  weightage: Number // marks weightage
}, { _id: false });

const examPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  examDate: {
    type: Date,
    required: true
  },
  currentDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  subjects: [{
    name: String,
    topics: [String]
  }],
  dailyStudyHours: {
    type: Number,
    default: 6
  },
  chapterPriorities: [chapterPrioritySchema],
  dailyPlans: [dailyContentSchema],
  revisionDays: {
    type: Number,
    default: 0
  },
  metadata: {
    totalChapters: Number,
    totalTopics: Number,
    estimatedTotalHours: Number,
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    examBoard: {
      type: String,
      enum: ['CBSE', 'ICSE', 'State Board', 'Other'],
      default: 'CBSE'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
examPlanSchema.index({ userId: 1, createdAt: -1 });
examPlanSchema.index({ examDate: 1 });

const ExamPlan = mongoose.model('ExamPlan', examPlanSchema);

export default ExamPlan;
