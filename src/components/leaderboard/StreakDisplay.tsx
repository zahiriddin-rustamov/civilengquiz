'use client';

import { motion } from 'framer-motion';
import { Flame, BookOpen } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  learningStreak: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export function StreakDisplay({
  currentStreak,
  learningStreak,
  showLabels = true,
  size = 'md',
  layout = 'horizontal',
  className = ''
}: StreakDisplayProps) {
  const sizeClasses = {
    sm: {
      icon: 'w-3 h-3',
      text: 'text-xs',
      gap: 'gap-1',
      padding: 'px-1.5 py-0.5'
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-2',
      padding: 'px-2 py-1'
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-base',
      gap: 'gap-3',
      padding: 'px-3 py-2'
    }
  };

  const classes = sizeClasses[size];
  const containerClass = layout === 'horizontal' ? 'flex-row' : 'flex-col';

  const getStreakColor = (streak: number, type: 'activity' | 'learning') => {
    if (streak === 0) return 'text-gray-400';
    if (streak >= 7) return type === 'activity' ? 'text-orange-500' : 'text-blue-500';
    if (streak >= 3) return type === 'activity' ? 'text-orange-400' : 'text-blue-400';
    return type === 'activity' ? 'text-orange-300' : 'text-blue-300';
  };

  const StreakBadge = ({
    icon: Icon,
    value,
    type,
    label
  }: {
    icon: React.ComponentType<any>,
    value: number,
    type: 'activity' | 'learning',
    label: string
  }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center ${classes.gap} ${classes.padding}
        bg-white/80 backdrop-blur-sm rounded-full border border-gray-200
        hover:shadow-md transition-all duration-200
      `}
    >
      <Icon className={`${classes.icon} ${getStreakColor(value, type)}`} />
      <div className="flex flex-col items-start">
        <span className={`${classes.text} font-medium text-gray-800`}>
          {value} {value === 1 ? 'day' : 'days'}
        </span>
        {showLabels && (
          <span className="text-xs text-gray-500 leading-none">
            {label}
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className={`flex ${containerClass} ${classes.gap} ${className}`}>
      <StreakBadge
        icon={Flame}
        value={currentStreak}
        type="activity"
        label="Activity"
      />
      <StreakBadge
        icon={BookOpen}
        value={learningStreak}
        type="learning"
        label="Learning"
      />
    </div>
  );
}