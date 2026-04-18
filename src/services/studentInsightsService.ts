import { supabase } from "@/integrations/supabase/client";

export const studentInsightsService = {
  /**
   * Generate AI insights for a student
   */
  async generateInsights(studentId: string): Promise<void> {
    await supabase.rpc("generate_student_insights", {
      student_uuid: studentId,
    });
  },

  /**
   * Get student's AI insights
   */
  async getInsights(studentId: string): Promise<any[]> {
    const { data } = await supabase
      .from("student_ai_insights")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);

    return data || [];
  },

  /**
   * Mark insight as read
   */
  async markAsRead(insightId: string): Promise<void> {
    await supabase
      .from("student_ai_insights")
      .update({ is_read: true })
      .eq("id", insightId);
  },

  /**
   * Get unread insights count
   */
  async getUnreadCount(studentId: string): Promise<number> {
    const { count } = await supabase
      .from("student_ai_insights")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("is_read", false);

    return count || 0;
  },

  /**
   * Delete old insights
   */
  async cleanupOldInsights(studentId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await supabase
      .from("student_ai_insights")
      .delete()
      .eq("student_id", studentId)
      .lt("created_at", thirtyDaysAgo.toISOString());
  },
};