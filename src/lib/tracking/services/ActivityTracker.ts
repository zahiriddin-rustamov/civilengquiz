'use client';

export interface ActivityEvent {
  type: 'click' | 'mousemove' | 'scroll' | 'keypress' | 'focus' | 'blur' | 'visibility';
  timestamp: number;
  metadata?: any;
}

export interface ActivityState {
  isActive: boolean;
  lastActivityTime: number;
  idleTime: number;
  isVisible: boolean;
}

export type ActivityListener = (state: ActivityState) => void;

export class ActivityTracker {
  private static instance: ActivityTracker | null = null;
  private listeners: Set<ActivityListener> = new Set();
  private events: ActivityEvent[] = [];
  private lastActivityTime: number = Date.now();
  private isActive: boolean = true;
  private isVisible: boolean = true;
  private checkInterval: NodeJS.Timeout | null = null;
  private idleThreshold: number = 30000; // 30 seconds default
  private maxEventsStored: number = 100;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  private initialize() {
    // Activity event listeners
    document.addEventListener('click', this.handleActivity);
    document.addEventListener('mousemove', this.throttledMouseMove);
    document.addEventListener('scroll', this.throttledScroll);
    document.addEventListener('keypress', this.handleActivity);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Start idle check interval
    this.checkInterval = setInterval(() => this.checkIdleState(), 1000);
  }

  private handleActivity = (event: Event) => {
    this.lastActivityTime = Date.now();
    this.recordEvent({
      type: event.type as any,
      timestamp: this.lastActivityTime,
    });

    if (!this.isActive) {
      this.isActive = true;
      this.notifyListeners();
    }
  };

  private throttledMouseMove = (() => {
    let lastCall = 0;
    return (event: Event) => {
      const now = Date.now();
      if (now - lastCall > 1000) { // Throttle to once per second
        lastCall = now;
        this.handleActivity(event);
      }
    };
  })();

  private throttledScroll = (() => {
    let lastCall = 0;
    return (event: Event) => {
      const now = Date.now();
      if (now - lastCall > 500) { // Throttle to twice per second
        lastCall = now;
        this.handleActivity(event);
      }
    };
  })();

  private handleFocus = () => {
    this.recordEvent({
      type: 'focus',
      timestamp: Date.now(),
    });
    this.handleActivity(new Event('focus'));
  };

  private handleBlur = () => {
    this.recordEvent({
      type: 'blur',
      timestamp: Date.now(),
    });
  };

  private handleVisibilityChange = () => {
    this.isVisible = !document.hidden;
    this.recordEvent({
      type: 'visibility',
      timestamp: Date.now(),
      metadata: { visible: this.isVisible }
    });

    if (!this.isVisible && this.isActive) {
      this.isActive = false;
      this.notifyListeners();
    } else if (this.isVisible && !this.isActive) {
      // Check if user is actually active when tab becomes visible
      this.checkIdleState();
    }
  };

  private checkIdleState() {
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;

    const wasActive = this.isActive;
    this.isActive = this.isVisible && idleTime < this.idleThreshold;

    if (wasActive !== this.isActive) {
      this.notifyListeners();
    }
  }

  private recordEvent(event: ActivityEvent) {
    this.events.push(event);

    // Keep only the most recent events
    if (this.events.length > this.maxEventsStored) {
      this.events = this.events.slice(-this.maxEventsStored);
    }
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  // Public methods
  getState(): ActivityState {
    const now = Date.now();
    return {
      isActive: this.isActive,
      lastActivityTime: this.lastActivityTime,
      idleTime: now - this.lastActivityTime,
      isVisible: this.isVisible
    };
  }

  getEvents(): ActivityEvent[] {
    return [...this.events];
  }

  getRecentEvents(count: number = 10): ActivityEvent[] {
    return this.events.slice(-count);
  }

  setIdleThreshold(milliseconds: number) {
    this.idleThreshold = milliseconds;
    this.checkIdleState();
  }

  addListener(listener: ActivityListener) {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getState());
  }

  removeListener(listener: ActivityListener) {
    this.listeners.delete(listener);
  }

  reset() {
    this.lastActivityTime = Date.now();
    this.isActive = true;
    this.events = [];
    this.notifyListeners();
  }

  destroy() {
    if (typeof window !== 'undefined') {
      document.removeEventListener('click', this.handleActivity);
      document.removeEventListener('mousemove', this.throttledMouseMove);
      document.removeEventListener('scroll', this.throttledScroll);
      document.removeEventListener('keypress', this.handleActivity);
      window.removeEventListener('focus', this.handleFocus);
      window.removeEventListener('blur', this.handleBlur);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);

      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
    }

    this.listeners.clear();
    ActivityTracker.instance = null;
  }
}

// Export singleton getter for convenience
export const getActivityTracker = () => ActivityTracker.getInstance();