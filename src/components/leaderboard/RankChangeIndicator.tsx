'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';

interface RankChangeIndicatorProps {
  rankChange: number;
  rankChangeType: 'up' | 'down' | 'none' | 'new';
  className?: string;
}

export function RankChangeIndicator({
  rankChange,
  rankChangeType,
  className = ''
}: RankChangeIndicatorProps) {
  const getIndicatorContent = () => {
    switch (rankChangeType) {
      case 'up':
        return {
          icon: ArrowUp,
          text: `+${rankChange}`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          animation: 'animate-bounce'
        };

      case 'down':
        return {
          icon: ArrowDown,
          text: `-${rankChange}`,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          animation: ''
        };

      case 'new':
        return {
          icon: Sparkles,
          text: 'NEW',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          animation: 'animate-pulse'
        };

      case 'none':
      default:
        return {
          icon: Minus,
          text: '—',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          animation: ''
        };
    }
  };

  const indicator = getIndicatorContent();
  const Icon = indicator.icon;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium
        ${indicator.color} ${indicator.bgColor} ${indicator.borderColor}
        ${indicator.animation} ${className}
      `}
    >
      <Icon className="w-3 h-3" />
      <span>{indicator.text}</span>
    </motion.div>
  );
}