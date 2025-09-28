'use client';

import { ActivityTracker, ActivityState } from './ActivityTracker';

export interface EngagementMetrics {
  totalTime: number;
  activeTime: number;
  idleTime: number;
  idlePeriods: Array<{ start: number; end: number; duration: number }>;
  engagementScore: number; // 0-100 score
  averageIdleDuration: number;
  longestIdlePeriod: number;
}

export interface EngagementConfig {
  idleThreshold?: number;
  contentType?: 'question' | 'flashcard' | 'media' | 'reading' | 'general';
}

export type EngagementListener = (isActive: boolean, metrics: EngagementMetrics) => void;

export class EngagementMonitor {
  private activityTracker: ActivityTracker;
  private startTime: number;
  private totalTime: number = 0;
  private activeTime: number = 0;
  private lastUpdateTime: number;
  private isActive: boolean = true;
  private idlePeriods: Array<{ start: number; end: number; duration: number }> = [];
  private currentIdleStart: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Set<EngagementListener> = new Set();
  private config: EngagementConfig;

  // Content-specific idle thresholds (in milliseconds)
  private static readonly IDLE_THRESHOLDS = {
    question: 60000,    // 60 seconds - they might be thinking
    flashcard: 30000,   // 30 seconds
    media: 5000,        // 5 seconds - immediate for video
    reading: 90000,     // 90 seconds - longer for reading
    general: 30000      // 30 seconds default
  };

  constructor(config: EngagementConfig = {}) {
    this.config = config;
    this.activityTracker = ActivityTracker.getInstance();
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;

    // Set idle threshold based on content type
    const threshold = config.idleThreshold ||
      EngagementMonitor.IDLE_THRESHOLDS[config.contentType || 'general'];
    this.activityTracker.setIdleThreshold(threshold);

    this.initialize();
  }

  private initialize() {
    // Listen to activity state changes
    this.activityTracker.addListener(this.handleActivityStateChange);

    // Update metrics every second
    this.updateInterval = setInterval(() => this.updateMetrics(), 1000);
  }

  private handleActivityStateChange = (state: ActivityState) => {
    const wasActive = this.isActive;
    this.isActive = state.isActive;

    if (wasActive && !this.isActive) {
      // Started idle period
      this.currentIdleStart = Date.now();
    } else if (!wasActive && this.isActive && this.currentIdleStart) {
      // Ended idle period
      const idleEnd = Date.now();
      const duration = idleEnd - this.currentIdleStart;
      this.idlePeriods.push({
        start: this.currentIdleStart,
        end: idleEnd,
        duration
      });
      this.currentIdleStart = null;
    }

    this.notifyListeners();
  };

  private updateMetrics() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds

    this.totalTime += deltaTime;

    if (this.isActive) {
      this.activeTime += deltaTime;
    }

    this.lastUpdateTime = now;
  }

  getMetrics(): EngagementMetrics {
    // Handle ongoing idle period
    let idlePeriods = [...this.idlePeriods];
    if (this.currentIdleStart && !this.isActive) {
      idlePeriods.push({
        start: this.currentIdleStart,
        end: Date.now(),
        duration: Date.now() - this.currentIdleStart
      });
    }

    const totalIdleTime = idlePeriods.reduce((sum, period) => sum + period.duration, 0) / 1000;
    const averageIdleDuration = idlePeriods.length > 0
      ? totalIdleTime / idlePeriods.length
      : 0;
    const longestIdlePeriod = idlePeriods.length > 0
      ? Math.max(...idlePeriods.map(p => p.duration)) / 1000
      : 0;

    // Calculate engagement score (0-100)
    const engagementScore = this.calculateEngagementScore();

    return {
      totalTime: Math.round(this.totalTime * 100) / 100,
      activeTime: Math.round(this.activeTime * 100) / 100,
      idleTime: Math.round(totalIdleTime * 100) / 100,
      idlePeriods: idlePeriods.map(p => ({
        ...p,
        duration: Math.round(p.duration / 1000 * 100) / 100
      })),
      engagementScore,
      averageIdleDuration: Math.round(averageIdleDuration * 100) / 100,
      longestIdlePeriod: Math.round(longestIdlePeriod * 100) / 100
    };
  }

  private calculateEngagementScore(): number {
    if (this.totalTime === 0) return 0;

    const activePercentage = (this.activeTime / this.totalTime) * 100;

    // Base score on active percentage
    let score = activePercentage;

    // Penalize for too many idle periods
    const idleFrequency = this.idlePeriods.length / (this.totalTime / 60); // idle periods per minute
    if (idleFrequency > 1) {
      score -= Math.min(20, idleFrequency * 5);
    }

    // Penalize for very long idle periods
    const longestIdle = this.idlePeriods.length > 0
      ? Math.max(...this.idlePeriods.map(p => p.duration)) / 1000
      : 0;

    if (longestIdle > 120) { // More than 2 minutes
      score -= Math.min(15, (longestIdle - 120) / 10);
    }

    // Bonus for consistent engagement (fewer but longer active periods)
    if (this.idlePeriods.length < 3 && activePercentage > 80) {
      score += 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  isUserActive(): boolean {
    return this.isActive;
  }

  getIdleTime(): number {
    if (!this.isActive && this.currentIdleStart) {
      return (Date.now() - this.currentIdleStart) / 1000;
    }
    return 0;
  }

  addListener(listener: EngagementListener) {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.isActive, this.getMetrics());
  }

  removeListener(listener: EngagementListener) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    const metrics = this.getMetrics();
    this.listeners.forEach(listener => listener(this.isActive, metrics));
  }

  pause() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    // Mark as idle when paused
    if (this.isActive) {
      this.currentIdleStart = Date.now();
      this.isActive = false;
    }
  }

  resume() {
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => this.updateMetrics(), 1000);
    }
    // End idle period when resumed
    if (!this.isActive && this.currentIdleStart) {
      const idleEnd = Date.now();
      const duration = idleEnd - this.currentIdleStart;
      this.idlePeriods.push({
        start: this.currentIdleStart,
        end: idleEnd,
        duration
      });
      this.currentIdleStart = null;
      this.isActive = true;
    }
    this.lastUpdateTime = Date.now();
  }

  reset() {
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    this.totalTime = 0;
    this.activeTime = 0;
    this.idlePeriods = [];
    this.currentIdleStart = null;
    this.isActive = true;
    this.notifyListeners();
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.activityTracker.removeListener(this.handleActivityStateChange);
    this.listeners.clear();
  }
}