import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "admin" | "trainer" | "receptionist" | "student";

export type Permission = 
  | "manage_users"
  | "manage_courses"
  | "manage_bookings"
  | "view_analytics"
  | "manage_payments"
  | "manage_settings"
  | "view_audit_logs"
  | "manage_backups"
  | "manage_integrations"
  | "view_system_health"
  | "manage_team"
  | "send_notifications"
  | "manage_certificates"
  | "view_reports"
  | "manage_trainers"
  | "manage_students";

// Role-based permissions matrix
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "manage_users",
    "manage_courses",
    "manage_bookings",
    "view_analytics",
    "manage_payments",
    "manage_settings",
    "view_audit_logs",
    "manage_backups",
    "manage_integrations",
    "view_system_health",
    "manage_team",
    "send_notifications",
    "manage_certificates",
    "view_reports",
    "manage_trainers",
    "manage_students",
  ],
  admin: [
    "manage_courses",
    "manage_bookings",
    "view_analytics",
    "manage_payments",
    "send_notifications",
    "manage_certificates",
    "view_reports",
    "manage_trainers",
    "manage_students",
    "view_system_health",
  ],
  trainer: [
    "manage_courses",
    "view_analytics",
    "view_reports",
    "manage_students",
  ],
  receptionist: [
    "manage_bookings",
    "view_reports",
    "manage_students",
  ],
  student: [],
};

// Page access control
const PAGE_PERMISSIONS: Record<string, Permission[]> = {
  "/admin/users": ["manage_users"],
  "/admin/team": ["manage_team"],
  "/admin/backups": ["manage_backups"],
  "/admin/system-health": ["view_system_health"],
  "/admin/audit-logs": ["view_audit_logs"],
  "/admin/integrations": ["manage_integrations"],
  "/admin/settings": ["manage_settings"],
  "/admin/analytics": ["view_analytics"],
  "/admin/payments": ["manage_payments"],
  "/admin/bookings": ["manage_bookings"],
  "/admin/students": ["manage_students"],
  "/admin/trainers": ["manage_trainers"],
  "/admin/courses": ["manage_courses"],
  "/admin/certificates": ["manage_certificates"],
  "/admin/notifications": ["send_notifications"],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if user has access to a specific page
 */
export function canAccessPage(role: Role, path: string): boolean {
  // Super admin has access to everything
  if (role === "super_admin") return true;

  // Get required permissions for the page
  const requiredPermissions = PAGE_PERMISSIONS[path];
  
  // If page has no specific requirements, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  // Check if user has at least one required permission
  return requiredPermissions.some(permission => hasPermission(role, permission));
}

/**
 * Get user's role from database
 */
export async function getUserRole(userId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.role as Role;
}

/**
 * Check if current user has permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const role = await getUserRole(session.user.id);
  if (!role) return false;

  return hasPermission(role, permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user can access admin area at all
 */
export async function canAccessAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const role = await getUserRole(session.user.id);
  if (!role) return false;

  return ["super_admin", "admin", "trainer", "receptionist"].includes(role);
}