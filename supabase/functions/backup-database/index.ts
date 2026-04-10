import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get active backup configuration
    const { data: config, error: configError } = await supabase
      .from("backup_configurations")
      .select("*")
      .eq("status", "active")
      .single();

    if (configError || !config) {
      throw new Error("No active backup configuration found");
    }

    // Create backup history entry
    const { data: backupEntry, error: entryError } = await supabase
      .from("backup_history")
      .insert({
        config_id: config.id,
        backup_type: config.backup_type,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (entryError || !backupEntry) {
      throw new Error("Failed to create backup history entry");
    }

    try {
      // Get all table data for backup
      const tables = [
        "profiles",
        "user_roles",
        "courses",
        "bookings",
        "payments",
        "trainers",
        "enquiries",
        "documents",
        "system_audit_logs",
        "user_feedback",
        "notification_preferences",
        "backup_configurations",
      ];

      const backupData: Record<string, any> = {
        metadata: {
          created_at: new Date().toISOString(),
          backup_type: config.backup_type,
          version: "1.0",
          tables: tables,
        },
        data: {},
      };

      // Fetch data from each table
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select("*");
          
          if (error) {
            console.error(`Error fetching ${table}:`, error);
            backupData.data[table] = { error: error.message, rows: [] };
          } else {
            backupData.data[table] = { rows: data || [], count: (data || []).length };
          }
        } catch (err) {
          console.error(`Exception fetching ${table}:`, err);
          backupData.data[table] = { error: String(err), rows: [] };
        }
      }

      // Convert to JSON string
      const backupJson = JSON.stringify(backupData, null, 2);
      const backupSize = new Blob([backupJson]).size;

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${config.storage_location}backup-${timestamp}.json`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("backups")
        .upload(filename, backupJson, {
          contentType: "application/json",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Verify backup
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from("backups")
        .download(filename);

      if (downloadError) {
        throw new Error(`Verification download failed: ${downloadError.message}`);
      }

      const downloadedText = await downloadData.text();
      const verification_status = downloadedText.length > 0 ? "verified" : "failed";

      // Update backup history with success
      await supabase
        .from("backup_history")
        .update({
          status: "completed",
          file_size: backupSize,
          storage_location: filename,
          verification_status,
          completed_at: new Date().toISOString(),
        })
        .eq("id", backupEntry.id);

      // Clean up old backups based on retention policy
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - config.retention_days);

      const { data: oldBackups } = await supabase
        .from("backup_history")
        .select("storage_location")
        .eq("config_id", config.id)
        .lt("completed_at", retentionDate.toISOString())
        .eq("status", "completed");

      if (oldBackups && oldBackups.length > 0) {
        for (const oldBackup of oldBackups) {
          if (oldBackup.storage_location) {
            await supabase.storage.from("backups").remove([oldBackup.storage_location]);
          }
        }

        await supabase
          .from("backup_history")
          .delete()
          .eq("config_id", config.id)
          .lt("completed_at", retentionDate.toISOString());
      }

      return new Response(
        JSON.stringify({
          success: true,
          backup_id: backupEntry.id,
          filename,
          size: backupSize,
          verification_status,
          tables_backed_up: tables.length,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (backupError: any) {
      // Update backup history with failure
      await supabase
        .from("backup_history")
        .update({
          status: "failed",
          error_message: backupError.message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", backupEntry.id);

      throw backupError;
    }
  } catch (error: any) {
    console.error("Backup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});