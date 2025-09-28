import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { UserProgress, Question, Flashcard, Media } from '@/models/database';
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

// Helper function to check if all content of a type is completed in a topic
async function checkTopicCompletion(userId: string, topicId: string, contentType: 'question' | 'flashcard' | 'media') {
  await connectToDatabase();

  // Get all content items for this topic
  let contentModel;
  switch (contentType) {
    case 'question':
      contentModel = Question;
      break;
    case 'flashcard':
      contentModel = Flashcard;
      break;
    case 'media':
      contentModel = Media;
      break;
  }

  const allContent = await contentModel.find({ topicId }).select('_id');
  const contentIds = allContent.map(item => item._id.toString());

  if (contentIds.length === 0) return false;

  // Check if all content is completed
  const completedProgress = await UserProgress.find({
    userId,
    topicId,
    contentType,
    contentId: { $in: contentIds },
    completed: true
  });

  return completedProgress.length === contentIds.length;
}

// Helper function to check if all questions in a section are completed
async function checkSectionCompletion(userId: string, sectionId: string) {
  await connectToDatabase();

  // Get all questions in this section
  const allQuestions = await Question.find({ sectionId }).select('_id');
  const questionIds = allQuestions.map(q => q._id.toString());

  if (questionIds.length === 0) return false;

  // Check if all questions are completed
  const completedQuestions = await UserProgress.find({
    userId,
    sectionId,
    contentType: 'question',
    contentId: { $in: questionIds },
    completed: true
  });

  return completedQuestions.length === questionIds.length;
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

    // Check existing progress
    let existingProgress = await UserProgress.findOne({
      userId,
      contentId: body.contentId,
      contentType: body.contentType
    });

    const now = new Date();
    let totalXPEarned = 0;
    let xpEarnedThisTime = 0;
    let xpResult = null;
    let completionBonusXP = 0;
    let isDailyXP = false;
    let isFirstTime = false;

    // Determine XP to award based on completion status and timing
    if (body.completed && body.score && body.score > 0) {
      if (!existingProgress || !existingProgress.completed || !existingProgress.firstCompletedDate) {
        // First-time completion - award full XP
        isFirstTime = true;
        xpEarnedThisTime = XPService.calculateContentXP(
          body.contentType,
          body.score,
          body.data?.difficulty,
          body.data
        );

        console.log(`[XP] First-time completion for ${body.contentType} ${body.contentId}: ${xpEarnedThisTime} XP`);

      } else if (XPService.isDailyXPEligible(existingProgress.firstCompletedDate, existingProgress.lastDailyXPDate)) {
        // Daily XP - award 50% XP
        isDailyXP = true;
        xpEarnedThisTime = XPService.calculateDailyXP(
          body.contentType,
          body.score,
          body.data?.difficulty,
          body.data
        );

        console.log(`[XP] Daily XP for ${body.contentType} ${body.contentId}: ${xpEarnedThisTime} XP`);

      } else {
        // Same day repeat or already got daily XP today - no XP
        xpEarnedThisTime = 0;
        console.log(`[XP] No XP for ${body.contentType} ${body.contentId} - already completed today`);
      }
    }

    // Update progress document with daily XP tracking
    const updateData: any = {
      userId,
      subjectId: body.subjectId,
      topicId: body.topicId,
      contentId: body.contentId,
      contentType: body.contentType,
      completed: body.completed,
      score: body.score,
      timeSpent: body.timeSpent,
      lastAccessed: now,
      data: body.data,
      ...(body.sectionId && { sectionId: body.sectionId })
    };

    // Update daily XP tracking fields
    if (isFirstTime) {
      updateData.firstCompletedDate = now;
      updateData.$inc = {
        attempts: 1,
        totalXPEarned: xpEarnedThisTime
      };
    } else if (isDailyXP) {
      updateData.lastDailyXPDate = now;
      updateData.$inc = {
        attempts: 1,
        dailyXPCount: 1,
        totalXPEarned: xpEarnedThisTime
      };
    } else {
      updateData.$inc = { attempts: 1 };
    }

    // Update the progress document
    const progress = await UserProgress.findOneAndUpdate(
      {
        userId,
        contentId: body.contentId,
        contentType: body.contentType
      },
      updateData,
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    // Award XP if earned
    if (xpEarnedThisTime > 0) {
      xpResult = await XPService.updateUserXP(userId, xpEarnedThisTime);
    }

    // Check for completion bonuses (only for first-time completions)
    if (isFirstTime && body.completed) {
      let bonusAwarded = false;

      // Check section completion bonus for questions
      if (body.contentType === 'question' && body.sectionId) {
        const sectionCompleted = await checkSectionCompletion(userId, body.sectionId);

        if (sectionCompleted) {
          // Check if we already awarded section completion bonus
          const sectionProgress = await UserProgress.findOne({
            userId,
            contentId: body.sectionId,
            contentType: 'section',
            completed: true
          });

          if (!sectionProgress) {
            // Award section completion bonus
            completionBonusXP = XPService.calculateCompletionBonus('section', body.data?.difficulty);
            console.log(`[XP] Section completion bonus for ${body.sectionId}: ${completionBonusXP} XP`);

            // Save section completion record
            await UserProgress.create({
              userId,
              contentId: body.sectionId,
              contentType: 'section',
              topicId: body.topicId,
              subjectId: body.subjectId,
              sectionId: body.sectionId,
              completed: true,
              score: 100,
              timeSpent: 0,
              firstCompletedDate: now,
              totalXPEarned: completionBonusXP
            });

            bonusAwarded = true;
          }
        }
      }

      // Check topic completion bonus for flashcards
      if (body.contentType === 'flashcard') {
        const topicCompleted = await checkTopicCompletion(userId, body.topicId, 'flashcard');

        if (topicCompleted) {
          // Check if we already awarded topic flashcard completion bonus
          const topicBonusKey = `flashcard-topic-${body.topicId}`;
          const topicBonusProgress = await UserProgress.findOne({
            userId,
            contentId: topicBonusKey,
            contentType: 'flashcard',
            data: { isTopicBonus: true }
          });

          if (!topicBonusProgress) {
            // Award topic flashcard completion bonus
            completionBonusXP = XPService.calculateCompletionBonus('flashcard-topic', body.data?.difficulty);
            console.log(`[XP] Flashcard topic completion bonus for topic ${body.topicId}: ${completionBonusXP} XP`);

            // Save topic completion bonus record
            await UserProgress.create({
              userId,
              contentId: topicBonusKey,
              contentType: 'flashcard',
              topicId: body.topicId,
              subjectId: body.subjectId,
              completed: true,
              score: 100,
              timeSpent: 0,
              firstCompletedDate: now,
              totalXPEarned: completionBonusXP,
              data: { isTopicBonus: true }
            });

            bonusAwarded = true;
          }
        }
      }

      // Check topic completion bonus for media
      if (body.contentType === 'media') {
        const topicCompleted = await checkTopicCompletion(userId, body.topicId, 'media');

        if (topicCompleted) {
          // Check if we already awarded topic media completion bonus
          const topicBonusKey = `media-topic-${body.topicId}`;
          const topicBonusProgress = await UserProgress.findOne({
            userId,
            contentId: topicBonusKey,
            contentType: 'media',
            data: { isTopicBonus: true }
          });

          if (!topicBonusProgress) {
            // Award topic media completion bonus
            completionBonusXP = XPService.calculateCompletionBonus('media-topic', body.data?.difficulty);
            console.log(`[XP] Media topic completion bonus for topic ${body.topicId}: ${completionBonusXP} XP`);

            // Save topic completion bonus record
            await UserProgress.create({
              userId,
              contentId: topicBonusKey,
              contentType: 'media',
              topicId: body.topicId,
              subjectId: body.subjectId,
              completed: true,
              score: 100,
              timeSpent: 0,
              firstCompletedDate: now,
              totalXPEarned: completionBonusXP,
              data: { isTopicBonus: true }
            });

            bonusAwarded = true;
          }
        }
      }

      // Award completion bonus XP
      if (bonusAwarded && completionBonusXP > 0) {
        const bonusResult = await XPService.updateUserXP(userId, completionBonusXP);
        if (bonusResult.leveledUp && !xpResult?.leveledUp) {
          xpResult = bonusResult;
        }
      }
    }

    // Calculate total XP for response
    const totalXPThisTime = xpEarnedThisTime + completionBonusXP;
    const achievementXP = xpResult?.newAchievements?.reduce((sum, a) => sum + a.xpReward, 0) || 0;

    // Build response message
    let message = 'Progress updated successfully.';
    if (isFirstTime) {
      message += ` First-time completion! Earned ${xpEarnedThisTime} XP.`;
    } else if (isDailyXP) {
      message += ` Daily practice! Earned ${xpEarnedThisTime} XP (50% of original).`;
    } else if (body.completed) {
      message += ' Already completed today - no additional XP.';
    }

    if (completionBonusXP > 0) {
      if (body.contentType === 'question') {
        message += ` Section complete! Bonus ${completionBonusXP} XP!`;
      } else if (body.contentType === 'flashcard') {
        message += ` All flashcards studied! Bonus ${completionBonusXP} XP!`;
      } else if (body.contentType === 'media') {
        message += ` All media viewed! Bonus ${completionBonusXP} XP!`;
      }
    }

    if (xpResult?.leveledUp) {
      message += ` Level up to ${xpResult.newLevel}!`;
    }

    return NextResponse.json({
      success: true,
      progress,
      xpEarned: totalXPThisTime + achievementXP,
      baseXP: xpEarnedThisTime,
      bonusXP: completionBonusXP,
      achievementXP,
      isDailyXP,
      isFirstTime,
      leveledUp: xpResult?.leveledUp || false,
      newLevel: xpResult?.newLevel || 1,
      newAchievements: xpResult?.newAchievements || [],
      message
    });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}