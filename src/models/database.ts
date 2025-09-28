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
  sectionSettings: {
    unlockConditions: 'always' | 'sequential' | 'score-based';
    requiredScore: number;
    requireCompletion: boolean;
  };
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
  sectionSettings: {
    unlockConditions: {
      type: String,
      enum: ['always', 'sequential', 'score-based'],
      default: 'always'
    },
    requiredScore: { type: Number, min: 0, max: 100, default: 70 },
    requireCompletion: { type: Boolean, default: false }
  },
}, {
  timestamps: true
});

const QuestionSectionSchema = new Schema<IQuestionSection>({
  name: { type: String, required: true },
  description: { type: String },
  topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
  order: { type: Number, required: true },
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

// Survey Schema
export interface ISurvey extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  isActive: boolean;
  targeting: {
    type: 'all' | 'specific_sections' | 'specific_topics' | 'specific_subjects';
    sectionIds?: Types.ObjectId[]; // For specific sections (section_completion only)
    topicIds?: Types.ObjectId[];   // For sections in specific topics, or specific topics (flashcard/media)
    subjectIds?: Types.ObjectId[]; // For sections/topics in specific subjects
  };
  questions: {
    id: string;
    type: 'rating' | 'multiple_choice' | 'text';
    question: string;
    required: boolean;
    options?: string[]; // For multiple choice
    scale?: { min: number; max: number; labels?: string[] }; // For rating
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema = new Schema<ISurvey>({
  title: { type: String, required: true },
  description: { type: String },
  triggerType: {
    type: String,
    enum: ['section_completion', 'flashcard_completion', 'media_completion'],
    required: true
  },
  isActive: { type: Boolean, default: true },
  targeting: {
    type: {
      type: String,
      enum: ['all', 'specific_sections', 'specific_topics', 'specific_subjects'],
      required: true,
      default: 'all'
    },
    sectionIds: [{ type: Schema.Types.ObjectId, ref: 'QuestionSection' }],
    topicIds: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }]
  },
  questions: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['rating', 'multiple_choice', 'text'], required: true },
    question: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    scale: {
      min: { type: Number },
      max: { type: Number },
      labels: [{ type: String }]
    }
  }]
}, {
  timestamps: true
});

// Survey Response Schema
export interface ISurveyResponse extends Document {
  _id: Types.ObjectId;
  surveyId: Types.ObjectId;
  userId: Types.ObjectId;
  triggerContentId: Types.ObjectId; // sectionId for section surveys, topicId for flashcard/media surveys
  triggerType: 'section_completion' | 'flashcard_completion' | 'media_completion';
  responses: {
    questionId: string;
    answer: any; // rating number, selected option, or text response
  }[];
  completedAt: Date;
  timeSpent: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const SurveyResponseSchema = new Schema<ISurveyResponse>({
  surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  triggerContentId: { type: Schema.Types.ObjectId, required: true },
  triggerType: {
    type: String,
    enum: ['section_completion', 'flashcard_completion', 'media_completion'],
    required: true
  },
  responses: [{
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true }
  }],
  completedAt: { type: Date, default: Date.now },
  timeSpent: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Create indexes for better query performance
SurveySchema.index({ triggerType: 1, isActive: 1 });
SurveyResponseSchema.index({ surveyId: 1, userId: 1 });
SurveyResponseSchema.index({ triggerContentId: 1, triggerType: 1 });
SurveyResponseSchema.index({ userId: 1 });

// User Interaction Schema for granular tracking
export interface IUserInteraction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId: string;
  timestamp: Date;
  eventType: string;
  contentType?: 'question' | 'flashcard' | 'media' | 'reading' | 'navigation';
  contentId?: Types.ObjectId;
  eventData: any;
  activeTime?: number;
  totalTime?: number;
  metadata?: any;
}

const UserInteractionSchema = new Schema<IUserInteraction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  eventType: { type: String, required: true },
  contentType: { type: String, enum: ['question', 'flashcard', 'media', 'reading', 'navigation'] },
  contentId: { type: Schema.Types.ObjectId },
  eventData: { type: Schema.Types.Mixed },
  activeTime: { type: Number },
  totalTime: { type: Number },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Create indexes for better query performance
UserInteractionSchema.index({ userId: 1, timestamp: -1 });
UserInteractionSchema.index({ sessionId: 1, timestamp: -1 });
UserInteractionSchema.index({ contentType: 1, contentId: 1 });
UserInteractionSchema.index({ eventType: 1 });

// Session Tracking Schema
export interface ISessionTracking extends Document {
  _id: Types.ObjectId;
  sessionId: string;
  userId?: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  activeDuration: number; // seconds
  navigationPath: Array<{
    timestamp: Date;
    url: string;
    pageTitle?: string;
    contentType?: string;
    contentId?: string;
  }>;
  contentInteractions: Array<{
    timestamp: Date;
    contentType: 'question' | 'flashcard' | 'media' | 'reading';
    contentId: string;
    action: string;
    duration?: number;
    activeTime?: number;
    metadata?: any;
  }>;
  engagementMetrics: {
    totalTime: number;
    activeTime: number;
    idleTime: number;
    engagementScore: number;
    idlePeriods: Array<{ start: Date; end: Date; duration: number }>;
  };
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    viewport: string;
    platform: string;
    language: string;
    timezone: string;
  };
}

const SessionTrackingSchema = new Schema<ISessionTracking>({
  sessionId: { type: String, required: true, unique: true }, // unique: true creates an index automatically
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  activeDuration: { type: Number, default: 0 },
  navigationPath: [{
    timestamp: { type: Date, required: true },
    url: { type: String, required: true },
    pageTitle: { type: String },
    contentType: { type: String },
    contentId: { type: String }
  }],
  contentInteractions: [{
    timestamp: { type: Date, required: true },
    contentType: { type: String, enum: ['question', 'flashcard', 'media', 'reading'], required: true },
    contentId: { type: String, required: true },
    action: { type: String, required: true },
    duration: { type: Number },
    activeTime: { type: Number },
    metadata: { type: Schema.Types.Mixed }
  }],
  engagementMetrics: {
    totalTime: { type: Number, default: 0 },
    activeTime: { type: Number, default: 0 },
    idleTime: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 100 },
    idlePeriods: [{
      start: { type: Date },
      end: { type: Date },
      duration: { type: Number }
    }]
  },
  deviceInfo: {
    userAgent: { type: String },
    screenResolution: { type: String },
    viewport: { type: String },
    platform: { type: String },
    language: { type: String },
    timezone: { type: String }
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
// Note: sessionId already has a unique index from the schema definition
SessionTrackingSchema.index({ userId: 1, startTime: -1 });
SessionTrackingSchema.index({ startTime: -1 });

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
export const Survey = mongoose.models.Survey || mongoose.model<ISurvey>('Survey', SurveySchema);
export const SurveyResponse = mongoose.models.SurveyResponse || mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
export const UserInteraction = mongoose.models.UserInteraction || mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);
export const SessionTracking = mongoose.models.SessionTracking || mongoose.model<ISessionTracking>('SessionTracking', SessionTrackingSchema);
