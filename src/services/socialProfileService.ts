import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export const socialProfileService = {
  /**
   * Get user's social profile with stats
   */
  async getSocialProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    // Get additional stats
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", userId);

    const { data: achievements } = await supabase
      .from("achievements" as any)
      .select("*")
      .eq("user_id", userId);

    return {
      profile: profile as Profile,
      stats: {
        totalCourses: enrollments?.length || 0,
        achievements: achievements?.length || 0,
      }
    };
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    return { profile: data, error };
  },

  async getPublicProfiles(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return { profiles: data || [], error };
  },

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

  async searchProfiles(query: string) {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("is_public", true)
      .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(20);

    return { profiles: data || [], error };
  },

  async getProfileAchievements(userId: string) {
    const { data, error } = await supabase
      .from("student_badges")
      .select("*")
      .eq("student_id", userId)
      .order("earned_at", { ascending: false });

    return { achievements: data || [], error };
  },

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