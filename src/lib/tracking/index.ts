// Services
export {
  ActivityTracker,
  getActivityTracker,
  type ActivityEvent,
  type ActivityState,
  type ActivityListener
} from './services/ActivityTracker';

export {
  EngagementMonitor,
  type EngagementMetrics,
  type EngagementConfig,
  type EngagementListener
} from './services/EngagementMonitor';

export {
  SessionTracker,
  getSessionTracker,
  type SessionData,
  type NavigationEntry,
  type ContentInteraction,
  type DeviceInfo
} from './services/SessionTracker';

// Hooks
export {
  useTimeTracking,
  useEngagement,
  useActivityTracking,
  useSessionTracking,
  type TimeTrackingOptions,
  type TimeTrackingMetrics,
  type UseEngagementOptions,
  type UseActivityTrackingOptions,
  type UseSessionTrackingOptions
} from './hooks';

// Components
export {
  TrackingProvider,
  useTracking,
  InteractionLogger,
  TrackedContent,
  QuestionTracker,
  FlashcardTracker,
  type TrackingProviderProps,
  type InteractionLoggerProps,
  type TrackedContentProps,
  type QuestionTrackerProps,
  type QuestionMetrics,
  type FlashcardTrackerProps,
  type FlashcardMetrics,
  type CardMetrics
} from './components';