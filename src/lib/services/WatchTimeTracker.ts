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
  // New research metrics
  segmentWatches: SegmentWatch[];
  speedChanges: SpeedChange[];
  rewatchPatterns: RewatchPattern[];
  focusTime: number; // Time with tab in focus
  backgroundTime: number; // Time with tab in background
  averagePlaybackSpeed: number;
  completionPercentage: number;
}

export interface WatchTimeEvent {
  type: 'play' | 'pause' | 'seek' | 'progress' | 'visibility' | 'end' | 'speed' | 'focus' | 'blur';
  timestamp: number;
  position: number;
  duration: number;
  wasVisible?: boolean;
  speed?: number; // For speed change events
}

export interface SegmentWatch {
  startTime: number;
  endTime: number;
  startPosition: number;
  endPosition: number;
  duration: number;
  watchCount: number;
}

export interface SpeedChange {
  timestamp: number;
  position: number;
  fromSpeed: number;
  toSpeed: number;
}

export interface RewatchPattern {
  segmentStart: number;
  segmentEnd: number;
  rewatchCount: number;
  totalTimeSpent: number;
  timestamps: number[];
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

  // New tracking variables for research
  private segmentWatches: Map<string, SegmentWatch> = new Map();
  private speedChanges: SpeedChange[] = [];
  private currentSpeed: number = 1;
  private rewatchPatterns: Map<string, RewatchPattern> = new Map();
  private focusTime: number = 0;
  private backgroundTime: number = 0;
  private isFocused: boolean = true;
  private lastFocusTime: number = Date.now();
  private watchedSegments: Set<string> = new Set();

  constructor(mediaId: string) {
    this.mediaId = mediaId;
    this.sessionStartTime = Date.now();
    this.lastEventTime = this.sessionStartTime;
    this.lastFocusTime = this.sessionStartTime;
    this.initializeFocusTracking();
  }

