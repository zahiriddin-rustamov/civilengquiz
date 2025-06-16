"use client";

import Image from "next/image";
import { BookOpen, FileText, BarChart3, Medal, Check, ChevronRight, Pencil, BrainCircuit, Clock, Zap } from "lucide-react";

export function StudySmarterSection() {
  return (
    <section className="mb-20">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-indigo-dye">Study Smarter</h2>
        <p className="text-moonstone mt-2 max-w-2xl mx-auto">Tools designed specifically for engineering students to improve comprehension and retention</p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {/* Feature 1 - Interactive Quizzes */}
        <div className="group h-full rounded-xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-2 duration-300 border-2 border-blue-200 hover:border-blue-400 relative overflow-hidden">
          {/* Gaming background pattern */}
          <div className="absolute top-2 right-2 w-16 h-16 border border-blue-200/30 rounded-full opacity-50"></div>
          <div className="absolute bottom-2 left-2 w-12 h-12 border border-cyan-200/30 rounded-full opacity-50"></div>
          
          {/* Rarity indicator */}
          <div className="absolute top-3 right-3 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white group-hover:from-indigo-600 group-hover:to-blue-700 transition-all duration-300 shadow-lg group-hover:scale-105">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-indigo-900 group-hover:text-blue-700 transition-colors duration-300">Interactive Quizzes</h3>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Combat</div>
                </div>
                <p className="text-gray-600 text-sm">Test your knowledge with different question types</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {/* Interactive quiz example */}
            <div className="mt-4 rounded-lg bg-white p-4 transition-all duration-300 group-hover:shadow-md border-2 border-picton-blue/40">
              <div className="flex justify-between items-end mb-2">
                <span className="top-2 left-2 text-xs bg-indigo-dye text-white px-2 py-1 rounded-full">Structural Mechanics</span>
              </div>
              <p className="mb-3 text-sm text-indigo-dye font-medium">What is the primary function of a retaining wall?</p>
              <div className="space-y-2">
                <div className="flex items-center rounded-lg bg-mint-green/30 px-3 py-2 text-sm shadow-sm border-l-4 border-green-500 hover:bg-mint-green/40 transition-colors duration-200 cursor-pointer">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-indigo-dye font-medium">To hold back soil and prevent erosion</span>
                </div>
                <div className="flex items-center rounded-lg px-3 py-2 text-sm hover:bg-columbia-blue/20 transition-colors duration-200 cursor-pointer border border-transparent hover:border-picton-blue/50">
                  <span className="mr-2 h-4 w-4 rounded-full border border-picton-blue/40 flex items-center justify-center"></span>
                  <span className="text-indigo-dye">To support building foundations</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-picton-blue/20 flex justify-between items-center">
                <span className="text-xs text-moonstone">Try another</span>
                <ChevronRight className="h-4 w-4 text-picton-blue" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature 2 - Flashcards */}
        <div className="group h-full rounded-xl bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-2 duration-300 border-2 border-green-200 hover:border-green-400 relative overflow-hidden">
          {/* Gaming background pattern */}
          <div className="absolute top-2 right-2 w-16 h-16 border border-green-200/30 rounded-full opacity-50"></div>
          <div className="absolute bottom-2 left-2 w-12 h-12 border border-emerald-200/30 rounded-full opacity-50"></div>
          
          {/* Rarity indicator */}
          <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white group-hover:from-emerald-600 group-hover:to-green-700 transition-all duration-300 shadow-lg group-hover:scale-105">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-indigo-900 group-hover:text-green-700 transition-colors duration-300">Flashcards</h3>
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Memory</div>
                </div>
                <p className="text-gray-600 text-sm">Quizlet-style flashcards to reinforce key concepts</p>
              </div>
            </div>
          </div>
          <div className="mt-4 relative perspective min-h-[200px] md:min-h-[250px] lg:min-h-[300px]">
            <div 
              className="flashcard-container absolute inset-0 cursor-pointer preserve-3d transition-transform duration-1000 transform-gpu"
              onClick={(e) => {
                const target = e.currentTarget;
                target.classList.toggle('rotate-y-180');
                e.stopPropagation();
              }}
            >
              <div className="flashcard-front absolute backface-hidden w-full h-full rounded-xl border-2 border-picton-blue/40 bg-gradient-to-br from-white to-columbia-blue/50 p-4 flex flex-col items-center justify-center shadow-md">
                <div className="absolute top-2 left-2 text-xs bg-indigo-dye text-white px-2 py-1 rounded-full">Structural Mechanics</div>
                <p className="text-center text-indigo-dye font-medium">What is the formula for beam deflection?</p>
                <div className="absolute bottom-2 right-2 text-xs text-indigo-dye flex items-center">
                  <span>Click to flip</span>
                  <Pencil className="ml-1 h-3 w-3" />
                </div>
              </div>
              <div className="flashcard-back absolute backface-hidden w-full h-full rounded-xl border-2 border-picton-blue/40 bg-gradient-to-br from-indigo-dye to-picton-blue p-4 flex flex-col items-center justify-center shadow-md rotate-y-180 transform-gpu">
                <p className="text-center text-indigo-dye font-medium">δ = PL³/3EI</p>
                <p className="text-xs text-indigo-dye/80 mt-2">For cantilever beam with end load</p>
                <div className="absolute bottom-2 right-2 text-xs text-indigo-dye/90 flex items-center">
                  <span>Click to flip back</span>
                  <Pencil className="ml-1 h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature 3 - Interactive Media */}
        <div className="group h-full rounded-xl bg-gradient-to-br from-purple-50 via-white to-violet-50 p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-2 duration-300 border-2 border-purple-200 hover:border-purple-400 relative overflow-hidden">
          {/* Gaming background pattern */}
          <div className="absolute top-2 right-2 w-16 h-16 border border-purple-200/30 rounded-full opacity-50"></div>
          <div className="absolute bottom-2 left-2 w-12 h-12 border border-violet-200/30 rounded-full opacity-50"></div>
          
          {/* Rarity indicator */}
          <div className="absolute top-3 right-3 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white group-hover:from-violet-600 group-hover:to-purple-700 transition-all duration-300 shadow-lg group-hover:scale-105">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-indigo-900 group-hover:text-purple-700 transition-colors duration-300">Interactive Media</h3>
                  <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Magic</div>
                </div>
                <p className="text-gray-600 text-sm">Videos, animations, and simulations to aid learning</p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
              <Image 
                src="/placeholder.webp" 
                alt="Beam Analysis Tutorial" 
                fill 
                className="object-cover opacity-60" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-dye/80 to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="h-16 w-16 rounded-full bg-indigo-dye flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg group-hover:bg-picton-blue">
                  <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-12 border-l-white"></div>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 text-xs text-white bg-indigo-dye px-3 py-1 rounded-full font-medium">
                <BrainCircuit className="inline h-3 w-3 mr-1" /> Interactive Demo
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-white bg-black/70 px-2 py-1 rounded-full flex items-center">
                <Clock className="inline h-3 w-3 mr-1" /> 10:25
              </div>
            </div>
            <div className="p-3 bg-picton-blue/10 border-t border-picton-blue/20">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-indigo-dye">Beam Analysis Interactive Tutorial</p>
                <Zap className="h-4 w-4 text-picton-blue" />
              </div>
              <p className="text-xs text-moonstone mt-1">Learn through visual simulations</p>
            </div>
          </div>
        </div>
        
        {/* Feature 4 - Progress Tracking */}
        <div className="group h-full rounded-xl bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-6 shadow-lg transition-all hover:shadow-xl hover:-translate-y-2 duration-300 border-2 border-yellow-200 hover:border-yellow-400 relative overflow-hidden">
          {/* Gaming background pattern */}
          <div className="absolute top-2 right-2 w-16 h-16 border border-yellow-200/30 rounded-full opacity-50"></div>
          <div className="absolute bottom-2 left-2 w-12 h-12 border border-orange-200/30 rounded-full opacity-50"></div>
          
          {/* Rarity indicator */}
          <div className="absolute top-3 right-3 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white group-hover:from-orange-600 group-hover:to-yellow-700 transition-all duration-300 shadow-lg group-hover:scale-105">
                <Medal className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-indigo-900 group-hover:text-orange-700 transition-colors duration-300">Progress Tracking</h3>
                  <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Stats</div>
                </div>
                <p className="text-gray-600 text-sm">Track your learning journey and improvements</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-indigo-dye">Structural Analysis</span>
                <span className="text-indigo-dye font-medium">75%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-columbia-blue/50 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-dye transition-all duration-1000" style={{ width: '75%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-moonstone">12/16 topics completed</span>
                <span className="text-xs bg-mint-green text-indigo-dye px-2 py-0.5 rounded-full font-medium">Strong</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-indigo-dye">Fluid Mechanics</span>
                <span className="text-indigo-dye font-medium">45%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-columbia-blue/50 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-dye transition-all duration-1000" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-moonstone">7/15 topics completed</span>
                <span className="text-xs bg-columbia-blue text-indigo-dye px-2 py-0.5 rounded-full font-medium">In Progress</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-indigo-dye">Geotechnical</span>
                <span className="text-indigo-dye font-medium">90%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-columbia-blue/50 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-dye transition-all duration-1000" style={{ width: '90%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-moonstone">18/20 topics completed</span>
                <span className="text-xs bg-picton-blue text-white px-2 py-0.5 rounded-full font-medium">Expert</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 