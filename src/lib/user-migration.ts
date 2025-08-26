import connectToDatabase from './mongoose';
import { User } from '@/models/database';

/**
 * Initialize gaming fields for existing users who don't have them
 */
export async function initializeUserGamingFields(userId: string): Promise<void> {
  await connectToDatabase();
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has gaming fields initialized
    const needsInitialization = (
      user.level === undefined || 
      user.totalXP === undefined || 
      user.currentStreak === undefined ||
      user.achievements === undefined
    );

    if (needsInitialization) {
      console.log(`Initializing gaming fields for user: ${user.email}`);
      
      // Initialize gaming fields with defaults
      const updateFields: any = {};
      
      if (user.level === undefined) updateFields.level = 1;
      if (user.totalXP === undefined) updateFields.totalXP = 0;
      if (user.currentStreak === undefined) updateFields.currentStreak = 0;
      if (user.maxStreak === undefined) updateFields.maxStreak = 0;
      if (user.achievements === undefined) updateFields.achievements = [];
      
      await User.findByIdAndUpdate(userId, updateFields);
      console.log(`Gaming fields initialized for user: ${user.email}`);
    }
  } catch (error) {
    console.error('Error initializing user gaming fields:', error);
    throw error;
  }
}

/**
 * Bulk initialize gaming fields for all users missing them
 */
export async function bulkInitializeAllUsers(): Promise<{
  totalUsers: number;
  initializedUsers: number;
  errors: string[];
}> {
  await connectToDatabase();
  
  const errors: string[] = [];
  let initializedUsers = 0;
  
  try {
    // Find all users missing gaming fields
    const users = await User.find({
      $or: [
        { level: { $exists: false } },
        { totalXP: { $exists: false } },
        { currentStreak: { $exists: false } },
        { achievements: { $exists: false } }
      ]
    });

    console.log(`Found ${users.length} users needing gaming field initialization`);

    for (const user of users) {
      try {
        await initializeUserGamingFields(user._id.toString());
        initializedUsers++;
      } catch (error) {
        const errorMsg = `Failed to initialize user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    const totalUsers = await User.countDocuments();

    return {
      totalUsers,
      initializedUsers,
      errors
    };
  } catch (error) {
    console.error('Error in bulk initialization:', error);
    throw error;
  }
}