  private initializeFocusTracking() {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.handleFocus);
      window.addEventListener('blur', this.handleBlur);
      this.isFocused = document.hasFocus();
    }
  }

  private handleFocus = () => {
    const now = Date.now();
    if (!this.isFocused) {
      this.backgroundTime += (now - this.lastFocusTime) / 1000;
    }
    this.isFocused = true;
    this.lastFocusTime = now;
    this.addEvent({
      type: 'focus',
      timestamp: now,
      position: this.lastPosition,
      duration: 0
    });
  };

  private handleBlur = () => {
    const now = Date.now();
    if (this.isFocused) {
      this.focusTime += (now - this.lastFocusTime) / 1000;
    }
    this.isFocused = false;
    this.lastFocusTime = now;
    this.addEvent({
      type: 'blur',
      timestamp: now,
      position: this.lastPosition,
      duration: 0
    });
  };

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

    // Track segment watching
    this.trackSegmentWatch(position, duration);

    // Detect seeking - if position changed more than expected based on playback time
    const expectedPositionChange = timeDiff * (this.isPlaying ? this.currentSpeed : 0);
    const isSeeking = positionDiff > this.seekThreshold &&
                     Math.abs(positionDiff - expectedPositionChange) > this.seekThreshold;

    if (isSeeking) {
      this.addEvent({
        type: 'seek',
        timestamp: now,
        position,
        duration
      });

      // Check for rewatch pattern
      this.detectRewatchPattern(this.lastPosition, position);

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

  // Track speed changes
  onSpeedChange(newSpeed: number) {
    const now = Date.now();

    this.speedChanges.push({
      timestamp: now,
      position: this.lastPosition,
      fromSpeed: this.currentSpeed,
      toSpeed: newSpeed
    });

    this.currentSpeed = newSpeed;

    this.addEvent({
      type: 'speed',
      timestamp: now,
      position: this.lastPosition,
      duration: 0,
      speed: newSpeed
    });
  }

  private trackSegmentWatch(position: number, duration: number) {
    // Track 10-second segments
    const segmentSize = 10;
    const segmentIndex = Math.floor(position / segmentSize);
    const segmentKey = `${segmentIndex * segmentSize}-${(segmentIndex + 1) * segmentSize}`;

    if (!this.segmentWatches.has(segmentKey)) {
      this.segmentWatches.set(segmentKey, {
        startTime: Date.now(),
        endTime: Date.now(),
        startPosition: segmentIndex * segmentSize,
        endPosition: Math.min((segmentIndex + 1) * segmentSize, duration),
        duration: 0,
        watchCount: 0
      });
    }

    const segment = this.segmentWatches.get(segmentKey)!;
    segment.endTime = Date.now();
    segment.duration += (Date.now() - this.lastEventTime) / 1000;

    if (!this.watchedSegments.has(segmentKey)) {
      this.watchedSegments.add(segmentKey);
      segment.watchCount++;
    }
  }

  private detectRewatchPattern(fromPosition: number, toPosition: number) {
    // Only track backward seeks as potential rewatches
    if (toPosition >= fromPosition) return;

    const segmentKey = `${Math.floor(toPosition)}-${Math.floor(fromPosition)}`;

    if (!this.rewatchPatterns.has(segmentKey)) {
      this.rewatchPatterns.set(segmentKey, {
        segmentStart: toPosition,
        segmentEnd: fromPosition,
        rewatchCount: 0,
        totalTimeSpent: 0,
        timestamps: []
      });
    }

    const pattern = this.rewatchPatterns.get(segmentKey)!;
    pattern.rewatchCount++;
    pattern.timestamps.push(Date.now());
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

    // Update focus time
    const now = Date.now();
    if (this.isFocused) {
      this.focusTime += (now - this.lastFocusTime) / 1000;
    } else {
      this.backgroundTime += (now - this.lastFocusTime) / 1000;
    }

    const playEvents = this.events.filter(e => e.type === 'play').length;
    const pauseEvents = this.events.filter(e => e.type === 'pause').length;
    const seekEvents = this.events.filter(e => e.type === 'seek').length;

    const visibilityPercentage = this.totalSessionTime > 0
      ? Math.min(100, (this.visibleTime / this.totalSessionTime) * 100)
      : 100;

    // Calculate average playback speed
    let totalSpeedTime = 0;
    let weightedSpeed = 0;
    for (let i = 0; i < this.speedChanges.length; i++) {
      const change = this.speedChanges[i];
      const nextChange = this.speedChanges[i + 1];
      const duration = nextChange
        ? (nextChange.timestamp - change.timestamp) / 1000
        : (now - change.timestamp) / 1000;
      totalSpeedTime += duration;
      weightedSpeed += change.toSpeed * duration;
    }
    const averagePlaybackSpeed = totalSpeedTime > 0
      ? weightedSpeed / totalSpeedTime
      : this.currentSpeed;

    // Calculate completion percentage
    const completionPercentage = this.lastPosition > 0
      ? Math.min(100, (this.watchedSegments.size * 10 / this.lastPosition) * 100)
      : 0;

    // Update rewatch patterns with total time spent
    for (const [key, pattern] of this.rewatchPatterns) {
      const segmentDuration = pattern.segmentEnd - pattern.segmentStart;
      pattern.totalTimeSpent = pattern.rewatchCount * segmentDuration;
    }

    return {
      mediaId: this.mediaId,
      actualWatchTime: Math.round(this.totalWatchTime * 100) / 100,
      totalDuration: this.lastPosition,
      seekEvents,
      pauseEvents,
      playEvents,
      visibility: Math.round(visibilityPercentage),
      lastPosition: this.lastPosition,
      sessionStartTime: this.sessionStartTime,
      isCompleted: false,
      // New research metrics
      segmentWatches: Array.from(this.segmentWatches.values()),
      speedChanges: this.speedChanges,
      rewatchPatterns: Array.from(this.rewatchPatterns.values()),
      focusTime: Math.round(this.focusTime * 100) / 100,
      backgroundTime: Math.round(this.backgroundTime * 100) / 100,
      averagePlaybackSpeed: Math.round(averagePlaybackSpeed * 100) / 100,
      completionPercentage: Math.round(completionPercentage * 100) / 100
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.handleFocus);
      window.removeEventListener('blur', this.handleBlur);
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
    onSpeedChange: (newSpeed: number) => tracker.onSpeedChange(newSpeed),
    getWatchTimeData: () => tracker.getWatchTimeData(),
    getEngagementScore: () => tracker.getEngagementScore(),
    isGenuineWatch: (minimumPercentage?: number) => tracker.isGenuineWatch(minimumPercentage),
    destroy: () => tracker.destroy()
  };
}