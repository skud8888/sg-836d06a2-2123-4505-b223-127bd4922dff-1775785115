import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Booking = Tables<"bookings">;
type ScheduledClass = Tables<"scheduled_classes">;
type CourseTemplate = Tables<"course_templates">;

/**
 * Email service for automated notifications
 * 
 * NOTE: This uses Supabase Edge Functions for email delivery.
 * To enable email notifications, you need to:
 * 1. Set up an email service provider (SendGrid, Resend, etc.)
 * 2. Add API keys to Edge Function secrets
 * 3. Deploy the email Edge Function
 * 
 * For now, this logs email events and stores them in the database.
 */

interface EmailTemplate {
  subject: string;
  html: string;
}

interface BookingConfirmationData {
  booking: Booking;
  scheduledClass: ScheduledClass;
  courseTemplate: CourseTemplate;
  studentName: string;
  studentEmail: string;
  accessToken: string;
}

export const emailService = {
  /**
   * Send booking confirmation email with portal access
   */
  async sendBookingConfirmation(data: BookingConfirmationData): Promise<boolean> {
    const { studentName, studentEmail, courseTemplate, scheduledClass, accessToken } = data;
    
    const portalUrl = `${window.location.origin}/student/portal?token=${accessToken}&email=${encodeURIComponent(studentEmail)}`;
    const courseDate = new Date(scheduledClass.start_datetime).toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    const template: EmailTemplate = {
      subject: `Booking Confirmed - ${courseTemplate.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Booking Confirmed!</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${studentName},
            </p>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Your booking for <strong>${courseTemplate.name}</strong> has been confirmed.
            </p>
            
            <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0;">
              <p style="margin: 8px 0; color: #1f2937;"><strong>Course:</strong> ${courseTemplate.name}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Date:</strong> ${courseDate}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Location:</strong> ${scheduledClass.location || "TBA"}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Total Amount:</strong> $${data.booking.total_amount}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Paid:</strong> $${data.booking.paid_amount}</p>
              ${data.booking.paid_amount < data.booking.total_amount ? 
                `<p style="margin: 8px 0; color: #dc2626;"><strong>Balance Due:</strong> $${data.booking.total_amount - data.booking.paid_amount}</p>` : 
                ""
              }
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${portalUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Access Student Portal
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              Use the link above to view your booking details, make payments, and download certificates after completion.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              GTS Training - Professional Training Solutions<br>
              © ${new Date().getFullYear()} GTS Training. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    return this.sendEmail(studentEmail, template);
  },

  /**
   * Send 24-hour course reminder
   */
  async send24HourReminder(data: BookingConfirmationData): Promise<boolean> {
    const { studentName, studentEmail, courseTemplate, scheduledClass } = data;
    
    const courseDateTime = new Date(scheduledClass.start_datetime);
    const formattedDate = courseDateTime.toLocaleDateString("en-AU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const formattedTime = courseDateTime.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const template: EmailTemplate = {
      subject: `Reminder: ${courseTemplate.name} - Tomorrow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Course Reminder</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${studentName},
            </p>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              This is a friendly reminder that your <strong>${courseTemplate.name}</strong> course starts tomorrow.
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
              <p style="margin: 8px 0; color: #1f2937;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Time:</strong> ${formattedTime}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Location:</strong> ${scheduledClass.location || "TBA"}</p>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 16px; margin: 24px 0; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">What to Bring:</h3>
              <ul style="color: #4a5568; margin: 0; padding-left: 20px;">
                <li>Photo ID (driver's license or passport)</li>
                <li>USI number (if you have one)</li>
                <li>Completed enrolment forms</li>
                <li>Appropriate clothing and footwear</li>
              </ul>
            </div>
            
            ${data.booking.paid_amount < data.booking.total_amount ? 
              `<div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #991b1b;"><strong>Outstanding Payment:</strong> $${data.booking.total_amount - data.booking.paid_amount}</p>
                <p style="margin: 8px 0 0 0; color: #991b1b; font-size: 14px;">Please bring payment on the day or pay online before the course.</p>
              </div>` : 
              ""
            }
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              Looking forward to seeing you tomorrow! If you have any questions, please contact us.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              GTS Training - Professional Training Solutions<br>
              © ${new Date().getFullYear()} GTS Training. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    return this.sendEmail(studentEmail, template);
  },

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(booking: Booking, paymentAmount: number): Promise<boolean> {
    const template: EmailTemplate = {
      subject: `Payment Receipt - $${paymentAmount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Payment Receipt</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Thank you for your payment of <strong>$${paymentAmount}</strong>.
            </p>
            
            <div style="background-color: #f3f4f6; padding: 16px; margin: 24px 0; border-radius: 6px;">
              <p style="margin: 8px 0; color: #1f2937;"><strong>Total Paid:</strong> $${booking.paid_amount}</p>
              <p style="margin: 8px 0; color: #1f2937;"><strong>Total Amount:</strong> $${booking.total_amount}</p>
              ${booking.paid_amount < booking.total_amount ? 
                `<p style="margin: 8px 0; color: #dc2626;"><strong>Balance Remaining:</strong> $${booking.total_amount - booking.paid_amount}</p>` :
                `<p style="margin: 8px 0; color: #16a34a;"><strong>Status:</strong> Fully Paid ✓</p>`
              }
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 24px;">
              This receipt has been sent to ${booking.student_email}.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              GTS Training - Professional Training Solutions<br>
              © ${new Date().getFullYear()} GTS Training. All rights reserved.
            </p>
          </div>
        </div>
      `
    };
    
    return this.sendEmail(booking.student_email, template);
  },

  /**
   * Core email sending function
   * In production, this would call an Edge Function or email API
   */
  async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // Log the email (for development)
      console.log("📧 Email would be sent:", {
        to,
        subject: template.subject,
        timestamp: new Date().toISOString()
      });

      // In production, you would call an Edge Function like this:
      // const { data, error } = await supabase.functions.invoke("send-email", {
      //   body: { to, subject: template.subject, html: template.html }
      // });
      
      // For now, return success (emails are logged but not actually sent)
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  },

  /**
   * Schedule 24-hour reminder for a booking
   * This would typically use a cron job or scheduled task
   */
  async schedule24HourReminder(bookingId: string): Promise<void> {
    // In production, this would create a scheduled task
    console.log("📅 24hr reminder scheduled for booking:", bookingId);
  }
};