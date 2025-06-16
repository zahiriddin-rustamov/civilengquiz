'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Shuffle, 
  Target, 
  Clock, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  const quickActions = [
    {
      id: 'continue',
      title: 'Continue Learning',
      description: 'Pick up where you left off',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-600',
      href: '/subjects/structural-analysis/fresh-concrete',
      badge: 'In Progress'
    },
    {
      id: 'random',
      title: 'Random Quiz',
      description: 'Test your knowledge across topics',
      icon: Shuffle,
      color: 'from-purple-500 to-violet-600',
      href: '/quiz/random',
      badge: 'Quick Study'
    },
    {
      id: 'daily',
      title: 'Daily Challenge',
      description: 'Complete today\'s special challenge',
      icon: Target,
      color: 'from-orange-500 to-red-600',
      href: '/challenges/daily',
      badge: 'New!',
      isNew: true
    },
    {
      id: 'timed',
      title: '5-Min Sprint',
      description: 'Quick knowledge check',
      icon: Clock,
      color: 'from-cyan-500 to-blue-600',
      href: '/quiz/sprint',
      badge: 'Fast Track'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Sparkles className="w-4 h-4 mr-1" />
          Ready to learn?
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group"
          >
            <Link href={action.href}>
              <div className={`relative bg-gradient-to-br ${action.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 right-2 w-16 h-16 border border-white/30 rounded-full"></div>
                  <div className="absolute bottom-2 left-2 w-12 h-12 border border-white/30 rounded-full"></div>
                </div>

                {/* Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    action.isNew 
                      ? 'bg-yellow-400 text-yellow-900 animate-pulse' 
                      : 'bg-white/20 text-white'
                  }`}>
                    {action.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <action.icon className="w-8 h-8" />
                    {action.isNew && (
                      <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-lg mb-1">{action.title}</h4>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs opacity-75">Click to start</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Today's Goal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-xl p-4 border border-indigo-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Today's Goal</h4>
              <p className="text-sm text-gray-600">Complete 3 quiz sessions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Progress */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">2 / 3 completed</div>
              <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                <div className="w-2/3 h-full bg-indigo-500 rounded-full"></div>
              </div>
            </div>
            
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Continue
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 