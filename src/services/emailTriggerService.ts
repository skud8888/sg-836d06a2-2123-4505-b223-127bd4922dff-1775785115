import { supabase } from "@/integrations/supabase/client";
import { emailService } from "./emailService";

interface EmailData {
  [key: string]: string | number;
}

export const emailTriggerService = {
  /**
   * Send enrollment confirmation email
   */
  async sendEnrollmentConfirmation(enrollmentId: string) {
    try {
      // Get enrollment details
      const { data: enrollment, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          *,
          student:profiles!enrollments_student_id_fkey(email, full_name),
          course:course_templates!enrollments_course_template_id_fkey(name, duration_hours)
        `)
        .eq("id", enrollmentId)
        .single();

      if (enrollError) throw enrollError;

      // Get email template
      const { data: template } = await supabase
        .from("email_templates")
        .select("*")
        .eq("name", "enrollment_confirmation")
        .single();

      if (!template) {
        console.error("Enrollment confirmation template not found");
        return;
      }

      // Replace template variables
      const emailData: EmailData = {
        course_name: enrollment.course.name,
        student_name: enrollment.student.full_name || enrollment.student.email,
        duration: enrollment.course.duration_hours,
        start_date: "TBD", // You can add scheduled_date to enrollments table
        amount_paid: enrollment.amount_paid || 0,
        amount_due: enrollment.amount_due || 0
      };

      let htmlContent = template.html_template;
      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(emailData[key]));
      });

      // Queue email
      await this.queueEmail({
        recipient_email: enrollment.student.email,
        subject: template.subject.replace(/{{course_name}}/g, enrollment.course.name),
        html_content: htmlContent,
        template_type: "enrollment_confirmation",
        metadata: { enrollment_id: enrollmentId }
      });

      console.log("Enrollment confirmation email queued");
    } catch (error) {
      console.error("Error sending enrollment confirmation:", error);
    }
  },

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(enrollmentId: string) {
    try {
      const { data: enrollment, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          student:profiles!enrollments_student_id_fkey(email, full_name),
          course:course_templates!enrollments_course_template_id_fkey(name)
        `)
        .eq("id", enrollmentId)
        .single();

      if (error) throw error;

      // Only send if there's an outstanding balance
      if (!enrollment.amount_due || enrollment.amount_due <= 0) {
        return;
      }

      const { data: template } = await supabase
        .from("email_templates")
        .select("*")
        .eq("name", "payment_reminder")
        .single();

      if (!template) return;

      const emailData: EmailData = {
        course_name: enrollment.course.name,
        student_name: enrollment.student.full_name || enrollment.student.email,
        amount_due: enrollment.amount_due,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        payment_link: `${window.location.origin}/student/portal`
      };

      let htmlContent = template.html_template;
      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(emailData[key]));
      });

      await this.queueEmail({
        recipient_email: enrollment.student.email,
        subject: template.subject.replace(/{{course_name}}/g, enrollment.course.name),
        html_content: htmlContent,
        template_type: "payment_reminder",
        metadata: { enrollment_id: enrollmentId }
      });

      console.log("Payment reminder email queued");
    } catch (error) {
      console.error("Error sending payment reminder:", error);
    }
  },

  /**
   * Send course completion email
   */
  async sendCourseCompletion(progressId: string) {
    try {
      const { data: progress, error } = await supabase
        .from("student_progress")
        .select(`
          *,
          enrollment:enrollments!student_progress_enrollment_id_fkey(
            student:profiles!enrollments_student_id_fkey(email, full_name),
            course:course_templates!enrollments_course_template_id_fkey(name)
          )
        `)
        .eq("id", progressId)
        .single();

      if (error) throw error;

      const { data: template } = await supabase
        .from("email_templates")
        .select("*")
        .eq("name", "course_completion")
        .single();

      if (!template) return;

      const emailData: EmailData = {
        course_name: progress.enrollment.course.name,
        student_name: progress.enrollment.student.full_name || progress.enrollment.student.email,
        completion_date: new Date(progress.completed_at).toLocaleDateString(),
        final_score: progress.completion_percentage,
        attendance: "100" // You can calculate actual attendance
      };

      let htmlContent = template.html_template;
      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(emailData[key]));
      });

      await this.queueEmail({
        recipient_email: progress.enrollment.student.email,
        subject: template.subject.replace(/{{course_name}}/g, progress.enrollment.course.name),
        html_content: htmlContent,
        template_type: "course_completion",
        metadata: { progress_id: progressId }
      });

      console.log("Course completion email queued");
    } catch (error) {
      console.error("Error sending course completion email:", error);
    }
  },

  /**
   * Send waitlist spot available notification
   */
  async sendWaitlistSpotAvailable(waitlistId: string) {
    try {
      const { data: waitlist, error } = await supabase
        .from("course_waitlist")
        .select(`
          *,
          course:course_templates!course_waitlist_course_template_id_fkey(name)
        `)
        .eq("id", waitlistId)
        .single();

      if (error) throw error;

      const { data: template } = await supabase
        .from("email_templates")
        .select("*")
        .eq("name", "waitlist_spot_available")
        .single();

      if (!template) return;

      const emailData: EmailData = {
        course_name: waitlist.course.name,
        student_name: waitlist.student_name,
        enrollment_link: `${window.location.origin}/enroll/${waitlist.course_template_id}`
      };

      let htmlContent = template.html_template;
      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(emailData[key]));
      });

      await this.queueEmail({
        recipient_email: waitlist.student_email,
        subject: template.subject.replace(/{{course_name}}/g, waitlist.course.name),
        html_content: htmlContent,
        template_type: "waitlist_spot_available",
        metadata: { waitlist_id: waitlistId }
      });

      // Update waitlist status
      await supabase
        .from("course_waitlist")
        .update({
          status: "notified",
          notified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours
        })
        .eq("id", waitlistId);

      console.log("Waitlist notification email queued");
    } catch (error) {
      console.error("Error sending waitlist notification:", error);
    }
  },

  /**
   * Queue an email for delivery
   */
  async queueEmail(emailData: {
    recipient_email: string;
    subject: string;
    html_content: string;
    template_type?: string;
    metadata?: any;
  }) {
    try {
      const { error } = await supabase
        .from("email_queue")
        .insert({
          recipient_email: emailData.recipient_email,
          subject: emailData.subject,
          html_content: emailData.html_content,
          template_type: emailData.template_type,
          metadata: emailData.metadata,
          status: "pending"
        });

      if (error) throw error;

      // Try to send immediately
      await this.processEmailQueue();
    } catch (error) {
      console.error("Error queuing email:", error);
    }
  },

  /**
   * Process pending emails in the queue
   */
  async processEmailQueue() {
    try {
      const { data: pendingEmails, error } = await supabase
        .from("email_queue")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(10);

      if (error) throw error;

      for (const email of pendingEmails || []) {
        try {
          await emailService.sendEmail(email.recipient_email, {
            subject: email.subject,
            html: email.html_content
          });

          // Mark as sent
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString()
            })
            .eq("id", email.id);
        } catch (emailError: any) {
          // Mark as failed
          await supabase
            .from("email_queue")
            .update({
              status: "failed",
              error_message: emailError.message
            })
            .eq("id", email.id);
        }
      }
    } catch (error) {
      console.error("Error processing email queue:", error);
    }
  }
};