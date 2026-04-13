import { supabase } from "@/integrations/supabase/client";

type ActionCategory = 'user_management' | 'authentication' | 'course_management' | 'booking_management' | 'payment' | 'system' | 'content';
type Severity = 'info' | 'warning' | 'error' | 'critical';

interface AuditLogParams {
  action: string;
  actionCategory: ActionCategory;
  severity?: Severity;
  details: string;
  metadata?: Record<string, any>;
  affectedUserId?: string;
}

export const auditService = {
  async logEvent({
    action,
    actionCategory,
    severity = 'info',
    details,
    metadata = {},
    affectedUserId
  }: AuditLogParams) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get client info
      const ipAddress = metadata.ipAddress || 'unknown';
      const userAgent = metadata.userAgent || navigator.userAgent;

      const { error } = await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action,
          action_category: actionCategory,
          severity,
          details,
          metadata: metadata,
          affected_user_id: affectedUserId,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (error) {
        console.error("Error logging audit event:", error);
      }
    } catch (error) {
      console.error("Error in auditService:", error);
    }
  },

  // Convenience methods for common actions
  async logUserCreated(userId: string, email: string, roles: string[]) {
    return this.logEvent({
      action: 'user_created',
      actionCategory: 'user_management',
      severity: 'info',
      details: `Created user: ${email}`,
      metadata: { email, roles },
      affectedUserId: userId
    });
  },

  async logUserDeleted(userId: string, email: string) {
    return this.logEvent({
      action: 'user_deleted',
      actionCategory: 'user_management',
      severity: 'warning',
      details: `Deleted user: ${email}`,
      metadata: { email },
      affectedUserId: userId
    });
  },

  async logUserUpdated(userId: string, email: string, changes: Record<string, any>) {
    return this.logEvent({
      action: 'user_updated',
      actionCategory: 'user_management',
      severity: 'info',
      details: `Updated user: ${email}`,
      metadata: { email, changes },
      affectedUserId: userId
    });
  },

  async logRoleAssigned(userId: string, email: string, role: string) {
    return this.logEvent({
      action: 'role_assigned',
      actionCategory: 'user_management',
      severity: 'warning',
      details: `Assigned role '${role}' to ${email}`,
      metadata: { email, role },
      affectedUserId: userId
    });
  },

  async logRoleRemoved(userId: string, email: string, role: string) {
    return this.logEvent({
      action: 'role_removed',
      actionCategory: 'user_management',
      severity: 'warning',
      details: `Removed role '${role}' from ${email}`,
      metadata: { email, role },
      affectedUserId: userId
    });
  },

  async logPasswordReset(userId: string, email: string, method: 'direct' | 'email') {
    return this.logEvent({
      action: 'password_reset',
      actionCategory: 'authentication',
      severity: 'warning',
      details: `Reset password for ${email} (${method})`,
      metadata: { email, method },
      affectedUserId: userId
    });
  },

  async logBulkAction(action: string, userCount: number, details: string) {
    return this.logEvent({
      action: `bulk_${action}`,
      actionCategory: 'user_management',
      severity: 'warning',
      details: `${details} (${userCount} users)`,
      metadata: { userCount, action }
    });
  },

  async logLogin(email: string, success: boolean) {
    return this.logEvent({
      action: success ? 'login_success' : 'login_failed',
      actionCategory: 'authentication',
      severity: success ? 'info' : 'warning',
      details: success ? `Successful login: ${email}` : `Failed login attempt: ${email}`,
      metadata: { email, success }
    });
  },

  async logPayment(enrollmentId: string, amount: number, status: string) {
    return this.logEvent({
      action: 'payment_processed',
      actionCategory: 'payment',
      severity: status === 'success' ? 'info' : 'error',
      details: `Payment ${status}: $${amount}`,
      metadata: { enrollmentId, amount, status }
    });
  },

  async logCourseCreated(courseId: string, courseName: string) {
    return this.logEvent({
      action: 'course_created',
      actionCategory: 'course_management',
      severity: 'info',
      details: `Created course: ${courseName}`,
      metadata: { courseId, courseName }
    });
  },

  async logBookingCreated(bookingId: string, studentEmail: string) {
    return this.logEvent({
      action: 'booking_created',
      actionCategory: 'booking_management',
      severity: 'info',
      details: `Created booking for ${studentEmail}`,
      metadata: { bookingId, studentEmail }
    });
  }
};