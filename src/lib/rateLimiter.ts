import { supabase } from "@/integrations/supabase/client";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  ip: string;
  endpoint: string;
  count: number;
  window_start: string;
}

/**
 * Rate limiter utility for protecting public API endpoints
 * Uses Supabase database to track requests by IP address
 */
export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 5, windowMs: 15 * 60 * 1000 }) {
    this.config = config;
  }

  /**
   * Check if a request should be rate limited
   * @param ip - Client IP address
   * @param endpoint - API endpoint identifier
   * @returns Object with allowed status and remaining requests
   */
  async checkLimit(ip: string, endpoint: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.windowMs);

    // Create rate_limit_log table if it doesn't exist (handled by migration)
    // Query existing rate limit entries for this IP + endpoint within the time window
    const { data: existingEntries, error: queryError } = await supabase
      .from("rate_limit_log")
      .select("*")
      .eq("ip", ip)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1);

    if (queryError) {
      console.error("Rate limit query error:", queryError);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(now.getTime() + this.config.windowMs)
      };
    }

    const currentEntry = existingEntries?.[0];

    if (!currentEntry) {
      // No existing entry - create new one
      await supabase.from("rate_limit_log").insert({
        ip,
        endpoint,
        count: 1,
        window_start: now.toISOString()
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(now.getTime() + this.config.windowMs)
      };
    }

    // Check if we're within the same window
    const entryWindowStart = new Date(currentEntry.window_start);
    const isWithinWindow = now.getTime() - entryWindowStart.getTime() < this.config.windowMs;

    if (!isWithinWindow) {
      // Window expired - create new entry
      await supabase.from("rate_limit_log").insert({
        ip,
        endpoint,
        count: 1,
        window_start: now.toISOString()
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: new Date(now.getTime() + this.config.windowMs)
      };
    }

    // Within same window - check count
    if (currentEntry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entryWindowStart.getTime() + this.config.windowMs)
      };
    }

    // Increment counter
    await supabase
      .from("rate_limit_log")
      .update({ count: currentEntry.count + 1 })
      .eq("id", currentEntry.id);

    return {
      allowed: true,
      remaining: this.config.maxRequests - (currentEntry.count + 1),
      resetAt: new Date(entryWindowStart.getTime() + this.config.windowMs)
    };
  }

  /**
   * Clean up old rate limit entries (call this periodically)
   */
  async cleanup(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.windowMs);
    
    await supabase
      .from("rate_limit_log")
      .delete()
      .lt("window_start", cutoffDate.toISOString());
  }
}

/**
 * Get client IP address from request headers
 * Works with Vercel, Cloudflare, and other common proxies
 */
export function getClientIp(req: any): string {
  // Check common headers (in order of preference)
  const forwardedFor = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list
    const ips = forwardedFor.split(",").map((ip: string) => ip.trim());
    return ips[0];
  }
  
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  
  // Fallback to connection remote address
  return req.connection?.remoteAddress || "unknown";
}