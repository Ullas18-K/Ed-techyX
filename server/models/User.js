import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  location: {
    country: { type: String, default: '' },
    region: { type: String, default: '' }, // state/province/region
    city: { type: String, default: '' }
  },
  learningStats: {
    sessions: {
      type: Number,
      default: 0
    },
    questionsAsked: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    totalPoints: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (typeof next === 'function') {
    next();
  }
});

// Create indexes for faster queries
userSchema.index({ createdAt: -1 });
userSchema.index({ 'location.country': 1, 'location.region': 1 });

const User = mongoose.model('User', userSchema);

export default User;
