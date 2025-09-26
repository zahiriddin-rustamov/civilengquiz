import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { UserProgress } from '@/models/database';
import { XPService } from '@/lib/xp-service';
import { initializeUserGamingFields } from '@/lib/user-migration';

interface ProgressUpdateRequest {
  contentId: string;
  contentType: 'question' | 'flashcard' | 'media' | 'section';
  topicId: string;
  subjectId: string;
  sectionId?: string; // Optional for backwards compatibility
  completed: boolean;
  score?: number;
  timeSpent: number;
  data?: any; // Additional progress data (e.g., flashcard mastery level, section completion data)
}

// POST /api/user/progress/update - Update user progress for content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body: ProgressUpdateRequest = await request.json();
    
    // Initialize gaming fields if they don't exist
    await initializeUserGamingFields(userId);
    
    // Validate required fields
    if (!body.contentId || !body.contentType || !body.topicId || !body.subjectId) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, contentType, topicId, subjectId' },
        { status: 400 }
      );
    }

    // Validate ObjectId format for MongoDB fields
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(body.contentId)) {
      return NextResponse.json(
        { error: 'Invalid contentId format. Must be a valid ObjectId (24-character hex string)' },
        { status: 400 }
      );
    }
    if (!objectIdRegex.test(body.topicId)) {
      return NextResponse.json(
        { error: 'Invalid topicId format. Must be a valid ObjectId (24-character hex string)' },
        { status: 400 }
      );
    }
    if (!objectIdRegex.test(body.subjectId)) {
      return NextResponse.json(
        { error: 'Invalid subjectId format. Must be a valid ObjectId (24-character hex string)' },
        { status: 400 }
      );
    }
    if (body.sectionId && !objectIdRegex.test(body.sectionId)) {
      return NextResponse.json(
        { error: 'Invalid sectionId format. Must be a valid ObjectId (24-character hex string)' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check existing progress to determine if this is a first-time correct completion
    let existingProgress = await UserProgress.findOne({
      userId,
      contentId: body.contentId,
      contentType: body.contentType
    });

    const wasAlreadyCompletedCorrectly = existingProgress &&
      existingProgress.completed &&
      existingProgress.score &&
      existingProgress.score > 0;

    // Update user progress
    let progress;
    try {
      const progressData = {
        userId,
        subjectId: body.subjectId,
        topicId: body.topicId,
        contentId: body.contentId,
        contentType: body.contentType,
        completed: body.completed,
        score: body.score,
        timeSpent: body.timeSpent,
        lastAccessed: new Date(),
        data: body.data,
        ...(body.sectionId && { sectionId: body.sectionId })
      };

      progress = await UserProgress.findOneAndUpdate(
        {
          userId,
          contentId: body.contentId,
          contentType: body.contentType
        },
        {
          $set: progressData,
          $inc: { attempts: 1 }
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );
    } catch (error) {
      console.error('Error updating user progress:', error);
      return NextResponse.json(
        { error: 'Failed to update user progress. Please check the provided IDs are valid.' },
        { status: 500 }
      );
    }

    // Calculate and award XP only if content was completed correctly for the first time
    let xpResult = null;
    const isFirstTimeCorrectCompletion = body.completed &&
      body.score &&
      body.score > 0 &&
      !wasAlreadyCompletedCorrectly;

    if (isFirstTimeCorrectCompletion) {
      const xpEarned = XPService.calculateContentXP(
        body.contentType,
        body.score,
        body.data?.difficulty,
        body.data
      );

      if (xpEarned > 0) {
        xpResult = await XPService.updateUserXP(userId, xpEarned);
      }
    }

    // Calculate actual XP earned for display (only for first-time correct completions)
    const actualXPEarned = isFirstTimeCorrectCompletion ? XPService.calculateContentXP(
      body.contentType,
      body.score,
      body.data?.difficulty,
      body.data
    ) : 0;

    return NextResponse.json({
      success: true,
      progress,
      xpEarned: actualXPEarned + (xpResult?.newAchievements?.reduce((sum, a) => sum + a.xpReward, 0) || 0),
      leveledUp: xpResult?.leveledUp || false,
      newLevel: xpResult?.newLevel || 1,
      newAchievements: xpResult?.newAchievements || [],
      message: `Progress updated successfully. ${actualXPEarned > 0 ? `Earned ${actualXPEarned} XP! ${xpResult?.leveledUp ? `Level up to ${xpResult.newLevel}!` : ''}` : ''}`
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
