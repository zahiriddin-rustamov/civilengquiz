import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Subject, Topic, QuestionSection, Question, Flashcard, Media } from '@/models/database';

// POST /api/admin/backup/export - Export all content to JSON
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch all content collections
    const [subjects, topics, questionSections, questions, flashcards, media] = await Promise.all([
      Subject.find({}).sort({ order: 1 }).lean(),
      Topic.find({}).sort({ order: 1 }).lean(),
      QuestionSection.find({}).sort({ order: 1 }).lean(),
      Question.find({}).sort({ order: 1 }).lean(),
      Flashcard.find({}).sort({ order: 1 }).lean(),
      Media.find({}).sort({ order: 1 }).lean()
    ]);

    // Create backup object
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      type: 'content-only',
      metadata: {
        totalSubjects: subjects.length,
        totalTopics: topics.length,
        totalQuestionSections: questionSections.length,
        totalQuestions: questions.length,
        totalFlashcards: flashcards.length,
        totalMedia: media.length,
        totalItems: subjects.length + topics.length + questionSections.length +
                    questions.length + flashcards.length + media.length
      },
      data: {
        subjects,
        topics,
        questionSections,
        questions,
        flashcards,
        media
      }
    };

    // Generate filename with timestamp
    const filename = `civilengquiz-backup-${new Date().toISOString().split('T')[0]}.json`;

    // Return as JSON file download
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting backup:', error);
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 });
  }
}
