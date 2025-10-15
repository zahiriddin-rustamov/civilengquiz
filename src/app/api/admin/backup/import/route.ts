import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Subject, Topic, QuestionSection, Question, Flashcard, Media } from '@/models/database';
import mongoose from 'mongoose';

// POST /api/admin/backup/import - Import backup data
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { backup, mode = 'replace' } = body;

    if (!backup || !backup.data) {
      return NextResponse.json({ error: 'Invalid backup data' }, { status: 400 });
    }

    await connectToDatabase();

    // Start a session for transaction-like behavior
    const mongooseSession = await mongoose.startSession();

    try {
      await mongooseSession.startTransaction();

      let result;

      if (mode === 'replace') {
        result = await replaceImport(backup.data, mongooseSession);
      } else if (mode === 'merge') {
        result = await mergeImport(backup.data, mongooseSession);
      } else {
        throw new Error('Invalid import mode. Use "replace" or "merge"');
      }

      await mongooseSession.commitTransaction();

      return NextResponse.json({
        success: true,
        mode,
        imported: result
      });

    } catch (error) {
      await mongooseSession.abortTransaction();
      throw error;
    } finally {
      mongooseSession.endSession();
    }

  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json({
      error: 'Failed to import backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Replace mode: Delete all existing content and import backup
async function replaceImport(data: any, session: any) {
  // Delete all existing content in reverse order to respect relationships
  await Media.deleteMany({}, { session });
  await Flashcard.deleteMany({}, { session });
  await Question.deleteMany({}, { session });
  await QuestionSection.deleteMany({}, { session });
  await Topic.deleteMany({}, { session });
  await Subject.deleteMany({}, { session });

  // Import backup data
  const imported = {
    subjects: 0,
    topics: 0,
    questionSections: 0,
    questions: 0,
    flashcards: 0,
    media: 0
  };

  // Import subjects
  if (data.subjects && data.subjects.length > 0) {
    const subjects = await Subject.insertMany(
      data.subjects.map((s: any) => {
        const { __v, ...rest } = s;
        return rest;
      }),
      { session }
    );
    imported.subjects = subjects.length;
  }

  // Import topics
  if (data.topics && data.topics.length > 0) {
    const topics = await Topic.insertMany(
      data.topics.map((t: any) => {
        const { __v, ...rest } = t;
        return rest;
      }),
      { session }
    );
    imported.topics = topics.length;
  }

  // Import question sections
  if (data.questionSections && data.questionSections.length > 0) {
    const sections = await QuestionSection.insertMany(
      data.questionSections.map((s: any) => {
        const { __v, ...rest } = s;
        return rest;
      }),
      { session }
    );
    imported.questionSections = sections.length;
  }

  // Import questions
  if (data.questions && data.questions.length > 0) {
    const questions = await Question.insertMany(
      data.questions.map((q: any) => {
        const { __v, ...rest } = q;
        return rest;
      }),
      { session }
    );
    imported.questions = questions.length;
  }

  // Import flashcards
  if (data.flashcards && data.flashcards.length > 0) {
    const flashcards = await Flashcard.insertMany(
      data.flashcards.map((f: any) => {
        const { __v, ...rest } = f;
        return rest;
      }),
      { session }
    );
    imported.flashcards = flashcards.length;
  }

  // Import media
  if (data.media && data.media.length > 0) {
    const media = await Media.insertMany(
      data.media.map((m: any) => {
        const { __v, ...rest } = m;
        return rest;
      }),
      { session }
    );
    imported.media = media.length;
  }

  return imported;
}

// Merge mode: Add backup content alongside existing content
async function mergeImport(data: any, session: any) {
  const imported = {
    subjects: 0,
    topics: 0,
    questionSections: 0,
    questions: 0,
    flashcards: 0,
    media: 0,
    skipped: {
      subjects: 0,
      topics: 0,
      questionSections: 0,
      questions: 0,
      flashcards: 0,
      media: 0
    }
  };

  // Import subjects (skip if _id already exists)
  if (data.subjects && data.subjects.length > 0) {
    for (const subject of data.subjects) {
      const { __v, ...rest } = subject;
      const exists = await Subject.findById(rest._id).session(session);
      if (!exists) {
        await Subject.create([rest], { session });
        imported.subjects++;
      } else {
        imported.skipped.subjects++;
      }
    }
  }

  // Import topics (skip if _id already exists)
  if (data.topics && data.topics.length > 0) {
    for (const topic of data.topics) {
      const { __v, ...rest } = topic;
      const exists = await Topic.findById(rest._id).session(session);
      if (!exists) {
        await Topic.create([rest], { session });
        imported.topics++;
      } else {
        imported.skipped.topics++;
      }
    }
  }

  // Import question sections (skip if _id already exists)
  if (data.questionSections && data.questionSections.length > 0) {
    for (const section of data.questionSections) {
      const { __v, ...rest } = section;
      const exists = await QuestionSection.findById(rest._id).session(session);
      if (!exists) {
        await QuestionSection.create([rest], { session });
        imported.questionSections++;
      } else {
        imported.skipped.questionSections++;
      }
    }
  }

  // Import questions (skip if _id already exists)
  if (data.questions && data.questions.length > 0) {
    for (const question of data.questions) {
      const { __v, ...rest } = question;
      const exists = await Question.findById(rest._id).session(session);
      if (!exists) {
        await Question.create([rest], { session });
        imported.questions++;
      } else {
        imported.skipped.questions++;
      }
    }
  }

  // Import flashcards (skip if _id already exists)
  if (data.flashcards && data.flashcards.length > 0) {
    for (const flashcard of data.flashcards) {
      const { __v, ...rest } = flashcard;
      const exists = await Flashcard.findById(rest._id).session(session);
      if (!exists) {
        await Flashcard.create([rest], { session });
        imported.flashcards++;
      } else {
        imported.skipped.flashcards++;
      }
    }
  }

  // Import media (skip if _id already exists)
  if (data.media && data.media.length > 0) {
    for (const mediaItem of data.media) {
      const { __v, ...rest } = mediaItem;
      const exists = await Media.findById(rest._id).session(session);
      if (!exists) {
        await Media.create([rest], { session });
        imported.media++;
      } else {
        imported.skipped.media++;
      }
    }
  }

  return imported;
}
