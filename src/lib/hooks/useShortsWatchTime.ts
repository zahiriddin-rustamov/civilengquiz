'use client';

import { useRef, useEffect, useState } from 'react';
import { WatchTimeTracker, WatchTimeData } from '@/lib/services/WatchTimeTracker';

interface ShortsWatchTimeHook {
  initializeTracking: (shortId: string, element: HTMLElement) => void;
  onPlay: (shortId: string, position: number, duration: number) => void;
  onPause: (shortId: string, position: number, duration: number) => void;
  onProgress: (shortId: string, position: number, duration: number) => void;
  onEnd: (shortId: string, duration: number) => void;
  getWatchTimeData: (shortId: string) => WatchTimeData | null;
  getEngagementScore: (shortId: string) => number;
  isGenuineWatch: (shortId: string, minimumPercentage?: number) => boolean;
  updateProgress: (shortId: string, topicId: string, subjectId: string) => Promise<void>;
  cleanup: () => void;
}

export function useShortsWatchTime(): ShortsWatchTimeHook {
  const trackersRef = useRef<Map<string, WatchTimeTracker>>(new Map());
  const [, forceUpdate] = useState({});

  // Force component re-render when needed
  const triggerUpdate = () => forceUpdate({});

  // Initialize tracking for a specific short
  const initializeTracking = (shortId: string, element: HTMLElement) => {
    // Clean up existing tracker if any
    const existingTracker = trackersRef.current.get(shortId);
    if (existingTracker) {
      existingTracker.destroy();
    }

    // Create new tracker
    const tracker = new WatchTimeTracker(shortId);
    tracker.initializeVisibilityTracking(element);
    trackersRef.current.set(shortId, tracker);
  };

  // Get tracker for a specific short
  const getTracker = (shortId: string): WatchTimeTracker | null => {
    return trackersRef.current.get(shortId) || null;
  };

  // Play event
  const onPlay = (shortId: string, position: number, duration: number) => {
    const tracker = getTracker(shortId);
    if (tracker) {
      tracker.onPlay(position, duration);
      triggerUpdate();
    }
  };

  // Pause event
  const onPause = (shortId: string, position: number, duration: number) => {
    const tracker = getTracker(shortId);
    if (tracker) {
      tracker.onPause(position, duration);
      triggerUpdate();
    }
  };

  // Progress event
  const onProgress = (shortId: string, position: number, duration: number) => {
    const tracker = getTracker(shortId);
    if (tracker) {
      tracker.onProgress(position, duration);
      triggerUpdate();
    }
  };

  // End event
  const onEnd = (shortId: string, duration: number) => {
    const tracker = getTracker(shortId);
    if (tracker) {
      tracker.onEnd(duration);
      triggerUpdate();
    }
  };

  // Get watch time data
  const getWatchTimeData = (shortId: string): WatchTimeData | null => {
    const tracker = getTracker(shortId);
    return tracker ? tracker.getWatchTimeData() : null;
  };

  // Get engagement score
  const getEngagementScore = (shortId: string): number => {
    const tracker = getTracker(shortId);
    return tracker ? tracker.getEngagementScore() : 0;
  };

  // Check if genuine watch
  const isGenuineWatch = (shortId: string, minimumPercentage = 30): boolean => {
    const tracker = getTracker(shortId);
    return tracker ? tracker.isGenuineWatch(minimumPercentage) : false;
  };

  // Update progress via API
  const updateProgress = async (shortId: string, topicId: string, subjectId: string) => {
    const watchData = getWatchTimeData(shortId);
    const engagementScore = getEngagementScore(shortId);
    const isGenuine = isGenuineWatch(shortId, 30); // Lower threshold for shorts

    if (!watchData) return;

    // For shorts, completion criteria are more lenient
    const progressCompleted = watchData.lastPosition > 0; // Any progress
    const timeCompleted = watchData.actualWatchTime >= 3; // At least 3 seconds of actual watch time
    const qualityCompleted = engagementScore >= 30 && isGenuine; // Lower quality threshold
    const completed = progressCompleted && timeCompleted && qualityCompleted;

    try {
      const response = await fetch('/api/user/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: shortId,
          contentType: 'media',
          topicId: topicId,
          subjectId: subjectId,
          completed: completed,
          score: 1.0, // Shorts are binary - watched or not
          timeSpent: watchData.actualWatchTime,
          data: {
            progressPercentage: 100, // Shorts are either watched or not
            watchTime: watchData.actualWatchTime,
            actualWatchTime: watchData.actualWatchTime,
            engagementScore: engagementScore,
            isGenuineWatch: isGenuine,
            visibility: watchData.visibility,
            seekEvents: watchData.seekEvents,
            pauseEvents: watchData.pauseEvents,
            difficulty: 'Beginner', // Most shorts are beginner-friendly
            videoType: 'short',
            minWatchTimeRequired: 3,
            hasWatchedEnough: timeCompleted
          }
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Failed to update short progress:', result.error);
      }
    } catch (error) {
      console.error('Error updating short progress:', error);
    }
  };

  // Cleanup all trackers
  const cleanup = () => {
    trackersRef.current.forEach((tracker) => {
      tracker.destroy();
    });
    trackersRef.current.clear();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    initializeTracking,
    onPlay,
    onPause,
    onProgress,
    onEnd,
    getWatchTimeData,
    getEngagementScore,
    isGenuineWatch,
    updateProgress,
    cleanup
  };
}