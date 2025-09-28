'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { EngagementMonitor, EngagementMetrics } from '../services/EngagementMonitor';

export interface TimeTrackingOptions {
  contentType?: 'question' | 'flashcard' | 'media' | 'reading' | 'general';
  idleThreshold?: number;
  autoStart?: boolean;
  onUpdate?: (metrics: TimeTrackingMetrics) => void;
  syncInterval?: number;
}

export interface TimeTrackingMetrics {
  totalTime: number;
  activeTime: number;
  idleTime: number;
  isActive: boolean;
  isPaused: boolean;
  engagementScore: number;
  idlePeriods: Array<{ start: number; end: number; duration: number }>;
}

export function useTimeTracking(options: TimeTrackingOptions = {}) {
  const {
    contentType = 'general',
    idleThreshold,
    autoStart = true,
    onUpdate,
    syncInterval = 1000
  } = options;

  const [metrics, setMetrics] = useState<TimeTrackingMetrics>({
    totalTime: 0,
    activeTime: 0,
    idleTime: 0,
    isActive: true,
    isPaused: !autoStart,
    engagementScore: 100,
    idlePeriods: []
  });

  const engagementMonitorRef = useRef<EngagementMonitor | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize engagement monitor
  useEffect(() => {
    engagementMonitorRef.current = new EngagementMonitor({
      contentType,
      idleThreshold
    });

    // Set up listener for engagement changes
    engagementMonitorRef.current.addListener((isActive, engagementMetrics) => {
      const newMetrics: TimeTrackingMetrics = {
        totalTime: engagementMetrics.totalTime,
        activeTime: engagementMetrics.activeTime,
        idleTime: engagementMetrics.idleTime,
        isActive,
        isPaused: false,
        engagementScore: engagementMetrics.engagementScore,
        idlePeriods: engagementMetrics.idlePeriods
      };

      setMetrics(prev => ({ ...prev, ...newMetrics }));

      if (onUpdate) {
        onUpdate(newMetrics);
      }
    });

    // Set up periodic updates
    updateIntervalRef.current = setInterval(() => {
      if (engagementMonitorRef.current) {
        const engagementMetrics = engagementMonitorRef.current.getMetrics();
        const isActive = engagementMonitorRef.current.isUserActive();

        const newMetrics: TimeTrackingMetrics = {
          totalTime: engagementMetrics.totalTime,
          activeTime: engagementMetrics.activeTime,
          idleTime: engagementMetrics.idleTime,
          isActive,
          isPaused: false,
          engagementScore: engagementMetrics.engagementScore,
          idlePeriods: engagementMetrics.idlePeriods
        };

        setMetrics(prev => ({ ...prev, ...newMetrics }));

        if (onUpdate) {
          onUpdate(newMetrics);
        }
      }
    }, syncInterval);

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (engagementMonitorRef.current) {
        engagementMonitorRef.current.destroy();
      }
    };
  }, [contentType, idleThreshold, syncInterval]);

  const start = useCallback(() => {
    if (engagementMonitorRef.current) {
      engagementMonitorRef.current.resume();
      setMetrics(prev => ({ ...prev, isPaused: false }));
    }
  }, []);

  const pause = useCallback(() => {
    if (engagementMonitorRef.current) {
      engagementMonitorRef.current.pause();
      setMetrics(prev => ({ ...prev, isPaused: true }));
    }
  }, []);

  const reset = useCallback(() => {
    if (engagementMonitorRef.current) {
      engagementMonitorRef.current.reset();
      setMetrics({
        totalTime: 0,
        activeTime: 0,
        idleTime: 0,
        isActive: true,
        isPaused: false,
        engagementScore: 100,
        idlePeriods: []
      });
    }
  }, []);

  const getMetrics = useCallback((): TimeTrackingMetrics => {
    if (engagementMonitorRef.current) {
      const engagementMetrics = engagementMonitorRef.current.getMetrics();
      const isActive = engagementMonitorRef.current.isUserActive();

      return {
        totalTime: engagementMetrics.totalTime,
        activeTime: engagementMetrics.activeTime,
        idleTime: engagementMetrics.idleTime,
        isActive,
        isPaused: metrics.isPaused,
        engagementScore: engagementMetrics.engagementScore,
        idlePeriods: engagementMetrics.idlePeriods
      };
    }
    return metrics;
  }, [metrics.isPaused]);

  return {
    metrics,
    start,
    pause,
    reset,
    getMetrics,
    isTracking: !metrics.isPaused,
    isActive: metrics.isActive
  };
}