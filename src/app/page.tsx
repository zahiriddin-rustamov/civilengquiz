"use client";

import {
  HeroSection,
  QuickStatsSection,
  StudySmarterSection,
  StudyWorldsSection,
  CallToActionSection
} from "@/components/home";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <HeroSection />
      <QuickStatsSection />
      <StudySmarterSection />
      <StudyWorldsSection />
      <CallToActionSection />
    </div>
  );
}
