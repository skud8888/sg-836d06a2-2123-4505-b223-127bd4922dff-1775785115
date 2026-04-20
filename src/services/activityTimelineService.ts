import { supabase } from "@/integrations/supabase/client";

export const activityTimelineService = {
  /**
   * Log a user activity
   */
  async logActivity(data: {
    actionType: string;
    actionDescription: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("activity_timeline")
      .insert({
        user_id: user.id,
        action_type: data.actionType,
        action_description: data.actionDescription,
        entity_type: data.entityType,
        entity_id: data.entityId,
        metadata: data.metadata,
      });

    if (error) console.error("Failed to log activity:", error);
  },

  /**
   * Get user activity timeline
   */
  async getUserTimeline(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from("activity_timeline")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return { activities: data || [], error };
  },

  /**
   * Get all recent activities (admin only)
   */
  async getRecentActivities(limit: number = 100) {
    const { data, error } = await supabase
      .from("activity_timeline")
      .select(`
        *,
        user:profiles!activity_timeline_user_id_fkey(full_name, email, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    return { activities: data || [], error };
  },

  /**
   * Get activity statistics
   */
  async getActivityStats(userId?: string) {
    let query = supabase.from("activity_timeline").select("action_type, created_at");

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data } = await query;
    if (!data) return null;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: data.length,
      last24h: data.filter(a => new Date(a.created_at) > last24h).length,
      last7d: data.filter(a => new Date(a.created_at) > last7d).length,
      byType: data.reduce((acc, activity) => {
        acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },
};