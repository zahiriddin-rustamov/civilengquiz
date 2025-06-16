"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Medal, BarChart3, Building, Ruler, HardHat, Calculator, ArrowRight, Check, Clock, BrainCircuit, Lightbulb, Pencil, ChevronRight, Plus, Rocket, Zap, Trophy } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  
  // Typing effect state
  const [displayText, setDisplayText] = useState("Concepts");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);
  
  // Array of words to display in the typing effect
  const wordsToRotate = ["Concepts", "Principles", "Formulas", "Theories", "Problems"];
  const typingRef = useRef(null);
  
  useEffect(() => {
    const handleTyping = () => {
      const currentIndex = loopNum % wordsToRotate.length;
      const fullText = wordsToRotate[currentIndex];
      
      setDisplayText(isDeleting 
        ? fullText.substring(0, displayText.length - 1) 
        : fullText.substring(0, displayText.length + 1)
      );
      
      // Set typing speed based on current state
      if (isDeleting) {
        setTypingSpeed(80); // Faster when deleting
      } else {
        setTypingSpeed(150); // Normal speed when typing
      }
      
      // If completed typing the word
      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 1500); // Pause at the end
      } 
      // If deleted the word completely
      else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(500); // Pause before starting next word
      }
    };
    
    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed, wordsToRotate]);

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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section - Gaming Enhanced */}
      <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 pb-2 sm:p-6 md:p-10 sm:mb-2">
        <div className="flex flex-col items-center md:flex-row md:justify-between md:gap-8">
          <div className="max-w-xl space-y-4 sm:space-y-6 z-10 mb-4 sm:mb-8 md:mb-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <div 
                className="inline-block rounded-full bg-indigo-dye px-4 py-1.5 text-sm font-medium text-white border border-picton-blue shadow-md hover:scale-105 transition-transform cursor-pointer"
                onClick={() => {
                  const badge = document.querySelector('.student-badge');
                  if (badge) {
                    badge.classList.add('animate-ping');
                    setTimeout(() => {
                      badge.classList.remove('animate-ping');
                    }, 300);
                  }
                }}
              >
                <span className="student-badge inline-flex items-center">
                  <HardHat className="mr-1.5 h-4 w-4 text-white" /> 
                  Civil Engineering Students
                  <span className="ml-1.5 relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                </span>
              </div>
              
              {/* Gaming Achievement Badges */}
              <div className="inline-block rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform cursor-pointer">
                <Trophy className="inline w-3 h-3 mr-1" />
                Level Up System
              </div>
              <div className="inline-block rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform cursor-pointer">
                <Zap className="inline w-3 h-3 mr-1" />
                XP & Badges
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Master Engineering <span className="text-picton-blue relative inline-block min-w-[180px] sm:min-w-[220px] md:min-w-[280px]" ref={typingRef}>
                {displayText}
                <span className="inline-block h-[70%] w-[2px] ml-[1px] align-middle bg-black animate-blink"></span>
              </span>
            </h1>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="relative overflow-hidden group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white btn-hover-effect">
                <Link href={isAuthenticated ? "/dashboard" : "/login"} className="flex items-center gap-2">
                  <span>Start Learning</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-purple-500 text-purple-600 hover:bg-purple-50 btn-hover-effect">
                <Link href="/subjects">Browse Worlds</Link>
              </Button>
            </div>
          </div>
          
          {/* Enhanced 3D Isometric Grid of Engineering Icons */}
          <div className="relative w-full md:w-[400px] lg:w-[450px] h-[250px] sm:h-[320px] md:h-[400px] lg:h-[450px] z-10 flex items-center justify-center mt-2 mb-2 sm:mt-0 sm:mb-0 md:mt-0 md:mb-0 md:-ml-6 lg:ml-0">
            <div className="transform-gpu perspective-1000 isometric-grid-container">
              <div className="grid grid-cols-3 gap-2 md:gap-4 lg:gap-3">
                {[...Array(9)].map((_, i) => {
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  const depth = (row + col) * 12;
                  const icons = [Building, Ruler, Calculator, HardHat, BookOpen, BrainCircuit, Medal, Lightbulb, FileText];
                  const IconComponent = icons[i];
                  
                  return (
                    <div 
                      key={i} 
                      className={`
                        relative aspect-square w-14 sm:w-16 md:w-18 lg:w-20 rounded-xl flex items-center justify-center
                        isometric-cube cube-glow
                        ${i % 3 === 0 ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white shadow-indigo-500/60' : 
                          i % 3 === 1 ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 text-white shadow-purple-500/60' : 
                                        'bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-700 text-white shadow-cyan-500/60'}
                        transform-gpu transition-all duration-700 hover:scale-125 hover:shadow-2xl hover:rotate-12
                        shadow-xl border border-white/30 backdrop-blur-sm
                      `}
                      style={{
                        transform: `translateZ(${depth}px) translateY(${-depth * 0.4}px) translateX(${depth * 0.2}px)`,
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Enhanced 3D Face Effect with Lighting */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 via-transparent to-black/30"></div>
                      
                      {/* Right Side Face for 3D Effect */}
                      <div 
                        className={`
                          absolute top-0 left-full w-3 h-full rounded-r-xl
                          ${i % 3 === 0 ? 'bg-gradient-to-b from-indigo-700 via-indigo-800 to-indigo-900' : 
                            i % 3 === 1 ? 'bg-gradient-to-b from-purple-700 via-purple-800 to-purple-900' : 
                                          'bg-gradient-to-b from-cyan-600 via-cyan-700 to-cyan-800'}
                          shadow-lg
                        `}
                        style={{ 
                          transform: 'rotateY(90deg) translateZ(1.5px)',
                          transformOrigin: 'left center'
                        }}
                      ></div>
                      
                      {/* Bottom Face for 3D Effect */}
                      <div 
                        className={`
                          absolute top-full left-0 w-full h-3 rounded-b-xl
                          ${i % 3 === 0 ? 'bg-gradient-to-r from-indigo-800 via-indigo-900 to-black' : 
                            i % 3 === 1 ? 'bg-gradient-to-r from-purple-800 via-purple-900 to-black' : 
                                          'bg-gradient-to-r from-cyan-700 via-cyan-800 to-black'}
                          shadow-lg
                        `}
                        style={{ 
                          transform: 'rotateX(-90deg) translateZ(1.5px)',
                          transformOrigin: 'top center'
                        }}
                      ></div>
                      
                      {/* Icon with Enhanced Styling */}
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 relative z-20 drop-shadow-lg filter brightness-110" />
                      
                      {/* Animated Glow Effect */}
                      <div className="absolute inset-0 rounded-xl opacity-40 bg-gradient-to-br from-white/20 to-transparent animate-pulse"></div>
                      
                      {/* Sparkle Effect on Hover */}
                      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute top-2 right-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                        <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Enhanced Floating Particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`
                      absolute rounded-full floating-particle
                      ${i % 4 === 0 ? 'w-1 h-1 bg-indigo-400/60' :
                        i % 4 === 1 ? 'w-0.5 h-0.5 bg-purple-400/60' :
                        i % 4 === 2 ? 'w-1.5 h-1.5 bg-cyan-400/40' :
                                      'w-0.5 h-0.5 bg-white/60'}
                    `}
                    style={{
                      left: `${10 + (i * 8)}%`,
                      top: `${5 + (i * 7)}%`,
                      animationDelay: `${i * 300}ms`,
                      animationDuration: `${3 + (i * 0.2)}s`,
                    }}
                  ></div>
                ))}
              </div>
              
              {/* Ambient Light Rays */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/20 via-transparent to-transparent transform rotate-12 animate-pulse"></div>
                <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-purple-300/20 via-transparent to-transparent transform -rotate-12 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
            
            {/* Enhanced Isometric Grid Base Shadow */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="w-56 h-16 bg-gradient-radial from-black/20 via-black/10 to-transparent rounded-full blur-lg"></div>
              <div className="absolute inset-0 w-40 h-8 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent rounded-full blur-md"></div>
            </div>
          </div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-purple-400/30 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-indigo-400/40 blur-3xl"></div>
      </section>

      {/* Quick Stats - Gamified Achievement Cards */}
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

      {/* Features Section - More Visual, Interactive Cards */}
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
          
          {/* Feature 4 - Progress Tracking - Moved to last position */}
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

      {/* Topic Gallery - Study Worlds Grid */}
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

      {/* CTA Section - Fun & Eye-catching - Only shown if not logged in */}
      {!isAuthenticated && (
        <section className="mb-16 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 relative border-2 border-purple-400 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
          
          <div className="relative p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex rounded-full bg-picton-blue px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm border border-white/30 animate-pulse-subtle">
                <Zap className="mr-2 h-4 w-4" /> Boost Your Engineering Skills
              </div>
              
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-white">
                Ready to Level Up Your Engineering Skills? 🎮
              </h2>
              
              <p className="mb-8 text-white/90 text-lg max-w-lg mx-auto">
                Join thousands of students earning XP, unlocking achievements, and mastering civil engineering through gamified learning!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-picton-blue text-white hover:bg-picton-blue/90 btn-hover-effect group">
                  <Link href="/register" className="flex items-center gap-2 px-8 py-6">
                    <Rocket className="h-5 w-5 group-hover:animate-bounce" />
                    <span className="text-lg font-bold">Get Started - It's Free!</span>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="border-white bg-white/10 text-white hover:bg-white/20 hover:border-white hover:text-picton-blue btn-hover-effect group">
                  <Link href="/login" className="flex items-center gap-2 px-6 py-6">
                    <span className="text-lg">Already a Member? Log In</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
