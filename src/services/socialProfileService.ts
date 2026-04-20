<![CDATA[
import { supabase } from "@/integrations/supabase/client";

export const socialProfileService = {
  /**
   * Get public profile by user ID
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    return { profile: data, error };
  },

  /**
   * Get all public profiles
   */
  async getPublicProfiles(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return { profiles: data || [], error };
  },

  /**
   * Create or update profile
   */
  async upsertProfile(userId: string, profileData: any) {
    const { data, error } = await supabase
      .from("student_profiles")
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { profile: data, error };
  },

  /**
   * Search profiles by name or interests
   */
  async searchProfiles(query: string) {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("is_public", true)
      .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(20);

    return { profiles: data || [], error };
  },

  /**
   * Get profile achievements
   */
  async getProfileAchievements(userId: string) {
    const { data, error } = await supabase
      .from("student_badges")
      .select("*")
      .eq("student_id", userId)
      .order("earned_at", { ascending: false });

    return { achievements: data || [], error };
  },

  /**
   * Get profile courses
   */
  async getProfileCourses(userId: string) {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        scheduled_classes (
          id,
          course_templates (
            name,
            description
          )
        )
      `)
      .eq("student_id", userId)
      .eq("status", "confirmed");

    return { courses: data || [], error };
  },
};
</![CDATA[>
