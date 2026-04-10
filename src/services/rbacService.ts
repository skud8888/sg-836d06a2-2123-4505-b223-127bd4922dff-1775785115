import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type UserRole = "super_admin" | "admin" | "trainer" | "receptionist" | "student";
export type Resource = "bookings" | "courses" | "trainers" | "users" | "analytics" | "audit_logs";
export type Action = "create" | "read" | "update" | "delete" | "export";

export type RoleAssignment = Tables<"user_roles">;
export type Permission = Tables<"role_permissions">;

/**
 * Role-Based Access Control Service
 */
export const rbacService = {
  /**
   * Get user's roles
   */
  async getUserRoles(userId?: string): Promise<RoleAssignment[]> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", targetUserId);

    if (error) {
      console.error("Get user roles error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get user's primary role (highest privilege)
   */
  async getUserPrimaryRole(userId?: string): Promise<UserRole | null> {
    const roles = await this.getUserRoles(userId);
    if (roles.length === 0) return null;

    // Priority order
    const rolePriority: UserRole[] = ["super_admin", "admin", "trainer", "receptionist", "student"];
    
    for (const priorityRole of rolePriority) {
      if (roles.some(r => r.role === priorityRole)) {
        return priorityRole;
      }
    }

    return roles[0].role as UserRole;
  },

  /**
   * Check if user has a specific permission
   */
  async hasPermission(resource: Resource, action: Action, userId?: string): Promise<boolean> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return false;

    const { data, error } = await supabase.rpc("has_permission", {
      p_user_id: targetUserId,
      p_resource: resource,
      p_action: action
    });

    if (error) {
      console.error("Permission check error:", error);
      return false;
    }

    return data === true;
  },

  /**
   * Assign role to user (super admin only)
   */
  async assignRole(userId: string, role: UserRole): Promise<{ success: boolean; error?: any }> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) return { success: false, error: "Not authenticated" };

    // Check if current user is super admin
    const isSuperAdmin = await this.hasPermission("users", "create");
    if (!isSuperAdmin) {
      return { success: false, error: "Insufficient permissions" };
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
      assigned_by: currentUser.user.id
    });

    if (error) {
      console.error("Assign role error:", error);
      return { success: false, error };
    }

    return { success: true };
  },

  /**
   * Remove role from user (super admin only)
   */
  async removeRole(userId: string, role: UserRole): Promise<{ success: boolean; error?: any }> {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) return { success: false, error: "Not authenticated" };

    // Check if current user is super admin
    const isSuperAdmin = await this.hasPermission("users", "delete");
    if (!isSuperAdmin) {
      return { success: false, error: "Insufficient permissions" };
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) {
      console.error("Remove role error:", error);
      return { success: false, error };
    }

    return { success: true };
  },

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(role: UserRole): Promise<Permission[]> {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("*")
      .eq("role", role);

    if (error) {
      console.error("Get role permissions error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Check if current user is admin or super admin
   */
  async isAdmin(): Promise<boolean> {
    const role = await this.getUserPrimaryRole();
    return role === "admin" || role === "super_admin";
  },

  /**
   * Check if current user is super admin
   */
  async isSuperAdmin(): Promise<boolean> {
    const role = await this.getUserPrimaryRole();
    return role === "super_admin";
  }
};