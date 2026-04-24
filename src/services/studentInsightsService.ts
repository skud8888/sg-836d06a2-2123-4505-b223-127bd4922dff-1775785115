import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Enrollment = Tables<"enrollments">;

export const studentInsightsService = {
  /**
   * Get personalized learning insights for a student
   */
  async getStudentInsights(userId: string): Promise<{
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageProgress: number;
    recommendedCourses: string[];
  }> {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", userId);

    if (error) throw error;

    const total = enrollments?.length || 0;
    const completed = enrollments?.filter((e: Enrollment) => e.status === "completed").length || 0;
    const inProgress = enrollments?.filter((e: Enrollment) => e.status === "in_progress").length || 0;
    
    // Calculate average progress (dummy calculation as progress column might not exist or be named differently)
    const avgProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalCourses: total,
      completedCourses: completed,
      inProgressCourses: inProgress,
      averageProgress: avgProgress,
      recommendedCourses: [] // TODO: Implement recommendation logic
    };
  },

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