import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AIInsight = Tables<"ai_insights">;
type AIAction = Tables<"ai_action_queue">;

/**
 * AI Agent Service - Smart automation and predictive analytics
 */
export const aiAgentService = {
  /**
   * Analyze booking for churn risk
   */
  async analyzeChurnRisk(bookingId: string): Promise<{ insight: AIInsight | null; error: any }> {
    try {
      // Call the database function to calculate risk
      const { data: riskData, error: calcError } = await supabase.rpc("calculate_churn_risk", {
        p_booking_id: bookingId
      });

      if (calcError) throw calcError;

      const prediction = riskData as any;

      // Create insight record
      const { data: insight, error: insertError } = await supabase
        .from("ai_insights")
        .insert({
          insight_type: "churn_risk",
          related_booking_id: bookingId,
          confidence_score: prediction.risk_score,
          prediction_data: prediction,
          recommendation: prediction.recommendation
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { insight, error: null };
    } catch (error) {
      console.error("Churn risk analysis error:", error);
      return { insight: null, error };
    }
  },

  /**
   * Detect upsell opportunities for a booking
   */
  async detectUpsellOpportunity(bookingId: string): Promise<{ insight: AIInsight | null; error: any }> {
    try {
      const { data: opportunityData, error: calcError } = await supabase.rpc("detect_upsell_opportunities", {
        p_booking_id: bookingId
      });

      if (calcError) throw calcError;

      const prediction = opportunityData as any;

      // Only create insight if opportunity score is significant
      if (prediction.opportunity_score < 0.3) {
        return { insight: null, error: null };
      }

      const { data: insight, error: insertError } = await supabase
        .from("ai_insights")
        .insert({
          insight_type: "upsell_opportunity",
          related_booking_id: bookingId,
          confidence_score: prediction.opportunity_score,
          prediction_data: prediction,
          recommendation: `Customer has ${prediction.student_history} completed courses - ideal for package deals`
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { insight, error: null };
    } catch (error) {
      console.error("Upsell detection error:", error);
      return { insight: null, error };
    }
  },

  /**
   * Predict no-show risk for upcoming bookings
   */
  async predictNoShowRisk(bookingId: string): Promise<{ insight: AIInsight | null; error: any }> {
    try {
      const { data: booking } = await supabase
        .from("bookings")
        .select(`
          *,
          scheduled_classes(start_datetime)
        `)
        .eq("id", bookingId)
        .single();

      if (!booking) {
        return { insight: null, error: new Error("Booking not found") };
      }

      let riskScore = 0.0;
      const factors: string[] = [];

      // Payment status risk
      if (booking.payment_status === "unpaid") {
        riskScore += 0.5;
        factors.push("Unpaid booking - high no-show risk");
      } else if (booking.payment_status === "partial") {
        riskScore += 0.2;
        factors.push("Partial payment - moderate no-show risk");
      }

      // Time to course risk
      const scheduledClass = booking.scheduled_classes as any;
      if (scheduledClass?.start_datetime) {
        const daysUntilCourse = Math.floor(
          (new Date(scheduledClass.start_datetime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilCourse < 2 && booking.payment_status !== "paid") {
          riskScore += 0.3;
          factors.push("Course starting soon with outstanding payment");
        }
      }

      // Cap at 1.0
      riskScore = Math.min(riskScore, 1.0);

      // Only create insight if significant risk
      if (riskScore < 0.3) {
        return { insight: null, error: null };
      }

      const { data: insight, error: insertError } = await supabase
        .from("ai_insights")
        .insert({
          insight_type: "no_show_risk",
          related_booking_id: bookingId,
          confidence_score: riskScore,
          prediction_data: { risk_score: riskScore, factors },
          recommendation: riskScore > 0.6 
            ? "High risk - contact student immediately to confirm attendance"
            : "Medium risk - send confirmation reminder 24 hours before course"
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { insight, error: null };
    } catch (error) {
      console.error("No-show prediction error:", error);
      return { insight: null, error };
    }
  },

  /**
   * Get all pending insights for review
   */
  async getPendingInsights(): Promise<AIInsight[]> {
    const { data, error } = await supabase
      .from("ai_insights")
      .select(`
        *,
        bookings(student_name, student_email, scheduled_classes(course_templates(name)))
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get insights error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Update insight status after review
   */
  async reviewInsight(
    insightId: string, 
    status: "reviewed" | "actioned" | "dismissed"
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ai_insights")
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", insightId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error("Review insight error:", error);
      return { success: false, error };
    }
  },

  /**
   * Propose an AI action for human approval
   */
  async proposeAction(params: {
    actionType: AIAction["action_type"];
    targetEntity: string;
    targetId: string;
    proposedAction: any;
    reasoning: string;
    confidence: number;
  }): Promise<{ action: AIAction | null; error: any }> {
    try {
      const { data: action, error } = await supabase
        .from("ai_action_queue")
        .insert({
          action_type: params.actionType,
          target_entity: params.targetEntity,
          target_id: params.targetId,
          proposed_action: params.proposedAction,
          reasoning: params.reasoning,
          confidence_score: params.confidence
        })
        .select()
        .single();

      if (error) throw error;

      return { action, error: null };
    } catch (error) {
      console.error("Propose action error:", error);
      return { action: null, error };
    }
  },

  /**
   * Get pending actions awaiting approval
   */
  async getPendingActions(): Promise<AIAction[]> {
    const { data, error } = await supabase
      .from("ai_action_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get actions error:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Approve or reject an AI action
   */
  async reviewAction(
    actionId: string,
    approved: boolean
  ): Promise<{ success: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("ai_action_queue")
        .update({
          status: approved ? "approved" : "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", actionId);

      if (error) throw error;

      // If approved, execute the action
      if (approved) {
        // TODO: Execute the action based on action_type
        // For now, just mark as executed
        await supabase
          .from("ai_action_queue")
          .update({
            status: "executed",
            executed_at: new Date().toISOString()
          })
          .eq("id", actionId);
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Review action error:", error);
      return { success: false, error };
    }
  },

  /**
   * Parse email content to create enquiry (simulated AI parsing)
   */
  async parseEmailToEnquiry(params: {
    fromEmail: string;
    subject: string;
    bodyText: string;
  }): Promise<{ enquiry: any | null; error: any }> {
    try {
      // Simple keyword-based parsing (would be AI-powered in production)
      const bodyLower = params.bodyText.toLowerCase();
      const subjectLower = params.subject.toLowerCase();
      
      // Extract name (first line or signature)
      const nameMatch = params.bodyText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m);
      const name = nameMatch ? nameMatch[1] : "Unknown";

      // Extract phone (simple pattern)
      const phoneMatch = params.bodyText.match(/(\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/);
      const phone = phoneMatch ? phoneMatch[1] : "";

      // Detect course interest
      let courseInterest = "";
      if (bodyLower.includes("first aid") || subjectLower.includes("first aid")) {
        courseInterest = "First Aid";
      } else if (bodyLower.includes("white card") || subjectLower.includes("white card")) {
        courseInterest = "White Card";
      } else if (bodyLower.includes("forklift") || subjectLower.includes("forklift")) {
        courseInterest = "Forklift";
      }

      // Log the parsing attempt
      const { data: log } = await supabase
        .from("email_parse_logs")
        .insert({
          from_email: params.fromEmail,
          subject: params.subject,
          body_text: params.bodyText,
          parsed_data: { name, phone, courseInterest },
          status: "parsed"
        })
        .select()
        .single();

      // Create enquiry
      const { data: enquiry, error: enquiryError } = await supabase
        .from("enquiries")
        .insert({
          name,
          email: params.fromEmail,
          phone: phone || null,
          course_interest: courseInterest || null,
          message: params.bodyText,
          status: "new"
        })
        .select()
        .single();

      if (enquiryError) throw enquiryError;

      // Update log with created enquiry
      if (log) {
        await supabase
          .from("email_parse_logs")
          .update({ created_enquiry_id: enquiry.id })
          .eq("id", log.id);
      }

      return { enquiry, error: null };
    } catch (error) {
      console.error("Email parsing error:", error);
      
      // Log failed parse
      await supabase
        .from("email_parse_logs")
        .insert({
          from_email: params.fromEmail,
          subject: params.subject,
          body_text: params.bodyText,
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error"
        });

      return { enquiry: null, error };
    }
  },

  /**
   * Run all AI analyses for a booking
   */
  async analyzeBooking(bookingId: string): Promise<{ insights: AIInsight[]; error: any }> {
    try {
      const insights: AIInsight[] = [];

      // Run all analysis functions
      const [churn, upsell, noShow] = await Promise.all([
        this.analyzeChurnRisk(bookingId),
        this.detectUpsellOpportunity(bookingId),
        this.predictNoShowRisk(bookingId)
      ]);

      if (churn.insight) insights.push(churn.insight);
      if (upsell.insight) insights.push(upsell.insight);
      if (noShow.insight) insights.push(noShow.insight);

      return { insights, error: null };
    } catch (error) {
      console.error("Booking analysis error:", error);
      return { insights: [], error };
    }
  }
};