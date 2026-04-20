<![CDATA[
import { supabase } from "@/integrations/supabase/client";

export const offlineService = {
  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * Add action to offline sync queue
   */
  async queueAction(
    userId: string,
    actionType: string,
    tableName: string,
    recordData: any
  ) {
    const { data, error } = await supabase
      .from("offline_sync_queue")
      .insert({
        user_id: userId,
        action_type: actionType,
        table_name: tableName,
        record_data: recordData,
        sync_status: "pending",
      })
      .select()
      .single();

    return { action: data, error };
  },

  /**
   * Get pending sync actions
   */
  async getPendingActions(userId: string) {
    const { data, error } = await supabase
      .from("offline_sync_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("sync_status", "pending")
      .order("created_at", { ascending: true });

    return { actions: data || [], error };
  },

  /**
   * Process sync queue
   */
  async processSyncQueue(userId: string) {
    const { actions } = await this.getPendingActions(userId);

    const results = [];
    for (const action of actions) {
      try {
        let result;
        switch (action.action_type) {
          case "insert":
            result = await supabase
              .from(action.table_name)
              .insert(action.record_data);
            break;
          case "update":
            result = await supabase
              .from(action.table_name)
              .update(action.record_data)
              .eq("id", action.record_data.id);
            break;
          case "delete":
            result = await supabase
              .from(action.table_name)
              .delete()
              .eq("id", action.record_data.id);
            break;
        }

        if (result?.error) throw result.error;

        // Mark as synced
        await supabase
          .from("offline_sync_queue")
          .update({
            sync_status: "synced",
            synced_at: new Date().toISOString(),
          })
          .eq("id", action.id);

        results.push({ id: action.id, success: true });
      } catch (err: any) {
        // Mark as failed
        await supabase
          .from("offline_sync_queue")
          .update({
            sync_status: "failed",
            error_message: err.message,
          })
          .eq("id", action.id);

        results.push({ id: action.id, success: false, error: err.message });
      }
    }

    return results;
  },

  /**
   * Cache data for offline use (IndexedDB)
   */
  async cacheData(key: string, data: any) {
    if (!("indexedDB" in window)) return;

    const db = await this.openDB();
    const tx = db.transaction("offline_cache", "readwrite");
    const store = tx.objectStore("offline_cache");

    await store.put({
      key,
      data,
      timestamp: Date.now(),
    });

    await tx.done;
  },

  /**
   * Get cached data
   */
  async getCachedData(key: string) {
    if (!("indexedDB" in window)) return null;

    const db = await this.openDB();
    const tx = db.transaction("offline_cache", "readonly");
    const store = tx.objectStore("offline_cache");

    const result = await store.get(key);
    return result?.data || null;
  },

  /**
   * Open IndexedDB
   */
  async openDB() {
    return new Promise<any>((resolve, reject) => {
      const request = indexedDB.open("training_hub_offline", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("offline_cache")) {
          db.createObjectStore("offline_cache", { keyPath: "key" });
        }
      };
    });
  },
};
</![CDATA[>
