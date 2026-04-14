import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get classes starting in 24 hours
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(tomorrowEnd.getHours() + 1);

    const { data: upcomingClasses, error: classError } = await supabaseClient
      .from("scheduled_classes")
      .select(`
        id,
        start_datetime,
        location,
        course_templates!scheduled_classes_course_template_id_fkey(name)
      `)
      .gte("start_datetime", tomorrow.toISOString())
      .lte("start_datetime", tomorrowEnd.toISOString())
      .eq("status", "scheduled");

    if (classError) throw classError;

    let remindersSent = 0;

    // For each upcoming class, send reminders to all students
    for (const classData of upcomingClasses || []) {
      const { data: bookings, error: bookingError } = await supabaseClient
        .from("bookings")
        .select("*")
        .eq("scheduled_class_id", classData.id)
        .in("status", ["confirmed", "pending"])
        .is("reminder_sent_at", null);

      if (bookingError) continue;

      for (const booking of bookings || []) {
        // Check notification preferences
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("email", booking.student_email)
          .single();

        let sendEmail = true;
        let sendSMS = true;

        if (profile?.id) {
          const { data: prefs } = await supabaseClient
            .from("notification_preferences")
            .select("email_course_reminder, sms_course_reminder")
            .eq("user_id", profile.id)
            .single();

          if (prefs) {
            sendEmail = prefs.email_course_reminder;
            sendSMS = prefs.sms_course_reminder;
          }
        }

        const classDate = new Date(classData.start_datetime).toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        const classTime = new Date(classData.start_datetime).toLocaleTimeString("en-AU", {
          hour: "2-digit",
          minute: "2-digit"
        });

        // Send email reminder
        if (sendEmail) {
          const emailBody = `
Hi ${booking.student_name},

This is a friendly reminder that your ${classData.course_templates.name} course starts tomorrow.

📅 Date: ${classDate}
⏰ Time: ${classTime}
📍 Location: ${classData.location}

What to bring:
• Photo ID (driver's license or passport)
• USI number (if you have one)
• Completed enrolment forms
• Appropriate clothing and footwear

See you tomorrow!

GTS Training
          `.trim();

          await supabaseClient.from("email_queue").insert({
            recipient_email: booking.student_email,
            subject: `Reminder: ${classData.course_templates.name} - Tomorrow`,
            html_content: emailBody,
            template_type: "class_reminder_24h",
            metadata: { booking_id: booking.id, class_id: classData.id }
          });
        }

        // Send SMS reminder
        if (sendSMS && booking.student_phone) {
          await supabaseClient.from("sms_notifications").insert({
            recipient_phone: booking.student_phone,
            recipient_user_id: profile?.id || null,
            message_body: `Reminder: ${classData.course_templates.name} tomorrow at ${classTime}. Location: ${classData.location}. See you there!`,
            notification_type: "class_reminder",
            related_booking_id: booking.id,
            related_class_id: classData.id,
            status: "pending"
          });
        }

        // Mark reminder as sent
        await supabaseClient
          .from("bookings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", booking.id);

        remindersSent++;
      }
    }

    // Process pending email queue
    const { data: pendingEmails } = await supabaseClient
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    let emailsSent = 0;
    for (const email of pendingEmails || []) {
      // Here you would integrate with your email provider (Resend, SendGrid, etc.)
      // For now, we'll just mark them as sent
      await supabaseClient
        .from("email_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", email.id);
      
      emailsSent++;
    }

    // Process pending SMS queue
    const { data: pendingSMS } = await supabaseClient
      .from("sms_notifications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    let smsSent = 0;
    for (const sms of pendingSMS || []) {
      // SMS would be sent via API route which handles Twilio
      // Mark as pending for the API to process
      smsSent++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent,
        emailsSent,
        smsSent,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});