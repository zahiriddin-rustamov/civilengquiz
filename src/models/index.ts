// User Models
export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

// Subject Models
export interface Subject {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  topics: Topic[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  order: number;
  subjectId: string;
  content: (Quiz | Flashcard | Media)[];
  createdAt: Date;
  updatedAt: Date;
}

// Content Models
export interface ContentBase {
  id: string;
  type: "quiz" | "flashcard" | "media";
  title: string;
  description: string;
  topicId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz extends ContentBase {
  type: "quiz";
  questions: Question[];
  timeLimit?: number; // in seconds
  passingScore?: number; // percentage
}

export interface Flashcard extends ContentBase {
  type: "flashcard";
  cards: Card[];
}

export interface Media extends ContentBase {
  type: "media";
  mediaType: "video" | "audio" | "document" | "image";
  url: string;
  duration?: number; // for video/audio
}

// Question Models
export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  points: number;
  order: number;
  options?: Option[];
  correctAnswer?: string | string[]; // Depends on question type
  explanation?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export type QuestionType = 
  | "multiple-choice" 
  | "true-false" 
  | "fill-blank" 
  | "matching" 
  | "sequence" 
  | "short-answer" 
  | "hotspot" 
  | "numerical" 
  | "diagram-labeling";

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean; // For multiple choice
  matchingPair?: string; // For matching questions
}

export interface Card {
  id: string;
  flashcardId: string;
  front: string;
  back: string;
  imageUrl?: string;
  order: number;
}

// User Progress Models
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeTaken: number; // in seconds
  answers: QuestionAnswer[];
  startedAt: Date;
  completedAt: Date;
}

export interface QuestionAnswer {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  score: number;
}

export interface UserProgress {
  userId: string;
  topicId: string;
  contentId: string;
  contentType: "quiz" | "flashcard" | "media";
  completed: boolean;
  lastAccessed: Date;
  timeSpent: number; // in seconds
} 