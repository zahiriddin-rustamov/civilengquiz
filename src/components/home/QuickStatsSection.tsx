"use client";

import { Trophy, BookOpen, Zap, Clock } from "lucide-react";

export function QuickStatsSection() {
  return (
    <section className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div className="rounded-xl border-2 border-picton-blue/70 bg-gradient-to-br from-white to-blue-50 p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg hover:-translate-y-1 card-hover-effect group">
        <div className="mb-2 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-500 mr-2 group-hover:animate-bounce" />
          <div className="text-4xl font-bold text-indigo-dye flex items-end">
            300<span className="text-picton-blue text-2xl">+</span>
          </div>
        </div>
        <p className="text-moonstone font-medium">Quiz Challenges</p>
        <div className="mt-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Epic Collection</div>
      </div>
      <div className="rounded-xl border-2 border-picton-blue/70 bg-gradient-to-br from-white to-green-50 p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg hover:-translate-y-1 card-hover-effect group">
        <div className="mb-2 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-green-500 mr-2 group-hover:animate-pulse" />
          <div className="text-4xl font-bold text-indigo-dye flex items-end">
            15<span className="text-picton-blue text-2xl">+</span>
          </div>
        </div>
        <p className="text-moonstone font-medium">Study Worlds</p>
        <div className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Unlocked</div>
      </div>
      <div className="rounded-xl border-2 border-picton-blue/70 bg-gradient-to-br from-white to-purple-50 p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg hover:-translate-y-1 card-hover-effect group">
        <div className="mb-2 flex items-center justify-center">
          <Zap className="w-6 h-6 text-purple-500 mr-2 group-hover:animate-spin" />
          <div className="text-4xl font-bold text-indigo-dye flex items-end">
            100<span className="text-picton-blue text-2xl">%</span>
          </div>
        </div>
        <p className="text-moonstone font-medium">Curriculum Match</p>
        <div className="mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Perfect Score</div>
      </div>
      <div className="rounded-xl border-2 border-picton-blue/70 bg-gradient-to-br from-white to-cyan-50 p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg hover:-translate-y-1 card-hover-effect group">
        <div className="mb-2 flex items-center justify-center">
          <Clock className="w-6 h-6 text-cyan-500 mr-2 group-hover:animate-bounce" />
          <div className="text-4xl font-bold text-indigo-dye flex items-end">
            24<span className="text-picton-blue text-2xl">/7</span>
          </div>
        </div>
        <p className="text-moonstone font-medium">Always Available</p>
        <div className="mt-1 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">Never Offline</div>
      </div>
    </section>
  );
} 