'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Star, TrendingUp } from 'lucide-react';
import { Achievement } from '@/lib/achievements';

interface XPNotificationProps {
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
  newAchievements: Achievement[];
  onComplete?: () => void;
}

export function XPNotification({ 
  xpGained, 
  leveledUp, 
  newLevel, 
  newAchievements, 
  onComplete 
}: XPNotificationProps) {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Create notification queue
  const notifications = [];
  
  if (xpGained > 0) {
    notifications.push({
      type: 'xp',
      content: `+${xpGained} XP`,
      icon: <Zap className="w-6 h-6" />,
      color: 'from-yellow-400 to-orange-500'
    });
  }
  
  if (leveledUp && newLevel) {
    notifications.push({
      type: 'level',
      content: `Level Up! Level ${newLevel}`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-600'
    });
  }
  
  newAchievements.forEach(achievement => {
    notifications.push({
      type: 'achievement',
      content: achievement.name,
      description: achievement.description,
      icon: <span className="text-2xl">{achievement.icon}</span>,
      color: getRarityColor(achievement.rarity)
    });
  });

  useEffect(() => {
    if (notifications.length > 0) {
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        if (currentNotification < notifications.length - 1) {
          setCurrentNotification(prev => prev + 1);
        } else {
          setIsVisible(false);
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [currentNotification, notifications.length, onComplete]);

  if (notifications.length === 0) return null;

  const notification = notifications[currentNotification];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`bg-gradient-to-r ${notification.color} text-white rounded-lg shadow-2xl p-4 min-w-[300px] border-2 border-white/20`}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                {notification.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{notification.content}</div>
                {notification.description && (
                  <div className="text-white/90 text-sm">{notification.description}</div>
                )}
              </div>
              {notification.type === 'achievement' && (
                <Trophy className="w-6 h-6 text-yellow-300" />
              )}
            </div>
            
            {/* Progress indicator for multiple notifications */}
            {notifications.length > 1 && (
              <div className="mt-3 flex space-x-1">
                {notifications.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full flex-1 ${
                      index === currentNotification ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'from-gray-500 to-gray-600';
    case 'rare':
      return 'from-blue-500 to-cyan-600';
    case 'epic':
      return 'from-indigo-500 to-purple-600';
    case 'legendary':
      return 'from-purple-500 to-pink-600';
    default:
      return 'from-gray-400 to-gray-500';
  }
}
