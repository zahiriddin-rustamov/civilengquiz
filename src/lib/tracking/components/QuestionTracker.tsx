'use client';

import React, { ReactElement, cloneElement, useRef, useEffect, useCallback } from 'react';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { useTracking } from './TrackingProvider';

export interface QuestionMetrics {
  questionId: string;
  questionType: string;
  startTime: number;
  endTime?: number;
  totalTime: number;
  activeTime: number;
  firstInteractionTime?: number;
  timeToFirstInteraction?: number;
  answerChanges: Array<{
    timestamp: number;
    from: any;
    to: any;
    timeElapsed: number;
  }>;
  answerChangeCount: number;
  finalAnswer: any;
  isCorrect?: boolean;
  score?: number;
  engagementScore: number;
  idlePeriods: Array<{ start: number; end: number; duration: number }>;
  mouseMovements: number;
  submitted: boolean;
  skipped: boolean;
}

export interface QuestionTrackerProps {
  children: ReactElement;
  questionId: string;
  questionType: string;
  questionText?: string;
  difficulty?: string;
  metadata?: any;
  onQuestionComplete?: (metrics: QuestionMetrics) => void;
}

export function QuestionTracker({
  children,
  questionId,
  questionType,
  questionText,
  difficulty,
  metadata = {},
  onQuestionComplete
}: QuestionTrackerProps) {
  const { trackInteraction, trackEvent } = useTracking();
  const metricsRef = useRef<QuestionMetrics>({
    questionId,
    questionType,
    startTime: Date.now(),
    totalTime: 0,
    activeTime: 0,
    answerChanges: [],
    answerChangeCount: 0,
    finalAnswer: null,
    engagementScore: 100,
    idlePeriods: [],
    mouseMovements: 0,
    submitted: false,
    skipped: false
  });

  const previousAnswerRef = useRef<any>(null);
  const mouseMovementCountRef = useRef(0);

  const timeTracking = useTimeTracking({
    contentType: 'question',
    autoStart: true,
    onUpdate: (metrics) => {
      metricsRef.current.totalTime = metrics.totalTime;
      metricsRef.current.activeTime = metrics.activeTime;
      metricsRef.current.engagementScore = metrics.engagementScore;
      metricsRef.current.idlePeriods = metrics.idlePeriods;
    }
  });

  useEffect(() => {
    // Track question view
    trackInteraction('question', questionId, 'view_start', {
      questionType,
      questionText,
      difficulty,
      ...metadata
    });

    // Track mouse movements
    const handleMouseMove = () => {
      mouseMovementCountRef.current++;
      metricsRef.current.mouseMovements = mouseMovementCountRef.current;
    };

    // Throttle mouse movement tracking
    let mouseMoveTimer: NodeJS.Timeout;
    const throttledMouseMove = () => {
      clearTimeout(mouseMoveTimer);
      mouseMoveTimer = setTimeout(handleMouseMove, 100);
    };

    document.addEventListener('mousemove', throttledMouseMove);

    return () => {
      document.removeEventListener('mousemove', throttledMouseMove);
      clearTimeout(mouseMoveTimer);

      // Track question end
      const endMetrics = {
        ...metricsRef.current,
        endTime: Date.now()
      };

      trackInteraction('question', questionId, 'view_end', endMetrics);

      if (onQuestionComplete && !metricsRef.current.submitted) {
        onQuestionComplete(endMetrics);
      }
    };
  }, [questionId, questionType, questionText, difficulty, metadata]);

  const handleAnswerChange = useCallback((newAnswer: any) => {
    const now = Date.now();

    // Track first interaction
    if (!metricsRef.current.firstInteractionTime) {
      metricsRef.current.firstInteractionTime = now;
      metricsRef.current.timeToFirstInteraction = (now - metricsRef.current.startTime) / 1000;

      trackInteraction('question', questionId, 'first_interaction', {
        timeToFirstInteraction: metricsRef.current.timeToFirstInteraction,
        ...metadata
      });
    }

    // Track answer change
    if (previousAnswerRef.current !== null && previousAnswerRef.current !== newAnswer) {
      const change = {
        timestamp: now,
        from: previousAnswerRef.current,
        to: newAnswer,
        timeElapsed: (now - metricsRef.current.startTime) / 1000
      };

      metricsRef.current.answerChanges.push(change);
      metricsRef.current.answerChangeCount++;

      trackInteraction('question', questionId, 'answer_change', {
        changeCount: metricsRef.current.answerChangeCount,
        from: change.from,
        to: change.to,
        timeElapsed: change.timeElapsed,
        ...metadata
      });
    }

    previousAnswerRef.current = newAnswer;
    metricsRef.current.finalAnswer = newAnswer;
  }, [questionId, metadata, trackInteraction]);

  const handleSubmit = useCallback((answer: any, isCorrect?: boolean, score?: number) => {
    const now = Date.now();
    const finalMetrics = timeTracking.getMetrics();

    metricsRef.current = {
      ...metricsRef.current,
      endTime: now,
      totalTime: finalMetrics.totalTime,
      activeTime: finalMetrics.activeTime,
      engagementScore: finalMetrics.engagementScore,
      idlePeriods: finalMetrics.idlePeriods,
      finalAnswer: answer,
      isCorrect,
      score,
      submitted: true
    };

    trackInteraction('question', questionId, 'submit', {
      ...metricsRef.current,
      ...metadata
    });

    if (onQuestionComplete) {
      onQuestionComplete(metricsRef.current);
    }
  }, [questionId, metadata, timeTracking, trackInteraction, onQuestionComplete]);

  const handleSkip = useCallback(() => {
    const now = Date.now();
    const finalMetrics = timeTracking.getMetrics();

    metricsRef.current = {
      ...metricsRef.current,
      endTime: now,
      totalTime: finalMetrics.totalTime,
      activeTime: finalMetrics.activeTime,
      engagementScore: finalMetrics.engagementScore,
      idlePeriods: finalMetrics.idlePeriods,
      skipped: true
    };

    trackInteraction('question', questionId, 'skip', {
      ...metricsRef.current,
      ...metadata
    });

    if (onQuestionComplete) {
      onQuestionComplete(metricsRef.current);
    }
  }, [questionId, metadata, timeTracking, trackInteraction, onQuestionComplete]);

  // Clone the child element and inject tracking props
  const enhancedChild = cloneElement(children, {
    onAnswerChange: (answer: any) => {
      handleAnswerChange(answer);
      // Call original handler if exists
      if (children.props.onAnswerChange) {
        children.props.onAnswerChange(answer);
      }
    },
    onSubmit: (answer: any, isCorrect?: boolean, score?: number) => {
      handleSubmit(answer, isCorrect, score);
      // Call original handler if exists
      if (children.props.onSubmit) {
        children.props.onSubmit(answer, isCorrect, score);
      }
    },
    onSkip: () => {
      handleSkip();
      // Call original handler if exists
      if (children.props.onSkip) {
        children.props.onSkip();
      }
    },
    'data-question-id': questionId,
    'data-question-type': questionType
  });

  return enhancedChild;
}