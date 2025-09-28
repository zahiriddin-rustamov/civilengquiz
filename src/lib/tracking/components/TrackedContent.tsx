'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useTracking } from './TrackingProvider';
import { InteractionLogger } from './InteractionLogger';

export interface TrackedContentProps {
  children: ReactNode;
  contentType: 'question' | 'flashcard' | 'media' | 'reading';
  contentId: string;
  contentTitle?: string;
  metadata?: any;
  trackTime?: boolean;
  trackInteractions?: boolean;
  onComplete?: (metrics: any) => void;
  className?: string;
}

export function TrackedContent({
  children,
  contentType,
  contentId,
  contentTitle,
  metadata = {},
  trackTime = true,
  trackInteractions = true,
  onComplete,
  className
}: TrackedContentProps) {
  const { trackInteraction } = useTracking();
  const startTimeRef = useRef<number>(Date.now());
  const hasTrackedStartRef = useRef(false);

  const timeTracking = useTimeTracking({
    contentType,
    autoStart: trackTime,
    onUpdate: (metrics) => {
      // Send periodic updates
      if (metrics.totalTime > 0 && metrics.totalTime % 10 === 0) {
        trackInteraction(contentType, contentId, 'progress_update', {
          ...metadata,
          totalTime: metrics.totalTime,
          activeTime: metrics.activeTime,
          engagementScore: metrics.engagementScore
        });
      }
    }
  });

  useEffect(() => {
    // Track content view start
    if (!hasTrackedStartRef.current) {
      hasTrackedStartRef.current = true;
      trackInteraction(contentType, contentId, 'view_start', {
        ...metadata,
        title: contentTitle,
        timestamp: startTimeRef.current
      });
    }

    // Track content view end on unmount
    return () => {
      const endTime = Date.now();
      const duration = (endTime - startTimeRef.current) / 1000;

      const finalMetrics = trackTime ? timeTracking.getMetrics() : null;

      const completeData = {
        ...metadata,
        title: contentTitle,
        duration,
        activeTime: finalMetrics?.activeTime || 0,
        totalTime: finalMetrics?.totalTime || 0,
        engagementScore: finalMetrics?.engagementScore || 0,
        idlePeriods: finalMetrics?.idlePeriods || [],
        timestamp: endTime
      };

      trackInteraction(contentType, contentId, 'view_end', completeData);

      if (onComplete) {
        onComplete(completeData);
      }
    };
  }, [contentType, contentId, contentTitle, metadata]);

  const content = (
    <div className={className} data-tracked-content={contentId}>
      {children}
    </div>
  );

  if (trackInteractions) {
    return (
      <InteractionLogger
        contentType={contentType}
        contentId={contentId}
        trackClicks={true}
        trackScroll={contentType === 'reading'}
        metadata={metadata}
      >
        {content}
      </InteractionLogger>
    );
  }

  return content;
}