import mongoose, { Document, Schema } from 'mongoose';

export interface IHabit extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  completions: {
    date: Date;
    count: number;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['health', 'productivity', 'learning', 'fitness', 'mindfulness', 'social', 'other']
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  targetCount: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  completions: [{
    date: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
HabitSchema.index({ userId: 1, createdAt: -1 });
HabitSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IHabit>('Habit', HabitSchema);