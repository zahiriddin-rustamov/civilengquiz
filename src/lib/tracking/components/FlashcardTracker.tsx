'use client';

import React, { ReactElement, cloneElement, useRef, useEffect, useCallback } from 'react';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useTracking } from './TrackingProvider';

export interface FlashcardMetrics {
  flashcardId: string;
  sessionStartTime: number;
  sessionEndTime?: number;
  totalTime: number;
  activeTime: number;
  cards: Array<{
    cardId: string;
    viewCount: number;
    flips: Array<{
      timestamp: number;
      toSide: 'front' | 'back';
      timeOnPreviousSide: number;
    }>;
    timeOnFront: number;
    timeOnBack: number;
    totalTime: number;
    confidence?: number;
    marked?: boolean;
  }>;
  totalFlips: number;
  averageTimePerCard: number;
  cardsViewed: number;
  cardsCompleted: number;
  sessionPattern: 'linear' | 'review' | 'mixed';
  engagementScore: number;
  idlePeriods: Array<{ start: number; end: number; duration: number }>;
}

export interface CardMetrics {
  cardId: string;
  viewCount: number;
  currentSide: 'front' | 'back';
  lastFlipTime: number;
  timeOnFront: number;
  timeOnBack: number;
  flips: Array<{
    timestamp: number;
    toSide: 'front' | 'back';
    timeOnPreviousSide: number;
  }>;
}

export interface FlashcardTrackerProps {
  children: ReactElement;
  flashcardId: string;
  totalCards?: number;
  metadata?: any;
  onSessionComplete?: (metrics: FlashcardMetrics) => void;
}

