'use client';

export interface WatchTimeData {
  mediaId: string;
  actualWatchTime: number;
  totalDuration: number;
  seekEvents: number;
  pauseEvents: number;
  playEvents: number;
  visibility: number; // percentage of time video was visible
  lastPosition: number;
  sessionStartTime: number;
  isCompleted: boolean;
}

export interface WatchTimeEvent {
  type: 'play' | 'pause' | 'seek' | 'progress' | 'visibility' | 'end';
  timestamp: number;
  position: number;
  duration: number;
  wasVisible?: boolean;
}

export class WatchTimeTracker {
  private mediaId: string;
  private events: WatchTimeEvent[] = [];
  private lastEventTime: number = 0;
  private lastPosition: number = 0;
  private isPlaying: boolean = false;
  private isVisible: boolean = true;
  private totalWatchTime: number = 0;
  private sessionStartTime: number;
  private seekThreshold: number = 5; // seconds - if position jumps more than this, it's a seek
  private visibilityObserver: IntersectionObserver | null = null;
  private element: HTMLElement | null = null;
  private visibleTime: number = 0;
  private totalSessionTime: number = 0;

  constructor(mediaId: string) {
    this.mediaId = mediaId;
    this.sessionStartTime = Date.now();
    this.lastEventTime = this.sessionStartTime;
  }

