'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/context/DashboardProvider';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  CheckCircle, 
  Circle,
  Star,
  BookOpen,
  FileText,
  Play,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

export function SubjectSkillTrees() {
  const { studentProgress, isLoading } = useDashboard();
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  if (isLoading || !studentProgress) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Subject Skill Trees</h3>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600';
    if (percentage >= 60) return 'from-blue-500 to-cyan-600';
    if (percentage >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  const getRarityColor = (percentage: number) => {
    if (percentage >= 80) return 'border-green-400 bg-green-50';
    if (percentage >= 60) return 'border-blue-400 bg-blue-50';
    if (percentage >= 40) return 'border-yellow-400 bg-yellow-50';
    return 'border-gray-300 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">Subject Skill Trees</h3>
        <div className="text-sm text-gray-500">
          {studentProgress.subjectProgress.filter(s => s.isUnlocked).length} / {studentProgress.subjectProgress.length} unlocked
        </div>
      </div>

      <div className="grid gap-4">
        {studentProgress.subjectProgress.map((subject, index) => {
          const progressPercentage = (subject.completedTopics / subject.totalTopics) * 100;
          const isExpanded = expandedSubjects.includes(subject.id);
          
          return (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 ${
                subject.isUnlocked 
                  ? `${getRarityColor(progressPercentage)} hover:shadow-md` 
                  : 'border-gray-200 bg-gray-50 opacity-75'
              }`}
            >
              {/* Subject Header */}
              <div 
                className="p-6 cursor-pointer"
                onClick={() => subject.isUnlocked && toggleSubject(subject.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Subject Icon */}
                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                      subject.isUnlocked 
                        ? `bg-gradient-to-br ${getProgressColor(progressPercentage)} text-white shadow-lg`
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {subject.isUnlocked ? subject.icon : <Lock className="w-6 h-6" />}
                      
                      {/* Progress Ring */}
                      {subject.isUnlocked && (
                        <svg className="absolute inset-0 w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-white/30"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercentage / 100)}`}
                            className="text-white transition-all duration-1000"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Subject Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg font-bold text-gray-800">{subject.name}</h4>
                        {progressPercentage === 100 && (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{subject.description}</p>
                      
                      {subject.isUnlocked ? (
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-700">
                            <strong>{subject.completedTopics}</strong> / {subject.totalTopics} topics
                          </span>
                          <span className="text-gray-700">
                            Avg: <strong>{subject.averageScore}%</strong>
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">
                              {progressPercentage >= 80 ? 'Mastered' : 
                               progressPercentage >= 60 ? 'Proficient' : 
                               progressPercentage >= 40 ? 'Learning' : 'Beginner'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          🔒 Complete previous subjects to unlock
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand Button */}
                  {subject.isUnlocked && (
                    <Button variant="ghost" size="sm">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Progress Bar */}
                {subject.isUnlocked && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${getProgressColor(progressPercentage)} rounded-full`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Content - Topic List */}
              <AnimatePresence>
                {isExpanded && subject.isUnlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 bg-gray-50/50"
                  >
                    <div className="p-6 space-y-4">
                      <h5 className="font-semibold text-gray-800 mb-3">Topics & Content</h5>
                      
                      {/* Mock Topics - Replace with actual topic data */}
                      <div className="grid gap-3">
                        {Array.from({ length: subject.totalTopics }, (_, i) => {
                          const isCompleted = i < subject.completedTopics;
                          const isUnlocked = i <= subject.completedTopics;
                          
                          return (
                            <div
                              key={i}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isCompleted 
                                  ? 'bg-green-50 border-green-200' 
                                  : isUnlocked 
                                    ? 'bg-white border-gray-200 hover:border-indigo-300' 
                                    : 'bg-gray-50 border-gray-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : isUnlocked ? (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <Lock className="w-5 h-5 text-gray-400" />
                                )}
                                
                                <div>
                                  <div className="font-medium text-gray-800">
                                    Topic {i + 1}: Sample Topic Name
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <BookOpen className="w-3 h-3 mr-1" />
                                      5 Questions
                                    </span>
                                    <span className="flex items-center">
                                      <FileText className="w-3 h-3 mr-1" />
                                      3 Flashcards
                                    </span>
                                    <span className="flex items-center">
                                      <Play className="w-3 h-3 mr-1" />
                                      2 Videos
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {isUnlocked && (
                                <Link href={`/subjects/${subject.id}/topic-${i + 1}`}>
                                  <Button size="sm" variant={isCompleted ? "outline" : "default"}>
                                    {isCompleted ? 'Review' : 'Start'}
                                  </Button>
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 