'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface StudentProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentStreak: number;
  totalQuizzesCompleted: number;
  averageScore: number;
  badges: Badge[];
  subjectProgress: SubjectProgress[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface SubjectProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  totalTopics: number;
  completedTopics: number;
  averageScore: number;
  isUnlocked: boolean;
  topics: TopicProgress[];
}

interface TopicProgress {
  id: string;
  name: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  bestScore: number;
  attemptsCount: number;
  contentTypes: {
    questions: number;
    flashcards: number;
    media: number;
  };
}

interface DashboardContextType {
  studentProgress: StudentProgress | null;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  updateProgress: (updates: Partial<StudentProgress>) => void;
  triggerRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentProgress = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch real user progress from API
      const response = await fetch('/api/user/progress');
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }
      
      const data = await response.json();
      
      // Transform API data to match our interface
      const progress: StudentProgress = {
        level: data.level,
        xp: data.xp,
        xpToNextLevel: Math.max(0, (data.level * 100) - data.xp),
        currentStreak: data.currentStreak,
        totalQuizzesCompleted: data.totalQuizzesCompleted,
        averageScore: data.averageScore,
        badges: data.badges,
        subjectProgress: data.subjectProgress
      };

      setStudentProgress(progress);
    } catch (error) {
      console.error('Failed to fetch student progress:', error);
      
      // Fallback to basic structure if API fails
      setStudentProgress({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        currentStreak: 0,
        totalQuizzesCompleted: 0,
        averageScore: 0,
        badges: [],
        subjectProgress: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProgress = async () => {
    setIsLoading(true);
    await fetchStudentProgress();
  };

  const updateProgress = (updates: Partial<StudentProgress>) => {
    if (studentProgress) {
      setStudentProgress({ ...studentProgress, ...updates });
    }
  };

  const triggerRefresh = () => {
    if (session?.user?.id) {
      fetchStudentProgress();
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchStudentProgress();
    }
  }, [session?.user?.id]);

  return (
    <DashboardContext.Provider
      value={{
        studentProgress,
        isLoading,
        refreshProgress,
        updateProgress,
        triggerRefresh
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Export types for use in components
export type { StudentProgress, Badge, SubjectProgress, TopicProgress }; 