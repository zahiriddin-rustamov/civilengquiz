"use client";

import Link from "next/link";
import { Building, Ruler, HardHat, Calculator, BookOpen, Trophy, Plus } from "lucide-react";

export function StudyWorldsSection() {
  // Array of common civil engineering topics with icons and background images
  const subjects = [
    { 
      name: "Structural Analysis", 
      icon: <Building className="h-6 w-6" />,
      bg: "url('/placeholder-structural.webp')"
    },
    { 
      name: "Geotechnical Engineering", 
      icon: <Ruler className="h-6 w-6" />,
      bg: "url('/placeholder-geotechnical.webp')"
    },
    { 
      name: "Transportation Engineering", 
      icon: <HardHat className="h-6 w-6" />,
      bg: "url('/placeholder-transportation.webp')"
    },
    { 
      name: "Fluid Mechanics", 
      icon: <Calculator className="h-6 w-6" />,
      bg: "url('/placeholder-fluid.webp')"
    },
    { 
      name: "Construction Management", 
      icon: <BookOpen className="h-6 w-6" />,
      bg: "url('/placeholder-construction.webp')"
    },
  ];

  return (
    <section className="my-20">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 rounded-full mb-4">
          <Trophy className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-indigo-700">Study Worlds</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-indigo-dye">Choose Your Engineering Adventure</h2>
        <p className="text-gray-600 mt-2">Each world contains unique challenges and knowledge to master</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {subjects.map((subject, index) => (
          <Link 
            key={index}
            href="/subjects" 
            className="group relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-indigo-200 hover:border-indigo-400 p-4 overflow-hidden
                      text-white transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
          >
            {/* Background image with darker overlay by default */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 brightness-50"
              style={{ backgroundImage: subject.bg }}
            ></div>
            
            {/* Gradient overlay - subtle overlay to maintain image visibility */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 to-purple-600/40 transition-opacity duration-500 group-hover:from-indigo-500/30 group-hover:to-purple-500/30"></div>
            
            {/* Gaming elements */}
            <div className="absolute top-2 right-2 w-8 h-8 border border-white/20 rounded-full opacity-60"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border border-white/20 rounded-full opacity-60"></div>
            
            {/* World level indicator */}
            <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
              World {index + 1}
            </div>
            
            {/* Rarity indicator */}
            <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            
            {/* Content that scales slightly on hover */}
            <div className="flex flex-col items-center z-10 transform transition-transform duration-500 group-hover:scale-105">
              <div className="mb-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
                {subject.icon}
              </div>
              <h3 className="text-center text-sm font-bold drop-shadow-lg">{subject.name}</h3>
              <div className="mt-1 text-xs opacity-75">Click to explore</div>
            </div>
          </Link>
        ))}
        
        {/* View More Card - Exact copy of subject card structure */}
        <Link 
          href="/subjects" 
          className="group relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-indigo-200 hover:border-indigo-400 p-4 overflow-hidden
                    text-white transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
        >
          {/* Background gradient - using solid color instead of image */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
          ></div>
          
          {/* Gradient overlay - exact copy from subject cards */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 to-purple-600/40 transition-opacity duration-500 group-hover:from-indigo-500/30 group-hover:to-purple-500/30"></div>
          
          {/* Gaming elements - exact copy */}
          <div className="absolute top-2 right-2 w-8 h-8 border border-white/20 rounded-full opacity-60"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border border-white/20 rounded-full opacity-60"></div>
          
          {/* Quest badge - replacing World level indicator */}
          <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
            Quest
          </div>
          
          {/* Rarity indicator - exact copy */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          
          {/* Content that scales slightly on hover - exact copy */}
          <div className="flex flex-col items-center z-10 transform transition-transform duration-500 group-hover:scale-105">
            <div className="mb-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-center text-sm font-bold drop-shadow-lg">Unlock New Worlds</h3>
            <div className="mt-1 text-xs opacity-75">Click to explore</div>
          </div>
        </Link>
      </div>
    </section>
  );
} 