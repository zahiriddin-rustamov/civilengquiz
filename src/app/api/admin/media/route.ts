import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongoose';
import { Media, Topic } from '@/models/database';
import { Types } from 'mongoose';

// GET /api/admin/media - List all media with filtering
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const includeAllTopics = searchParams.get('includeAllTopics') === 'true';

    // Build query
    const query: any = {};
    if (topicId) query.topicId = new Types.ObjectId(topicId);
    if (type) query.videoType = type;
    if (difficulty) query.difficulty = difficulty;

    // Get media with topic information
    const media = await Media.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'topic.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $addFields: {
          topicName: { $arrayElemAt: ['$topic.name', 0] },
          subjectName: { $arrayElemAt: ['$subject.name', 0] },
          subjectId: { $arrayElemAt: ['$topic.subjectId', 0] }
        }
      },
      { $sort: { 'topic.order': 1, order: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalCount = await Media.countDocuments(query);

    let allTopicCombinations = [];

    // If includeAllTopics is requested (for admin Media page), get all subject-topic combinations
    if (includeAllTopics) {
      allTopicCombinations = await Topic.aggregate([
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $addFields: {
            subjectName: { $arrayElemAt: ['$subject.name', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            subjectId: 1,
            subjectName: 1,
            order: 1
          }
        },
        {
          $sort: { 'subject.order': 1, order: 1 }
        }
      ]);
    }

    return NextResponse.json({
      media,
      allTopicCombinations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

// POST /api/admin/media - Create new media
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const {
      topicId,
      title,
      description,
      difficulty,
      xpReward,
      estimatedMinutes,
      actualDuration,
      order,
      youtubeUrl,
      videoType,
      preVideoContent,
      postVideoContent,
      quizQuestions
    } = body;

    // Validate required fields
    if (!topicId || !title?.trim() || !description?.trim() || !difficulty || xpReward === undefined || estimatedMinutes === undefined || order === undefined || !youtubeUrl?.trim() || !videoType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Extract YouTube ID from URL
    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Prepare media data based on videoType
    const mediaData: any = {
      topicId: new Types.ObjectId(topicId),
      title: title.trim(),
      description: description.trim(),
      difficulty,
      xpReward,
      estimatedMinutes,
      duration: actualDuration || null, // Store actual duration in seconds (matches schema)
      order,
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      videoType
    };

    // Add content based on video type
    if (videoType === 'video') {
      // Filter out empty entries from educational content for videos
      const cleanPreVideoContent = {
        learningObjectives: preVideoContent?.learningObjectives?.filter((obj: string) => obj.trim()) || [],
        prerequisites: preVideoContent?.prerequisites?.filter((obj: string) => obj.trim()) || [],
        keyTerms: preVideoContent?.keyTerms?.filter((obj: any) => obj.term?.trim() && obj.definition?.trim()) || []
      };

      const cleanPostVideoContent = {
        keyConcepts: postVideoContent?.keyConcepts?.filter((obj: string) => obj.trim()) || [],
        reflectionQuestions: postVideoContent?.reflectionQuestions?.filter((obj: string) => obj.trim()) || [],
        practicalApplications: postVideoContent?.practicalApplications?.filter((obj: string) => obj.trim()) || [],
        additionalResources: postVideoContent?.additionalResources?.filter((obj: any) => obj.title?.trim() && obj.url?.trim()) || []
      };

      mediaData.preVideoContent = cleanPreVideoContent;
      mediaData.postVideoContent = cleanPostVideoContent;
    } else if (videoType === 'short') {
      // For shorts, only add quiz questions if they exist
      if (quizQuestions && Array.isArray(quizQuestions)) {
        const cleanQuizQuestions = quizQuestions.filter((q: any) =>
          q.question?.trim() &&
          q.options?.length > 0 &&
          q.options.every((o: string) => o?.trim()) &&
          q.correctAnswer !== undefined
        );

        if (cleanQuizQuestions.length > 0) {
          mediaData.quizQuestions = cleanQuizQuestions;
        }
      }

      // Explicitly DO NOT add preVideoContent and postVideoContent for shorts
      // (The database schema allows them but we don't want them for shorts)
    }

    // Create media
    const media = new Media(mediaData);

    await media.save();

    // Populate topic and subject information for response
    const populatedMedia = await Media.aggregate([
      { $match: { _id: media._id } },
      {
        $lookup: {
          from: 'topics',
          localField: 'topicId',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'topic.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $addFields: {
          topicName: { $arrayElemAt: ['$topic.name', 0] },
          subjectName: { $arrayElemAt: ['$subject.name', 0] },
          subjectId: { $arrayElemAt: ['$topic.subjectId', 0] }
        }
      }
    ]);

    return NextResponse.json(populatedMedia[0], { status: 201 });

  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
  }
}

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}