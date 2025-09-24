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
  // Gaming/Progress fields
  level: number;
  totalXP: number;
  currentStreak: number;
  maxStreak: number;
  lastActiveDate?: Date;
  achievements: string[]; // Array of achievement IDs
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
  // Gaming/Progress fields
  level: { type: Number, default: 1 },
  totalXP: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  achievements: [{ type: String }],
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
}, {
  timestamps: true
});

// Topic Schema
export interface ITopic extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  longDescription?: string;
  imageUrl?: string;
  subjectId: Types.ObjectId;
  order: number;
  isUnlocked: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: { type: String },
  imageUrl: { type: String },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  order: { type: Number, required: true },
  isUnlocked: { type: Boolean, default: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
}, {
  timestamps: true
});

const QuestionSectionSchema = new Schema<IQuestionSection>({
  name: { type: String, required: true },
  description: { type: String },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  order: { type: Number, required: true },
  settings: {
    unlockConditions: {
      type: String,
      enum: ['always', 'sequential', 'score-based'],
      default: 'always'
    },
    requiredScore: { type: Number, min: 0, max: 100 },
    allowRandomAccess: { type: Boolean, default: true },
    showToStudents: {
      type: String,
      enum: ['always', 'one-random', 'sequential'],
      default: 'always'
    },
    requireCompletion: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Question Section Schema
export interface IQuestionSection extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  topicId: Types.ObjectId;
  order: number;
  settings: {
    // Unlock conditions
    unlockConditions: 'always' | 'sequential' | 'score-based';
    requiredScore?: number; // Percentage required from previous section (if score-based)

    // Navigation settings
    allowRandomAccess: boolean; // Can students jump between sections freely?
    showToStudents: 'always' | 'one-random' | 'sequential'; // How to present to students

    // Progress requirements
    requireCompletion: boolean; // Must complete all questions to finish section
  };
  createdAt: Date;
  updatedAt: Date;
}

// Question Schema
export interface IQuestion extends Document {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  sectionId: Types.ObjectId;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'numerical' | 'matching';
  text: string;
  imageUrl?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  order: number;
  data: any; // Flexible data structure for different question types
  explanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'QuestionSection', required: true },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-in-blank', 'numerical', 'matching'],
    required: true
  },
  text: { type: String, required: true },
  imageUrl: { type: String },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  xpReward: { type: Number, required: true },
  estimatedMinutes: { type: Number, required: true },
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
  xpReward: number;
  estimatedMinutes: number;
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
  xpReward: { type: Number, required: true },
  estimatedMinutes: { type: Number, required: true },
  order: { type: Number, required: true },
  tags: [{ type: String }],
  category: { type: String },
}, {
  timestamps: true
});

// Media Schema (YouTube-focused)
export interface IMedia extends Document {
  _id: Types.ObjectId;
  topicId: Types.ObjectId;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xpReward: number;
  estimatedMinutes: number;
  order: number;

  // YouTube video data
  youtubeUrl: string;
  youtubeId: string;
  videoType: 'video' | 'short';
  thumbnail?: string;
  duration?: number; // in seconds

  // Educational content structure
  preVideoContent?: {
    learningObjectives: string[];
    prerequisites: string[];
    keyTerms: { term: string; definition: string }[];
  };

  postVideoContent?: {
    keyConcepts: string[];
    reflectionQuestions: string[];
    practicalApplications: string[];
    additionalResources?: { title: string; url: string }[];
  };

  // Quiz questions for shorts
  quizQuestions?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>({
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  xpReward: { type: Number, required: true },
  estimatedMinutes: { type: Number, required: true },
  order: { type: Number, required: true },

  // YouTube video data
  youtubeUrl: { type: String, required: true },
  youtubeId: { type: String, required: true },
  videoType: { type: String, enum: ['video', 'short'], required: true },
  thumbnail: { type: String },
  duration: { type: Number },

  // Educational content structure (optional based on videoType)
  preVideoContent: {
    learningObjectives: [{ type: String }],
    prerequisites: [{ type: String }],
    keyTerms: [{
      term: { type: String },
      definition: { type: String }
    }]
  },

  postVideoContent: {
    keyConcepts: [{ type: String }],
    reflectionQuestions: [{ type: String }],
    practicalApplications: [{ type: String }],
    additionalResources: [{
      title: { type: String },
      url: { type: String }
    }]
  },

  // Quiz questions for shorts
  quizQuestions: [{
    question: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: Number },
    explanation: { type: String }
  }]
}, {
  timestamps: true
});

// User Progress Schema
export interface IUserProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subjectId?: Types.ObjectId;
  topicId?: Types.ObjectId;
  sectionId?: Types.ObjectId; // Section progress tracking
  contentId: Types.ObjectId; // Can be question, flashcard, or media
  contentType: 'question' | 'flashcard' | 'media' | 'section';
  completed: boolean;
  score?: number;
  timeSpent: number; // in seconds
  lastAccessed: Date;
  attempts: number;
  data?: any; // Store additional progress data (e.g., flashcard mastery level, section unlock status)
  createdAt: Date;
  updatedAt: Date;
}

const UserProgressSchema = new Schema<IUserProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
  sectionId: { type: Schema.Types.ObjectId, ref: 'QuestionSection' },
  contentId: { type: Schema.Types.ObjectId, required: true },
  contentType: { type: String, enum: ['question', 'flashcard', 'media', 'section'], required: true },
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
UserProgressSchema.index({ userId: 1, sectionId: 1 });

// Media Engagement Schema
export interface IMediaEngagement extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  mediaId: Types.ObjectId;
  isLiked: boolean;
  isSaved: boolean;
  viewCount: number;
  lastViewed: Date;
  totalWatchTime: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const MediaEngagementSchema = new Schema<IMediaEngagement>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mediaId: { type: Schema.Types.ObjectId, ref: 'Media', required: true },
  isLiked: { type: Boolean, default: false },
  isSaved: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  lastViewed: { type: Date, default: Date.now },
  totalWatchTime: { type: Number, default: 0 },
}, {
  timestamps: true
});

// Create compound indexes for better query performance
MediaEngagementSchema.index({ userId: 1, mediaId: 1 }, { unique: true });
MediaEngagementSchema.index({ userId: 1, isLiked: 1 });
MediaEngagementSchema.index({ userId: 1, isSaved: 1 });
MediaEngagementSchema.index({ mediaId: 1 });

// Export models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
// Force clear cached Topic model to ensure schema updates
if (mongoose.models.Topic) {
  delete mongoose.models.Topic;
}
export const Topic = mongoose.model<ITopic>('Topic', TopicSchema);
// Force clear cached QuestionSection model to ensure schema updates
if (mongoose.models.QuestionSection) {
  delete mongoose.models.QuestionSection;
}
export const QuestionSection = mongoose.model<IQuestionSection>('QuestionSection', QuestionSectionSchema);
// Force clear cached Question model to ensure schema updates
if (mongoose.models.Question) {
  delete mongoose.models.Question;
}
export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
export const Flashcard = mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);
export const Media = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
export const UserProgress = mongoose.models.UserProgress || mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);
export const MediaEngagement = mongoose.models.MediaEngagement || mongoose.model<IMediaEngagement>('MediaEngagement', MediaEngagementSchema);
