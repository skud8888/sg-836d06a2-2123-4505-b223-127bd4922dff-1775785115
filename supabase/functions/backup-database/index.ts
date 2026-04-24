import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupResult {
  success: boolean;
  timestamp: string;
  tables: string[];
  recordCounts: Record<string, number>;
  backupSize: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const timestamp = new Date().toISOString();
    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};

    // Critical tables to backup
    const criticalTables = [
      "profiles",
      "user_roles",
      "course_templates",
      "scheduled_classes",
      "bookings",
      "enrollments",
      "payments",
      "documents",
      "certificates",
      "contracts",
      "signature_requests",
      "course_feedback",
      "audit_logs"
    ];

    // Backup each table
    for (const table of criticalTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .limit(10000); // Prevent memory issues

        if (error) {
          console.error(`Error backing up ${table}:`, error);
          continue;
        }

        if (data) {
          backupData[table] = data;
          recordCounts[table] = data.length;
        }
      } catch (err) {
        console.error(`Exception backing up ${table}:`, err);
      }
    }

    // Calculate backup size
    const backupJson = JSON.stringify(backupData);
    const backupSizeKB = Math.round(backupJson.length / 1024);

    // Store backup metadata in database
    const { error: metaError } = await supabase
      .from("backup_metadata")
      .insert({
        backup_timestamp: timestamp,
        tables_backed_up: criticalTables,
        record_counts: recordCounts,
        backup_size_kb: backupSizeKB,
        backup_type: "automated",
        status: "completed"
      });

    if (metaError) {
      console.error("Error storing backup metadata:", metaError);
    }

    // Optional: Upload to storage bucket for long-term retention
    const fileName = `backup_${timestamp.replace(/[:.]/g, "-")}.json`;
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, backupJson, {
        contentType: "application/json",
        cacheControl: "3600"
      });

    if (uploadError) {
      console.error("Error uploading backup to storage:", uploadError);
    }

    const result: BackupResult = {
      success: true,
      timestamp,
      tables: criticalTables,
      recordCounts,
      backupSize: `${backupSizeKB} KB`
    };

    // Send notification about successful backup
    await supabase.from("notifications").insert({
      type: "system",
      title: "Database Backup Completed",
      message: `Automated backup completed successfully. ${criticalTables.length} tables backed up, ${backupSizeKB} KB total.`,
      priority: "low",
      created_at: timestamp
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Backup function error:", error);
    
    const errorResult: BackupResult = {
      success: false,
      timestamp: new Date().toISOString(),
      tables: [],
      recordCounts: {},
      backupSize: "0 KB",
      error: error instanceof Error ? error.message : "Unknown error"
    };

    return new Response(JSON.stringify(errorResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});