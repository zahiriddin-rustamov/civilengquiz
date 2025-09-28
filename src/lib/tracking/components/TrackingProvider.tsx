'use client';

import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { SessionTracker } from '../services/SessionTracker';
import { ActivityTracker } from '../services/ActivityTracker';
import { useSession } from 'next-auth/react';

interface TrackingContextValue {
  sessionTracker: SessionTracker;
  activityTracker: ActivityTracker;
  trackEvent: (eventType: string, eventData: any) => void;
  trackInteraction: (
    contentType: 'question' | 'flashcard' | 'media' | 'reading',
    contentId: string,
    action: string,
    metadata?: any
  ) => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export interface TrackingProviderProps {
  children: ReactNode;
  enableTracking?: boolean;
  syncInterval?: number;
}

export function TrackingProvider({
  children,
  enableTracking = true,
  syncInterval = 30000
}: TrackingProviderProps) {
  const { data: session } = useSession();
  const sessionTrackerRef = useRef<SessionTracker | null>(null);
  const activityTrackerRef = useRef<ActivityTracker | null>(null);
  const batchedEventsRef = useRef<any[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enableTracking) return;

    // Initialize trackers
    sessionTrackerRef.current = SessionTracker.getInstance();
    activityTrackerRef.current = ActivityTracker.getInstance();

    // Set user ID if available
    if (session?.user && (session.user as any).id) {
      sessionTrackerRef.current.setUserId((session.user as any).id);
    }

    // Cleanup on unmount
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        // Send any remaining batched events
        sendBatchedEvents();
      }
    };
  }, [enableTracking, session]);

  const sendBatchedEvents = async () => {
    if (batchedEventsRef.current.length === 0) return;

    const events = [...batchedEventsRef.current];
    batchedEventsRef.current = [];

    try {
      const response = await fetch('/api/tracking/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send tracking events:', response.status, error);
        // Re-add events to batch for retry
        batchedEventsRef.current = [...events, ...batchedEventsRef.current];
      } else {
        const result = await response.json();
        console.log('Successfully sent tracking events:', result);
      }
    } catch (error) {
      console.error('Failed to send batched tracking events:', error);
      // Re-add events to batch for retry
      batchedEventsRef.current = [...events, ...batchedEventsRef.current];
    }
  };

  const trackEvent = (eventType: string, eventData: any) => {
    if (!enableTracking || !sessionTrackerRef.current) return;

    const sessionData = sessionTrackerRef.current.getSessionData();
    const event = {
      timestamp: Date.now(),
      sessionId: sessionData?.sessionId || 'unknown',
      userId: (session?.user as any)?.id || null,
      eventType,
      eventData
    };

    batchedEventsRef.current.push(event);
    console.log('Tracked event:', eventType, event);

    // Reset batch timer
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }

    // Send batch after 5 seconds or when reaching 20 events
    if (batchedEventsRef.current.length >= 20) {
      sendBatchedEvents();
    } else {
      batchTimerRef.current = setTimeout(() => sendBatchedEvents(), 5000);
    }
  };

  const trackInteraction = (
    contentType: 'question' | 'flashcard' | 'media' | 'reading',
    contentId: string,
    action: string,
    metadata?: any
  ) => {
    if (!enableTracking) return;

    sessionTrackerRef.current?.trackContentInteraction(
      contentType,
      contentId,
      action,
      metadata
    );

    trackEvent('content_interaction', {
      contentType,
      contentId,
      action,
      metadata
    });
  };

  const value: TrackingContextValue = {
    sessionTracker: sessionTrackerRef.current!,
    activityTracker: activityTrackerRef.current!,
    trackEvent,
    trackInteraction
  };

  if (!enableTracking) {
    return <>{children}</>;
  }

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    // Return a no-op implementation if tracking is not enabled
    return {
      sessionTracker: null,
      activityTracker: null,
      trackEvent: () => {},
      trackInteraction: () => {}
    };
  }
  return context;
}