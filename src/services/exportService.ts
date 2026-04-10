import { supabase } from "@/integrations/supabase/client";
import { auditService } from "./auditService";
import type { Tables } from "@/integrations/supabase/types";

type Booking = Tables<"bookings">;
type Enquiry = Tables<"enquiries">;
type Feedback = Tables<"course_feedback">;

/**
 * Data Export Service - CSV/Excel/PDF exports
 */
export const exportService = {
  /**
   * Export bookings to CSV
   */
  async exportBookingsCSV(params?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    paymentStatus?: string;
  }): Promise<string> {
    let query = supabase
      .from("bookings")
      .select(`
        *,
        scheduled_classes (
          start_datetime,
          end_datetime,
          location,
          course_templates (name, code)
        )
      `)
      .order("created_at", { ascending: false });

    if (params?.startDate) {
      query = query.gte("created_at", params.startDate.toISOString());
    }

    if (params?.endDate) {
      query = query.lte("created_at", params.endDate.toISOString());
    }

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    if (params?.paymentStatus) {
      query = query.eq("payment_status", params.paymentStatus);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    // CSV header
    const headers = [
      "Booking ID",
      "Student Name",
      "Email",
      "Phone",
      "Course",
      "Course Code",
      "Start Date",
      "Location",
      "Status",
      "Payment Status",
      "Total Amount",
      "Paid Amount",
      "Balance",
      "Booked At"
    ];

    // CSV rows
    const rows = (bookings || []).map((booking: any) => [
      booking.id,
      booking.student_name,
      booking.student_email,
      booking.student_phone,
      booking.scheduled_classes?.course_templates?.name || "",
      booking.scheduled_classes?.course_templates?.code || "",
      booking.scheduled_classes?.start_datetime || "",
      booking.scheduled_classes?.location || "",
      booking.status,
      booking.payment_status,
      booking.total_amount,
      booking.paid_amount,
      booking.total_amount - booking.paid_amount,
      booking.created_at
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Log export
    await auditService.logEvent({
      action: "EXPORT",
      resourceType: "booking",
      metadata: {
        export_type: "csv",
        filters: params,
        record_count: bookings?.length || 0
      }
    });

    return csv;
  },

  /**
   * Export enquiries to CSV
   */
  async exportEnquiriesCSV(params?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<string> {
    let query = supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (params?.startDate) {
      query = query.gte("created_at", params.startDate.toISOString());
    }

    if (params?.endDate) {
      query = query.lte("created_at", params.endDate.toISOString());
    }

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    const { data: enquiries, error } = await query;

    if (error) throw error;

    const headers = ["ID", "Name", "Email", "Phone", "Course Interest", "Message", "Status", "Created At"];

    const rows = (enquiries || []).map((enq: Enquiry) => [
      enq.id,
      enq.name,
      enq.email,
      enq.phone || "",
      enq.course_interest || "",
      enq.message,
      enq.status,
      enq.created_at
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    await auditService.logEvent({
      action: "EXPORT",
      resourceType: "enquiry",
      metadata: {
        export_type: "csv",
        filters: params,
        record_count: enquiries?.length || 0
      }
    });

    return csv;
  },

  /**
   * Export feedback/reviews to CSV
   */
  async exportFeedbackCSV(params?: {
    startDate?: Date;
    endDate?: Date;
    minRating?: number;
  }): Promise<string> {
    let query = supabase
      .from("course_feedback")
      .select(`
        *,
        bookings (
          student_name,
          student_email,
          scheduled_classes (
            course_templates (name, code)
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (params?.startDate) {
      query = query.gte("created_at", params.startDate.toISOString());
    }

    if (params?.endDate) {
      query = query.lte("created_at", params.endDate.toISOString());
    }

    if (params?.minRating) {
      query = query.gte("rating", params.minRating);
    }

    const { data: feedback, error } = await query;

    if (error) throw error;

    const headers = [
      "Student Name",
      "Email",
      "Course",
      "Overall Rating",
      "Course Quality",
      "Trainer Quality",
      "Venue Quality",
      "Comments",
      "Would Recommend",
      "Submitted At"
    ];

    const rows = (feedback || []).map((f: any) => [
      f.bookings?.student_name || "",
      f.bookings?.student_email || "",
      f.bookings?.scheduled_classes?.course_templates?.name || "",
      f.rating,
      f.course_quality || "",
      f.trainer_quality || "",
      f.venue_quality || "",
      f.comments || "",
      f.would_recommend ? "Yes" : "No",
      f.created_at
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    await auditService.logEvent({
      action: "EXPORT",
      resourceType: "feedback",
      metadata: {
        export_type: "csv",
        filters: params,
        record_count: feedback?.length || 0
      }
    });

    return csv;
  },

  /**
   * Trigger CSV download in browser
   */
  downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};