export function FlashcardTracker({
  children,
  flashcardId,
  totalCards,
  metadata = {},
  onSessionComplete
}: FlashcardTrackerProps) {
  const { trackInteraction, trackEvent } = useTracking();
  const sessionStartRef = useRef<number>(Date.now());
  const currentCardRef = useRef<CardMetrics | null>(null);
  const cardsMapRef = useRef<Map<string, CardMetrics>>(new Map());
  const sessionMetricsRef = useRef<FlashcardMetrics>({
    flashcardId,
    sessionStartTime: Date.now(),
    totalTime: 0,
    activeTime: 0,
    cards: [],
    totalFlips: 0,
    averageTimePerCard: 0,
    cardsViewed: 0,
    cardsCompleted: 0,
    sessionPattern: 'linear',
    engagementScore: 100,
    idlePeriods: []
  });

  const timeTracking = useTimeTracking({
    contentType: 'flashcard',
    autoStart: true,
    onUpdate: (metrics) => {
      sessionMetricsRef.current.totalTime = metrics.totalTime;
      sessionMetricsRef.current.activeTime = metrics.activeTime;
      sessionMetricsRef.current.engagementScore = metrics.engagementScore;
      sessionMetricsRef.current.idlePeriods = metrics.idlePeriods;
    }
  });

  useEffect(() => {
    // Track session start
    trackInteraction('flashcard', flashcardId, 'session_start', {
      totalCards,
      ...metadata
    });

    return () => {
      // Track session end
      const finalMetrics = prepareFinalMetrics();
      trackInteraction('flashcard', flashcardId, 'session_end', finalMetrics);

      if (onSessionComplete) {
        onSessionComplete(finalMetrics);
      }
    };
  }, [flashcardId, totalCards, metadata]);

  const prepareFinalMetrics = (): FlashcardMetrics => {
    const now = Date.now();
    const cards = Array.from(cardsMapRef.current.values());

    // Calculate session pattern
    const sessionPattern = detectSessionPattern(cards);

    // Calculate averages
    const averageTimePerCard = cards.length > 0
      ? cards.reduce((sum, card) => sum + (card.timeOnFront + card.timeOnBack), 0) / cards.length
      : 0;

    return {
      ...sessionMetricsRef.current,
      sessionEndTime: now,
      cards: cards.map(card => ({
        cardId: card.cardId,
        viewCount: card.viewCount,
        flips: card.flips,
        timeOnFront: card.timeOnFront,
        timeOnBack: card.timeOnBack,
        totalTime: card.timeOnFront + card.timeOnBack,
        confidence: undefined, // Set by confidence rating
        marked: undefined // Set by marking
      })),
      cardsViewed: cards.length,
      averageTimePerCard: averageTimePerCard / 1000, // Convert to seconds
      sessionPattern
    };
  };

  const detectSessionPattern = (cards: CardMetrics[]): 'linear' | 'review' | 'mixed' => {
    if (cards.length === 0) return 'linear';

    const reviewCards = cards.filter(c => c.viewCount > 1);
    const reviewRatio = reviewCards.length / cards.length;

    if (reviewRatio > 0.5) return 'review';
    if (reviewRatio > 0.2) return 'mixed';
    return 'linear';
  };

  const handleCardView = useCallback((cardId: string, cardIndex?: number) => {
    const now = Date.now();

    // Update previous card's time if exists
    if (currentCardRef.current) {
      const timeSinceLastFlip = now - currentCardRef.current.lastFlipTime;
      if (currentCardRef.current.currentSide === 'front') {
        currentCardRef.current.timeOnFront += timeSinceLastFlip;
      } else {
        currentCardRef.current.timeOnBack += timeSinceLastFlip;
      }
    }

    // Get or create card metrics
    let cardMetrics = cardsMapRef.current.get(cardId);
    if (!cardMetrics) {
      cardMetrics = {
        cardId,
        viewCount: 0,
        currentSide: 'front',
        lastFlipTime: now,
        timeOnFront: 0,
        timeOnBack: 0,
        flips: []
      };
      cardsMapRef.current.set(cardId, cardMetrics);
    }

    cardMetrics.viewCount++;
    cardMetrics.lastFlipTime = now;
    cardMetrics.currentSide = 'front'; // Reset to front on new view
    currentCardRef.current = cardMetrics;

    sessionMetricsRef.current.cardsViewed = cardsMapRef.current.size;

    trackInteraction('flashcard', flashcardId, 'card_view', {
      cardId,
      cardIndex,
      viewCount: cardMetrics.viewCount,
      timestamp: now,
      ...metadata
    });
  }, [flashcardId, metadata, trackInteraction]);

  const handleCardFlip = useCallback((cardId: string, toSide: 'front' | 'back') => {
    const now = Date.now();
    const cardMetrics = cardsMapRef.current.get(cardId);

    if (!cardMetrics) return;

    const timeSinceLastFlip = now - cardMetrics.lastFlipTime;

    // Update time on previous side
    if (cardMetrics.currentSide === 'front') {
      cardMetrics.timeOnFront += timeSinceLastFlip;
    } else {
      cardMetrics.timeOnBack += timeSinceLastFlip;
    }

    // Record flip
    cardMetrics.flips.push({
      timestamp: now,
      toSide,
      timeOnPreviousSide: timeSinceLastFlip / 1000
    });

    cardMetrics.currentSide = toSide;
    cardMetrics.lastFlipTime = now;

    sessionMetricsRef.current.totalFlips++;

    trackInteraction('flashcard', flashcardId, 'card_flip', {
      cardId,
      toSide,
      timeOnPreviousSide: timeSinceLastFlip / 1000,
      flipCount: cardMetrics.flips.length,
      ...metadata
    });
  }, [flashcardId, metadata, trackInteraction]);

  const handleConfidenceRating = useCallback((cardId: string, confidence: number) => {
    const cardMetrics = cardsMapRef.current.get(cardId);
    if (!cardMetrics) return;

    trackInteraction('flashcard', flashcardId, 'confidence_rating', {
      cardId,
      confidence,
      timeSpentTotal: (cardMetrics.timeOnFront + cardMetrics.timeOnBack) / 1000,
      ...metadata
    });
  }, [flashcardId, metadata, trackInteraction]);

  const handleCardMark = useCallback((cardId: string, marked: boolean) => {
    trackInteraction('flashcard', flashcardId, 'card_mark', {
      cardId,
      marked,
      ...metadata
    });
  }, [flashcardId, metadata, trackInteraction]);

  const handleSessionComplete = useCallback(() => {
    sessionMetricsRef.current.cardsCompleted = cardsMapRef.current.size;
    const finalMetrics = prepareFinalMetrics();

    trackInteraction('flashcard', flashcardId, 'session_complete', finalMetrics);

    if (onSessionComplete) {
      onSessionComplete(finalMetrics);
    }
  }, [flashcardId, trackInteraction, onSessionComplete]);

  // Clone the child element and inject tracking props
  const enhancedChild = cloneElement(children, {
    onCardView: (cardId: string, cardIndex?: number) => {
      handleCardView(cardId, cardIndex);
      if (children.props.onCardView) {
        children.props.onCardView(cardId, cardIndex);
      }
    },
    onCardFlip: (cardId: string, toSide: 'front' | 'back') => {
      handleCardFlip(cardId, toSide);
      if (children.props.onCardFlip) {
        children.props.onCardFlip(cardId, toSide);
      }
    },
    onConfidenceRating: (cardId: string, confidence: number) => {
      handleConfidenceRating(cardId, confidence);
      if (children.props.onConfidenceRating) {
        children.props.onConfidenceRating(cardId, confidence);
      }
    },
    onCardMark: (cardId: string, marked: boolean) => {
      handleCardMark(cardId, marked);
      if (children.props.onCardMark) {
        children.props.onCardMark(cardId, marked);
      }
    },
    onSessionComplete: () => {
      handleSessionComplete();
      if (children.props.onSessionComplete) {
        children.props.onSessionComplete();
      }
    },
    'data-flashcard-id': flashcardId
  });

  return enhancedChild;
}