'use client';

import React, { ReactElement, cloneElement, useRef, useEffect, useCallback } from 'react';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useTracking } from './TrackingProvider';

export interface MediaMetrics {
  mediaId: string;
  mediaType: 'video' | 'short';
  mediaTitle?: string;
  duration?: number; // Video total duration in seconds
  startTime: number;
  endTime?: number;
  totalWatchTime: number;
  activeWatchTime: number;
  completionPercentage: number;
  playbackEvents: Array<{
    timestamp: number;
    event: 'play' | 'pause' | 'seek' | 'ended' | 'error';
    position: number; // Current position in seconds
    timeElapsed: number; // Time since start
    metadata?: any;
  }>;
  seekEvents: Array<{
    timestamp: number;
    from: number;
    to: number;
    direction: 'forward' | 'backward';
    skipAmount: number;
  }>;
  pauseCount: number;
  playCount: number;
  replayCount: number;
  averagePlaybackSpeed: number;
  bufferedSegments: Array<{ start: number; end: number }>;
  watchedSegments: Array<{ start: number; end: number; watchCount: number }>;
  firstPlayTime?: number;
  timeToFirstPlay?: number;
  lastPosition: number;
  completed: boolean;
  engagementScore: number;
  idlePeriods: Array<{ start: number; end: number; duration: number }>;
}

export interface MediaTrackerProps {
  children: ReactElement;
  mediaId: string;
  mediaType: 'video' | 'short';
  mediaTitle?: string;
  mediaDuration?: number;
  metadata?: any;
  onMediaComplete?: (metrics: MediaMetrics) => void;
  trackingThresholds?: {
    minWatchTime?: number; // Minimum watch time to count as viewed (seconds)
    completionThreshold?: number; // Percentage to count as completed (0-100)
  };
}

