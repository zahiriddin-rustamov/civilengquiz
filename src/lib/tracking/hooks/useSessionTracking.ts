'use client';

import { useEffect, useCallback, useRef } from 'react';
import { SessionTracker, SessionData, ContentInteraction } from '../services/SessionTracker';
import { useSession } from 'next-auth/react';

export interface UseSessionTrackingOptions {
  trackNavigation?: boolean;
  autoSetUserId?: boolean;
}

export function useSessionTracking(options: UseSessionTrackingOptions = {}) {
  const { trackNavigation: shouldTrackNavigation = true, autoSetUserId = true } = options;
  const { data: session } = useSession();
  const sessionTrackerRef = useRef<SessionTracker | null>(null);

  useEffect(() => {
    sessionTrackerRef.current = SessionTracker.getInstance();

    // Auto-set user ID if available
    if (autoSetUserId && session?.user && (session.user as any).id) {
      sessionTrackerRef.current.setUserId((session.user as any).id);
    }

    // Track navigation if enabled
    if (shouldTrackNavigation && typeof window !== 'undefined') {
      sessionTrackerRef.current.trackNavigation();

      // Track route changes (for Next.js apps)
      const handleRouteChange = () => {
        sessionTrackerRef.current?.trackNavigation();
      };

      // Listen to popstate for browser back/forward
      window.addEventListener('popstate', handleRouteChange);

      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [session, autoSetUserId, shouldTrackNavigation]);

  const trackNavigation = useCallback((
    url?: string,
    pageTitle?: string,
    contentType?: string,
    contentId?: string
  ) => {
    sessionTrackerRef.current?.trackNavigation(url, pageTitle, contentType, contentId);
  }, []);

  const trackContentInteraction = useCallback((
    contentType: 'question' | 'flashcard' | 'media' | 'reading',
    contentId: string,
    action: string,
    metadata?: any,
    duration?: number,
    activeTime?: number
  ) => {
    sessionTrackerRef.current?.trackContentInteraction(
      contentType,
      contentId,
      action,
      metadata,
      duration,
      activeTime
    );
  }, []);

  const getSessionData = useCallback((): SessionData | null => {
    return sessionTrackerRef.current?.getSessionData() || null;
  }, []);

  const getSessionDuration = useCallback((): number => {
    return sessionTrackerRef.current?.getSessionDuration() || 0;
  }, []);

  const getActiveDuration = useCallback((): number => {
    return sessionTrackerRef.current?.getActiveDuration() || 0;
  }, []);

  const getNavigationPath = useCallback(() => {
    return sessionTrackerRef.current?.getNavigationPath() || [];
  }, []);

  const getContentInteractions = useCallback((): ContentInteraction[] => {
    return sessionTrackerRef.current?.getContentInteractions() || [];
  }, []);

  const setUserId = useCallback((userId: string) => {
    sessionTrackerRef.current?.setUserId(userId);
  }, []);

  const reset = useCallback(() => {
    sessionTrackerRef.current?.reset();
  }, []);

  return {
    trackNavigation,
    trackContentInteraction,
    getSessionData,
    getSessionDuration,
    getActiveDuration,
    getNavigationPath,
    getContentInteractions,
    setUserId,
    reset
  };
}