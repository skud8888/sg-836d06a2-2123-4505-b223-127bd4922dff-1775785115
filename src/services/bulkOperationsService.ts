import { supabase } from "@/integrations/supabase/client";

export const bulkOperationsService = {
  /**
   * Create a bulk operation record
   */
  async createOperation(operationType: string, totalItems: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("bulk_operations")
      .insert({
        user_id: user.id,
        operation_type: operationType,
        status: "pending",
        total_items: totalItems,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { operation: data, error };
  },

  /**
   * Update operation progress
   */
  async updateProgress(
    operationId: string,
    processedItems: number,
    failedItems: number = 0
  ) {
    const { error } = await supabase
      .from("bulk_operations")
      .update({
        processed_items: processedItems,
        failed_items: failedItems,
        status: "processing",
      })
      .eq("id", operationId);

    return { error };
  },

  /**
   * Complete operation
   */
  async completeOperation(operationId: string, success: boolean, errorMessage?: string) {
    const { error } = await supabase
      .from("bulk_operations")
      .update({
        status: success ? "completed" : "failed",
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq("id", operationId);

    return { error };
  },

  /**
   * Bulk delete records
   */
  async bulkDelete(table: string, ids: string[]) {
    const { operation, error: opError } = await this.createOperation(
      `bulk_delete_${table}`,
      ids.length
    );

    if (opError || !operation) {
      throw new Error("Failed to create operation");
    }

    try {
      let processed = 0;
      let failed = 0;

      // Process in batches of 10
      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        
        const { error } = await supabase
          .from(table)
          .delete()
          .in("id", batch);

        if (error) {
          failed += batch.length;
        } else {
          processed += batch.length;
        }

        await this.updateProgress(operation.id, processed, failed);
      }

      await this.completeOperation(
        operation.id,
        failed === 0,
        failed > 0 ? `${failed} items failed to delete` : undefined
      );

      return { success: failed === 0, processed, failed };
    } catch (err: any) {
      await this.completeOperation(operation.id, false, err.message);
      throw err;
    }
  },

  /**
   * Bulk update records
   */
  async bulkUpdate(table: string, ids: string[], updates: Record<string, any>) {
    const { operation, error: opError } = await this.createOperation(
      `bulk_update_${table}`,
      ids.length
    );

    if (opError || !operation) {
      throw new Error("Failed to create operation");
    }

    try {
      let processed = 0;
      let failed = 0;

      for (let i = 0; i < ids.length; i += 10) {
        const batch = ids.slice(i, i + 10);
        
        const { error } = await supabase
          .from(table)
          .update(updates)
          .in("id", batch);

        if (error) {
          failed += batch.length;
        } else {
          processed += batch.length;
        }

        await this.updateProgress(operation.id, processed, failed);
      }

      await this.completeOperation(
        operation.id,
        failed === 0,
        failed > 0 ? `${failed} items failed to update` : undefined
      );

      return { success: failed === 0, processed, failed };
    } catch (err: any) {
      await this.completeOperation(operation.id, false, err.message);
      throw err;
    }
  },

  /**
   * Get user's bulk operations
   */
  async getUserOperations(limit: number = 20) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { operations: [] };

    const { data, error } = await supabase
      .from("bulk_operations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    return { operations: data || [], error };
  },
};