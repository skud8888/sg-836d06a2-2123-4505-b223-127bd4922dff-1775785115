import { supabase } from "@/integrations/supabase/client";

export const notificationService = {
  /**
   * Create a notification for a user
   */
  async createNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase.rpc("create_notification", {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_link: params.link || null,
        p_metadata: params.metadata || {},
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  },

  /**
   * Notify admins of new booking
   */
  async notifyNewBooking(bookingId: string, studentName: string, courseName: string): Promise<void> {
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "super_admin"]);

    if (!admins) return;

    for (const admin of admins) {
      await this.createNotification({
        userId: admin.user_id,
        type: "booking",
        title: "New Booking",
        message: `${studentName} booked ${courseName}`,
        link: `/admin/bookings`,
        metadata: { bookingId },
      });
    }
  },

  /**
   * Notify admins of new enquiry
   */
  async notifyNewEnquiry(enquiryId: string, name: string, subject: string): Promise<void> {
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["admin", "super_admin"]);

    if (!admins) return;

    for (const admin of admins) {
      await this.createNotification({
        userId: admin.user_id,
        type: "enquiry",
        title: "New Enquiry",
        message: `${name}: ${subject}`,
        link: `/admin/enquiries`,
        metadata: { enquiryId },
      });
    }
  },

  /**
   * Notify trainer of class assignment
   */
  async notifyClassAssignment(trainerId: string, className: string, classDate: string): Promise<void> {
    await this.createNotification({
      userId: trainerId,
      type: "assignment",
      title: "New Class Assignment",
      message: `You've been assigned to ${className} on ${classDate}`,
      link: `/field`,
      metadata: { classDate },
    });
  },

  /**
   * Notify student of payment success
   */
  async notifyPaymentSuccess(userId: string, courseName: string, amount: number): Promise<void> {
    await this.createNotification({
      userId: userId,
      type: "payment",
      title: "Payment Successful",
      message: `Payment of $${amount} received for ${courseName}`,
      link: `/student/portal`,
      metadata: { amount },
    });
  },

  /**
   * Notify student of signature request
   */
  async notifySignatureRequest(userId: string, documentType: string): Promise<void> {
    await this.createNotification({
      userId: userId,
      type: "signature",
      title: "Signature Required",
      message: `Please sign your ${documentType.replace(/_/g, " ")}`,
      link: `/student/portal`,
      metadata: { documentType },
    });
  },

  /**
   * Send feedback request to student
   */
  async sendFeedbackRequest(bookingId: string): Promise<void> {
    const { data: booking } = await supabase
      .from("bookings")
      .select("student_email, scheduled_classes(course_templates(name))")
      .eq("id", bookingId)
      .single();

    if (!booking || !booking.student_email) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", booking.student_email)
      .limit(1);

    if (profiles && profiles.length > 0) {
      await this.createNotification({
        userId: profiles[0].id,
        type: "feedback_request",
        title: "Feedback Requested",
        message: `Please provide feedback for ${booking.scheduled_classes?.course_templates?.name || 'your recent course'}`,
        link: `/student/feedback`,
        metadata: { bookingId },
      });
    }
  },
};