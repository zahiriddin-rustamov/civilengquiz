'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { EngagementMonitor, EngagementMetrics, EngagementConfig } from '../services/EngagementMonitor';

export interface UseEngagementOptions extends EngagementConfig {
  onActiveChange?: (isActive: boolean) => void;
  onMetricsUpdate?: (metrics: EngagementMetrics) => void;
}

export function useEngagement(options: UseEngagementOptions = {}) {
  const { onActiveChange, onMetricsUpdate, ...config } = options;

  const [isActive, setIsActive] = useState(true);
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    totalTime: 0,
    activeTime: 0,
    idleTime: 0,
    idlePeriods: [],
    engagementScore: 100,
    averageIdleDuration: 0,
    longestIdlePeriod: 0
  });

  const engagementMonitorRef = useRef<EngagementMonitor | null>(null);
  const previousActiveRef = useRef(true);

  useEffect(() => {
    engagementMonitorRef.current = new EngagementMonitor(config);

    const handleUpdate = (active: boolean, newMetrics: EngagementMetrics) => {
      setIsActive(active);
      setMetrics(newMetrics);

      // Call onActiveChange only when the state actually changes
      if (active !== previousActiveRef.current) {
        previousActiveRef.current = active;
        onActiveChange?.(active);
      }

      onMetricsUpdate?.(newMetrics);
    };

    engagementMonitorRef.current.addListener(handleUpdate);

    return () => {
      engagementMonitorRef.current?.destroy();
    };
  }, [config.contentType, config.idleThreshold]);

  const getMetrics = useCallback((): EngagementMetrics => {
    return engagementMonitorRef.current?.getMetrics() || metrics;
  }, [metrics]);

  const getIdleTime = useCallback((): number => {
    return engagementMonitorRef.current?.getIdleTime() || 0;
  }, []);

  const pause = useCallback(() => {
    engagementMonitorRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    engagementMonitorRef.current?.resume();
  }, []);

  const reset = useCallback(() => {
    engagementMonitorRef.current?.reset();
  }, []);

  return {
    isActive,
    metrics,
    activeTime: metrics.activeTime,
    totalTime: metrics.totalTime,
    idleTime: metrics.idleTime,
    engagementScore: metrics.engagementScore,
    getMetrics,
    getIdleTime,
    pause,
    resume,
    reset
  };
}