  // Initialize visibility tracking
  initializeVisibilityTracking(element: HTMLElement) {
    this.element = element;

    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const wasVisible = this.isVisible;
            this.isVisible = entry.isIntersecting && entry.intersectionRatio > 0.5;

            this.addEvent({
              type: 'visibility',
              timestamp: Date.now(),
              position: this.lastPosition,
              duration: 0,
              wasVisible: this.isVisible
            });

            // Only count watch time when visible and playing
            if (wasVisible && !this.isVisible && this.isPlaying) {
              // Video became invisible while playing - pause watch time tracking
              this.updateWatchTime();
            }
          });
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1.0],
          rootMargin: '0px'
        }
      );

      this.visibilityObserver.observe(element);
    }
  }

  // Track play event
  onPlay(position: number, duration: number) {
    const now = Date.now();
    this.isPlaying = true;
    this.lastPosition = position;
    this.lastEventTime = now;

    this.addEvent({
      type: 'play',
      timestamp: now,
      position,
      duration
    });
  }

  // Track pause event
  onPause(position: number, duration: number) {
    const now = Date.now();
    this.updateWatchTime();
    this.isPlaying = false;
    this.lastPosition = position;

    this.addEvent({
      type: 'pause',
      timestamp: now,
      position,
      duration
    });
  }

  // Track progress updates from ReactPlayer
  onProgress(position: number, duration: number) {
    const now = Date.now();
    const positionDiff = Math.abs(position - this.lastPosition);
    const timeDiff = (now - this.lastEventTime) / 1000;

    // Detect seeking - if position changed more than expected based on playback time
    const expectedPositionChange = timeDiff * (this.isPlaying ? 1 : 0);
    const isSeeking = positionDiff > this.seekThreshold &&
                     Math.abs(positionDiff - expectedPositionChange) > this.seekThreshold;

    if (isSeeking) {
      this.addEvent({
        type: 'seek',
        timestamp: now,
        position,
        duration
      });

      // Reset tracking after seek
      this.lastEventTime = now;
      this.lastPosition = position;
      return;
    }

    // Update watch time if playing and visible
    if (this.isPlaying) {
      this.updateWatchTime();
    }

    this.lastPosition = position;
    this.lastEventTime = now;

    this.addEvent({
      type: 'progress',
      timestamp: now,
      position,
      duration
    });
  }

  // Track end event
  onEnd(duration: number) {
    const now = Date.now();
    this.updateWatchTime();
    this.isPlaying = false;

    this.addEvent({
      type: 'end',
      timestamp: now,
      position: duration,
      duration
    });
  }

  // Update actual watch time calculation
  private updateWatchTime() {
    if (!this.isPlaying || !this.isVisible) return;

    const now = Date.now();
    const timeDiff = (now - this.lastEventTime) / 1000;

    // Only add time if it's reasonable (not more than 2 seconds since last update)
    if (timeDiff > 0 && timeDiff <= 2) {
      this.totalWatchTime += timeDiff;
      this.visibleTime += timeDiff;
    }

    this.totalSessionTime = (now - this.sessionStartTime) / 1000;
    this.lastEventTime = now;
  }

  // Add event to tracking history
  private addEvent(event: WatchTimeEvent) {
    this.events.push(event);

    // Keep only last 100 events to prevent memory bloat
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  // Get comprehensive watch time data
  getWatchTimeData(): WatchTimeData {
    this.updateWatchTime(); // Ensure we have latest data

    const playEvents = this.events.filter(e => e.type === 'play').length;
    const pauseEvents = this.events.filter(e => e.type === 'pause').length;
    const seekEvents = this.events.filter(e => e.type === 'seek').length;

    const visibilityPercentage = this.totalSessionTime > 0
      ? Math.min(100, (this.visibleTime / this.totalSessionTime) * 100)
      : 100;

    return {
      mediaId: this.mediaId,
      actualWatchTime: Math.round(this.totalWatchTime * 100) / 100, // Round to 2 decimal places
      totalDuration: this.lastPosition,
      seekEvents,
      pauseEvents,
      playEvents,
      visibility: Math.round(visibilityPercentage),
      lastPosition: this.lastPosition,
      sessionStartTime: this.sessionStartTime,
      isCompleted: false // Will be determined by calling component
    };
  }

  // Calculate engagement quality score (0-100)
  getEngagementScore(): number {
    const data = this.getWatchTimeData();

    if (data.totalDuration === 0) return 0;

    const watchPercentage = Math.min(100, (data.actualWatchTime / data.totalDuration) * 100);
    const visibilityScore = data.visibility;

    // Penalize excessive seeking (more than 1 seek per minute is suspicious)
    const seekPenalty = Math.min(20, data.seekEvents * 2);

    // Reward continuous watching (fewer pause events)
    const continuityBonus = Math.max(0, 10 - data.pauseEvents);

    const baseScore = (watchPercentage * 0.6) + (visibilityScore * 0.3);
    const finalScore = Math.max(0, Math.min(100, baseScore + continuityBonus - seekPenalty));

    return Math.round(finalScore);
  }

  // Check if viewing qualifies as "genuine" watching
  isGenuineWatch(minimumWatchPercentage: number = 60): boolean {
    const data = this.getWatchTimeData();
    const engagementScore = this.getEngagementScore();

    if (data.totalDuration === 0) return false;

    const watchPercentage = (data.actualWatchTime / data.totalDuration) * 100;

    return watchPercentage >= minimumWatchPercentage &&
           engagementScore >= 50 &&
           data.visibility >= 70;
  }

  // Cleanup
  destroy() {
    if (this.visibilityObserver && this.element) {
      this.visibilityObserver.unobserve(this.element);
      this.visibilityObserver.disconnect();
    }
  }
}

// Hook for easier use in React components
export function useWatchTimeTracker(mediaId: string) {
  const tracker = new WatchTimeTracker(mediaId);

  return {
    tracker,
    initializeVisibilityTracking: (element: HTMLElement) => tracker.initializeVisibilityTracking(element),
    onPlay: (position: number, duration: number) => tracker.onPlay(position, duration),
    onPause: (position: number, duration: number) => tracker.onPause(position, duration),
    onProgress: (position: number, duration: number) => tracker.onProgress(position, duration),
    onEnd: (duration: number) => tracker.onEnd(duration),
    getWatchTimeData: () => tracker.getWatchTimeData(),
    getEngagementScore: () => tracker.getEngagementScore(),
    isGenuineWatch: (minimumPercentage?: number) => tracker.isGenuineWatch(minimumPercentage),
    destroy: () => tracker.destroy()
  };
}