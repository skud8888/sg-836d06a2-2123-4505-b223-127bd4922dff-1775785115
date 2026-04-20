import { supabase } from "@/integrations/supabase/client";

interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  url?: string;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: any;
}

export const errorLoggingService = {
  /**
   * Log an error to the database
   */
  async logError(data: ErrorLogData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("error_logs")
        .insert({
          user_id: user?.id || null,
          error_type: data.errorType,
          error_message: data.errorMessage,
          stack_trace: data.stackTrace,
          url: data.url || window.location.href,
          user_agent: navigator.userAgent,
          severity: data.severity || "medium",
        });

      if (error) console.error("Failed to log error:", error);

      // Also send to console in development
      if (process.env.NODE_ENV === "development") {
        console.error(`[${data.severity}] ${data.errorType}:`, data.errorMessage);
      }
    } catch (err) {
      console.error("Error logging service failed:", err);
    }
  },

  /**
   * Log a client-side error automatically
   */
  setupGlobalErrorHandler() {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      this.logError({
        errorType: "JavaScript Error",
        errorMessage: event.message,
        stackTrace: event.error?.stack,
        url: event.filename,
        severity: "high",
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.logError({
        errorType: "Unhandled Promise Rejection",
        errorMessage: event.reason?.message || String(event.reason),
        stackTrace: event.reason?.stack,
        severity: "high",
      });
    });
  },

  /**
   * Get error logs with filtering
   */
  async getErrorLogs(filters?: {
    severity?: string;
    resolved?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    let query = supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.severity) {
      query = query.eq("severity", filters.severity);
    }

    if (filters?.resolved !== undefined) {
      query = query.eq("resolved", filters.resolved);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    return { logs: data || [], error };
  },

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("error_logs")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
      })
      .eq("id", errorId);

    return { error };
  },

  /**
   * Get error statistics
   */
  async getErrorStats() {
    const { data: allErrors } = await supabase
      .from("error_logs")
      .select("severity, resolved, created_at");

    if (!allErrors) return null;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: allErrors.length,
      unresolved: allErrors.filter(e => !e.resolved).length,
      critical: allErrors.filter(e => e.severity === "critical").length,
      last24h: allErrors.filter(e => new Date(e.created_at) > last24h).length,
      last7d: allErrors.filter(e => new Date(e.created_at) > last7d).length,
      bySeverity: {
        critical: allErrors.filter(e => e.severity === "critical").length,
        high: allErrors.filter(e => e.severity === "high").length,
        medium: allErrors.filter(e => e.severity === "medium").length,
        low: allErrors.filter(e => e.severity === "low").length,
      },
    };
  },
};