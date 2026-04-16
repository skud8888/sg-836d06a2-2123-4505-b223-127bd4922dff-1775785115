import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupResult {
  success: boolean;
  backupId?: string;
  fileName?: string;
  size?: number;
  tables?: string[];
  error?: string;
  duration?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Starting database backup...");

    // Define tables to backup (all core tables)
    const tablesToBackup = [
      "profiles",
      "user_roles",
      "role_permissions",
      "course_templates",
      "scheduled_classes",
      "bookings",
      "payments",
      "stripe_payments",
      "enquiries",
      "documents",
      "signature_requests",
      "contract_templates",
      "enrollments",
      "student_progress",
      "certificates",
      "course_modules",
      "course_lessons",
      "learning_objectives",
      "course_materials",
      "evidence_capture",
      "notifications",
      "notification_preferences",
      "email_queue",
      "email_templates",
      "sms_notifications",
      "course_feedback",
      "user_feedback",
      "ai_insights",
      "audit_logs",
      "system_audit_logs",
      "backup_config",
      "class_attendance",
      "payment_plans",
      "payment_plan_installments",
      "instructor_payouts",
      "payout_rules",
      "discussion_threads",
      "discussion_replies",
      "pre_course_materials",
      "material_access",
      "invitations",
      "course_waitlist",
    ];

    const backupData: Record<string, any[]> = {};
    let totalRows = 0;
    const errors: string[] = [];

    // Backup each table
    for (const table of tablesToBackup) {
      try {
        console.log(`📦 Backing up table: ${table}`);
        
        const { data, error } = await supabase
          .from(table)
          .select("*");

        if (error) {
          console.error(`❌ Error backing up ${table}:`, error);
          errors.push(`${table}: ${error.message}`);
          continue;
        }

        backupData[table] = data || [];
        totalRows += (data || []).length;
        console.log(`✅ Backed up ${table}: ${(data || []).length} rows`);
      } catch (err) {
        console.error(`❌ Exception backing up ${table}:`, err);
        errors.push(`${table}: ${err.message}`);
      }
    }

    // Create backup metadata
    const timestamp = new Date().toISOString();
    const backupId = `backup_${timestamp.replace(/[:.]/g, "_")}`;
    const fileName = `${backupId}.json`;

    const backup = {
      id: backupId,
      timestamp,
      version: "1.0",
      tables: Object.keys(backupData),
      totalRows,
      errors: errors.length > 0 ? errors : undefined,
      data: backupData,
    };

    // Convert to JSON
    const backupJson = JSON.stringify(backup, null, 2);
    const backupSize = new TextEncoder().encode(backupJson).length;

    // Store backup in Supabase Storage
    console.log("💾 Uploading backup to storage...");
    
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, backupJson, {
        contentType: "application/json",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      throw new Error(`Failed to upload backup: ${uploadError.message}`);
    }

    // Record backup in backup_history table
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    const { error: historyError } = await supabase
      .from("backup_history")
      .insert({
        backup_type: "full",
        status: errors.length > 0 ? "completed" : "completed",
        size_bytes: backupSize,
        duration_seconds: duration,
        file_path: `backups/${fileName}`,
        tables_backed_up: Object.keys(backupData),
        rows_backed_up: totalRows,
        completed_at: new Date().toISOString(),
      });

    if (historyError) {
      console.warn("⚠️ Failed to record backup history:", historyError);
    }

    // Update backup config last_backup_at
    const { error: configError } = await supabase
      .from("backup_config")
      .update({
        last_backup_at: timestamp,
        next_backup_at: calculateNextBackup(),
      })
      .eq("id", 1);

    if (configError) {
      console.warn("⚠️ Failed to update backup config:", configError);
    }

    const result: BackupResult = {
      success: true,
      backupId,
      fileName,
      size: backupSize,
      tables: Object.keys(backupData),
      duration,
    };

    if (errors.length > 0) {
      result.error = `Completed with ${errors.length} errors: ${errors.join(", ")}`;
    }

    console.log("✅ Backup completed successfully!");
    console.log(`📊 Stats: ${totalRows} rows from ${Object.keys(backupData).length} tables`);
    console.log(`💾 Size: ${(backupSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️ Duration: ${duration}s`);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Backup failed:", error);
    
    const result: BackupResult = {
      success: false,
      error: error.message || "Unknown error occurred",
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

/**
 * Calculate next backup time based on schedule
 */
function calculateNextBackup(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(2, 0, 0, 0); // 2 AM next day
  return tomorrow.toISOString();
}