"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Rocket, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";

export function CallToActionSection() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // Don't render if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
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
  );
} 