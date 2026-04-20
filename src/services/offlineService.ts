import { supabase } from "@/integrations/supabase/client";

export const offlineService = {
  isOnline(): boolean {
    return typeof window !== 'undefined' ? navigator.onLine : true;
  },

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

  async getPendingActions(userId: string) {
    const { data, error } = await supabase
      .from("offline_sync_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("sync_status", "pending")
      .order("created_at", { ascending: true });

    return { actions: data || [], error };
  },

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

        await supabase
          .from("offline_sync_queue")
          .update({
            sync_status: "synced",
            synced_at: new Date().toISOString(),
          })
          .eq("id", action.id);

        results.push({ id: action.id, success: true });
      } catch (err: any) {
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

  async cacheData(key: string, data: any) {
    if (typeof window === 'undefined' || !("indexedDB" in window)) return;

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_cache", "readwrite");
      const store = tx.objectStore("offline_cache");
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getCachedData(key: string) {
    if (typeof window === 'undefined' || !("indexedDB" in window)) return null;

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_cache", "readonly");
      const store = tx.objectStore("offline_cache");
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  },

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