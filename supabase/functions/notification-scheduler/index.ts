import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SchedulerResult {
  success: boolean;
  sent: number;
  failed: number;
  types: {
    booking_reminders: number;
    signature_reminders: number;
    payment_reminders: number;
    course_updates: number;
  };
  errors?: string[];
  duration?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔔 Starting notification scheduler...");

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const types = {
      booking_reminders: 0,
      signature_reminders: 0,
      payment_reminders: 0,
      course_updates: 0,
    };

    // 1. BOOKING REMINDERS - Send 24h before class
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const { data: upcomingClasses } = await supabase
        .from("scheduled_classes")
        .select(`
          *,
          course:course_templates(*),
          bookings(*)
        `)
        .gte("start_date", tomorrow.toISOString())
        .lt("start_date", dayAfterTomorrow.toISOString())
        .eq("status", "scheduled");

      for (const classItem of upcomingClasses || []) {
        for (const booking of classItem.bookings || []) {
          if (booking.status === "confirmed") {
            // Check if reminder already sent
            const { data: existing } = await supabase
              .from("notifications")
              .select("id")
              .eq("user_id", booking.student_id)
              .eq("type", "booking_reminder")
              .eq("metadata->>booking_id", booking.id)
              .single();

            if (!existing) {
              const { error: notifError } = await supabase
                .from("notifications")
                .insert({
                  user_id: booking.student_id,
                  type: "booking_reminder",
                  title: "Class Reminder - Tomorrow",
                  message: `Your ${classItem.course.name} class is tomorrow at ${new Date(classItem.start_date).toLocaleTimeString()}. Location: ${classItem.location}`,
                  metadata: {
                    booking_id: booking.id,
                    class_id: classItem.id,
                    course_name: classItem.course.name,
                  },
                });

              if (notifError) {
                errors.push(`Booking reminder failed for ${booking.id}: ${notifError.message}`);
                failed++;
              } else {
                types.booking_reminders++;
                sent++;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ Booking reminders error:", err);
      errors.push(`Booking reminders: ${err.message}`);
    }

    // 2. SIGNATURE REMINDERS - Pending signatures older than 3 days
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data: pendingSignatures } = await supabase
        .from("signature_requests")
        .select("*")
        .in("status", ["pending", "sent", "viewed"])
        .lt("sent_at", threeDaysAgo.toISOString())
        .gte("expires_at", new Date().toISOString());

      for (const request of pendingSignatures || []) {
        // Check if reminder sent in last 24h
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { data: recentReminder } = await supabase
          .from("notifications")
          .select("id")
          .eq("type", "signature_reminder")
          .eq("metadata->>signature_request_id", request.id)
          .gte("created_at", oneDayAgo.toISOString())
          .single();

        if (!recentReminder) {
          // Get booking details
          const { data: booking } = await supabase
            .from("bookings")
            .select("*, student:profiles(*)")
            .eq("id", request.booking_id)
            .single();

          if (booking && booking.student) {
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: booking.student_id,
                type: "signature_reminder",
                title: "Signature Required",
                message: `Please sign your enrollment contract. It expires on ${new Date(request.expires_at).toLocaleDateString()}.`,
                metadata: {
                  signature_request_id: request.id,
                  booking_id: booking.id,
                },
              });

            if (notifError) {
              errors.push(`Signature reminder failed for ${request.id}: ${notifError.message}`);
              failed++;
            } else {
              types.signature_reminders++;
              sent++;
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ Signature reminders error:", err);
      errors.push(`Signature reminders: ${err.message}`);
    }

    // 3. PAYMENT REMINDERS - Overdue installments
    try {
      const { data: overdueInstallments } = await supabase
        .from("payment_plan_installments")
        .select(`
          *,
          payment_plan:payment_plans(
            *,
            booking:bookings(
              *,
              student:profiles(*)
            )
          )
        `)
        .eq("status", "pending")
        .lt("due_date", new Date().toISOString());

      for (const installment of overdueInstallments || []) {
        const plan = installment.payment_plan;
        const booking = plan?.booking;
        const student = booking?.student;

        if (student) {
          // Check if reminder sent in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: recentReminder } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", student.id)
            .eq("type", "payment_reminder")
            .eq("metadata->>installment_id", installment.id)
            .gte("created_at", sevenDaysAgo.toISOString())
            .single();

          if (!recentReminder) {
            const daysOverdue = Math.floor(
              (new Date().getTime() - new Date(installment.due_date).getTime()) / (1000 * 60 * 60 * 24)
            );

            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: student.id,
                type: "payment_reminder",
                title: "Payment Overdue",
                message: `Your payment of $${installment.amount} is ${daysOverdue} days overdue. Please pay as soon as possible to avoid late fees.`,
                metadata: {
                  installment_id: installment.id,
                  payment_plan_id: plan.id,
                  booking_id: booking.id,
                  amount: installment.amount,
                  days_overdue: daysOverdue,
                },
              });

            if (notifError) {
              errors.push(`Payment reminder failed for ${installment.id}: ${notifError.message}`);
              failed++;
            } else {
              types.payment_reminders++;
              sent++;
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ Payment reminders error:", err);
      errors.push(`Payment reminders: ${err.message}`);
    }

    // 4. COURSE UPDATES - New materials/announcements
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: recentMaterials } = await supabase
        .from("course_materials")
        .select(`
          *,
          course:course_templates(*)
        `)
        .gte("created_at", oneDayAgo.toISOString());

      for (const material of recentMaterials || []) {
        // Get enrolled students
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("student_id")
          .eq("course_id", material.course_id)
          .eq("status", "active");

        for (const enrollment of enrollments || []) {
          // Check if already notified
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", enrollment.student_id)
            .eq("type", "course_update")
            .eq("metadata->>material_id", material.id)
            .single();

          if (!existing) {
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: enrollment.student_id,
                type: "course_update",
                title: "New Course Material",
                message: `New material available: ${material.title} for ${material.course.name}`,
                metadata: {
                  material_id: material.id,
                  course_id: material.course_id,
                  course_name: material.course.name,
                },
              });

            if (notifError) {
              errors.push(`Course update failed for ${material.id}: ${notifError.message}`);
              failed++;
            } else {
              types.course_updates++;
              sent++;
            }
          }
        }
      }
    } catch (err) {
      console.error("❌ Course updates error:", err);
      errors.push(`Course updates: ${err.message}`);
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);

    console.log(`✅ Notification scheduler completed!`);
    console.log(`📊 Sent: ${sent}, Failed: ${failed}`);
    console.log(`📧 Types: ${JSON.stringify(types)}`);
    console.log(`⏱️ Duration: ${duration}s`);

    const result: SchedulerResult = {
      success: true,
      sent,
      failed,
      types,
      duration,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Scheduler failed:", error);

    const result: SchedulerResult = {
      success: false,
      sent: 0,
      failed: 0,
      types: {
        booking_reminders: 0,
        signature_reminders: 0,
        payment_reminders: 0,
        course_updates: 0,
      },
      errors: [error.message || "Unknown error"],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});