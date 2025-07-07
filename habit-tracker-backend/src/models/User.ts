import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  location?: string;
  joinedAt: Date;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
  };
  stats: {
    totalHabits: number;
    completedToday: number;
    currentStreak: number;
    longestStreak: number;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: String,
  bio: String,
  dateOfBirth: Date,
  location: String,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: false },
    publicProfile: { type: Boolean, default: false }
  },
  stats: {
    totalHabits: { type: Number, default: 0 },
    completedToday: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);