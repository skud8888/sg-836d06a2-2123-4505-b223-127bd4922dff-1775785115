<![CDATA[
import { supabase } from "@/integrations/supabase/client";

export const exportService = {
  /**
   * Export data to CSV
   */
  exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error("No data to export");
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values with commas, quotes, or newlines
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(",")
      )
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export data to JSON
   */
  exportToJSON(data: any[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error("No data to export");
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Export all students data
   */
  async exportStudents(format: "csv" | "json" = "csv") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at, role")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) throw new Error("No students found");

    const filename = `students_export_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      this.exportToCSV(data, filename);
    } else {
      this.exportToJSON(data, filename);
    }
  },

  /**
   * Export all bookings data
   */
  async exportBookings(format: "csv" | "json" = "csv") {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        student_name,
        student_email,
        student_phone,
        class_date,
        status,
        total_amount,
        payment_status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) throw new Error("No bookings found");

    const filename = `bookings_export_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      this.exportToCSV(data, filename);
    } else {
      this.exportToJSON(data, filename);
    }
  },

  /**
   * Export all courses data
   */
  async exportCourses(format: "csv" | "json" = "csv") {
    const { data, error } = await supabase
      .from("course_templates")
      .select("id, name, description, duration_hours, price_full, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) throw new Error("No courses found");

    const filename = `courses_export_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      this.exportToCSV(data, filename);
    } else {
      this.exportToJSON(data, filename);
    }
  },

  /**
   * Export all enrollments data
   */
  async exportEnrollments(format: "csv" | "json" = "csv") {
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        student_id,
        course_template_id,
        status,
        payment_status,
        amount_paid,
        amount_due,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) throw new Error("No enrollments found");

    const filename = `enrollments_export_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      this.exportToCSV(data, filename);
    } else {
      this.exportToJSON(data, filename);
    }
  },

  /**
   * Export all certificates data
   */
  async exportCertificates(format: "csv" | "json" = "csv") {
    const { data, error } = await supabase
      .from("certificates")
      .select(`
        id,
        student_id,
        course_template_id,
        certificate_number,
        issue_date,
        completion_date,
        status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) throw new Error("No certificates found");

    const filename = `certificates_export_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      this.exportToCSV(data, filename);
    } else {
      this.exportToJSON(data, filename);
    }
  },

  /**
   * Export all payments data
   */
  async exportPayments(format: "csv" | "json" = "csv") {
    const { data, error } = await supabase
      .from("payments")
      .select("id, booking_id, amount, method, status, transaction_id, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) throw new Error("No payments found");

    const filename = `payments_export_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      this.exportToCSV(data, filename);
    } else {
      this.exportToJSON(data, filename);
    }
  },

  /**
   * Export complete database backup (all tables)
   */
  async exportCompleteBackup() {
    try {
      const backup: any = {
        exported_at: new Date().toISOString(),
        data: {}
      };

      // Fetch all tables
      const tables = [
        "profiles",
        "bookings",
        "course_templates",
        "enrollments",
        "certificates",
        "payments",
        "student_progress",
        "course_feedback"
      ];

      for (const table of tables) {
        const { data } = await supabase.from(table as any).select("*");
        backup.data[table] = data || [];
      }

      const filename = `complete_backup_${new Date().toISOString().split("T")[0]}`;
      this.exportToJSON([backup], filename);
    } catch (error: any) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }
};
</![CDATA[>
