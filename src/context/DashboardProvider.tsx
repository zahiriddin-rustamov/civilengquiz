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
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentProgress = async () => {
    if (!session?.user?.id) return;

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/students/${session.user.id}/progress`);
      // const data = await response.json();
      
      // Mock data for now
      const mockProgress: StudentProgress = {
        level: 12,
        xp: 2450,
        xpToNextLevel: 3000,
        currentStreak: 7,
        totalQuizzesCompleted: 45,
        averageScore: 78,
        badges: [
          {
            id: '1',
            name: 'First Steps',
            description: 'Completed your first quiz',
            icon: '🎯',
            unlockedAt: new Date('2024-01-15'),
            rarity: 'common'
          },
          {
            id: '2',
            name: 'Streak Master',
            description: '7-day study streak',
            icon: '🔥',
            unlockedAt: new Date('2024-01-20'),
            rarity: 'rare'
          },
          {
            id: '3',
            name: 'Quiz Champion',
            description: 'Scored 90+ on 5 quizzes',
            icon: '👑',
            unlockedAt: new Date('2024-01-22'),
            rarity: 'epic'
          }
        ],
        subjectProgress: [
          {
            id: '1',
            name: 'Structural Analysis',
            description: 'Master the fundamentals of structural engineering',
            icon: '🏗️',
            totalTopics: 12,
            completedTopics: 8,
            averageScore: 85,
            isUnlocked: true,
            topics: []
          },
          {
            id: '2',
            name: 'Concrete Technology',
            description: 'Learn about concrete properties and applications',
            icon: '🧱',
            totalTopics: 10,
            completedTopics: 5,
            averageScore: 72,
            isUnlocked: true,
            topics: []
          },
          {
            id: '3',
            name: 'Fluid Mechanics',
            description: 'Understand fluid behavior and applications',
            icon: '🌊',
            totalTopics: 14,
            completedTopics: 3,
            averageScore: 68,
            isUnlocked: true,
            topics: []
          },
          {
            id: '4',
            name: 'Soil Mechanics',
            description: 'Study soil properties and foundation design',
            icon: '⛰️',
            totalTopics: 11,
            completedTopics: 0,
            averageScore: 0,
            isUnlocked: false,
            topics: []
          }
        ]
      };

      setStudentProgress(mockProgress);
    } catch (error) {
      console.error('Failed to fetch student progress:', error);
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
        updateProgress
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