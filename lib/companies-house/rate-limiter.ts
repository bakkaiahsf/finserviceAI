// Rate limiter for Companies House API (600 requests per 5 minutes)

interface RateLimitWindow {
  requests: number[];
  windowStart: number;
}

class CompaniesHouseRateLimiter {
  private static instance: CompaniesHouseRateLimiter;
  private windows: Map<string, RateLimitWindow> = new Map();
  private readonly maxRequests = 600;
  private readonly windowDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

  private constructor() {}

  static getInstance(): CompaniesHouseRateLimiter {
    if (!CompaniesHouseRateLimiter.instance) {
      CompaniesHouseRateLimiter.instance = new CompaniesHouseRateLimiter();
    }
    return CompaniesHouseRateLimiter.instance;
  }

  /**
   * Check if a request can be made for the given key (usually user ID or IP)
   * @param key - Unique identifier for rate limiting (user ID, IP, etc.)
   * @returns Promise that resolves when the request can be made
   */
  async checkRateLimit(key: string = 'global'): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const now = Date.now();
    const window = this.getOrCreateWindow(key, now);

    // Clean old requests outside the current window
    this.cleanOldRequests(window, now);

    const remaining = this.maxRequests - window.requests.length;

    if (window.requests.length >= this.maxRequests) {
      // Rate limit exceeded
      const oldestRequest = Math.min(...window.requests);
      const retryAfter = Math.max(0, oldestRequest + this.windowDuration - now);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequest + this.windowDuration,
        retryAfter: Math.ceil(retryAfter / 1000), // Convert to seconds
      };
    }

    // Request is allowed, record it
    window.requests.push(now);
    
    return {
      allowed: true,
      remaining: remaining - 1,
      resetTime: window.windowStart + this.windowDuration,
    };
  }

  /**
   * Get current rate limit status without making a request
   */
  getRateLimitStatus(key: string = 'global'): {
    remaining: number;
    resetTime: number;
    total: number;
  } {
    const now = Date.now();
    const window = this.getOrCreateWindow(key, now);
    
    this.cleanOldRequests(window, now);
    
    return {
      remaining: this.maxRequests - window.requests.length,
      resetTime: window.windowStart + this.windowDuration,
      total: this.maxRequests,
    };
  }

  /**
   * Wait for rate limit to reset if necessary
   */
  async waitForRateLimit(key: string = 'global'): Promise<void> {
    const status = await this.checkRateLimit(key);
    
    if (!status.allowed && status.retryAfter) {
      await new Promise(resolve => setTimeout(resolve, (status.retryAfter || 1) * 1000));
    }
  }

  /**
   * Reset rate limit for a specific key (useful for testing or admin override)
   */
  resetRateLimit(key: string = 'global'): void {
    this.windows.delete(key);
  }

  private getOrCreateWindow(key: string, now: number): RateLimitWindow {
    let window = this.windows.get(key);
    
    if (!window) {
      window = {
        requests: [],
        windowStart: now,
      };
      this.windows.set(key, window);
    }

    // If the window is older than the duration, reset it
    if (now - window.windowStart >= this.windowDuration) {
      window.requests = [];
      window.windowStart = now;
    }

    return window;
  }

  private cleanOldRequests(window: RateLimitWindow, now: number): void {
    const cutoff = now - this.windowDuration;
    window.requests = window.requests.filter(requestTime => requestTime > cutoff);
  }

  /**
   * Get statistics about rate limiter usage
   */
  getStats(): {
    activeWindows: number;
    totalRequests: number;
    oldestWindow: number | null;
  } {
    const now = Date.now();
    let totalRequests = 0;
    let oldestWindow: number | null = null;

    for (const [key, window] of this.windows.entries()) {
      this.cleanOldRequests(window, now);
      totalRequests += window.requests.length;
      
      if (oldestWindow === null || window.windowStart < oldestWindow) {
        oldestWindow = window.windowStart;
      }
    }

    return {
      activeWindows: this.windows.size,
      totalRequests,
      oldestWindow,
    };
  }
}

export const rateLimiter = CompaniesHouseRateLimiter.getInstance();

export interface RateLimitOptions {
  key?: string;
  respectRateLimit?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Decorator function to add rate limiting to API calls
 */
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RateLimitOptions = {}
) {
  return async (...args: T): Promise<R> => {
    const {
      key = 'global',
      respectRateLimit = true,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    if (!respectRateLimit) {
      return fn(...args);
    }

    let retries = 0;
    
    while (retries <= maxRetries) {
      const status = await rateLimiter.checkRateLimit(key);
      
      if (status.allowed) {
        try {
          return await fn(...args);
        } catch (error) {
          // If it's a rate limit error from the API itself, wait and retry
          if (error instanceof Error && error.message.includes('429')) {
            retries++;
            if (retries <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
              continue;
            }
          }
          throw error;
        }
      } else {
        // Wait for rate limit to reset
        if (status.retryAfter && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, status.retryAfter! * 1000));
          retries++;
          continue;
        } else {
          throw new Error(`Rate limit exceeded. Try again in ${status.retryAfter} seconds.`);
        }
      }
    }

    throw new Error('Max retries exceeded due to rate limiting');
  };
}