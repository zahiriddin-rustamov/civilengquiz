'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityTracker, ActivityState, ActivityEvent } from '../services/ActivityTracker';

export interface UseActivityTrackingOptions {
  idleThreshold?: number;
  onActivityStateChange?: (state: ActivityState) => void;
  trackEvents?: boolean;
}

export function useActivityTracking(options: UseActivityTrackingOptions = {}) {
  const { idleThreshold = 30000, onActivityStateChange, trackEvents = false } = options;

  const [activityState, setActivityState] = useState<ActivityState>({
    isActive: true,
    lastActivityTime: Date.now(),
    idleTime: 0,
    isVisible: true
  });

  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const activityTrackerRef = useRef<ActivityTracker | null>(null);

  useEffect(() => {
    activityTrackerRef.current = ActivityTracker.getInstance();

    if (idleThreshold) {
      activityTrackerRef.current.setIdleThreshold(idleThreshold);
    }

    const handleStateChange = (state: ActivityState) => {
      setActivityState(state);
      onActivityStateChange?.(state);

      if (trackEvents) {
        setRecentEvents(activityTrackerRef.current?.getRecentEvents(10) || []);
      }
    };

    activityTrackerRef.current.addListener(handleStateChange);

    // Get initial state
    const initialState = activityTrackerRef.current.getState();
    setActivityState(initialState);

    return () => {
      if (activityTrackerRef.current) {
        activityTrackerRef.current.removeListener(handleStateChange);
      }
    };
  }, [idleThreshold, trackEvents]);

  const getState = useCallback((): ActivityState => {
    return activityTrackerRef.current?.getState() || activityState;
  }, [activityState]);

  const getEvents = useCallback((): ActivityEvent[] => {
    return activityTrackerRef.current?.getEvents() || [];
  }, []);

  const getRecentEvents = useCallback((count: number = 10): ActivityEvent[] => {
    return activityTrackerRef.current?.getRecentEvents(count) || [];
  }, []);

  const setIdleThresholdValue = useCallback((milliseconds: number) => {
    activityTrackerRef.current?.setIdleThreshold(milliseconds);
  }, []);

  const reset = useCallback(() => {
    activityTrackerRef.current?.reset();
  }, []);

  return {
    isActive: activityState.isActive,
    isVisible: activityState.isVisible,
    lastActivityTime: activityState.lastActivityTime,
    idleTime: activityState.idleTime,
    activityState,
    recentEvents: trackEvents ? recentEvents : [],
    getState,
    getEvents,
    getRecentEvents,
    setIdleThreshold: setIdleThresholdValue,
    reset
  };
}