export function MediaTracker({
  children,
  mediaId,
  mediaType,
  mediaTitle,
  mediaDuration,
  metadata = {},
  onMediaComplete,
  trackingThresholds = {
    minWatchTime: mediaType === 'short' ? 3 : 10, // 3s for shorts, 10s for videos
    completionThreshold: mediaType === 'short' ? 90 : 80 // 90% for shorts, 80% for videos
  }
}: MediaTrackerProps) {
  const { trackInteraction, trackEvent } = useTracking();
  const metricsRef = useRef<MediaMetrics>({
    mediaId,
    mediaType,
    mediaTitle,
    duration: mediaDuration,
    startTime: Date.now(),
    totalWatchTime: 0,
    activeWatchTime: 0,
    completionPercentage: 0,
    playbackEvents: [],
    seekEvents: [],
    pauseCount: 0,
    playCount: 0,
    replayCount: 0,
    averagePlaybackSpeed: 1,
    bufferedSegments: [],
    watchedSegments: [],
    lastPosition: 0,
    completed: false,
    engagementScore: 100,
    idlePeriods: []
  });

  const watchStartTimeRef = useRef<number | null>(null);
  const lastPositionRef = useRef<number>(0);
  const playbackSpeedRef = useRef<number>(1);
  const isPlayingRef = useRef<boolean>(false);
  const watchedSegmentsMapRef = useRef<Map<string, number>>(new Map());

  const timeTracking = useTimeTracking({
    contentType: 'media',
    autoStart: false, // Start when video plays
    onUpdate: (metrics) => {
      metricsRef.current.totalWatchTime = metrics.totalTime;
      metricsRef.current.activeWatchTime = metrics.activeTime;
      metricsRef.current.engagementScore = metrics.engagementScore;
      metricsRef.current.idlePeriods = metrics.idlePeriods;
    }
  });

  useEffect(() => {
    // Track media view start
    trackInteraction('media', mediaId, 'view_start', {
      mediaType,
      mediaTitle,
      duration: mediaDuration,
      ...metadata
    });

    return () => {
      // Track media view end
      if (isPlayingRef.current && watchStartTimeRef.current) {
        const watchDuration = (Date.now() - watchStartTimeRef.current) / 1000;
        updateWatchedSegments(lastPositionRef.current, watchDuration);
      }

      const endMetrics = {
        ...metricsRef.current,
        endTime: Date.now(),
        watchedSegments: Array.from(watchedSegmentsMapRef.current.entries()).map(([key, count]) => {
          const [start, end] = key.split('-').map(Number);
          return { start, end, watchCount: count };
        })
      };

      trackInteraction('media', mediaId, 'view_end', endMetrics);

      if (onMediaComplete) {
        onMediaComplete(endMetrics);
      }
    };
  }, [mediaId, mediaType, mediaTitle, mediaDuration, metadata]);

  const updateWatchedSegments = (position: number, duration: number) => {
    // Track watched segments in 5-second chunks
    const chunkSize = 5;
    const startChunk = Math.floor((position - duration) / chunkSize) * chunkSize;
    const endChunk = Math.floor(position / chunkSize) * chunkSize;

    for (let chunk = Math.max(0, startChunk); chunk <= endChunk; chunk += chunkSize) {
      const key = `${chunk}-${chunk + chunkSize}`;
      const currentCount = watchedSegmentsMapRef.current.get(key) || 0;
      watchedSegmentsMapRef.current.set(key, currentCount + 1);
    }
  };

  const calculateCompletionPercentage = () => {
    if (!mediaDuration || mediaDuration === 0) return 0;

    const uniqueWatched = new Set<number>();
    watchedSegmentsMapRef.current.forEach((_, key) => {
      const [start, end] = key.split('-').map(Number);
      for (let i = start; i < end && i < mediaDuration; i++) {
        uniqueWatched.add(i);
      }
    });

    return Math.min(100, (uniqueWatched.size / mediaDuration) * 100);
  };

  const handlePlay = useCallback((position?: number) => {
    const now = Date.now();
    const currentPosition = position ?? lastPositionRef.current;

    if (!metricsRef.current.firstPlayTime) {
      metricsRef.current.firstPlayTime = now;
      metricsRef.current.timeToFirstPlay = (now - metricsRef.current.startTime) / 1000;

      trackInteraction('media', mediaId, 'first_play', {
        timeToFirstPlay: metricsRef.current.timeToFirstPlay,
        ...metadata
      });
    }

    watchStartTimeRef.current = now;
    isPlayingRef.current = true;
    metricsRef.current.playCount++;

    const playEvent = {
      timestamp: now,
      event: 'play' as const,
      position: currentPosition,
      timeElapsed: (now - metricsRef.current.startTime) / 1000
    };

    metricsRef.current.playbackEvents.push(playEvent);

    // Check if this is a replay
    if (currentPosition < 5 && metricsRef.current.playCount > 1) {
      metricsRef.current.replayCount++;
    }

    timeTracking.start();

    trackInteraction('media', mediaId, 'play', {
      position: currentPosition,
      playCount: metricsRef.current.playCount,
      ...metadata
    });
  }, [mediaId, metadata, timeTracking, trackInteraction]);

  const handlePause = useCallback((position?: number) => {
    const now = Date.now();
    const currentPosition = position ?? lastPositionRef.current;

    if (watchStartTimeRef.current && isPlayingRef.current) {
      const watchDuration = (now - watchStartTimeRef.current) / 1000;
      updateWatchedSegments(currentPosition, watchDuration);
    }

    isPlayingRef.current = false;
    metricsRef.current.pauseCount++;
    lastPositionRef.current = currentPosition;

    const pauseEvent = {
      timestamp: now,
      event: 'pause' as const,
      position: currentPosition,
      timeElapsed: (now - metricsRef.current.startTime) / 1000
    };

    metricsRef.current.playbackEvents.push(pauseEvent);

    timeTracking.pause();

    trackInteraction('media', mediaId, 'pause', {
      position: currentPosition,
      pauseCount: metricsRef.current.pauseCount,
      watchedSoFar: metricsRef.current.totalWatchTime,
      ...metadata
    });
  }, [mediaId, metadata, timeTracking, trackInteraction]);

  const handleSeek = useCallback((from: number, to: number) => {
    const now = Date.now();
    const direction = to > from ? 'forward' : 'backward';
    const skipAmount = Math.abs(to - from);

    const seekEvent = {
      timestamp: now,
      from,
      to,
      direction,
      skipAmount
    };

    metricsRef.current.seekEvents.push(seekEvent);
    lastPositionRef.current = to;

    const playbackEvent = {
      timestamp: now,
      event: 'seek' as const,
      position: to,
      timeElapsed: (now - metricsRef.current.startTime) / 1000,
      metadata: { from, direction, skipAmount }
    };

    metricsRef.current.playbackEvents.push(playbackEvent);

    trackInteraction('media', mediaId, 'seek', {
      from,
      to,
      direction,
      skipAmount,
      seekCount: metricsRef.current.seekEvents.length,
      ...metadata
    });
  }, [mediaId, metadata, trackInteraction]);

  const handleEnded = useCallback(() => {
    const now = Date.now();

    if (watchStartTimeRef.current && isPlayingRef.current) {
      const watchDuration = (now - watchStartTimeRef.current) / 1000;
      updateWatchedSegments(lastPositionRef.current, watchDuration);
    }

    isPlayingRef.current = false;
    metricsRef.current.completed = true;
    metricsRef.current.completionPercentage = calculateCompletionPercentage();

    const endEvent = {
      timestamp: now,
      event: 'ended' as const,
      position: mediaDuration || lastPositionRef.current,
      timeElapsed: (now - metricsRef.current.startTime) / 1000
    };

    metricsRef.current.playbackEvents.push(endEvent);

    const finalMetrics = timeTracking.getMetrics();
    metricsRef.current.totalWatchTime = finalMetrics.totalTime;
    metricsRef.current.activeWatchTime = finalMetrics.activeTime;

    trackInteraction('media', mediaId, 'completed', {
      ...metricsRef.current,
      ...metadata
    });

    if (onMediaComplete) {
      onMediaComplete(metricsRef.current);
    }
  }, [mediaId, mediaDuration, metadata, timeTracking, trackInteraction, onMediaComplete]);

  const handleTimeUpdate = useCallback((currentTime: number) => {
    lastPositionRef.current = currentTime;
    metricsRef.current.lastPosition = currentTime;

    // Update completion percentage periodically
    if (mediaDuration && currentTime > 0) {
      metricsRef.current.completionPercentage = (currentTime / mediaDuration) * 100;
    }
  }, [mediaDuration]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    playbackSpeedRef.current = rate;
    metricsRef.current.averagePlaybackSpeed = rate;

    trackInteraction('media', mediaId, 'playback_rate_change', {
      rate,
      ...metadata
    });
  }, [mediaId, metadata, trackInteraction]);

  const handleError = useCallback((error: any) => {
    const now = Date.now();

    const errorEvent = {
      timestamp: now,
      event: 'error' as const,
      position: lastPositionRef.current,
      timeElapsed: (now - metricsRef.current.startTime) / 1000,
      metadata: { error: error?.message || 'Unknown error' }
    };

    metricsRef.current.playbackEvents.push(errorEvent);

    trackInteraction('media', mediaId, 'error', {
      position: lastPositionRef.current,
      error: error?.message || 'Unknown error',
      ...metadata
    });
  }, [mediaId, metadata, trackInteraction]);

  // Clone the child element and inject tracking props
  const enhancedChild = cloneElement(children, {
    onPlay: (position?: number) => {
      handlePlay(position);
      if (children.props.onPlay) {
        children.props.onPlay(position);
      }
    },
    onPause: (position?: number) => {
      handlePause(position);
      if (children.props.onPause) {
        children.props.onPause(position);
      }
    },
    onSeek: (from: number, to: number) => {
      handleSeek(from, to);
      if (children.props.onSeek) {
        children.props.onSeek(from, to);
      }
    },
    onEnded: () => {
      handleEnded();
      if (children.props.onEnded) {
        children.props.onEnded();
      }
    },
    onTimeUpdate: (currentTime: number) => {
      handleTimeUpdate(currentTime);
      if (children.props.onTimeUpdate) {
        children.props.onTimeUpdate(currentTime);
      }
    },
    onPlaybackRateChange: (rate: number) => {
      handlePlaybackRateChange(rate);
      if (children.props.onPlaybackRateChange) {
        children.props.onPlaybackRateChange(rate);
      }
    },
    onError: (error: any) => {
      handleError(error);
      if (children.props.onError) {
        children.props.onError(error);
      }
    },
    'data-media-id': mediaId,
    'data-media-type': mediaType
  });

  return enhancedChild;
}