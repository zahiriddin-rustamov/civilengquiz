'use client';

import React, { ReactElement, cloneElement, useRef, useEffect } from 'react';
import { useTracking } from './TrackingProvider';

export interface InteractionLoggerProps {
  children: ReactElement;
  contentType?: 'question' | 'flashcard' | 'media' | 'reading';
  contentId?: string;
  trackClicks?: boolean;
  trackHover?: boolean;
  trackFocus?: boolean;
  trackScroll?: boolean;
  metadata?: any;
  debounceMs?: number;
}

export function InteractionLogger({
  children,
  contentType,
  contentId,
  trackClicks = true,
  trackHover = false,
  trackFocus = false,
  trackScroll = false,
  metadata = {},
  debounceMs = 500
}: InteractionLoggerProps) {
  const { trackEvent, trackInteraction } = useTracking();
  const elementRef = useRef<HTMLElement | null>(null);
  const hoverStartRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handlers: Array<[string, EventListener]> = [];

    if (trackClicks) {
      const handleClick = (e: Event) => {
        const target = e.target as HTMLElement;
        const clickData = {
          contentType,
          contentId,
          elementTag: target.tagName,
          elementClass: target.className,
          elementId: target.id,
          timestamp: Date.now(),
          ...metadata
        };

        if (contentType && contentId) {
          trackInteraction(contentType, contentId, 'click', clickData);
        } else {
          trackEvent('element_click', clickData);
        }
      };
      element.addEventListener('click', handleClick);
      handlers.push(['click', handleClick]);
    }

    if (trackHover) {
      const handleMouseEnter = () => {
        hoverStartRef.current = Date.now();
        if (contentType && contentId) {
          trackInteraction(contentType, contentId, 'hover_start', metadata);
        }
      };

      const handleMouseLeave = () => {
        if (hoverStartRef.current) {
          const hoverDuration = Date.now() - hoverStartRef.current;
          const hoverData = {
            duration: hoverDuration,
            ...metadata
          };

          if (contentType && contentId) {
            trackInteraction(contentType, contentId, 'hover_end', hoverData);
          } else {
            trackEvent('element_hover', hoverData);
          }
          hoverStartRef.current = null;
        }
      };

      element.addEventListener('mouseenter', handleMouseEnter);
      element.addEventListener('mouseleave', handleMouseLeave);
      handlers.push(['mouseenter', handleMouseEnter]);
      handlers.push(['mouseleave', handleMouseLeave]);
    }

    if (trackFocus) {
      const handleFocus = () => {
        if (contentType && contentId) {
          trackInteraction(contentType, contentId, 'focus', metadata);
        } else {
          trackEvent('element_focus', { ...metadata, timestamp: Date.now() });
        }
      };

      const handleBlur = () => {
        if (contentType && contentId) {
          trackInteraction(contentType, contentId, 'blur', metadata);
        } else {
          trackEvent('element_blur', { ...metadata, timestamp: Date.now() });
        }
      };

      element.addEventListener('focus', handleFocus);
      element.addEventListener('blur', handleBlur);
      handlers.push(['focus', handleFocus]);
      handlers.push(['blur', handleBlur]);
    }

    if (trackScroll) {
      const handleScroll = () => {
        const now = Date.now();

        // Clear existing debounce timer
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }

        // Set new debounce timer
        scrollDebounceRef.current = setTimeout(() => {
          const scrollData = {
            scrollTop: element.scrollTop,
            scrollLeft: element.scrollLeft,
            scrollHeight: element.scrollHeight,
            scrollWidth: element.scrollWidth,
            clientHeight: element.clientHeight,
            clientWidth: element.clientWidth,
            scrollPercentageY: (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100,
            scrollPercentageX: (element.scrollLeft / (element.scrollWidth - element.clientWidth)) * 100,
            ...metadata
          };

          if (contentType && contentId) {
            trackInteraction(contentType, contentId, 'scroll', scrollData);
          } else {
            trackEvent('element_scroll', scrollData);
          }

          lastScrollTimeRef.current = now;
        }, debounceMs);
      };

      element.addEventListener('scroll', handleScroll);
      handlers.push(['scroll', handleScroll]);
    }

    // Cleanup
    return () => {
      handlers.forEach(([event, handler]) => {
        element.removeEventListener(event, handler);
      });

      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [
    trackClicks,
    trackHover,
    trackFocus,
    trackScroll,
    contentType,
    contentId,
    metadata,
    debounceMs,
    trackEvent,
    trackInteraction
  ]);

  // Clone the child element and add ref
  return cloneElement(children, {
    ref: (node: HTMLElement) => {
      elementRef.current = node;

      // Preserve existing ref if any
      const { ref } = children as any;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }
  });
}