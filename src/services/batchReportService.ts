import { supabase } from "@/integrations/supabase/client";
import { exportService } from "./exportService";

export const batchReportService = {
  /**
   * Schedule a batch report
   */
  async scheduleReport(
    reportType: "daily" | "weekly" | "monthly" | "custom",
    reportName: string,
    recipients: string[]
  ): Promise<{ id: string | null; error: any }> {
    try {
      const { data, error } = await supabase.rpc("schedule_batch_report", {
        report_type_param: reportType,
        report_name_param: reportName,
        recipients_param: recipients,
      });

      if (error) throw error;

      return { id: data, error: null };
    } catch (error: any) {
      return { id: null, error };
    }
  },

  /**
   * Generate daily summary report
   */
  async generateDailySummary(): Promise<{
    report: any;
    error: any;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's stats
      const [bookings, enrollments, payments, classes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString()),
        supabase
          .from("enrollments")
          .select("*")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString()),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString()),
        supabase
          .from("scheduled_classes")
          .select("*")
          .gte("start_datetime", today.toISOString())
          .lt("start_datetime", tomorrow.toISOString()),
      ]);

      const totalRevenue =
        payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const report = {
        date: today.toISOString().split("T")[0],
        bookings: {
          total: bookings.data?.length || 0,
          pending: bookings.data?.filter((b) => b.status === "pending").length || 0,
          confirmed: bookings.data?.filter((b) => b.status === "confirmed").length || 0,
        },
        enrollments: {
          total: enrollments.data?.length || 0,
          active: enrollments.data?.filter((e) => e.status === "active").length || 0,
        },
        revenue: {
          total: totalRevenue,
          payments_count: payments.data?.length || 0,
        },
        classes: {
          scheduled: classes.data?.length || 0,
          completed: classes.data?.filter((c) => c.status === "completed").length || 0,
        },
      };

      return { report, error: null };
    } catch (error: any) {
      return { report: null, error };
    }
  },

  /**
   * Generate weekly summary report
   */
  async generateWeeklySummary(): Promise<{
    report: any;
    error: any;
  }> {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [bookings, enrollments, payments, students] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .gte("created_at", weekAgo.toISOString())
          .lt("created_at", today.toISOString()),
        supabase
          .from("enrollments")
          .select("*")
          .gte("created_at", weekAgo.toISOString())
          .lt("created_at", today.toISOString()),
        supabase
          .from("payments")
          .select("amount, payment_method")
          .eq("status", "completed")
          .gte("created_at", weekAgo.toISOString())
          .lt("created_at", today.toISOString()),
        supabase
          .from("profiles")
          .select("id, created_at")
          .eq("role", "student")
          .gte("created_at", weekAgo.toISOString())
          .lt("created_at", today.toISOString()),
      ]);

      const totalRevenue =
        payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const report = {
        period: {
          start: weekAgo.toISOString().split("T")[0],
          end: today.toISOString().split("T")[0],
        },
        bookings: {
          total: bookings.data?.length || 0,
          by_status: {
            pending: bookings.data?.filter((b) => b.status === "pending").length || 0,
            confirmed: bookings.data?.filter((b) => b.status === "confirmed").length || 0,
            cancelled: bookings.data?.filter((b) => b.status === "cancelled").length || 0,
          },
        },
        enrollments: {
          total: enrollments.data?.length || 0,
          new_students: students.data?.length || 0,
        },
        revenue: {
          total: totalRevenue,
          payments_count: payments.data?.length || 0,
          by_method: payments.data?.reduce((acc: any, p) => {
            const method = p.payment_method || "unknown";
            acc[method] = (acc[method] || 0) + 1;
            return acc;
          }, {}),
        },
      };

      return { report, error: null };
    } catch (error: any) {
      return { report: null, error };
    }
  },

  /**
   * Generate monthly summary report
   */
  async generateMonthlySummary(): Promise<{
    report: any;
    error: any;
  }> {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [bookings, enrollments, payments, certificates] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .gte("created_at", firstDayOfMonth.toISOString())
          .lte("created_at", lastDayOfMonth.toISOString()),
        supabase
          .from("enrollments")
          .select("*")
          .gte("created_at", firstDayOfMonth.toISOString())
          .lte("created_at", lastDayOfMonth.toISOString()),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed")
          .gte("created_at", firstDayOfMonth.toISOString())
          .lte("created_at", lastDayOfMonth.toISOString()),
        supabase
          .from("certificates")
          .select("id")
          .gte("issue_date", firstDayOfMonth.toISOString().split("T")[0])
          .lte("issue_date", lastDayOfMonth.toISOString().split("T")[0]),
      ]);

      const totalRevenue =
        payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const report = {
        month: today.toLocaleString("default", { month: "long", year: "numeric" }),
        bookings: {
          total: bookings.data?.length || 0,
          revenue: totalRevenue,
        },
        enrollments: {
          total: enrollments.data?.length || 0,
          completed: enrollments.data?.filter((e) => e.status === "completed").length || 0,
        },
        certificates_issued: certificates.data?.length || 0,
        average_revenue_per_booking:
          bookings.data?.length ? totalRevenue / bookings.data.length : 0,
      };

      return { report, error: null };
    } catch (error: any) {
      return { report: null, error };
    }
  },

  /**
   * Get all scheduled reports
   */
  async getScheduledReports(): Promise<any[]> {
    const { data } = await supabase
      .from("batch_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return data || [];
  },

  /**
   * Mark report as sent
   */
  async markReportSent(reportId: string, fileUrl?: string): Promise<void> {
    await supabase
      .from("batch_reports")
      .update({
        status: "sent",
        file_url: fileUrl,
      })
      .eq("id", reportId);
  },
};