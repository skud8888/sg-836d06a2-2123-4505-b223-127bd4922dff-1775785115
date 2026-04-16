<![CDATA[
import { supabase } from "@/integrations/supabase/client";

export const gamificationService = {
  /**
   * Get student's gamification stats
   */
  async getStudentStats(studentId: string) {
    const { data, error } = await supabase
      .from("student_points")
      .select("*")
      .eq("student_id", studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      total_points: 0,
      current_level: 1,
      points_to_next_level: 100,
      streak_days: 0
    };
  },

  /**
   * Get student's badges
   */
  async getStudentBadges(studentId: string) {
    const { data, error } = await supabase
      .from("student_badges")
      .select("*")
      .eq("student_id", studentId)
      .order("earned_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get point transaction history
   */
  async getPointHistory(studentId: string, limit = 20) {
    const { data, error } = await supabase
      .from("point_transactions")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    const { data, error } = await supabase
      .from("leaderboard_cache")
      .select("*")
      .order("total_points", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Award points to student
   */
  async awardPoints(studentId: string, points: number, actionType: string, description?: string) {
    const { error } = await supabase.rpc("award_points", {
      p_student_id: studentId,
      p_points: points,
      p_action_type: actionType,
      p_description: description
    });

    if (error) throw error;
  },

  /**
   * Update daily streak
   */
  async updateStreak(studentId: string) {
    const { data, error } = await supabase.rpc("update_daily_streak", {
      p_student_id: studentId
    });

    if (error) throw error;
    return data;
  },

  /**
   * Check and award achievement badges
   */
  async checkAchievements(studentId: string) {
    // Get student's progress
    const { data: progress } = await supabase
      .from("student_progress")
      .select("*")
      .eq("student_id", studentId);

    const completedCourses = progress?.filter(p => p.status === "completed").length || 0;
    const inProgressCourses = progress?.filter(p => p.status === "in_progress").length || 0;

    // Get existing badges
    const { data: existingBadges } = await supabase
      .from("student_badges")
      .select("badge_type, badge_name")
      .eq("student_id", studentId);

    const hasBadge = (type: string, name: string) =>
      existingBadges?.some(b => b.badge_type === type && b.badge_name === name);

    const newBadges = [];

    // First course completion
    if (completedCourses >= 1 && !hasBadge("achievement", "First Steps")) {
      newBadges.push({
        student_id: studentId,
        badge_type: "achievement",
        badge_name: "First Steps",
        badge_description: "Completed your first course",
        points_awarded: 100
      });
      await this.awardPoints(studentId, 100, "achievement", "First course completed");
    }

    // 5 courses completed
    if (completedCourses >= 5 && !hasBadge("achievement", "Rising Star")) {
      newBadges.push({
        student_id: studentId,
        badge_type: "achievement",
        badge_name: "Rising Star",
        badge_description: "Completed 5 courses",
        points_awarded: 250
      });
      await this.awardPoints(studentId, 250, "achievement", "5 courses completed");
    }

    // 10 courses completed
    if (completedCourses >= 10 && !hasBadge("achievement", "Expert Learner")) {
      newBadges.push({
        student_id: studentId,
        badge_type: "achievement",
        badge_name: "Expert Learner",
        badge_description: "Completed 10 courses",
        points_awarded: 500
      });
      await this.awardPoints(studentId, 500, "achievement", "10 courses completed");
    }

    // Multi-tasker (3+ courses in progress)
    if (inProgressCourses >= 3 && !hasBadge("achievement", "Multi-Tasker")) {
      newBadges.push({
        student_id: studentId,
        badge_type: "achievement",
        badge_name: "Multi-Tasker",
        badge_description: "Enrolled in 3+ courses simultaneously",
        points_awarded: 150
      });
      await this.awardPoints(studentId, 150, "achievement", "3+ courses in progress");
    }

    // Insert new badges
    if (newBadges.length > 0) {
      await supabase.from("student_badges").insert(newBadges);
    }

    return newBadges;
  },

  /**
   * Refresh leaderboard cache
   */
  async refreshLeaderboard() {
    // Clear existing cache
    await supabase.from("leaderboard_cache").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Rebuild from student_points
    const { data: students } = await supabase
      .from("student_points")
      .select(`
        student_id,
        total_points,
        profiles!student_points_student_id_fkey(full_name)
      `)
      .order("total_points", { ascending: false })
      .limit(100);

    if (!students) return;

    const leaderboardData = await Promise.all(
      students.map(async (student, index) => {
        const { data: badges } = await supabase
          .from("student_badges")
          .select("id")
          .eq("student_id", student.student_id);

        return {
          student_id: student.student_id,
          full_name: (student.profiles as any)?.full_name || "Anonymous",
          total_points: student.total_points,
          rank: index + 1,
          badges_count: badges?.length || 0
        };
      })
    );

    await supabase.from("leaderboard_cache").insert(leaderboardData);
  }
};
</file_content>
