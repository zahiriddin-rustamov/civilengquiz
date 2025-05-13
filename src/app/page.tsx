"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Medal, BarChart3, Building, Ruler, HardHat, Calculator, ArrowRight, Check, Clock, BrainCircuit, Lightbulb, Pencil, ChevronRight, Plus, Rocket, Zap } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // Array of common civil engineering topics with icons and background images
  const subjects = [
    { 
      name: "Structural Analysis", 
      icon: <Building className="h-6 w-6" />,
      bg: "linear-gradient(rgba(27, 73, 101, 0.7), rgba(27, 73, 101, 0.7)), url('/placeholder-structural.jpg')"
    },
    { 
      name: "Geotechnical Engineering", 
      icon: <Ruler className="h-6 w-6" />,
      bg: "linear-gradient(rgba(27, 73, 101, 0.7), rgba(27, 73, 101, 0.7)), url('/placeholder-geotechnical.jpg')"
    },
    { 
      name: "Transportation Engineering", 
      icon: <HardHat className="h-6 w-6" />,
      bg: "linear-gradient(rgba(27, 73, 101, 0.7), rgba(27, 73, 101, 0.7)), url('/placeholder-transportation.jpg')"
    },
    { 
      name: "Fluid Mechanics", 
      icon: <Calculator className="h-6 w-6" />,
      bg: "linear-gradient(rgba(27, 73, 101, 0.7), rgba(27, 73, 101, 0.7)), url('/placeholder-fluid.jpg')"
    },
    { 
      name: "Construction Management", 
      icon: <BookOpen className="h-6 w-6" />,
      bg: "linear-gradient(rgba(27, 73, 101, 0.7), rgba(27, 73, 101, 0.7)), url('/placeholder-construction.jpg')"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section - More Visual, Less Text */}
      <section className="relative mb-16 overflow-hidden rounded-2xl bg-gradient-to-br from-columbia-blue via-white to-mint-green p-6 md:p-10">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="max-w-xl space-y-6 z-10">
            <div className="inline-block rounded-full bg-accent px-4 py-1 text-sm font-medium text-indigo-dye">
              Civil Engineering Students
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Master Engineering <span className="text-indigo-dye">Concepts</span>
            </h1>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="relative overflow-hidden group bg-indigo-dye hover:bg-indigo-dye/90">
                <Link href="/register" className="flex items-center gap-2">
                  <span>Start Learning</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-indigo-dye text-indigo-dye hover:bg-indigo-dye/10">
                <Link href="/subjects">Browse Topics</Link>
              </Button>
            </div>
          </div>
          
          {/* 3D-looking isometric grid of engineering icons */}
          <div className="relative h-[300px] w-[300px] md:h-[400px] md:w-[400px] lg:h-[450px] lg:w-[450px] z-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative transform-gpu rotate-12">
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(9)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`
                        aspect-square w-24 rounded-lg shadow-lg flex items-center justify-center
                        ${i % 3 === 0 ? 'bg-indigo-dye text-white' : 
                          i % 3 === 1 ? 'bg-picton-blue text-white' : 
                                        'bg-mint-green text-indigo-dye'}
                        transform-gpu transition-all duration-300 hover:scale-110
                      `}
                      style={{
                        transform: `translateZ(${Math.random() * 20}px)`,
                      }}
                    >
                      {i === 0 ? <Building className="h-10 w-10" /> : 
                       i === 1 ? <Ruler className="h-10 w-10" /> :
                       i === 2 ? <Calculator className="h-10 w-10" /> :
                       i === 3 ? <HardHat className="h-10 w-10" /> :
                       i === 4 ? <BookOpen className="h-10 w-10" /> :
                       i === 5 ? <BrainCircuit className="h-10 w-10" /> :
                       i === 6 ? <Medal className="h-10 w-10" /> :
                       i === 7 ? <Lightbulb className="h-10 w-10" /> :
                                 <FileText className="h-10 w-10" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-picton-blue/20 blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-mint-green/30 blur-3xl"></div>
      </section>

      {/* Quick Stats - Visual Counters */}
      <section className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border-2 border-columbia-blue bg-white p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg">
          <div className="mb-2 text-4xl font-bold text-indigo-dye flex items-end">
            300<span className="text-picton-blue text-2xl">+</span>
          </div>
          <p className="text-moonstone">Questions</p>
        </div>
        <div className="rounded-xl border-2 border-columbia-blue bg-white p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg">
          <div className="mb-2 text-4xl font-bold text-indigo-dye flex items-end">
            15<span className="text-picton-blue text-2xl">+</span>
          </div>
          <p className="text-moonstone">Topics</p>
        </div>
        <div className="rounded-xl border-2 border-columbia-blue bg-white p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg">
          <div className="mb-2 text-4xl font-bold text-indigo-dye flex items-end">
            100<span className="text-picton-blue text-2xl">%</span>
          </div>
          <p className="text-moonstone">Curriculum Aligned</p>
        </div>
        <div className="rounded-xl border-2 border-columbia-blue bg-white p-6 text-center flex flex-col items-center transition-all hover:border-picton-blue hover:shadow-lg">
          <div className="mb-2 text-4xl font-bold text-indigo-dye flex items-end">
            24<span className="text-picton-blue text-2xl">/7</span>
          </div>
          <p className="text-moonstone">Access</p>
        </div>
      </section>

      {/* Features Section - More Visual, Interactive Cards */}
      <section className="mb-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-indigo-dye">Study Smarter</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Feature 1 - Interactive Quizzes */}
          <div className="group h-full rounded-xl bg-white border-2 border-columbia-blue p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-picton-blue hover:shadow-md">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-moonstone/20">
              <BookOpen className="h-7 w-7 text-indigo-dye" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-indigo-dye">Interactive Quizzes</h3>
            <div className="space-y-2">
              {/* Interactive quiz example */}
              <div className="mt-4 rounded-lg bg-columbia-blue/30 p-3">
                <p className="font-medium text-indigo-dye">Sample Question:</p>
                <p className="mb-2 text-sm text-picton-blue">What is the primary function of a retaining wall?</p>
                <div className="space-y-1">
                  <div className="flex items-center rounded bg-white px-3 py-1 text-sm">
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    <span>To hold back soil and prevent erosion</span>
                  </div>
                  <div className="flex items-center rounded px-3 py-1 text-sm opacity-60">
                    <span className="mr-2 h-4 w-4">○</span>
                    <span>To support building foundations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature 2 - Flashcards */}
          <div className="group h-full rounded-xl bg-white border-2 border-columbia-blue p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-picton-blue hover:shadow-md">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mint-green/50">
              <FileText className="h-7 w-7 text-indigo-dye" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-indigo-dye">Flashcards</h3>
            <div className="mt-4 relative perspective">
              <div className="relative preserve-3d transition-all duration-500 hover:my-rotate-y-180 w-full h-[120px] cursor-pointer">
                <div className="absolute backface-hidden border border-columbia-blue w-full h-full rounded-lg bg-white p-4 flex items-center justify-center">
                  <p className="text-center text-indigo-dye font-medium">What is the formula for beam deflection?</p>
                </div>
                <div className="absolute my-rotate-y-180 backface-hidden w-full h-full rounded-lg bg-picton-blue p-4 flex items-center justify-center">
                  <p className="text-center text-white">δ = PL³/3EI for cantilever beam with end load</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature 3 - Progress Tracking */}
          <div className="group h-full rounded-xl bg-white border-2 border-columbia-blue p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-picton-blue hover:shadow-md">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-picton-blue/20">
              <Medal className="h-7 w-7 text-indigo-dye" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-indigo-dye">Progress Tracking</h3>
            <div className="mt-4 space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Structural Analysis</span>
                  <span className="text-picton-blue">75%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-columbia-blue/30">
                  <div className="h-2 rounded-full bg-picton-blue" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Fluid Mechanics</span>
                  <span className="text-picton-blue">45%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-columbia-blue/30">
                  <div className="h-2 rounded-full bg-picton-blue" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Geotechnical</span>
                  <span className="text-picton-blue">90%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-columbia-blue/30">
                  <div className="h-2 rounded-full bg-picton-blue" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature 4 - Rich Media */}
          <div className="group h-full rounded-xl bg-white border-2 border-columbia-blue p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-picton-blue hover:shadow-md">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-columbia-blue/50">
              <BarChart3 className="h-7 w-7 text-indigo-dye" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-indigo-dye">Rich Media</h3>
            <div className="mt-4 rounded-lg border border-columbia-blue bg-columbia-blue/10 overflow-hidden">
              <div className="aspect-video bg-gray-200 relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-indigo-dye/80 flex items-center justify-center">
                    <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-12 border-l-white"></div>
                  </div>
                </div>
                <p className="text-xs text-center absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded">
                  <Clock className="inline h-3 w-3 mr-1" /> 10:25
                </p>
              </div>
              <div className="p-2">
                <p className="text-xs text-picton-blue">Beam Analysis Tutorial</p>
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
              className="group relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-columbia-blue p-4 overflow-hidden
                        text-white transition-all hover:scale-105 hover:border-picton-blue hover:shadow-lg"
              style={{ background: subject.bg }}
            >
              <div className="mb-4 transition-colors z-10">
                {subject.icon}
              </div>
              <h3 className="text-center text-sm font-medium z-10">{subject.name}</h3>
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-dye/80 to-indigo-dye/20"></div>
            </Link>
          ))}
          
          {/* View More Card */}
          <Link 
            href="/subjects" 
            className="group flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-columbia-blue bg-mint-green/10 p-4 
                      transition-all hover:scale-105 hover:border-picton-blue hover:shadow-lg"
          >
            <div className="mb-4 rounded-full bg-white/90 p-3">
              <Plus className="h-6 w-6 text-indigo-dye" />
            </div>
            <h3 className="text-center text-sm font-medium text-indigo-dye">View More</h3>
          </Link>
        </div>
      </section>

      {/* CTA Section - Fun & Eye-catching - Only shown if not logged in */}
      {!isAuthenticated && (
        <section className="mb-16 overflow-hidden rounded-3xl bg-indigo-dye relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-mint-green/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-picton-blue/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
          
          <div className="relative p-8 md:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white">
                <Zap className="mr-2 h-4 w-4" /> Boost Your Engineering Skills
              </div>
              
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-white">
                Ready to Ace Your Exams? 🚀
              </h2>
              
              <p className="mb-8 text-white/90 text-lg max-w-lg mx-auto">
                Join thousands of students who are crushing their civil engineering courses with our interactive quizzes!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-indigo-dye hover:bg-mint-green hover:scale-105 transform transition-all shadow-lg group">
                  <Link href="/register" className="flex items-center gap-2 px-8 py-6">
                    <Rocket className="h-5 w-5 group-hover:animate-bounce" />
                    <span className="text-lg font-bold">Get Started - It's Free!</span>
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white">
                  <Link href="/login" className="flex items-center gap-2 px-6 py-6">
                    <span className="text-lg">Already a Member? Log In</span>
                    <ArrowRight className="h-4 w-4" />
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
