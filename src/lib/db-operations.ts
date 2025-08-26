import connectToDatabase from './mongoose';
import { Subject, Topic, Question, Flashcard, Media, UserProgress, ISubject, ITopic, IQuestion, IFlashcard, IMedia, IUserProgress } from '@/models/database';
import { Types } from 'mongoose';

// Subject Operations
export class SubjectService {
  static async getAllSubjects(): Promise<ISubject[]> {
    await connectToDatabase();
    return Subject.find({}).sort({ order: 1 }).lean();
  }

  static async getSubjectById(id: string): Promise<ISubject | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Subject.findById(id).lean();
  }

  static async createSubject(data: Partial<ISubject>): Promise<ISubject> {
    await connectToDatabase();
    const subject = new Subject(data);
    return subject.save();
  }

  static async updateSubject(id: string, data: Partial<ISubject>): Promise<ISubject | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Subject.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async deleteSubject(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Subject.findByIdAndDelete(id);
    return !!result;
  }
}

// Topic Operations
export class TopicService {
  static async getTopicsBySubject(subjectId: string): Promise<ITopic[]> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(subjectId)) return [];
    return Topic.find({ subjectId }).sort({ order: 1 }).lean();
  }

  static async getTopicById(id: string): Promise<ITopic | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Topic.findById(id).lean();
  }

  static async createTopic(data: Partial<ITopic>): Promise<ITopic> {
    await connectToDatabase();
    const topic = new Topic(data);
    return topic.save();
  }

  static async updateTopic(id: string, data: Partial<ITopic>): Promise<ITopic | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Topic.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async deleteTopic(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Topic.findByIdAndDelete(id);
    return !!result;
  }
}

// Question Operations
export class QuestionService {
  static async getQuestionsByTopic(topicId: string): Promise<IQuestion[]> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(topicId)) return [];
    return Question.find({ topicId }).sort({ order: 1 }).lean();
  }

  static async getQuestionById(id: string): Promise<IQuestion | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Question.findById(id).lean();
  }

  static async createQuestion(data: Partial<IQuestion>): Promise<IQuestion> {
    await connectToDatabase();
    const question = new Question(data);
    return question.save();
  }

  static async updateQuestion(id: string, data: Partial<IQuestion>): Promise<IQuestion | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Question.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async deleteQuestion(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Question.findByIdAndDelete(id);
    return !!result;
  }
}

// Flashcard Operations
export class FlashcardService {
  static async getFlashcardsByTopic(topicId: string): Promise<IFlashcard[]> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(topicId)) return [];
    return Flashcard.find({ topicId }).sort({ order: 1 }).lean();
  }

  static async getFlashcardById(id: string): Promise<IFlashcard | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Flashcard.findById(id).lean();
  }

  static async createFlashcard(data: Partial<IFlashcard>): Promise<IFlashcard> {
    await connectToDatabase();
    const flashcard = new Flashcard(data);
    return flashcard.save();
  }

  static async updateFlashcard(id: string, data: Partial<IFlashcard>): Promise<IFlashcard | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Flashcard.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async deleteFlashcard(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Flashcard.findByIdAndDelete(id);
    return !!result;
  }
}

// Media Operations
export class MediaService {
  static async getMediaByTopic(topicId: string): Promise<IMedia[]> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(topicId)) return [];
    return Media.find({ topicId }).sort({ order: 1 }).lean();
  }

  static async getMediaById(id: string): Promise<IMedia | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Media.findById(id).lean();
  }

  static async createMedia(data: Partial<IMedia>): Promise<IMedia> {
    await connectToDatabase();
    const media = new Media(data);
    return media.save();
  }

  static async updateMedia(id: string, data: Partial<IMedia>): Promise<IMedia | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return null;
    return Media.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  static async deleteMedia(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Media.findByIdAndDelete(id);
    return !!result;
  }
}

// User Progress Operations
export class ProgressService {
  static async getUserProgress(userId: string, contentId: string, contentType: string): Promise<IUserProgress | null> {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(contentId)) return null;
    return UserProgress.findOne({ userId, contentId, contentType }).lean();
  }

  static async updateUserProgress(data: {
    userId: string;
    subjectId?: string;
    topicId?: string;
    contentId: string;
    contentType: 'question' | 'flashcard' | 'media';
    completed?: boolean;
    score?: number;
    timeSpent?: number;
    data?: any;
  }): Promise<IUserProgress> {
    await connectToDatabase();
    
    const filter = {
      userId: data.userId,
      contentId: data.contentId,
      contentType: data.contentType
    };

    const update = {
      ...data,
      lastAccessed: new Date(),
      $inc: { attempts: 1 }
    };

    return UserProgress.findOneAndUpdate(
      filter,
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as Promise<IUserProgress>;
  }

  static async getUserTopicProgress(userId: string, topicId: string): Promise<{
    totalItems: number;
    completedItems: number;
    totalXP: number;
    earnedXP: number;
    progressPercentage: number;
  }> {
    await connectToDatabase();
    
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(topicId)) {
      return { totalItems: 0, completedItems: 0, totalXP: 0, earnedXP: 0, progressPercentage: 0 };
    }

    // Get all content for the topic
    const [questions, flashcards, media] = await Promise.all([
      Question.find({ topicId }).lean(),
      Flashcard.find({ topicId }).lean(),
      Media.find({ topicId }).lean()
    ]);

    const totalItems = questions.length + flashcards.length + media.length;
    const totalXP = [...questions, ...flashcards, ...media].reduce((sum, item) => sum + item.points, 0);

    if (totalItems === 0) {
      return { totalItems: 0, completedItems: 0, totalXP: 0, earnedXP: 0, progressPercentage: 0 };
    }

    // Get user progress for all content
    const allContentIds = [
      ...questions.map(q => q._id),
      ...flashcards.map(f => f._id),
      ...media.map(m => m._id)
    ];

    const progressRecords = await UserProgress.find({
      userId,
      contentId: { $in: allContentIds }
    }).lean();

    const completedItems = progressRecords.filter(p => p.completed).length;
    const earnedXP = progressRecords.reduce((sum, p) => sum + (p.score || 0), 0);
    const progressPercentage = Math.round((completedItems / totalItems) * 100);

    return {
      totalItems,
      completedItems,
      totalXP,
      earnedXP,
      progressPercentage
    };
  }

  static async getUserSubjectProgress(userId: string, subjectId: string): Promise<{
    totalTopics: number;
    completedTopics: number;
    totalXP: number;
    earnedXP: number;
    progressPercentage: number;
  }> {
    await connectToDatabase();
    
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(subjectId)) {
      return { totalTopics: 0, completedTopics: 0, totalXP: 0, earnedXP: 0, progressPercentage: 0 };
    }

    const topics = await Topic.find({ subjectId }).lean();
    
    if (topics.length === 0) {
      return { totalTopics: 0, completedTopics: 0, totalXP: 0, earnedXP: 0, progressPercentage: 0 };
    }

    let totalXP = 0;
    let earnedXP = 0;
    let completedTopics = 0;

    for (const topic of topics) {
      const topicProgress = await this.getUserTopicProgress(userId, topic._id.toString());
      totalXP += topicProgress.totalXP;
      earnedXP += topicProgress.earnedXP;
      
      if (topicProgress.progressPercentage >= 80) { // Consider 80%+ as completed
        completedTopics++;
      }
    }

    const progressPercentage = topics.length > 0 ? Math.round((completedTopics / topics.length) * 100) : 0;

    return {
      totalTopics: topics.length,
      completedTopics,
      totalXP,
      earnedXP,
      progressPercentage
    };
  }
}
