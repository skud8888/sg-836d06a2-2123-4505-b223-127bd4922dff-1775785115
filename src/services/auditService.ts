import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AuditLog = Tables<"system_audit_logs">;

export type AuditAction = 
  | "CREATE" 
  | "UPDATE" 
  | "DELETE" 
  | "VIEW" 
  | "EXPORT" 
  | "LOGIN" 
  | "LOGOUT"
  | "ROLE_CHANGE"
  | "PERMISSION_GRANT"
  | "PAYMENT_RECORDED";

export type ResourceType = 
  | "booking" 
  | "document" 
  | "user" 
  | "payment" 
  | "course"
  | "trainer"
  | "enquiry"
  | "feedback";

/**
 * System Audit Logging Service
 */
export const auditService = {
  /**
   * Log an audit event
   */
  async logEvent(params: {
    action: AuditAction;
    resourceType: ResourceType;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
  }): Promise<{ success: boolean; logId?: string; error?: any }> {
    try {
      const { data, error } = await supabase.rpc("log_audit_event", {
        p_action: params.action,
        p_resource_type: params.resourceType,
        p_resource_id: params.resourceId || null,
        p_old_values: params.oldValues || null,
        p_new_values: params.newValues || null,
        p_metadata: params.metadata || {}
      });

      if (error) throw error;

      return { success: true, logId: data };
    } catch (error: any) {
      console.error("Audit log error:", error);
      return { success: false, error };
    }
  },

  /**
   * Get audit logs with filters
   */
  async getLogs(params?: {
    userId?: string;
    action?: AuditAction;
    resourceType?: ResourceType;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    let query = supabase
      .from("system_audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (params?.userId) {
      query = query.eq("user_id", params.userId);
    }

    if (params?.action) {
      query = query.eq("action", params.action);
    }

    if (params?.resourceType) {
      query = query.eq("resource_type", params.resourceType);
    }

    if (params?.resourceId) {
      query = query.eq("resource_id", params.resourceId);
    }

    if (params?.startDate) {
      query = query.gte("created_at", params.startDate.toISOString());
    }

    if (params?.endDate) {
      query = query.lte("created_at", params.endDate.toISOString());
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Get audit logs error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get logs for a specific resource
   */
  async getResourceHistory(resourceType: ResourceType, resourceId: string): Promise<AuditLog[]> {
    return this.getLogs({ resourceType, resourceId });
  },

  /**
   * Get recent activity for current user
   */
  async getMyActivity(limit: number = 50): Promise<AuditLog[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    return this.getLogs({ userId: user.user.id, limit });
  },

  /**
   * Export audit logs to CSV
   */
  async exportLogs(params?: {
    startDate?: Date;
    endDate?: Date;
    action?: AuditAction;
    resourceType?: ResourceType;
  }): Promise<string> {
    const logs = await this.getLogs(params);

    // Create CSV header
    const headers = [
      "Timestamp",
      "User Email",
      "User Role",
      "Action",
      "Resource Type",
      "Resource ID",
      "Details"
    ];

    // Create CSV rows
    const rows = logs.map(log => [
      log.created_at,
      log.user_email || "System",
      log.user_role || "N/A",
      log.action,
      log.resource_type,
      log.resource_id || "",
      JSON.stringify(log.metadata || {})
    ]);

    // Combine into CSV string
    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Log the export action
    await this.logEvent({
      action: "EXPORT",
      resourceType: "booking",
      metadata: {
        export_type: "audit_logs",
        filter: params,
        record_count: logs.length
      }
    });

    return csv;
  }
};