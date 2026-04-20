import { supabase } from "@/integrations/supabase/client";

export const referralService = {
  async generateCode(userId: string) {
    const { data, error } = await supabase.rpc("generate_referral_code", {
      p_user_id: userId,
    });

    return { code: data, error };
  },

  async getUserCodes(userId: string) {
    const { data, error } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { codes: data || [], error };
  },

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

  async processReferral(code: string, userId: string) {
    const { data, error } = await supabase.rpc("process_referral", {
      p_code: code,
      p_referred_id: userId,
    });

    return { result: data, error };
  },

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