'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/context/DashboardProvider';

// Generate a valid MongoDB ObjectId for testing
const generateTestObjectId = (): string => {
  // Generate a 24-character hex string (valid ObjectId format)
  return Math.floor(Date.now() / 1000).toString(16).padStart(8, '0') + 
         Math.random().toString(16).substr(2, 16).padEnd(16, '0');
};

export function XPDebugger() {
  const { studentProgress, triggerRefresh } = useDashboard();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const testXPGain = async () => {
    try {
      // Generate valid ObjectIds for testing (24-character hex strings)
      const testObjectId = generateTestObjectId();
      const testTopicId = generateTestObjectId();
      const testSubjectId = generateTestObjectId();
      
      const response = await fetch('/api/user/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: testObjectId,
          contentType: 'question',
          topicId: testTopicId,
          subjectId: testSubjectId,
          completed: true,
          score: 50,
          timeSpent: 30,
          data: {
            difficulty: 'Beginner'
          }
        }),
      });

      const result = await response.json();
      console.log('XP Test Result:', result);
      
      // Refresh dashboard
      triggerRefresh();
      
      alert(`Test XP Gain: ${result.xpEarned} XP, Level: ${result.newLevel}, Leveled Up: ${result.leveledUp}`);
    } catch (error) {
      console.error('XP test failed:', error);
      alert('XP test failed - check console');
    }
  };

  const initializeGamingFields = async () => {
    try {
      const response = await fetch('/api/user/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('Initialize Result:', result);
      
      // Refresh dashboard
      triggerRefresh();
      
      alert(`Gaming fields initialized: ${result.message}`);
    } catch (error) {
      console.error('Initialization failed:', error);
      alert('Initialization failed - check console');
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          🐛 XP Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white border-2 border-yellow-300 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">XP Debug Panel</h3>
        <Button
          onClick={() => setIsVisible(false)}
          size="sm"
          variant="ghost"
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          ✕
        </Button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div><strong>Level:</strong> {studentProgress?.level || 'Loading...'}</div>
        <div><strong>XP:</strong> {studentProgress?.xp || 'Loading...'}</div>
        <div><strong>Streak:</strong> {studentProgress?.currentStreak || 'Loading...'}</div>
        <div><strong>Badges:</strong> {studentProgress?.badges?.length || 'Loading...'}</div>
      </div>
      
      <div className="mt-3 space-y-2">
        <Button onClick={initializeGamingFields} size="sm" variant="secondary" className="w-full">
          Initialize Gaming Fields
        </Button>
        <Button onClick={testXPGain} size="sm" className="w-full">
          Test +50 XP
        </Button>
        <Button onClick={triggerRefresh} size="sm" variant="outline" className="w-full">
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
