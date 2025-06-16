'use client';

import { motion } from 'framer-motion';
import { useDashboard } from '@/context/DashboardProvider';
import { Button } from '@/components/ui/button';
import { Calendar, Target, TrendingUp, Clock } from 'lucide-react';

export function ProgressSummary() {
  const { studentProgress, isLoading } = useDashboard();

  if (isLoading || !studentProgress) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const weeklyGoals = [
    { label: 'Quizzes Completed', current: 8, target: 10, icon: Target },
    { label: 'Study Hours', current: 12, target: 15, icon: Clock },
    { label: 'Topics Mastered', current: 3, target: 5, icon: TrendingUp }
  ];

  const upcomingDeadlines = [
    { subject: 'Structural Analysis', task: 'Chapter 5 Quiz', dueDate: '2024-01-28', priority: 'high' },
    { subject: 'Concrete Technology', task: 'Lab Report', dueDate: '2024-01-30', priority: 'medium' },
    { subject: 'Fluid Mechanics', task: 'Practice Problems', dueDate: '2024-02-02', priority: 'low' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100"
    >
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Weekly Progress & Upcoming</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Goals */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-600" />
              Weekly Goals
            </h4>
            
            <div className="space-y-4">
              {weeklyGoals.map((goal, index) => {
                const percentage = (goal.current / goal.target) * 100;
                const IconComponent = goal.icon;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{goal.label}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {goal.current} / {goal.target}
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.2 }}
                        className={`h-full rounded-full ${
                          percentage >= 100 
                            ? 'bg-green-500' 
                            : percentage >= 75 
                              ? 'bg-blue-500' 
                              : percentage >= 50 
                                ? 'bg-yellow-500' 
                                : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Upcoming Deadlines
            </h4>
            
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-3 rounded-lg border-l-4 ${
                    deadline.priority === 'high' 
                      ? 'border-red-400 bg-red-50' 
                      : deadline.priority === 'medium' 
                        ? 'border-yellow-400 bg-yellow-50' 
                        : 'border-green-400 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{deadline.task}</div>
                      <div className="text-xs text-gray-600">{deadline.subject}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">
                        {new Date(deadline.dueDate).toLocaleDateString()}
                      </div>
                      <div className={`text-xs font-medium ${
                        deadline.priority === 'high' 
                          ? 'text-red-600' 
                          : deadline.priority === 'medium' 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {deadline.priority.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Deadlines
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 