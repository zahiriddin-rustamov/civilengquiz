"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Building, Ruler, HardHat, Calculator, BrainCircuit, Medal, Lightbulb, FileText, ArrowRight, Trophy, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export function HeroSection() {
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

  return (
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
  );
}