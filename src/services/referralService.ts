<![CDATA[
import { supabase } from "@/integrations/supabase/client";

export const referralService = {
  /**
   * Generate referral code for user
   */
  async generateCode(userId: string) {
    const { data, error } = await supabase.rpc("generate_referral_code", {
      p_user_id: userId,
    });

    return { code: data, error };
  },

  /**
   * Get user's referral codes
   */
  async getUserCodes(userId: string) {
    const { data, error } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { codes: data || [], error };
  },

  /**
   * Get user's referrals
   */
  async getUserReferrals(userId: string) {
    const { data, error } = await supabase
      .from("referrals")
      .select(`
        *,
        referred:referred_id (
          email,
          user_metadata
        )
      `)
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    return { referrals: data || [], error };
  },

  /**
   * Process referral code
   */
  async processReferral(code: string, userId: string) {
    const { data, error } = await supabase.rpc("process_referral", {
      p_code: code,
      p_referred_id: userId,
    });

    return { result: data, error };
  },

  /**
   * Get referral stats
   */
  async getReferralStats(userId: string) {
    const { data: referrals } = await supabase
      .from("referrals")
      .select("status")
      .eq("referrer_id", userId);

    const total = referrals?.length || 0;
    const completed = referrals?.filter(r => r.status === "completed").length || 0;
    const pending = referrals?.filter(r => r.status === "pending").length || 0;

    return {
      total,
      completed,
      pending,
      conversionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  },
};
</![CDATA[>
