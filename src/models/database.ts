import mongoose, { Schema, Document, Types } from 'mongoose';

// User Schema (extends NextAuth user)
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, {
  timestamps: true
});

// Subject Schema
export interface ISubject extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  imageUrl?: string;
  isUnlocked: boolean;
  order: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  isUnlocked: { type: Boolean, default: true },
  order: { type: Number, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  estimatedHours: { type: Number, required: true },
  xpReward: { type: Number, required: true },
}, {
  timestamps: true
});

// Topic Schema
export interface ITopic extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  longDescription?: string;
  subjectId: Types.ObjectId;
  order: number;
  isUnlocked: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: { type: String },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  order: { type: Number, required: true },
  isUnlocked: { type: Boolean, default: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  estimatedMinutes: { type: Number, required: true },
  xpReward: { type: Number, required: true },
}, {
  timestamps: true
});

// Question Schema
export interface IQuestion extends Document {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
  text: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  data: any; // Flexible data structure for different question types
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  type: { 
    type: String, 
    enum: ['multiple-choice', 'true-false', 'fill-in-blank', 'numerical', 'matching'], 
    required: true 
  },
  text: { type: String, required: true },
  imageUrl: { type: String },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  points: { type: Number, required: true },
  order: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, required: true }, // Stores question-specific data
  explanation: { type: String },
}, {
  timestamps: true
});

// Flashcard Schema
export interface IFlashcard extends Document {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  front: string;
  back: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  imageUrl: { type: String },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  points: { type: Number, required: true },
  order: { type: Number, required: true },
  tags: [{ type: String }],
  category: { type: String },
}, {
  timestamps: true
});

// Media Schema
export interface IMedia extends Document {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  type: 'video' | 'simulation' | 'gallery';
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  order: number;
  data: any; // Flexible data structure for different media types
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  type: { type: String, enum: ['video', 'simulation', 'gallery'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  points: { type: Number, required: true },
  order: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, required: true },
}, {
  timestamps: true
});

// User Progress Schema
export interface IUserProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  topicId?: Types.ObjectId;
  contentId: Types.ObjectId; // Can be question, flashcard, or media
  contentType: 'question' | 'flashcard' | 'media';
  completed: boolean;
  score?: number;
  timeSpent: number; // in seconds
  lastAccessed: Date;
  attempts: number;
  data?: any; // Store additional progress data (e.g., flashcard mastery level)
  createdAt: Date;
  updatedAt: Date;
}

const UserProgressSchema = new Schema<IUserProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  contentId: { type: Schema.Types.ObjectId, required: true },
  contentType: { type: String, enum: ['question', 'flashcard', 'media'], required: true },
  completed: { type: Boolean, default: false },
  score: { type: Number },
  timeSpent: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now },
  attempts: { type: Number, default: 0 },
  data: { type: Schema.Types.Mixed },
}, {
  timestamps: true
});

// Create compound indexes for better query performance
UserProgressSchema.index({ userId: 1, contentId: 1, contentType: 1 }, { unique: true });
UserProgressSchema.index({ userId: 1, topicId: 1 });
UserProgressSchema.index({ userId: 1, subjectId: 1 });

// Export models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export const Topic = mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export const Flashcard = mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);
export const Media = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
export const UserProgress = mongoose.models.UserProgress || mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
