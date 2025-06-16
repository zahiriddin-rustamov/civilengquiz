'use client';

import Link from 'next/link';
import { 
  Building, 
  Mail, 
  Trophy, 
  Crown, 
  BookOpen, 
  Target, 
  Zap, 
  Star,
  Sparkles,
  Shield,
  Flame
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { motion } from 'framer-motion';

export function Footer() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const gamingStats = [
    { icon: Trophy, label: 'Active Learners', value: '500+', color: 'text-yellow-500' },
    { icon: Zap, label: 'Quests Completed', value: '10K+', color: 'text-purple-500' },
    { icon: Star, label: 'Achievements Unlocked', value: '2.5K+', color: 'text-blue-500' },
    { icon: Flame, label: 'Study Streaks', value: '1K+', color: 'text-orange-500' }
  ];

  return (
    <footer className="relative bg-gradient-to-br from-indigo-50 via-white to-cyan-50 border-t border-indigo-100/50">
      {/* Gaming Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-8 left-8 w-32 h-32 border border-indigo-300 rounded-full"></div>
        <div className="absolute bottom-8 right-8 w-24 h-24 border border-purple-300 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-cyan-300 rounded-full"></div>
      </div>

      <div className="relative container mx-auto px-4 py-12 pb-2">
        {/* Gaming Stats Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Gaming Community Stats
              </h3>
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </motion.div>
            <p className="text-sm text-gray-600">Join thousands of engineering students on their learning adventure</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {gamingStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-center mb-2">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Building className="h-7 w-7 text-indigo-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  CivilEngQuiz
                </span>
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  BETA
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Level up your civil engineering knowledge through our gamified learning platform. 
                Earn XP, unlock achievements, and master engineering concepts through interactive 
                quests and challenges designed for UAEU students.
              </p>

              {/* Gaming Achievement Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  RPG Learning
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  XP System
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Achievement Unlocks
                </div>
              </div>

              
            </motion.div>
          </div>

          {/* Gaming Platform Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="mb-4 text-sm font-bold text-gray-800 flex items-center gap-2">
              <Crown className="w-4 h-4 text-indigo-600" />
              Gaming Platform
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                >
                  <Crown className="w-3 h-3 group-hover:text-indigo-600" />
                  Gaming Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/subjects" 
                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                >
                  <BookOpen className="w-3 h-3 group-hover:text-indigo-600" />
                  Study Worlds
                </Link>
              </li>
              <li>
                <Link 
                  href="/challenges" 
                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                >
                  <Target className="w-3 h-3 group-hover:text-indigo-600" />
                  Daily Challenges
                </Link>
              </li>
              <li>
                <Link 
                  href="/achievements" 
                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                >
                  <Trophy className="w-3 h-3 group-hover:text-indigo-600" />
                  Achievement Gallery
                </Link>
              </li>
              <li>
                <Link 
                  href="/leaderboard" 
                  className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                >
                  <Star className="w-3 h-3 group-hover:text-indigo-600" />
                  Leaderboards
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Player Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="mb-4 text-sm font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              Player Account
            </h3>
            <ul className="space-y-3 text-sm">
              {isAuthenticated ? (
                <>
                  <li>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                    >
                      <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full group-hover:scale-110 transition-transform"></div>
                      Player Profile
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/progress" 
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                    >
                      <Zap className="w-3 h-3 group-hover:text-indigo-600" />
                      Progress Analytics
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                    >
                      <div className="w-3 h-3 bg-gray-400 rounded-full group-hover:bg-indigo-600 transition-colors"></div>
                      Game Settings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link 
                      href="/login" 
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                    >
                      <div className="w-3 h-3 bg-green-500 rounded-full group-hover:scale-110 transition-transform"></div>
                      Join Adventure
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/register" 
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                    >
                      <Sparkles className="w-3 h-3 group-hover:text-indigo-600" />
                      Create Player
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/demo" 
                      className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors group"
                    >
                      <Star className="w-3 h-3 group-hover:text-indigo-600" />
                      Try Demo Quest
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </motion.div>
        </div>

                 {/* Gaming Footer Bottom */}
         <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           transition={{ duration: 0.6, delay: 0.4 }}
           className="border-t border-indigo-100 pt-2"
         >
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="text-sm text-gray-600">
               <span>© {new Date().getFullYear()} Zahiriddin Rustamov</span>
             </div>
             
             <div className="flex items-center gap-3">
               <Link 
                 href="https://github.com" 
                 target="_blank" 
                 className="rounded-full p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
               >
                 <SiGithub className="h-5 w-5" />
               </Link>
               <Link 
                 href="mailto:contact@civilengquiz.com" 
                 className="rounded-full p-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
               >
                 <Mail className="h-5 w-5" />
               </Link>
             </div>
           </div>
         </motion.div>
      </div>
    </footer>
  );
} 