import { supabase } from "@/integrations/supabase/client";

interface SMSMessage {
  to: string;
  body: string;
  notificationType: string;
  relatedBookingId?: string;
  relatedClassId?: string;
  recipientUserId?: string;
}

interface SMSTemplate {
  booking_confirmation: (data: any) => string;
  class_reminder: (data: any) => string;
  payment_receipt: (data: any) => string;
  signature_request: (data: any) => string;
  class_cancelled: (data: any) => string;
}

/**
 * SMS Service for sending notifications via Twilio
 * 
 * Setup Instructions:
 * 1. Sign up for Twilio account at https://www.twilio.com
 * 2. Get your Account SID and Auth Token from console
 * 3. Get a Twilio phone number
 * 4. Add environment variables to Vercel:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_PHONE_NUMBER
 * 5. Install Twilio SDK: npm install twilio
 */

// SMS Templates
export const smsTemplates: SMSTemplate = {
  booking_confirmation: (data) => `
Hi ${data.studentName},

Your booking is confirmed!

Course: ${data.courseName}
Date: ${data.classDate}
Time: ${data.classTime}
Location: ${data.location}

See you there!
- ${data.organizationName || "Training Centre"}
`.trim(),

  class_reminder: (data) => `
Reminder: You have a class tomorrow!

Course: ${data.courseName}
Date: ${data.classDate}
Time: ${data.classTime}
Location: ${data.location}

Please arrive 10 minutes early.
- ${data.organizationName || "Training Centre"}
`.trim(),

  payment_receipt: (data) => `
Payment Received!

Amount: $${data.amount}
Course: ${data.courseName}
Receipt: ${data.receiptUrl}

Thank you!
- ${data.organizationName || "Training Centre"}
`.trim(),

  signature_request: (data) => `
Action Required: Please sign your course agreement

Course: ${data.courseName}
Sign here: ${data.signatureUrl}

Link expires in 7 days.
- ${data.organizationName || "Training Centre"}
`.trim(),

  class_cancelled: (data) => `
Class Cancellation Notice

Unfortunately, your class has been cancelled.

Course: ${data.courseName}
Original Date: ${data.classDate}

${data.refundInfo || "You will receive a full refund within 5-7 business days."}

We apologize for any inconvenience.
- ${data.organizationName || "Training Centre"}
`.trim()
};

/**
 * Send SMS notification
 */
export async function sendSMS(message: SMSMessage): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Log SMS attempt in database
    const { data: logData, error: logError } = await supabase
      .from("sms_notifications")
      .insert({
        recipient_phone: message.to,
        recipient_user_id: message.recipientUserId || null,
        message_body: message.body,
        notification_type: message.notificationType,
        related_booking_id: message.relatedBookingId || null,
        related_class_id: message.relatedClassId || null,
        status: "pending"
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging SMS:", logError);
    }

    // Send SMS via API route (which handles Twilio)
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: message.to,
        body: message.body,
        logId: logData?.id
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Update log status to failed
      if (logData?.id) {
        await supabase
          .from("sms_notifications")
          .update({
            status: "failed",
            failed_at: new Date().toISOString(),
            error_message: result.error || "Failed to send SMS"
          })
          .eq("id", logData.id);
      }

      return { success: false, error: result.error };
    }

    // Update log status to sent
    if (logData?.id && result.messageId) {
      await supabase
        .from("sms_notifications")
        .update({
          status: "sent",
          twilio_sid: result.messageId,
          sent_at: new Date().toISOString()
        })
        .eq("id", logData.id);
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send booking confirmation SMS
 */
export async function sendBookingConfirmationSMS(bookingData: {
  studentName: string;
  studentPhone: string;
  studentId?: string;
  courseName: string;
  classDate: string;
  classTime: string;
  location: string;
  bookingId: string;
  classId: string;
  organizationName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = smsTemplates.booking_confirmation(bookingData);

  return sendSMS({
    to: bookingData.studentPhone,
    body: message,
    notificationType: "booking_confirmation",
    relatedBookingId: bookingData.bookingId,
    relatedClassId: bookingData.classId,
    recipientUserId: bookingData.studentId
  });
}

/**
 * Send class reminder SMS (24 hours before)
 */
export async function sendClassReminderSMS(classData: {
  studentName: string;
  studentPhone: string;
  studentId?: string;
  courseName: string;
  classDate: string;
  classTime: string;
  location: string;
  bookingId?: string;
  classId: string;
  organizationName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = smsTemplates.class_reminder(classData);

  return sendSMS({
    to: classData.studentPhone,
    body: message,
    notificationType: "class_reminder",
    relatedBookingId: classData.bookingId,
    relatedClassId: classData.classId,
    recipientUserId: classData.studentId
  });
}

/**
 * Send payment receipt SMS
 */
export async function sendPaymentReceiptSMS(paymentData: {
  studentName: string;
  studentPhone: string;
  studentId?: string;
  amount: number;
  courseName: string;
  receiptUrl: string;
  bookingId?: string;
  organizationName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const message = smsTemplates.payment_receipt(paymentData);

  return sendSMS({
    to: paymentData.studentPhone,
    body: message,
    notificationType: "payment_receipt",
    relatedBookingId: paymentData.bookingId,
    recipientUserId: paymentData.studentId
  });
}

/**
 * Get SMS notification history for a user
 */
export async function getSMSHistory(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("sms_notifications")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching SMS history:", error);
    return [];
  }

  return data || [];
}

/**
 * Get SMS notification statistics
 */
export async function getSMSStats(): Promise<{
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}> {
  const { data, error } = await supabase
    .from("sms_notifications")
    .select("status");

  if (error) {
    console.error("Error fetching SMS stats:", error);
    return { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };
  }

  const stats = {
    total: data.length,
    sent: data.filter((s) => s.status === "sent").length,
    delivered: data.filter((s) => s.status === "delivered").length,
    failed: data.filter((s) => s.status === "failed").length,
    pending: data.filter((s) => s.status === "pending").length
  };

  return stats;
}