'use client';

import { EngagementMonitor, EngagementMetrics } from './EngagementMonitor';

export interface SessionData {
  sessionId: string;
  userId: string | null;
  startTime: number;
  endTime?: number;
  duration: number;
  activeDuration: number;
  navigationPath: NavigationEntry[];
  contentInteractions: ContentInteraction[];
  engagementMetrics: EngagementMetrics;
  deviceInfo: DeviceInfo;
}

export interface NavigationEntry {
  timestamp: number;
  url: string;
  pageTitle?: string;
  contentType?: string;
  contentId?: string;
}

export interface ContentInteraction {
  timestamp: number;
  contentType: 'question' | 'flashcard' | 'media' | 'reading';
  contentId: string;
  action: string;
  metadata?: any;
  duration?: number;
  activeTime?: number;
}

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  viewport: string;
  platform: string;
  language: string;
  timezone: string;
}

export class SessionTracker {
  private static instance: SessionTracker | null = null;
  private sessionId: string;
  private userId: string | null = null;
  private startTime: number;
  private navigationPath: NavigationEntry[] = [];
  private contentInteractions: ContentInteraction[] = [];
  private engagementMonitor: EngagementMonitor;
  private syncInterval: NodeJS.Timeout | null = null;
  private deviceInfo: DeviceInfo;
  private lastSyncTime: number = 0;
  private unsyncedData: boolean = false;

  private static readonly STORAGE_KEY = 'civileng_session_data';
  private static readonly SYNC_INTERVAL = 30000; // Sync every 30 seconds
  private static readonly MAX_ENTRIES = 500; // Maximum entries to keep in memory

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.engagementMonitor = new EngagementMonitor({ contentType: 'general' });
    this.deviceInfo = this.collectDeviceInfo();

    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  static getInstance(): SessionTracker {
    if (!SessionTracker.instance) {
      SessionTracker.instance = new SessionTracker();
    }
    return SessionTracker.instance;
  }

  private initialize() {
    // Load any persisted session data
    this.loadPersistedData();

    // Track page navigation
    this.trackNavigation();

    // Set up periodic sync
    this.syncInterval = setInterval(() => this.syncToBackend(), SessionTracker.SYNC_INTERVAL);

    // Handle page unload
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    window.addEventListener('pagehide', this.handlePageHide);

    // Handle visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private collectDeviceInfo(): DeviceInfo {
    if (typeof window === 'undefined') {
      return {
        userAgent: '',
        screenResolution: '',
        viewport: '',
        platform: '',
        language: '',
        timezone: ''
      };
    }

    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.persistData();
  }

  trackNavigation(url?: string, pageTitle?: string, contentType?: string, contentId?: string) {
    const entry: NavigationEntry = {
      timestamp: Date.now(),
      url: url || (typeof window !== 'undefined' ? window.location.href : ''),
      pageTitle: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
      contentType,
      contentId
    };

    this.navigationPath.push(entry);
    this.trimEntries();
    this.unsyncedData = true;
  }

  trackContentInteraction(
    contentType: 'question' | 'flashcard' | 'media' | 'reading',
    contentId: string,
    action: string,
    metadata?: any,
    duration?: number,
    activeTime?: number
  ) {
    const interaction: ContentInteraction = {
      timestamp: Date.now(),
      contentType,
      contentId,
      action,
      metadata,
      duration,
      activeTime
    };

    this.contentInteractions.push(interaction);
    this.trimEntries();
    this.unsyncedData = true;
  }

  getSessionData(): SessionData {
    const metrics = this.engagementMonitor.getMetrics();
    const now = Date.now();

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      endTime: now,
      duration: (now - this.startTime) / 1000,
      activeDuration: metrics.activeTime,
      navigationPath: [...this.navigationPath],
      contentInteractions: [...this.contentInteractions],
      engagementMetrics: metrics,
      deviceInfo: this.deviceInfo
    };
  }

  getNavigationPath(): NavigationEntry[] {
    return [...this.navigationPath];
  }

  getContentInteractions(): ContentInteraction[] {
    return [...this.contentInteractions];
  }

  getSessionDuration(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  getActiveDuration(): number {
    return this.engagementMonitor.getMetrics().activeTime;
  }

  private trimEntries() {
    // Keep only the most recent entries to prevent memory bloat
    if (this.navigationPath.length > SessionTracker.MAX_ENTRIES) {
      this.navigationPath = this.navigationPath.slice(-SessionTracker.MAX_ENTRIES);
    }
    if (this.contentInteractions.length > SessionTracker.MAX_ENTRIES) {
      this.contentInteractions = this.contentInteractions.slice(-SessionTracker.MAX_ENTRIES);
    }
  }

  private persistData() {
    if (typeof window === 'undefined') return;

    try {
      const data = this.getSessionData();
      localStorage.setItem(SessionTracker.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist session data:', error);
    }
  }

  private loadPersistedData() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(SessionTracker.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as SessionData;

        // Only restore if the session is recent (within last hour)
        if (Date.now() - data.startTime < 3600000) {
          // Check if it's a different session
          if (data.sessionId !== this.sessionId) {
            // Send the old session data to backend
            this.sendToBackend(data);
          }
        }

        // Clear old data
        localStorage.removeItem(SessionTracker.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to load persisted session data:', error);
    }
  }

  private async syncToBackend() {
    if (!this.unsyncedData) return;

    const now = Date.now();
    if (now - this.lastSyncTime < 5000) return; // Don't sync more than once per 5 seconds

    try {
      const data = this.getSessionData();
      await this.sendToBackend(data);
      this.lastSyncTime = now;
      this.unsyncedData = false;
    } catch (error) {
      console.error('Failed to sync session data:', error);
      // Data remains unsynced, will retry on next interval
    }
  }

  private async sendToBackend(data: SessionData) {
    try {
      const response = await fetch('/api/tracking/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send session data to backend:', error);
      throw error;
    }
  }

  private handleBeforeUnload = () => {
    // Persist data before page unload
    this.persistData();

    // Try to send data synchronously (best effort)
    const data = this.getSessionData();
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/tracking/session', blob);
    }
  };

  private handlePageHide = () => {
    this.persistData();
  };

  private handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden, persist data
      this.persistData();
    } else {
      // Page is visible again, sync if needed
      if (this.unsyncedData) {
        this.syncToBackend();
      }
    }
  };

  reset() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.navigationPath = [];
    this.contentInteractions = [];
    this.engagementMonitor.reset();
    this.unsyncedData = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(SessionTracker.STORAGE_KEY);
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      window.removeEventListener('pagehide', this.handlePageHide);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    // Final sync attempt
    this.syncToBackend();

    this.engagementMonitor.destroy();
    SessionTracker.instance = null;
  }
}

// Export singleton getter for convenience
export const getSessionTracker = () => SessionTracker.getInstance();