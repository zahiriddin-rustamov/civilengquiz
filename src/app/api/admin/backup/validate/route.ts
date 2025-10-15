import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/admin/backup/validate - Validate backup file structure
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { backup } = body;

    if (!backup) {
      return NextResponse.json({ error: 'No backup data provided' }, { status: 400 });
    }

    // Validate backup structure
    const validation = validateBackupStructure(backup);

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        errors: validation.errors
      }, { status: 400 });
    }

    // Return preview of backup contents
    return NextResponse.json({
      valid: true,
      preview: {
        version: backup.version,
        timestamp: backup.timestamp,
        type: backup.type,
        metadata: backup.metadata,
        collections: {
          subjects: backup.data.subjects?.length || 0,
          topics: backup.data.topics?.length || 0,
          questionSections: backup.data.questionSections?.length || 0,
          questions: backup.data.questions?.length || 0,
          flashcards: backup.data.flashcards?.length || 0,
          media: backup.data.media?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Error validating backup:', error);
    return NextResponse.json({
      valid: false,
      errors: ['Invalid JSON format or corrupted backup file']
    }, { status: 400 });
  }
}

// Helper function to validate backup structure
function validateBackupStructure(backup: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required top-level fields
  if (!backup.version) {
    errors.push('Missing version field');
  }

  if (!backup.timestamp) {
    errors.push('Missing timestamp field');
  }

  if (!backup.type) {
    errors.push('Missing type field');
  }

  if (!backup.metadata) {
    errors.push('Missing metadata field');
  }

  if (!backup.data) {
    errors.push('Missing data field');
    return { valid: false, errors };
  }

  // Check required data collections
  const requiredCollections = ['subjects', 'topics', 'questionSections', 'questions', 'flashcards', 'media'];

  for (const collection of requiredCollections) {
    if (!Array.isArray(backup.data[collection])) {
      errors.push(`Missing or invalid ${collection} collection`);
    }
  }

  // Validate metadata counts match actual data
  if (backup.metadata && backup.data) {
    if (backup.metadata.totalSubjects !== undefined &&
        backup.metadata.totalSubjects !== backup.data.subjects?.length) {
      errors.push('Metadata subject count does not match actual data');
    }

    if (backup.metadata.totalTopics !== undefined &&
        backup.metadata.totalTopics !== backup.data.topics?.length) {
      errors.push('Metadata topic count does not match actual data');
    }

    if (backup.metadata.totalQuestions !== undefined &&
        backup.metadata.totalQuestions !== backup.data.questions?.length) {
      errors.push('Metadata question count does not match actual data');
    }

    if (backup.metadata.totalFlashcards !== undefined &&
        backup.metadata.totalFlashcards !== backup.data.flashcards?.length) {
      errors.push('Metadata flashcard count does not match actual data');
    }

    if (backup.metadata.totalMedia !== undefined &&
        backup.metadata.totalMedia !== backup.data.media?.length) {
      errors.push('Metadata media count does not match actual data');
    }
  }

  // Validate each subject has required fields
  if (backup.data.subjects && Array.isArray(backup.data.subjects)) {
    backup.data.subjects.forEach((subject: any, index: number) => {
      if (!subject.name) {
        errors.push(`Subject at index ${index} is missing name field`);
      }
      if (!subject.description) {
        errors.push(`Subject at index ${index} is missing description field`);
      }
      if (subject.order === undefined) {
        errors.push(`Subject at index ${index} is missing order field`);
      }
    });
  }

  // Validate each topic has required fields
  if (backup.data.topics && Array.isArray(backup.data.topics)) {
    backup.data.topics.forEach((topic: any, index: number) => {
      if (!topic.name) {
        errors.push(`Topic at index ${index} is missing name field`);
      }
      if (!topic.subjectId) {
        errors.push(`Topic at index ${index} is missing subjectId field`);
      }
      if (topic.order === undefined) {
        errors.push(`Topic at index ${index} is missing order field`);
      }
    });
  }

  // Validate each question has required fields
  if (backup.data.questions && Array.isArray(backup.data.questions)) {
    backup.data.questions.forEach((question: any, index: number) => {
      if (!question.topicId) {
        errors.push(`Question at index ${index} is missing topicId field`);
      }
      if (!question.sectionId) {
        errors.push(`Question at index ${index} is missing sectionId field`);
      }
      if (!question.type) {
        errors.push(`Question at index ${index} is missing type field`);
      }
      if (!question.text) {
        errors.push(`Question at index ${index} is missing text field`);
      }
      if (!question.data) {
        errors.push(`Question at index ${index} is missing data field`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
