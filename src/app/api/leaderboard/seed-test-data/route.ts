import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import { User } from '@/models/database';

// POST /api/leaderboard/seed-test-data - Add test XP to students for leaderboard testing
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get all students
    const students = await User.find({ role: 'student' }).lean();

    if (students.length === 0) {
      return NextResponse.json({
        error: 'No students found. Create some student accounts first.'
      }, { status: 404 });
    }

    // Award random XP amounts to students for testing
    const updates = students.map((student, index) => {
      const randomXP = Math.floor(Math.random() * 1000) + (index * 50); // 0-1000 + some spread
      const level = Math.floor(randomXP / 100) + 1;
      const currentStreak = Math.floor(Math.random() * 10) + 1;
      const learningStreak = Math.floor(Math.random() * 8) + 1;

      return {
        updateOne: {
          filter: { _id: student._id },
          update: {
            $set: {
              totalXP: randomXP,
              level: level,
              currentStreak: currentStreak,
              learningStreak: learningStreak,
              showOnLeaderboard: true,
              lastActiveDate: new Date()
            }
          }
        }
      };
    });

    const result = await User.bulkWrite(updates);

    return NextResponse.json({
      success: true,
      message: 'Seeded test leaderboard data',
      studentsUpdated: result.modifiedCount,
      totalStudents: students.length,
      sampleData: students.slice(0, 3).map((student, index) => ({
        name: student.name,
        newXP: Math.floor(Math.random() * 1000) + (index * 50),
        newLevel: Math.floor((Math.floor(Math.random() * 1000) + (index * 50)) / 100) + 1
      }))
    });

  } catch (error) {
    console.error('Error seeding test data:', error);
    return NextResponse.json(
      { error: 'Failed to seed test data' },
      { status: 500 }
    );
  }
}