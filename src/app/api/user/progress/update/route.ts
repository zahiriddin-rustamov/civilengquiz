import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { User, UserProgress, Question, Flashcard, Media } from '@/models/database';
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

  console.log(`[XP DEBUG] Total questions in section: ${questionIds.length}`);
  console.log(`[XP DEBUG] Question IDs:`, questionIds);

  if (questionIds.length === 0) {
    console.log(`[XP DEBUG] No questions found in section`);
    return false;
  }

  // Check if all questions are completed
  const completedQuestions = await UserProgress.find({
    userId,
    sectionId,
    contentType: 'question',
    contentId: { $in: questionIds },
    completed: true
  });

  console.log(`[XP DEBUG] Completed questions: ${completedQuestions.length}`);
  console.log(`[XP DEBUG] Completed question IDs:`, completedQuestions.map(q => q.contentId.toString()));

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

    // Calculate score tracking fields first
    const currentScore = body.score || 0;
    const isCorrect = body.completed || (currentScore >= 70); // Consider 70%+ as correct

    let totalXPEarned = 0;
    let xpEarnedThisTime = 0;
    let xpResult = null;
    let completionBonusXP = 0;
    let isDailyXP = false;
    let isFirstTime = false;

    // NO XP FOR INDIVIDUAL CONTENT - Only award XP for section/topic completion bonuses
    // Track if this is first-time completion for completion bonus eligibility
    if (body.completed) {
      if (!existingProgress || !existingProgress.completed || !existingProgress.firstCompletedDate) {
        isFirstTime = true;
        console.log(`[XP] First-time completion for ${body.contentType} ${body.contentId} (no individual XP, only completion bonuses)`);
      } else if (XPService.isDailyXPEligible(existingProgress.firstCompletedDate, existingProgress.lastDailyXPDate)) {
        isDailyXP = true;
        console.log(`[XP] Daily completion for ${body.contentType} ${body.contentId} (no individual XP, only completion bonuses)`);
      } else {
        console.log(`[XP] No XP for ${body.contentType} ${body.contentId} - already completed today`);
      }
    }

    // Individual content does NOT award XP
    xpEarnedThisTime = 0;

    // Prepare attempt history entry
    const attemptEntry = {
      attemptNumber: (existingProgress?.attempts || 0) + 1,
      score: currentScore,
      timestamp: now,
      timeSpent: body.timeSpent || 0,
      isCorrect
    };

    // Update progress document with enhanced score tracking
    const updateData: any = {
      userId,
      subjectId: body.subjectId,
      topicId: body.topicId,
      contentId: body.contentId,
      contentType: body.contentType,
      completed: body.completed,
      score: currentScore, // Keep current score for backward compatibility
      timeSpent: body.timeSpent,
      lastAccessed: now,
      data: body.data,
      ...(body.sectionId && { sectionId: body.sectionId })
    };

    // Debug logging to understand the issue
    console.log('[DEBUG] existingProgress:', JSON.stringify(existingProgress, null, 2));
    console.log('[DEBUG] attempts:', existingProgress?.attempts);
    console.log('[DEBUG] isFirstTime condition:', !existingProgress || (existingProgress.attempts || 0) === 0);

    // Handle first attempt vs subsequent attempts
    if (!existingProgress || (existingProgress.attempts || 0) === 0) {
      console.log('[DEBUG] Treating as FIRST attempt');
      // First attempt - set all score fields
      updateData.firstAttemptScore = currentScore;
      updateData.bestScore = currentScore;
      updateData.attemptHistory = [attemptEntry];
    } else {
      console.log('[DEBUG] Treating as SUBSEQUENT attempt');
      // Subsequent attempts - update best score and add to history
      updateData.bestScore = Math.max(existingProgress.bestScore || 0, currentScore);
      // Safely handle attemptHistory - ensure it exists before pushing
      if (existingProgress.attemptHistory && existingProgress.attemptHistory.length > 0) {
        updateData.$push = { attemptHistory: attemptEntry };
      } else {
        // Edge case: existing progress but no attempt history yet
        console.log('[DEBUG] No attempt history found, initializing array');
        updateData.attemptHistory = [attemptEntry];
      }
      // Keep firstAttemptScore unchanged (don't include in updateData)
    }

    // Separate direct assignments from MongoDB operators
    const mongoOperations: any = {};

    // Update daily XP tracking fields
    if (isFirstTime) {
      updateData.firstCompletedDate = now;
      mongoOperations.$inc = {
        attempts: 1,
        totalXPEarned: xpEarnedThisTime
      };
    } else if (isDailyXP) {
      updateData.lastDailyXPDate = now;
      mongoOperations.$inc = {
        attempts: 1,
        dailyXPCount: 1,
        totalXPEarned: xpEarnedThisTime
      };
    } else {
      mongoOperations.$inc = { attempts: 1 };
    }

    // Move $push operation to mongoOperations if it exists
    if (updateData.$push) {
      mongoOperations.$push = updateData.$push;
      delete updateData.$push;
    }

    // Combine direct assignments with MongoDB operators
    const finalUpdateData = {
      $set: updateData,
      ...mongoOperations
    };


    // Update the progress document
    const progress = await UserProgress.findOneAndUpdate(
      {
        userId,
        contentId: body.contentId,
        contentType: body.contentType
      },
      finalUpdateData,
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );


    // Check for completion bonuses (only for first-time completions)
    console.log(`[XP DEBUG] Checking completion bonuses - isFirstTime: ${isFirstTime}, body.completed: ${body.completed}, contentType: ${body.contentType}`);

    if (isFirstTime && body.completed) {
      let bonusAwarded = false;

      // Check section completion bonus for questions
      if (body.contentType === 'question' && body.sectionId) {
        console.log(`[XP DEBUG] Checking section completion for sectionId: ${body.sectionId}`);
        const sectionCompleted = await checkSectionCompletion(userId, body.sectionId);
        console.log(`[XP DEBUG] Section completed: ${sectionCompleted}`);

        if (sectionCompleted) {
          // Award section completion bonus (using atomic operation to prevent race condition)
          completionBonusXP = XPService.calculateCompletionBonus('section', body.data?.difficulty);

          // Calculate average score from completed questions in this section
          const sectionQuestionProgress = await UserProgress.find({
            userId,
            sectionId: body.sectionId,
            contentType: 'question',
            completed: true
          });

          const averageScore = sectionQuestionProgress.length > 0
            ? Math.round(sectionQuestionProgress.reduce((sum, p) => sum + (p.bestScore || p.score || 0), 0) / sectionQuestionProgress.length)
            : 100;

          // Use findOneAndUpdate with upsert to atomically create section completion record
          const sectionProgress = await UserProgress.findOneAndUpdate(
            {
              userId,
              contentId: body.sectionId,
              contentType: 'section'
            },
            {
              $setOnInsert: {
                userId,
                contentId: body.sectionId,
                contentType: 'section',
                topicId: body.topicId,
                subjectId: body.subjectId,
                sectionId: body.sectionId,
                completed: true,
                score: averageScore,
                timeSpent: 0,
                firstCompletedDate: now,
                totalXPEarned: completionBonusXP,
                attempts: 0
              }
            },
            {
              upsert: true,
              new: false // Return the old document to check if it was just created
            }
          );

          // Only award XP if this was a new completion (document didn't exist before)
          if (!sectionProgress) {
            console.log(`[XP] Section completion bonus for ${body.sectionId}: ${completionBonusXP} XP`);
            bonusAwarded = true;
          } else {
            // Section completion bonus was already awarded
            completionBonusXP = 0;
          }
        }
      }

      // Check topic completion bonus for flashcards
      if (body.contentType === 'flashcard') {
        const topicCompleted = await checkTopicCompletion(userId, body.topicId, 'flashcard');

        if (topicCompleted) {
          // Award topic flashcard completion bonus (using atomic operation to prevent race condition)
          completionBonusXP = XPService.calculateCompletionBonus('flashcard-topic', body.data?.difficulty);
          const topicBonusKey = `flashcard-topic-${body.topicId}`;

          // Use findOneAndUpdate with upsert to atomically create topic completion record
          const topicBonusProgress = await UserProgress.findOneAndUpdate(
            {
              userId,
              contentId: topicBonusKey,
              contentType: 'flashcard'
            },
            {
              $setOnInsert: {
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
                data: { isTopicBonus: true },
                attempts: 0
              }
            },
            {
              upsert: true,
              new: false // Return the old document to check if it was just created
            }
          );

          // Only award XP if this was a new completion (document didn't exist before)
          if (!topicBonusProgress) {
            console.log(`[XP] Flashcard topic completion bonus for topic ${body.topicId}: ${completionBonusXP} XP`);
            bonusAwarded = true;
          } else {
            // Topic completion bonus was already awarded
            completionBonusXP = 0;
          }
        }
      }

      // Check topic completion bonus for media
      if (body.contentType === 'media') {
        const topicCompleted = await checkTopicCompletion(userId, body.topicId, 'media');

        if (topicCompleted) {
          // Award topic media completion bonus (using atomic operation to prevent race condition)
          completionBonusXP = XPService.calculateCompletionBonus('media-topic', body.data?.difficulty);
          const topicBonusKey = `media-topic-${body.topicId}`;

          // Use findOneAndUpdate with upsert to atomically create topic completion record
          const topicBonusProgress = await UserProgress.findOneAndUpdate(
            {
              userId,
              contentId: topicBonusKey,
              contentType: 'media'
            },
            {
              $setOnInsert: {
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
                data: { isTopicBonus: true },
                attempts: 0
              }
            },
            {
              upsert: true,
              new: false // Return the old document to check if it was just created
            }
          );

          // Only award XP if this was a new completion (document didn't exist before)
          if (!topicBonusProgress) {
            console.log(`[XP] Media topic completion bonus for topic ${body.topicId}: ${completionBonusXP} XP`);
            bonusAwarded = true;
          } else {
            // Topic completion bonus was already awarded
            completionBonusXP = 0;
          }
        }
      }

      // Award completion bonus XP
      if (bonusAwarded && completionBonusXP > 0) {
        xpResult = await XPService.updateUserXP(userId, completionBonusXP);
        console.log(`[XP] Awarded ${completionBonusXP} XP. User now at level ${xpResult.newLevel} with ${xpResult.totalXP} total XP`);
      }
    }

    // Calculate total XP for response
    const totalXPThisTime = xpEarnedThisTime + completionBonusXP;
    const achievementXP = xpResult?.newAchievements?.reduce((sum, a) => sum + a.xpReward, 0) || 0;

    // Get user's current level if no XP was awarded (for proper response)
    let currentUserLevel = 1;
    if (!xpResult) {
      const user = await User.findById(userId).select('level').lean();
      currentUserLevel = user?.level || 1;
    }

    // Build response message
    let message = 'Progress updated successfully.';

    if (completionBonusXP > 0) {
      if (body.contentType === 'question') {
        message = ` Section complete! Earned ${completionBonusXP} XP!`;
      } else if (body.contentType === 'flashcard') {
        message = ` All flashcards studied! Earned ${completionBonusXP} XP!`;
      } else if (body.contentType === 'media') {
        message = ` All media viewed! Earned ${completionBonusXP} XP!`;
      }

      if (achievementXP > 0) {
        message += ` (+${achievementXP} from achievements!)`;
      }

      if (xpResult?.leveledUp) {
        message += ` Level up to ${xpResult.newLevel}!`;
      }
    } else if (isFirstTime) {
      message = 'Great progress! Complete the full section/topic to earn XP.';
    } else if (body.completed) {
      message = 'Already completed - no additional XP.';
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
      newLevel: xpResult?.newLevel || currentUserLevel,
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