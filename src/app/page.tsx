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
      {/* Hero Section - More Visual, Less Text */}
      <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-picton-blue/10 via-white to-mint-green/20 p-4 pb-2 sm:p-6 md:p-10 sm:mb-2">
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
              <Button asChild size="lg" className="relative overflow-hidden group bg-indigo-dye hover:bg-indigo-dye/90 btn-hover-effect">
                <Link href={isAuthenticated ? "/dashboard" : "/login"} className="flex items-center gap-2">
                  <span>Start Learning</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-indigo-dye text-indigo-dye hover:bg-indigo-dye/10 btn-hover-effect">
                <Link href="/subjects">Browse Topics</Link>
              </Button>
            </div>
          </div>
          
          {/* 3D-looking isometric grid of engineering icons */}
          <div className="relative w-full md:w-[400px] lg:w-[450px] h-[250px] sm:h-[320px] md:h-[400px] lg:h-[450px] z-10 flex items-center justify-center mt-2 mb-2 sm:mt-0 sm:mb-0 md:mt-0 md:mb-0 md:-ml-6 lg:ml-0">
            <div className="transform-gpu rotate-12">
              <div className="grid grid-cols-3 gap-3 md:gap-6 lg:gap-5">
                {[...Array(9)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`
                      aspect-square w-16 sm:w-18 md:w-18 lg:w-24 rounded-lg shadow-lg flex items-center justify-center
                      ${i % 3 === 0 ? 'bg-indigo-dye text-white' : 
                        i % 3 === 1 ? 'bg-picton-blue text-white' : 
                                      'bg-mint-green text-indigo-dye'}
                      transform-gpu transition-all duration-300 hover:scale-110 hover:shadow-xl animate-icon-hover
                    `}
                    style={{
                      transform: `translateZ(${5 + (i * 1.5)}px)`,
                    }}
                  >
                    {i === 0 ? <Building className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> : 
                     i === 1 ? <Ruler className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> :
                     i === 2 ? <Calculator className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> :
                     i === 3 ? <HardHat className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> :
                     i === 4 ? <BookOpen className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> :
                     i === 5 ? <BrainCircuit className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> :
                     i === 6 ? <Medal className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> :
                     i === 7 ? <Lightbulb className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" /> :
                               <FileText className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-10 lg:w-10" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-picton-blue/30 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-mint-green/40 blur-3xl"></div>
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

      {/* Topic Gallery - Interactive Grid of Topics */}
      <section className="my-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-indigo-dye">Engineering Topics</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {subjects.map((subject, index) => (
            <Link 
              key={index}
              href="/subjects" 
              className="group relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-picton-blue/70 p-4 overflow-hidden
                        text-white transition-all hover:shadow-lg topic-card-effect"
            >
              {/* Background image with darker overlay by default */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-500 group-hover:scale-110 group-hover:brightness-110 brightness-50"
                style={{ backgroundImage: subject.bg }}
              ></div>
              
              {/* Gradient overlay - darker by default, lighter on hover */}
              <div className="absolute inset-0 bg-indigo-dye/70 transition-opacity duration-500 group-hover:bg-indigo-dye/40"></div>
              
              {/* Content that scales slightly on hover */}
              <div className="flex flex-col items-center z-10 transform transition-transform duration-500">
                <div className="mb-4 transition-colors animate-icon-hover">
                  {subject.icon}
                </div>
                <h3 className="text-center text-sm font-medium">{subject.name}</h3>
              </div>
            </Link>
          ))}
          
          {/* View More Card */}
          <Link 
            href="/subjects" 
            className="group flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-picton-blue/70 bg-gradient-to-br from-mint-green/30 via-white to-picton-blue/20 p-4 
                      transition-all hover:shadow-lg hover:scale-105 hover:border-indigo-dye"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="mb-2 rounded-full bg-picton-blue p-3 text-white transform transition-all duration-300 group-hover:bg-indigo-dye group-hover:scale-110 group-hover:rotate-12 shadow-md">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-center font-medium text-indigo-dye text-base">Explore More Topics</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section - Fun & Eye-catching - Only shown if not logged in */}
      {!isAuthenticated && (
        <section className="mb-16 overflow-hidden rounded-3xl bg-indigo-dye relative border-2 border-picton-blue shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-picton-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-picton-blue/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
          
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
